// src/popup/components/TableView.tsx
import React from 'react';
import { ChatMessage } from '../../types/message';

interface TableViewProps {
  messages: ChatMessage[];
}

export function TableView({ messages }: TableViewProps) {
  return (
    <div style={{ overflow: 'auto', maxHeight: '400px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Timestamp</th>
            <th>Sender</th>
            <th>Message</th>
            <th>Type</th>
            <th>Attachment</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((m, i) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td>{i + 1}</td>
              <td>{m.timestamp || '—'}</td>
              <td>{m.sender || 'Unknown'}</td>
              <td>
                {m.text || (m.attachments.length > 0 ? m.attachments.map(a => a.name).join(', ') : '[Media]')}
              </td>
              <td>{m.type}</td>
              <td>
                {m.attachments.map(a => `${a.type}: ${a.name}`).join('; ') || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}