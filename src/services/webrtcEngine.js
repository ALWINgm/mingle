// WebRTC Real P2P Engine — WebSocket Signaling for Mingle
// Connects real users across different browsers/devices

const DEFAULT_PROD_WS = 'wss://mingle-server-q4q0.onrender.com';
const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER ||
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'ws://localhost:4000'
    : DEFAULT_PROD_WS);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCEngine {
  constructor(handlers = {}) {
    this.peerConnection = null;
    this.localStream = null;
    this.peerId = 'peer_' + Math.random().toString(36).substr(2, 9);
    this.remotePeerId = null;
    this.isInitiator = false;
    this.ws = null;
    this.wsReady = false;

    this.onRemoteStream = handlers.onRemoteStream || (() => {});
    this.onConnectionState = handlers.onConnectionState || (() => {});
    this.onChatMessage = handlers.onChatMessage || (() => {});
    this.onOnlineCount = handlers.onOnlineCount || (() => {});

    this.connectSignalingServer();
  }

  connectSignalingServer() {
    try {
      this.ws = new WebSocket(SIGNALING_SERVER);

      this.ws.onopen = () => {
        this.wsReady = true;
        console.log('[Mingle] Connected to signaling server');
        // Register this peer with the server
        this.send({ type: 'REGISTER', peerId: this.peerId });
      };

      this.ws.onmessage = (event) => {
        let data;
        try { data = JSON.parse(event.data); } catch { return; }
        this.handleServerMessage(data);
      };

      this.ws.onclose = () => {
        this.wsReady = false;
        console.log('[Mingle] Signaling server disconnected. Retrying in 3s...');
        this.onConnectionState('server_disconnected');
        setTimeout(() => this.connectSignalingServer(), 3000);
      };

      this.ws.onerror = (err) => {
        console.error('[Mingle] WebSocket error:', err);
      };
    } catch (err) {
      console.error('[Mingle] Could not connect to signaling server:', err);
      setTimeout(() => this.connectSignalingServer(), 3000);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  setLocalStream(stream) {
    this.localStream = stream;

    // If already in a peer connection, replace tracks
    if (this.peerConnection) {
      const senders = this.peerConnection.getSenders();
      stream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track && s.track.kind === track.kind);
        if (sender) sender.replaceTrack(track);
        else this.peerConnection.addTrack(track, stream);
      });
    }
  }

  findPeer(interest = 'General') {
    this.closePeerConnection();
    this.onConnectionState('searching');
    this.send({ type: 'FIND_MATCH', interest });
  }

  stop() {
    this.closePeerConnection();
    this.send({ type: 'STOP' });
    this.onConnectionState('idle');
  }

  async handleServerMessage(data) {
    switch (data.type) {

      case 'ONLINE_COUNT':
        this.onOnlineCount(data.count);
        break;

      case 'SEARCHING':
        this.onConnectionState('searching');
        break;

      case 'STOPPED':
        this.onConnectionState('idle');
        break;

      case 'MATCHED': {
        this.remotePeerId = data.remotePeerId;
        this.isInitiator = data.isInitiator;
        this.onConnectionState('connecting');
        await this.initPeerConnection();

        if (this.isInitiator) {
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          this.send({ type: 'SDP_OFFER', sdp: offer });
        }
        break;
      }

      case 'SDP_OFFER': {
        if (!this.peerConnection) await this.initPeerConnection();
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.sdp)
        );
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.send({ type: 'SDP_ANSWER', sdp: answer });
        break;
      }

      case 'SDP_ANSWER': {
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.sdp)
          );
        }
        break;
      }

      case 'ICE_CANDIDATE': {
        if (this.peerConnection && data.candidate) {
          try {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } catch (e) {
            console.warn('[Mingle] ICE candidate error:', e);
          }
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        this.onChatMessage({
          sender: 'Stranger',
          text: data.text,
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isPeer: true
        });
        break;
      }

      case 'PEER_DISCONNECTED': {
        this.closePeerConnection();
        this.onConnectionState('peer_left');
        break;
      }

      case 'server_disconnected':
        break;

      default:
        break;
    }
  }

  async initPeerConnection() {
    if (this.peerConnection) return;

    const remoteStream = new MediaStream();
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Receive remote tracks
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
      this.onRemoteStream(remoteStream, { name: 'Stranger' });
    };

    // Send ICE candidates to the server for relay
    this.peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.send({ type: 'ICE_CANDIDATE', candidate });
      }
    };

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('[Mingle] Peer connection state:', state);
      if (state === 'connected') {
        this.onConnectionState('connected');
      } else if (state === 'failed' || state === 'closed') {
        this.closePeerConnection();
        this.onConnectionState('peer_left');
      }
    };
  }

  sendChatMessage(text) {
    this.send({
      type: 'CHAT_MESSAGE',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  closePeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remotePeerId = null;
    this.isInitiator = false;
  }

  destroy() {
    this.closePeerConnection();
    if (this.ws) {
      this.ws.onclose = null; // prevent auto-reconnect on manual destroy
      this.ws.close();
    }
  }
}
