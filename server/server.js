// Mingle WebSocket Signaling Server — Production Ready
import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 4000;

// HTTP Health Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      clients: clients.size,
      queue: waitingQueue.length,
      pairs: activePairs.size / 2,
      uptime: Math.floor(process.uptime()),
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// WebSocket Server attached directly to HTTP server
const wss = new WebSocketServer({ server });

let waitingQueue = [];
const activePairs = new Map();   // peerId -> peerId
const clients = new Map();       // peerId -> ws

function log(...args) {
  console.log(`[${new Date().toLocaleTimeString()}] [Mingle]`, ...args);
}

function safeSend(ws, data) {
  try {
    if (ws && ws.readyState === 1) { // 1 = OPEN
      ws.send(JSON.stringify(data));
    }
  } catch (e) {
    log('Send error:', e.message);
  }
}

function sendTo(peerId, data) {
  const ws = clients.get(peerId);
  if (ws && ws.readyState === 1) {
    safeSend(ws, data);
    return true;
  }
  return false;
}

function broadcastOnlineCount() {
  const msg = JSON.stringify({ type: 'ONLINE_COUNT', count: clients.size });
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

function removeFromQueue(id) {
  waitingQueue = waitingQueue.filter(w => w.peerId !== id);
}

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

  sendTo(entry.peerId, { type: 'MATCHED', isInitiator: true, remotePeerId: match.peerId });
  sendTo(match.peerId, { type: 'MATCHED', isInitiator: false, remotePeerId: entry.peerId });
}

function handleDisconnect(peerId) {
  if (!peerId) return;
  log(`🔌 Client disconnected: ${peerId}`);
  clients.delete(peerId);
  removeFromQueue(peerId);

  const partnerId = activePairs.get(peerId);
  if (partnerId) {
    activePairs.delete(peerId);
    activePairs.delete(partnerId);
    sendTo(partnerId, { type: 'PEER_DISCONNECTED' });
  }

  broadcastOnlineCount();
}

wss.on('connection', (ws, req) => {
  let peerId = null;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  log(`📡 New WebSocket connection from ${ip}`);

  ws.on('message', (rawData) => {
    let data;
    try {
      data = JSON.parse(rawData.toString());
    } catch (e) {
      return;
    }

    switch (data.type) {
      case 'REGISTER': {
        peerId = String(data.peerId || '').replace(/[^a-z0-9_]/gi, '').substring(0, 32);
        if (!peerId) return;
        clients.set(peerId, ws);
        log(`✅ Registered peer: ${peerId} | Online: ${clients.size}`);
        broadcastOnlineCount();
        break;
      }

      case 'FIND_MATCH': {
        if (!peerId) return;
        removeFromQueue(peerId);

        const oldPartner = activePairs.get(peerId);
        if (oldPartner) {
          activePairs.delete(peerId);
          activePairs.delete(oldPartner);
          sendTo(oldPartner, { type: 'PEER_DISCONNECTED' });
        }

        const entry = { peerId, ws, interest: data.interest || 'Fun' };
        waitingQueue.push(entry);
        safeSend(ws, { type: 'SEARCHING' });
        log(`🔍 Queued peer: ${peerId} [${entry.interest}] | Queue size: ${waitingQueue.length}`);
        tryMatch(entry);
        break;
      }

      case 'SDP_OFFER':
      case 'SDP_ANSWER':
      case 'ICE_CANDIDATE': {
        if (!peerId) return;
        const targetId = activePairs.get(peerId);
        if (targetId) {
          sendTo(targetId, { ...data, fromPeerId: peerId });
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        if (!peerId) return;
        const targetId = activePairs.get(peerId);
        if (targetId) {
          sendTo(targetId, {
            type: 'CHAT_MESSAGE',
            text: String(data.text || '').substring(0, 500),
            timestamp: data.timestamp
          });
        }
        break;
      }

      case 'STOP': {
        if (!peerId) return;
        removeFromQueue(peerId);
        const partnerId = activePairs.get(peerId);
        if (partnerId) {
          activePairs.delete(peerId);
          activePairs.delete(partnerId);
          sendTo(partnerId, { type: 'PEER_DISCONNECTED' });
        }
        safeSend(ws, { type: 'STOPPED' });
        break;
      }

      default:
        break;
    }
  });

  ws.on('close', () => {
    handleDisconnect(peerId);
  });

  ws.on('error', (err) => {
    log(`WS error for ${peerId}:`, err.message);
    handleDisconnect(peerId);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  log(`✅ Mingle Signaling Server running on port ${PORT}`);
});
