import React, { useState } from 'react';
import { Video, ShieldCheck, HeartHandshake, AlertCircle } from 'lucide-react';
import { soundFx } from '../services/soundEffects.js';

export default function WelcomeModal({ isOpen, onAccept }) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '540px',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        border: '1px solid var(--border-glass-bright)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
      }}>
        {/* Header Badge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 25px var(--primary-glow)'
          }}>
            <Video size={34} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            Welcome to <span className="gradient-text">Mingle</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Connect with random video chatters worldwide in seconds!
          </p>
        </div>

        {/* Safety Guidelines */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <ShieldCheck size={20} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <strong>Be Respectful & Kind</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Hate speech, inappropriate behavior, or explicit content will result in immediate permanent bans.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <HeartHandshake size={20} color="var(--secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <strong>Protect Your Privacy</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Never share personal credentials, passwords, financial details, or address with strangers.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertCircle size={20} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <strong>Report & Skip Anytime</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Use the Report button or Skip button instantly if a chat makes you uncomfortable.
              </p>
            </div>
          </div>
        </div>

        {/* Age Consent Checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          color: 'var(--text-main)',
          userSelect: 'none'
        }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--primary)',
              cursor: 'pointer'
            }}
          />
          <span>I am 18 years or older and agree to the Mingle Community Rules.</span>
        </label>

        {/* Join Call Button */}
        <button
          onClick={() => {
            soundFx.playMatchFound();
            onAccept();
          }}
          disabled={!agreed}
          className="btn btn-action-glow"
          style={{
            padding: '14px',
            fontSize: '1.05rem',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            opacity: agreed ? 1 : 0.4
          }}
        >
          Enter Mingle Video Call
        </button>
      </div>
    </div>
  );
}
