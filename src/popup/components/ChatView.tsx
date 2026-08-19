// src/popup/components/ChatView.tsx
import React from 'react';
import { ChatMessage } from '../../types/message';

interface ChatViewProps {
  messages: ChatMessage[];
}

export function ChatView({ messages }: ChatViewProps) {
  return (
    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
      {messages.map((m, i) => (
        <div
          key={m.id}
          style={{
            borderBottom: '1px solid #f1f5f9',
            padding: '0.75rem 0',
            marginBottom: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong>{m.sender || 'Unknown'}</strong>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{m.timestamp || ''}</span>
          </div>
          {m.text && <div style={{ marginTop: '0.25rem' }}>{m.text}</div>}
          {m.attachments.map((a) => (
            <div key={a.id} style={{ marginTop: '0.25rem', color: '#475569' }}>
              📎 {a.name}
              {a.duration ? ` (${a.duration})` : ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}