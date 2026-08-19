// src/popup/components/AttachmentsView.tsx
import React, { useState } from 'react';
import { ChatMessage, Attachment } from '../../types/message';

interface AttachmentsViewProps {
  messages: ChatMessage[];
}

export function AttachmentsView({ messages }: AttachmentsViewProps) {
  const [filter, setFilter] = useState<string>('all');

  const allAttachments = messages.flatMap((m) =>
    m.attachments.map((a) => ({
      ...a,
      sender: m.sender,
      timestamp: m.timestamp,
    }))
  );

  const filteredAttachments =
    filter === 'all' ? allAttachments : allAttachments.filter((a) => a.type === filter);

  const filterOptions = ['all', 'image', 'video', 'audio', 'voice', 'document', 'pdf', 'sticker', 'gif', 'other'];

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              background: filter === f ? '#3b82f6' : '#e2e8f0',
              color: filter === f ? 'white' : 'inherit',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filteredAttachments.map((att, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              background: 'white',
            }}
          >
            <div>
              {att.type === 'image' && '🖼️ '}
              {att.type === 'video' && '🎬 '}
              {att.type === 'audio' && '🎵 '}
              {att.type === 'voice' && '🎤 '}
              {att.type === 'document' && '📄 '}
              {att.type === 'pdf' && '📕 '}
              {att.type === 'sticker' && '🏷️ '}
              {att.type === 'gif' && '✨ '}
              {att.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Sender: {att.sender || 'Unknown'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Time: {att.timestamp || 'Unknown'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Preview: {att.previewAvailable ? '✅ Available' : '❌ Not available'} | Download:{' '}
              {att.downloadAvailable ? '✅ Available' : '❌ Not available'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}