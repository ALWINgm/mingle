import React from 'react';
import { X, Sparkles, Image, Smile } from 'lucide-react';
import { soundFx } from '../services/soundEffects.js';

const FILTERS = [
  { id: 'none', label: 'Normal', icon: '✨' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', icon: '🌆' },
  { id: 'noir', label: 'B&W Noir', icon: '🎬' },
  { id: 'vintage', label: 'Warm Vintage', icon: '📜' },
  { id: 'warm', label: 'Sunset Glow', icon: '🌅' },
  { id: 'blur', label: 'Privacy Blur', icon: '🌫️' }
];

const STICKERS = [
  { id: 'none', label: 'No Sticker', emoji: '❌' },
  { id: 'glasses', label: 'Cool Sunglasses', emoji: '🕶️' },
  { id: 'crown', label: 'Royal Crown', emoji: '👑' },
  { id: 'party', label: 'Party Mode', emoji: '🥳' },
  { id: 'cat', label: 'Kitty Ears', emoji: '🐱' }
];

export default function FilterModal({
  isOpen,
  onClose,
  activeFilter,
  onSelectFilter,
  selectedSticker,
  onSelectSticker
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div className="glass-panel" style={{
        width: '90%',
        maxWidth: '520px',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Video Filters & AR Effects
            </h3>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="btn btn-secondary btn-icon"
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Color Presets */}
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Image size={16} /> Color Filters
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {FILTERS.map(f => {
              const isSelected = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectFilter(f.id);
                  }}
                  className="btn"
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected 
                      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? 'none' : '1px solid var(--border-glass)',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: AR Stickers */}
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smile size={16} /> AR Face Stickers
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {STICKERS.map(s => {
              const isSelected = selectedSticker === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectSticker(s.id);
                  }}
                  className="btn"
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected 
                      ? 'linear-gradient(135deg, var(--secondary) 0%, #0284c7 100%)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? 'none' : '1px solid var(--border-glass)',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)' }}
        >
          Apply & Close
        </button>
      </div>
    </div>
  );
}
