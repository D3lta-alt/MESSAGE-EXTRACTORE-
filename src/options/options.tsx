// src/options/options.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { InspectorPanel } from '../popup/components/InspectorPanel';
import type { ScrollSettings } from '../core/extractor';

interface StoredSettings {
  userSelectors?: Record<string, string>;
  scrollSettings?: Partial<ScrollSettings>;
}

function Options() {
  const [selectors, setSelectors] = useState<Record<string, string>>({});
  const [scrollDelay, setScrollDelay] = useState<number>(2000);
  const [settleDelay, setSettleDelay] = useState<number>(500);

  useEffect(() => {
    // Load saved settings
    chrome.storage.local.get<StoredSettings>(['userSelectors', 'scrollSettings'], (result) => {
      if (result.userSelectors) setSelectors(result.userSelectors);
      if (result.scrollSettings) {
        setScrollDelay(result.scrollSettings.scrollDelayMs || 2000);
        setSettleDelay(result.scrollSettings.settleDelayMs || 500);
      }
    });
  }, []);

  const save = () => {
    chrome.storage.local.set({
      userSelectors: selectors,
      scrollSettings: { scrollDelayMs: scrollDelay, settleDelayMs: settleDelay },
    });
  };

  const updateSelector = (key: string, value: string) => {
    setSelectors((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Chat Extractor Options</h1>

      <h2>Element Inspector</h2>
      <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
        Click a target below, then click the matching element on the chat page. The
        derived selector fills in the field beneath — remember to Save when you're done.
      </p>
      <InspectorPanel onSelectorsChange={(cfg) => setSelectors((prev) => ({ ...prev, ...cfg }))} />

      <h2>Default Selectors (Generic Adapter)</h2>
      <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
        These selectors are used as fallback for the generic DOM adapter and can be manually configured per platform.
      </p>

      {['container', 'sender', 'text', 'timestamp', 'attachment'].map((key) => (
        <div key={key} style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
            {key.charAt(0).toUpperCase() + key.slice(1)}:
          </label>
          <input
            type="text"
            value={selectors[key] || ''}
            onChange={(e) => updateSelector(key, e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
      ))}

      <h2>Scrolling Settings</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label>Scroll Delay (ms):</label>
          <input
            type="number"
            value={scrollDelay}
            onChange={(e) => setScrollDelay(Number(e.target.value))}
            style={{ padding: '0.5rem', width: '120px' }}
          />
        </div>
        <div>
          <label>Settle Delay (ms):</label>
          <input
            type="number"
            value={settleDelay}
            onChange={(e) => setSettleDelay(Number(e.target.value))}
            style={{ padding: '0.5rem', width: '120px' }}
          />
        </div>
      </div>

      <button onClick={save} style={{ padding: '0.5rem 1.5rem', cursor: 'pointer' }}>
        Save Settings
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);