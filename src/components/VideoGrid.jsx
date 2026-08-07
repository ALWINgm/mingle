import React, { useEffect, useRef } from 'react';
import { VideoOff, MicOff, Search, User, Sparkles, Wifi, WifiOff } from 'lucide-react';
import EmojiReactions from './EmojiReactions.jsx';

export default function VideoGrid({
  localStream,
  remoteStream,
  peerInfo,
  connectionState,
  activeFilter,
  selectedSticker,
  isMuted,
  isVideoOff,
  callDuration,
  onStartSearch,
  onSendReaction
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const stickerCanvasRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, connectionState]);

  // AR Sticker canvas overlay
  useEffect(() => {
    if (!stickerCanvasRef.current || !selectedSticker || selectedSticker === 'none') {
      if (stickerCanvasRef.current) {
        const ctx = stickerCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, stickerCanvasRef.current.width, stickerCanvasRef.current.height);
      }
      return;
    }
    const canvas = stickerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let angle = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      angle += 0.03;
      ctx.font = '70px sans-serif';
      ctx.textAlign = 'center';
      const cx = canvas.width / 2;
      const cy = canvas.height / 3 + Math.sin(angle) * 8;
      const map = { glasses: '🕶️', crown: '👑', party: '🥳', cat: '🐱' };
      if (map[selectedSticker]) ctx.fillText(map[selectedSticker], cx, cy);
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [selectedSticker]);

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const isConnected = connectionState === 'connected';

  return (
    <div style={{
      flex: 1,
      position: 'relative',
      display: 'flex',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      backgroundColor: '#030712',
      border: '1px solid var(--border-glass)',
      margin: '0 12px 12px 12px'
    }}>

      {/* ── REMOTE VIDEO ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000'
      }}>
        {/* Emoji Reactions Panel + Floating burst emojis */}
        <EmojiReactions onSendReaction={onSendReaction} />

        {/* Remote Video Element */}
        {isConnected && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`filter-${activeFilter}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Sticker Canvas */}
        <canvas ref={stickerCanvasRef} width={640} height={480} className="video-canvas-effect" />

        {/* Connected Peer Badge */}
        {isConnected && (
          <div style={{
            position: 'absolute', top: '20px', left: '20px',
            display: 'flex', alignItems: 'center', gap: '10px', zIndex: 20
          }}>
            <div className="glass-pill" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 16px', fontSize: '0.9rem', fontWeight: 600, color: '#fff'
            }}>
              <span style={{
                width: '9px', height: '9px', borderRadius: '50%',
                backgroundColor: 'var(--accent-green)',
                boxShadow: '0 0 10px var(--accent-green)'
              }} />
              <span>{peerInfo?.name || 'Stranger'}</span>
            </div>
            <div className="glass-pill" style={{
              padding: '8px 16px', fontSize: '0.85rem',
              fontWeight: 700, fontFamily: 'monospace', color: 'var(--secondary)'
            }}>
              {formatTime(callDuration)}
            </div>
          </div>
        )}

        {/* ── STATE SCREENS ── */}

        {/* IDLE */}
        {(connectionState === 'idle') && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', padding: '40px', zIndex: 10
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-glow), var(--secondary-glow))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px', border: '1px solid var(--border-glass-bright)'
            }}>
              <Sparkles size={40} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px' }}>
              Ready to meet someone new?
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '28px', fontSize: '0.95rem' }}>
              Click <strong>Start Matching</strong> to instantly connect with real people worldwide.
            </p>
            <button
              onClick={onStartSearch}
              className="btn btn-action-glow"
              style={{ fontSize: '1.1rem', padding: '14px 36px', borderRadius: 'var(--radius-full)' }}
            >
              <Search size={22} />
              <span>Start Matching</span>
            </button>
          </div>
        )}

        {/* SEARCHING */}
        {connectionState === 'searching' && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', padding: '40px', zIndex: 10
          }}>
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              {/* Ripple rings */}
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${90 + i * 40}px`, height: `${90 + i * 40}px`,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(139,92,246,0.25)',
                  animation: `rippleWave ${1.4 + i * 0.4}s ease-out ${i * 0.3}s infinite`
                }} />
              ))}
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: 'rgba(139,92,246,0.12)',
                border: '2px solid var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={40} color="var(--primary)" />
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
              Finding a stranger...
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Searching for real people worldwide
            </p>
          </div>
        )}

        {/* CONNECTING (WebRTC handshake in progress) */}
        {connectionState === 'connecting' && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', padding: '40px', zIndex: 10
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              border: '3px solid rgba(6,182,212,0.2)', borderTopColor: 'var(--secondary)',
              animation: 'spinSlow 1s linear infinite', marginBottom: '20px'
            }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              Connecting...
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Establishing secure P2P connection
            </p>
          </div>
        )}

        {/* PEER LEFT */}
        {connectionState === 'peer_left' && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', padding: '40px', zIndex: 10
          }}>
            <WifiOff size={52} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-muted)' }}>
              Stranger left the call
            </h3>
            <button
              onClick={onStartSearch}
              className="btn btn-primary"
              style={{ fontSize: '1rem', padding: '12px 28px', borderRadius: 'var(--radius-full)' }}
            >
              <Search size={18} />
              <span>Find Next Stranger</span>
            </button>
          </div>
        )}

        {/* SERVER DISCONNECTED */}
        {connectionState === 'server_disconnected' && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', padding: '40px', zIndex: 10
          }}>
            <Wifi size={52} color="var(--accent-red)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-red)' }}>
              Server Disconnected
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Make sure the signaling server is running.<br />
              Reconnecting automatically...
            </p>
          </div>
        )}
      </div>

      {/* ── LOCAL SELF-VIEW (PiP) ── */}
      <div style={{
        position: 'absolute', bottom: '20px', right: '20px',
        width: '220px', height: '160px',
        borderRadius: 'var(--radius-md)', overflow: 'hidden',
        border: '2px solid var(--border-glass-bright)',
        backgroundColor: '#111827',
        boxShadow: '0 10px 25px rgba(0,0,0,0.6)', zIndex: 30
      }}>
        {isVideoOff ? (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#1f2937', color: 'var(--text-muted)'
          }}>
            <VideoOff size={32} />
            <span style={{ fontSize: '0.75rem', marginTop: '6px' }}>Camera Off</span>
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay muted playsInline
            className={`filter-${activeFilter}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        )}
        <div style={{
          position: 'absolute', bottom: '8px', left: '8px',
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'rgba(0,0,0,0.65)', padding: '3px 8px',
          borderRadius: '4px', fontSize: '0.75rem', color: '#fff'
        }}>
          <span>You</span>
          {isMuted && <MicOff size={11} color="var(--accent-red)" />}
        </div>
      </div>
    </div>
  );
}
