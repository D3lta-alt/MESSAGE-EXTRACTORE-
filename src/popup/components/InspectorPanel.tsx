// src/popup/components/InspectorPanel.tsx
import React, { useState } from 'react';

interface InspectorPanelProps {
  /** Called with the derived selector config whenever the user stops the
   * inspector with a result, so a parent (e.g. the Options page) can merge it
   * into the selectors it persists — see BUG-016. */
  onSelectorsChange?: (config: Record<string, string>) => void;
}

export function InspectorPanel({ onSelectorsChange }: InspectorPanelProps) {
  const [config, setConfig] = useState<Record<string, string>>({});

  const startInspector = async (target: 'container' | 'sender' | 'text' | 'timestamp' | 'attachment') => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await chrome.tabs.sendMessage(tab.id, { type: 'START_INSPECTOR', target });
  };

  const stopInspector = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const resp = await chrome.tabs.sendMessage(tab.id, { type: 'STOP_INSPECTOR' });
    if (resp?.config) {
      setConfig(resp.config);
      onSelectorsChange?.(resp.config);
    }
  };

  const targets: Array<{ key: 'container' | 'sender' | 'text' | 'timestamp' | 'attachment'; label: string }> = [
    { key: 'container', label: 'Message Container' },
    { key: 'sender', label: 'Sender' },
    { key: 'text', label: 'Message Text' },
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'attachment', label: 'Attachment' },
  ];

  return (
    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Element Inspector</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {targets.map((t) => (
          <button
            key={t.key}
            onClick={() => startInspector(t.key)}
            style={{ padding: '4px 12px', cursor: 'pointer' }}
          >
            Select {t.label}
          </button>
        ))}
      </div>
      <button onClick={stopInspector} style={{ marginTop: '0.5rem', padding: '6px 12px', cursor: 'pointer' }}>
        Stop Inspector
      </button>
      {Object.keys(config).length > 0 && (
        <pre style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>{JSON.stringify(config, null, 2)}</pre>
      )}
    </div>
  );
}