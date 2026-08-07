import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, MessageSquare } from 'lucide-react';
import { soundFx } from '../services/soundEffects.js';

const QUICK_REACTIONS = ['❤️', '😂', '🔥', '👍', '🎉', '😮'];

export default function ChatPanel({
  messages = [],
  isConnected,
  onSendMessage,
  onSendReaction
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !isConnected) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="glass-panel" style={{
      width: '340px',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 'var(--radius-lg)',
      margin: '0 12px 12px 0',
      overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <MessageSquare size={18} color="var(--primary)" />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
          Text Chat
        </h3>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.75rem',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          color: isConnected ? 'var(--accent-green)' : 'var(--text-muted)'
        }}>
          {isConnected ? 'Active Call' : 'Standby'}
        </span>
      </div>

      {/* Message History */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.85rem'
          }}>
            Messages will appear here once connected to a stranger.
          </div>
        ) : (
          messages.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div key={index} style={{
                  textAlign: 'center',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  margin: '4px 0'
                }}>
                  {msg.text}
                </div>
              );
            }

            const isYou = !msg.isPeer;

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isYou ? 'flex-end' : 'flex-start'
                }}
              >
                <span style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  marginBottom: '3px'
                }}>
                  {isYou ? 'You' : msg.sender || 'Stranger'} • {msg.timestamp}
                </span>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: isYou 
                    ? '16px 16px 4px 16px' 
                    : '16px 16px 16px 4px',
                  background: isYou
                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  wordBreak: 'break-word',
                  border: isYou ? 'none' : '1px solid var(--border-glass)'
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Reaction Quick Bar */}
      <div style={{
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderTop: '1px solid var(--border-glass)',
        overflowX: 'auto'
      }}>
        {QUICK_REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => {
              soundFx.playClick();
              onSendReaction(emoji);
            }}
            disabled={!isConnected}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: isConnected ? 'pointer' : 'default',
              opacity: isConnected ? 1 : 0.4,
              padding: '4px',
              borderRadius: '6px',
              transition: 'transform 0.15s ease'
            }}
            title={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          gap: '8px'
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isConnected ? "Type a message..." : "Connect to chat..."}
          disabled={!isConnected}
          style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputText.trim()}
          className="btn btn-primary btn-icon"
          style={{
            width: '40px',
            height: '40px',
            opacity: (!isConnected || !inputText.trim()) ? 0.4 : 1
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
