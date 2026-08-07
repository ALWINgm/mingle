// Mingle WebSocket Signaling Server — SECURITY HARDENED
import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────────
// Security Configuration
// ─────────────────────────────────────────────
const SECURITY = {
  MAX_CONNECTIONS_PER_IP: 5,          // Max simultaneous tabs/clients per IP
  MESSAGE_RATE_LIMIT: 30,             // Max WS messages per window per client
  MESSAGE_RATE_WINDOW_MS: 10_000,     // Rate window = 10 seconds
  MAX_MESSAGE_SIZE_BYTES: 8192,       // 8 KB max per message
  MAX_CHAT_TEXT_LENGTH: 500,          // Max chat message characters
  HEARTBEAT_INTERVAL_MS: 20_000,      // Ping clients every 20s
  HEARTBEAT_TIMEOUT_MS: 35_000,       // Kill if no pong in 35s
  MAX_QUEUE_SIZE: 200,                // Max users in waiting queue
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
      ]
  ),
  BAN_DURATION_MS: 10 * 60 * 1000,   // 10-minute bans
  MAX_REPORTS_BEFORE_BAN: 3,         // Auto-ban after 3 reports
};

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let waitingQueue = [];
const activePairs   = new Map();   // peerId -> peerId
const clients       = new Map();   // peerId -> { ws, ip, peerId, isAlive, msgCount, msgWindowStart }
const ipConnections = new Map();   // ip -> Set<peerId>
const bannedIPs     = new Map();   // ip -> unbanTimestamp
const reportCounts  = new Map();   // peerId -> reportCount

// ─────────────────────────────────────────────
// HTTP Server (health endpoint)
// ─────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      clients: clients.size,
      queue: waitingQueue.length,
      pairs: activePairs.size / 2,
      banned: bannedIPs.size,
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Mingle Signaling Server — Secured');
  }
});

// ─────────────────────────────────────────────
// WebSocket Server
// ─────────────────────────────────────────────
const wss = new WebSocketServer({
  server,
  // Validate upgrade origin
  verifyClient: ({ req }, done) => {
    const origin = req.headers.origin || '';
    const ip = getIP(req);

    // Check IP ban
    if (isIPBanned(ip)) {
      log(`🚫 Blocked banned IP: ${ip}`);
      return done(false, 403, 'Banned');
    }

    // Check origin (allow null/empty for non-browser clients in dev)
    if (origin && !SECURITY.ALLOWED_ORIGINS.includes(origin)) {
      log(`🚫 Blocked unknown origin: ${origin}`);
      return done(false, 403, 'Forbidden origin');
    }

    // Check per-IP connection limit
    const ipConns = ipConnections.get(ip) || new Set();
    if (ipConns.size >= SECURITY.MAX_CONNECTIONS_PER_IP) {
      log(`🚫 IP ${ip} exceeded connection limit (${ipConns.size})`);
      return done(false, 429, 'Too many connections');
    }

    done(true);
  },
});

// ─────────────────────────────────────────────
// Heartbeat — kick zombie connections
// ─────────────────────────────────────────────
const heartbeatInterval = setInterval(() => {
  const now = Date.now();
  clients.forEach(({ ws, isAlive, lastPong, peerId }) => {
    if (!isAlive || (now - lastPong > SECURITY.HEARTBEAT_TIMEOUT_MS)) {
      log(`💀 Zombie connection killed: ${peerId}`);
      ws.terminate();
      return;
    }
    // Mark dead, waiting for pong
    const client = clients.get(peerId);
    if (client) { client.isAlive = false; }
    ws.ping();
  });
}, SECURITY.HEARTBEAT_INTERVAL_MS);

wss.on('close', () => clearInterval(heartbeatInterval));

// ─────────────────────────────────────────────
// Connection Handler
// ─────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  const ip = getIP(req);
  let peerId = null;

  // Track IP → connections
  if (!ipConnections.has(ip)) ipConnections.set(ip, new Set());

  ws.on('pong', () => {
    const client = clients.get(peerId);
    if (client) {
      client.isAlive = true;
      client.lastPong = Date.now();
    }
  });

  ws.on('message', (rawData, isBinary) => {
    // ── Size guard ──
    if (isBinary || rawData.length > SECURITY.MAX_MESSAGE_SIZE_BYTES) {
      log(`⚠️ Oversized message from ${peerId || ip} (${rawData.length} bytes) — dropped`);
      return;
    }

    // ── Parse ──
    let data;
    try {
      data = JSON.parse(rawData.toString('utf8'));
    } catch {
      log(`⚠️ Malformed JSON from ${peerId || ip} — dropped`);
      return;
    }

    // ── Rate limit (after REGISTER) ──
    if (peerId) {
      const client = clients.get(peerId);
      if (client) {
        const now = Date.now();
        if (now - client.msgWindowStart > SECURITY.MESSAGE_RATE_WINDOW_MS) {
          client.msgCount = 0;
          client.msgWindowStart = now;
        }
        client.msgCount++;
        if (client.msgCount > SECURITY.MESSAGE_RATE_LIMIT) {
          log(`⚠️ Rate limit hit for ${peerId}`);
          safeSend(ws, { type: 'ERROR', code: 'RATE_LIMITED', message: 'You are sending messages too fast. Slow down.' });
          return;
        }
      }
    }

    handleMessage(ws, data, ip);
  });

  ws.on('close', () => {
    if (peerId) handleDisconnect(peerId, ip);
  });

  ws.on('error', (err) => {
    log(`WebSocket error for ${peerId || ip}: ${err.message}`);
    if (peerId) handleDisconnect(peerId, ip);
  });
});

// ─────────────────────────────────────────────
// Message Router
// ─────────────────────────────────────────────
function handleMessage(ws, data, ip) {
  const { type } = data;

  switch (type) {

    case 'REGISTER': {
      const id = sanitizeId(data.peerId);
      if (!id) return;

      peerId = id;
      clients.set(peerId, {
        ws, ip, peerId,
        isAlive: true,
        lastPong: Date.now(),
        msgCount: 0,
        msgWindowStart: Date.now(),
      });
      ipConnections.get(ip).add(peerId);
      log(`✅ Registered: ${peerId} (IP: ${ip}) | Online: ${clients.size}`);
      broadcastOnlineCount();
      break;
    }

    case 'FIND_MATCH': {
      if (!peerId) return;

      // Disconnect existing pair
      const oldPartner = activePairs.get(peerId);
      if (oldPartner) {
        activePairs.delete(peerId);
        activePairs.delete(oldPartner);
        sendTo(oldPartner, { type: 'PEER_DISCONNECTED' });
      }
      removeFromQueue(peerId);

      // Queue size guard
      if (waitingQueue.length >= SECURITY.MAX_QUEUE_SIZE) {
        safeSend(ws, { type: 'ERROR', code: 'SERVER_FULL', message: 'Server is at capacity. Try again shortly.' });
        return;
      }

      const interest = sanitizeText(data.interest || 'General', 30);
      const entry = { peerId, ws, interest };
      waitingQueue.push(entry);
      safeSend(ws, { type: 'SEARCHING' });
      log(`🔍 Queued: ${peerId} [${interest}] | Queue: ${waitingQueue.length}`);
      tryMatch(entry);
      break;
    }

    case 'SDP_OFFER':
    case 'SDP_ANSWER':
    case 'ICE_CANDIDATE': {
      if (!peerId) return;
      const target = activePairs.get(peerId);
      if (target) sendTo(target, { ...data, fromPeerId: peerId });
      break;
    }

    case 'CHAT_MESSAGE': {
      if (!peerId) return;
      const target = activePairs.get(peerId);
      if (!target) return;

      // Sanitize text
      const text = sanitizeText(data.text || '', SECURITY.MAX_CHAT_TEXT_LENGTH);
      if (!text) return;

      sendTo(target, {
        type: 'CHAT_MESSAGE',
        text,
        timestamp: data.timestamp,
      });
      break;
    }

    case 'REPORT_PEER': {
      if (!peerId) return;
      const target = activePairs.get(peerId);
      if (!target) return;

      const count = (reportCounts.get(target) || 0) + 1;
      reportCounts.set(target, count);
      log(`🚩 Peer ${target} reported (total: ${count})`);

      if (count >= SECURITY.MAX_REPORTS_BEFORE_BAN) {
        const targetClient = clients.get(target);
        if (targetClient) {
          banIP(targetClient.ip, `${count} reports`);
          sendTo(target, { type: 'BANNED', message: 'You have been banned for violating community guidelines.' });
          targetClient.ws.terminate();
        }
      }

      // Skip to next for the reporter
      sendTo(peerId, { type: 'PEER_DISCONNECTED' });
      activePairs.delete(peerId);
      activePairs.delete(target);
      break;
    }

    case 'STOP': {
      if (!peerId) return;
      removeFromQueue(peerId);
      const partner = activePairs.get(peerId);
      if (partner) {
        activePairs.delete(peerId);
        activePairs.delete(partner);
        sendTo(partner, { type: 'PEER_DISCONNECTED' });
      }
      safeSend(ws, { type: 'STOPPED' });
      break;
    }

    default:
      break;
  }
}

// ─────────────────────────────────────────────
// Matchmaking
// ─────────────────────────────────────────────
function tryMatch(entry) {
  const sameInterest = waitingQueue.find(
    w => w.peerId !== entry.peerId && w.interest === entry.interest
  );
  const anyPeer = waitingQueue.find(w => w.peerId !== entry.peerId);
  const match = sameInterest || anyPeer;
  if (!match) return;

  waitingQueue = waitingQueue.filter(
    w => w.peerId !== entry.peerId && w.peerId !== match.peerId
  );

  activePairs.set(entry.peerId, match.peerId);
  activePairs.set(match.peerId, entry.peerId);

  log(`💚 Matched: ${entry.peerId} ↔ ${match.peerId}`);

  sendTo(entry.peerId, { type: 'MATCHED', isInitiator: true,  remotePeerId: match.peerId });
  sendTo(match.peerId, { type: 'MATCHED', isInitiator: false, remotePeerId: entry.peerId });
}

// ─────────────────────────────────────────────
// Disconnect Handler
// ─────────────────────────────────────────────
function handleDisconnect(id, ip) {
  log(`🔌 Disconnected: ${id}`);
  clients.delete(id);
  removeFromQueue(id);
  ipConnections.get(ip)?.delete(id);
  if (ipConnections.get(ip)?.size === 0) ipConnections.delete(ip);

  const partner = activePairs.get(id);
  if (partner) {
    activePairs.delete(id);
    activePairs.delete(partner);
    sendTo(partner, { type: 'PEER_DISCONNECTED' });
  }

  broadcastOnlineCount();
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function sendTo(peerId, data) {
  const client = clients.get(peerId);
  if (client?.ws.readyState === client?.ws.OPEN) {
    safeSend(client.ws, data);
    return true;
  }
  return false;
}

function safeSend(ws, data) {
  try {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
  } catch (e) {
    log('safeSend error:', e.message);
  }
}

function removeFromQueue(id) {
  waitingQueue = waitingQueue.filter(w => w.peerId !== id);
}

function broadcastOnlineCount() {
  const msg = JSON.stringify({ type: 'ONLINE_COUNT', count: clients.size });
  wss.clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  });
}

function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function isIPBanned(ip) {
  const until = bannedIPs.get(ip);
  if (!until) return false;
  if (Date.now() > until) { bannedIPs.delete(ip); return false; }
  return true;
}

function banIP(ip, reason) {
  const until = Date.now() + SECURITY.BAN_DURATION_MS;
  bannedIPs.set(ip, until);
  log(`🔨 IP banned: ${ip} — reason: ${reason} | until: ${new Date(until).toLocaleTimeString()}`);
}

function sanitizeId(str) {
  if (typeof str !== 'string') return null;
  // Allow only alphanumeric + underscore, max 32 chars
  return str.replace(/[^a-z0-9_]/gi, '').substring(0, 32) || null;
}

function sanitizeText(str, maxLen) {
  if (typeof str !== 'string') return '';
  // Strip HTML/script tags
  return str
    .replace(/<[^>]*>/g, '')          // strip tags
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')  // strip non-printable
    .trim()
    .substring(0, maxLen);
}

function log(...args) {
  console.log(`[${new Date().toLocaleTimeString()}] [Mingle]`, ...args);
}

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
server.listen(PORT, () => {
  log(`✅ Mingle Secure Signaling Server → ws://localhost:${PORT}`);
  log(`🛡️  Security: Rate limit ${SECURITY.MESSAGE_RATE_LIMIT} msg/${SECURITY.MESSAGE_RATE_WINDOW_MS/1000}s | Max ${SECURITY.MAX_CONNECTIONS_PER_IP} conn/IP | Heartbeat ${SECURITY.HEARTBEAT_INTERVAL_MS/1000}s`);
  log(`📋 Health check: http://localhost:${PORT}/health`);
});
