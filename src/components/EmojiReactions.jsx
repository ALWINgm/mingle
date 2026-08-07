import React, { useState, useCallback } from 'react';
import { soundFx } from '../services/soundEffects.js';

// All available emojis grouped in rows
const EMOJI_ROWS = [
  ['❤️', '😂', '😍', '🔥', '👏'],
  ['😮', '🥳', '👍', '💯', '🎉'],
  ['😭', '😎', '🤣', '💋', '✨'],
  ['🙌', '💀', '🤯', '👻', '🫶'],
];

const ALL_EMOJIS = EMOJI_ROWS.flat();

const PATHS = ['path-center', 'path-left', 'path-right'];

export default function EmojiReactions({ onSendReaction }) {
  const [expanded, setExpanded] = useState(false);
  const [floaters, setFloaters] = useState([]);

  const spawnFloater = useCallback((emoji) => {
    soundFx.playClick();

    // Spawn 1–3 floaters per tap for a burst feel
    const count = Math.random() < 0.4 ? 3 : Math.random() < 0.6 ? 2 : 1;

    const newFloaters = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      emoji,
      // x spread across the left 60% of video (avoids covering PiP)
      x: 8 + Math.random() * 55,
      // y starts near the bottom
      y: 55 + Math.random() * 20,
      path: PATHS[i % PATHS.length],
      size: 2.4 + Math.random() * 1.2,   // rem
      duration: 1.9 + Math.random() * 0.6, // seconds
    }));

    setFloaters(prev => [...prev, ...newFloaters]);

    // Clean up after animation finishes
    newFloaters.forEach(f => {
      setTimeout(() => {
        setFloaters(prev => prev.filter(r => r.id !== f.id));
      }, (f.duration + 0.2) * 1000);
    });

    // Notify parent so it can relay to stranger
    if (onSendReaction) onSendReaction(emoji);
  }, [onSendReaction]);

  return (
    <>
      {/* ── FLOATING EMOJI LAYER ── renders inside parent's position:relative */}
      {floaters.map(f => (
        <span
          key={f.id}
          className={`floating-reaction ${f.path}`}
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            fontSize: `${f.size}rem`,
            animationDuration: `${f.duration}s`,
          }}
        >
          {f.emoji}
        </span>
      ))}

      {/* ── EMOJI PANEL (bottom-left of video) ── */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
      }}>

        {/* Expanded emoji grid */}
        {expanded && (
          <div
            className="glass-panel"
            style={{
              borderRadius: '18px',
              padding: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
              animation: 'emojiBounceIn 0.28s ease forwards',
              marginBottom: '4px',
            }}
          >
            {ALL_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                className="emoji-btn"
                onClick={() => spawnFloater(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Quick-launch row (always visible) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {/* Toggle button */}
          <button
            className="emoji-btn"
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'Close emojis' : 'Open emojis'}
            style={{
              background: expanded
                ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
                : 'rgba(255,255,255,0.1)',
              border: expanded ? 'none' : '1.5px solid rgba(255,255,255,0.18)',
              fontSize: '1.4rem',
              boxShadow: expanded ? '0 4px 16px var(--primary-glow)' : 'none',
            }}
          >
            {expanded ? '✕' : '😊'}
          </button>

          {/* 5 hot-key emojis */}
          {['❤️', '😂', '🔥', '👍', '🎉'].map((emoji, i) => (
            <button
              key={i}
              className="emoji-btn"
              onClick={() => spawnFloater(emoji)}
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
