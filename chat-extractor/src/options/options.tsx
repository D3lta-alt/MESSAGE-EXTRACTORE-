// src/options/options.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { InspectorPanel } from '../popup/components/InspectorPanel';
import type { ScrollSettings } from '../core/extractor';
import { storageKeyFor } from '../core/platform-key';

interface StoredSettings {
  userSelectorsByPlatform?: Record<string, Record<string, string>>;
  scrollSettings?: Partial<ScrollSettings>;
}

const CONFIGURABLE_PLATFORMS = ['Telegram Web', 'Messenger', 'Discord', 'Instagram', 'Generic DOM'];

function Options() {
  // Keyed by storageKeyFor(platformName) — see BUG-016. Each platform's
  // selectors are edited/saved independently so a fix for one platform can
  // never silently bleed into another.
  const [selectorsByPlatform, setSelectorsByPlatform] = useState<Record<string, Record<string, string>>>({});
  const [editingPlatform, setEditingPlatform] = useState<string>(CONFIGURABLE_PLATFORMS[0]);
  const [scrollDelay, setScrollDelay] = useState<number>(2000);
  const [settleDelay, setSettleDelay] = useState<number>(500);

  useEffect(() => {
    // Load saved settings
    chrome.storage.local.get<StoredSettings>(['userSelectorsByPlatform', 'scrollSettings'], (result) => {
      if (result.userSelectorsByPlatform) setSelectorsByPlatform(result.userSelectorsByPlatform);
      if (result.scrollSettings) {
        setScrollDelay(result.scrollSettings.scrollDelayMs || 2000);
        setSettleDelay(result.scrollSettings.settleDelayMs || 500);
      }
    });
  }, []);

  const save = () => {
    chrome.storage.local.set({
      userSelectorsByPlatform: selectorsByPlatform,
      scrollSettings: { scrollDelayMs: scrollDelay, settleDelayMs: settleDelay },
    });
  };

  const currentKey = storageKeyFor(editingPlatform);
  const currentSelectors = selectorsByPlatform[currentKey] || {};

  const updateSelector = (field: string, value: string) => {
    setSelectorsByPlatform((prev) => ({
      ...prev,
      [currentKey]: { ...prev[currentKey], [field]: value },
    }));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Chat Extractor Options</h1>

      <h2>Element Inspector</h2>
      <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
        Open the chat platform you want to fix in another tab, then click a target
        below and click the matching element on that page. The picked selectors are
        saved for whichever platform is detected in that tab — they won't affect any
        other platform.
      </p>
      <InspectorPanel
        onSelectorsChange={(cfg, platform) => {
          const key = storageKeyFor(platform);
          setSelectorsByPlatform((prev) => ({ ...prev, [key]: { ...prev[key], ...cfg } }));
          setEditingPlatform(platform);
        }}
      />

      <h2>Manual Selectors</h2>
      <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
        Selectors are stored separately per platform. Pick which platform you're
        editing below — "Generic DOM" is the fallback used for any unrecognized page.
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Platform:</label>
        <select
          value={editingPlatform}
          onChange={(e) => setEditingPlatform(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          {CONFIGURABLE_PLATFORMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {['container', 'sender', 'text', 'timestamp', 'attachment'].map((key) => (
        <div key={key} style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
            {key.charAt(0).toUpperCase() + key.slice(1)}:
          </label>
          <input
            type="text"
            value={currentSelectors[key] || ''}
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