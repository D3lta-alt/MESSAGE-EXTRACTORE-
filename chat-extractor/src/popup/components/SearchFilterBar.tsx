// src/popup/components/SearchFilterBar.tsx
import React from 'react';
import { useStore } from '../store';

export function SearchFilterBar() {
  const search = useStore((state) => state.search);
  const setSearch = useStore((state) => state.setSearch);

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        type="text"
        placeholder="Search messages, senders, filenames..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          flex: 1,
          padding: '0.5rem',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          fontSize: '0.9rem',
        }}
      />
      <button
        onClick={() => setSearch('')}
        style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
      >
        Clear
      </button>
    </div>
  );
}