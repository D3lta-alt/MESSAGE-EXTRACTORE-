// src/popup/components/StatsBar.tsx
import React from 'react';
import { useStore } from '../store';

export function StatsBar() {
  const stats = useStore((state) => state.stats);
  return (
    <div
      style={{
        background: '#e2e8f0',
        padding: '0.5rem 1rem',
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}
    >
      <span>Messages: {stats.totalMessages}</span>
      <span>Participants: {stats.participants}</span>
      <span>Attachments: {stats.attachments}</span>
    </div>
  );
}