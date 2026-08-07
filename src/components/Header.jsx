import React from 'react';
import { Video, Zap, Volume2, VolumeX, Shield, Users, Tag } from 'lucide-react';
import { soundFx } from '../services/soundEffects.js';

const INTEREST_TAGS = ['Fun', 'Dating', 'Friends', 'Sports', 'Tech', 'Fitness', 'Food', 'Fashion', 'Business', 'Language Exchange'];

export default function Header({ 
  selectedTag, 
  onSelectTag, 
  soundEnabled, 
  onToggleSound, 
  onlineCount = 4281,
  onOpenRules 
}) {
  return (
    <header className="glass-panel" style={{
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 40,
      borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
      margin: '0 12px 12px 12px'
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px var(--primary-glow)'
        }}>
          <Video size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ 
            fontSize: '1.45rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1
          }}>
            <span className="gradient-text">Mingle</span>
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Instant Video Discovery
          </span>
        </div>
      </div>

      {/* Interest Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '4px' }}>
        <Tag size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        {INTEREST_TAGS.map(tag => {
          const isActive = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => {
                soundFx.playClick();
                onSelectTag(tag);
              }}
              className="btn"
              style={{
                fontSize: '0.82rem',
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                background: isActive 
                  ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                border: isActive ? 'none' : '1px solid var(--border-glass)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      {/* Header Right Actions & Online Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Live Online Badge */}
        <div className="glass-pill" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '6px 14px',
          fontSize: '0.85rem',
          color: 'var(--accent-green)',
          fontWeight: 600
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-green)',
            boxShadow: '0 0 10px var(--accent-green)'
          }} />
          <Users size={14} />
          <span>{onlineCount.toLocaleString()} online</span>
        </div>

        {/* Mute/Unmute Sound FX */}
        <button
          onClick={onToggleSound}
          className="btn btn-secondary btn-icon"
          title={soundEnabled ? "Disable sound effects" : "Enable sound effects"}
          style={{ width: '38px', height: '38px' }}
        >
          {soundEnabled ? <Volume2 size={18} color="var(--primary)" /> : <VolumeX size={18} color="var(--text-muted)" />}
        </button>

        {/* Safety Guidelines */}
        <button
          onClick={onOpenRules}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
        >
          <Shield size={16} color="var(--secondary)" />
          <span>Rules</span>
        </button>
      </div>
    </header>
  );
}
