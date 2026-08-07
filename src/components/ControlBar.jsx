import React from 'react';
import {
  Play,
  SkipForward,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Sparkles,
  Camera,
  Monitor,
  Flag,
  StopCircle,
  Search,
  PhoneOff
} from 'lucide-react';
import { soundFx } from '../services/soundEffects.js';

export default function ControlBar({
  connectionState,
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onStartSearch,
  onSkipPeer,
  onStop,
  onOpenFilters,
  onTakeSnapshot,
  onReportUser
}) {
  const isConnected = connectionState === 'connected';
  const isSearching = connectionState === 'searching';
  const isConnecting = connectionState === 'connecting';
  const isIdle = connectionState === 'idle' || connectionState === 'peer_left' || connectionState === 'server_disconnected';

  return (
    <div className="glass-panel mobile-control-bar" style={{
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '0 12px 12px 12px',
      borderRadius: 'var(--radius-lg)',
      gap: '12px'
    }}>

      {/* ── LEFT: Primary Match/Skip/Stop Action ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* START button — when idle */}
        {isIdle && (
          <button
            onClick={() => { soundFx.playClick(); onStartSearch(); }}
            className="btn btn-action-glow"
            style={{ padding: '11px 28px', fontSize: '1rem', borderRadius: 'var(--radius-full)' }}
          >
            <Play size={20} />
            <span>Start Matching</span>
          </button>
        )}

        {/* SEARCHING / CONNECTING — show Stop only */}
        {(isSearching || isConnecting) && (
          <button
            onClick={() => { soundFx.playClick(); onStop(); }}
            className="btn"
            style={{
              padding: '11px 24px',
              fontSize: '0.97rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(239,68,68,0.15)',
              border: '1.5px solid rgba(239,68,68,0.5)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <StopCircle size={20} />
            <span>{isConnecting ? 'Cancel' : 'Stop Searching'}</span>
          </button>
        )}

        {/* CONNECTED — Next & Stop buttons */}
        {isConnected && (
          <>
            <button
              onClick={() => { soundFx.playClick(); onSkipPeer(); }}
              className="btn btn-primary"
              style={{ padding: '11px 24px', fontSize: '0.97rem', borderRadius: 'var(--radius-full)' }}
            >
              <SkipForward size={19} />
              <span>Next Stranger</span>
            </button>

            <button
              onClick={() => { soundFx.playClick(); onStop(); }}
              className="btn"
              style={{
                padding: '11px 20px',
                fontSize: '0.97rem',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 16px rgba(239,68,68,0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <PhoneOff size={18} />
              <span>Stop</span>
            </button>
          </>
        )}
      </div>

      {/* ── CENTRE: Media Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Mute Mic */}
        <button
          onClick={() => { soundFx.playClick(); onToggleMute(); }}
          className={`btn btn-icon ${isMuted ? 'btn-danger' : 'btn-secondary'}`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => { soundFx.playClick(); onToggleVideo(); }}
          className={`btn btn-icon ${isVideoOff ? 'btn-danger' : 'btn-secondary'}`}
          title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        {/* AR Filters */}
        <button
          onClick={() => { soundFx.playClick(); onOpenFilters(); }}
          className="btn btn-secondary"
          style={{ borderRadius: 'var(--radius-full)', padding: '10px 18px' }}
        >
          <Sparkles size={18} color="var(--primary)" />
          <span>Filters</span>
        </button>

        {/* Screen Share */}
        <button
          onClick={() => { soundFx.playClick(); onToggleScreenShare(); }}
          className={`btn btn-icon ${isScreenSharing ? 'btn-primary' : 'btn-secondary'}`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor size={20} />
        </button>

        {/* Snapshot */}
        <button
          onClick={() => { soundFx.playClick(); onTakeSnapshot(); }}
          className="btn btn-icon btn-secondary"
          title="Take Snapshot"
        >
          <Camera size={20} color="var(--secondary)" />
        </button>
      </div>

      {/* ── RIGHT: Report ── */}
      <div>
        <button
          onClick={() => { soundFx.playClick(); onReportUser(); }}
          className="btn btn-secondary"
          disabled={!isConnected}
          style={{
            opacity: isConnected ? 1 : 0.35,
            padding: '8px 16px',
            fontSize: '0.84rem',
            color: 'var(--accent-red)'
          }}
        >
          <Flag size={15} />
          <span>Report</span>
        </button>
      </div>

    </div>
  );
}
