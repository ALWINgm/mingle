import { WebSocket } from 'ws';

console.log('Testing connection to wss://mingle-server-q4q0.onrender.com ...');
const ws = new WebSocket('wss://mingle-server-q4q0.onrender.com');

ws.on('open', () => {
  console.log('SUCCESS: Connected to Render WebSocket server!');
  ws.send(JSON.stringify({ type: 'REGISTER', peerId: 'test_peer_123' }));
});

ws.on('message', (data) => {
  console.log('RECEIVED:', data.toString());
  ws.close();
});

ws.on('error', (err) => {
  console.error('ERROR:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(`CLOSED: code=${code}, reason=${reason}`);
});
