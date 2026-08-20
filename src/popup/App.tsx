import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from './store';
import { StatsBar } from './components/StatsBar';
import { TableView } from './components/TableView';
import { ChatView } from './components/ChatView';
import { JsonView } from './components/JsonView';
import { AttachmentsView } from './components/AttachmentsView';
import { SearchFilterBar } from './components/SearchFilterBar';
import { ExportManager, ExportFormat } from '../core/export-manager';
import type { ChatMessage } from '../types/message';

const EXPORT_MIME_TYPES: Record<ExportFormat, string> = {
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  html: 'text/html'
};

function matchesSearch(message: ChatMessage, query: string): boolean {
  const q = query.toLowerCase();
  if (message.sender?.toLowerCase().includes(q)) return true;
  if (message.text?.toLowerCase().includes(q)) return true;
  return message.attachments.some((a) => a.name.toLowerCase().includes(q));
}

export default function App() {
  const { messages, search, setMessages } = useStore();
  const [view, setView] = useState<'table' | 'chat' | 'json' | 'attachments'>('table');
  const [platform, setPlatform] = useState<string>('');
  const [tabId, setTabId] = useState<number | undefined>(undefined);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id !== undefined) setTabId(tab.id);
    });

    // Pull whatever's already in storage so reopening the popup doesn't lose
    // previously-extracted data (see BUG-005/BUG-006).
    chrome.runtime.sendMessage({ type: 'GET_MESSAGES' }, (response) => {
      if (response?.messages) setMessages(response.messages);
    });

    const listener = (msg: any) => {
      if (msg.type === 'PROGRESS_UPDATE') {
        setMessages(msg.messages);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const filteredMessages = useMemo(
    () => (search ? messages.filter((m) => matchesSearch(m, search)) : messages),
    [messages, search]
  );

  const handleExport = (format: ExportFormat) => {
    const content = ExportManager.export(messages, format);
    ExportManager.download(content, `chat-export.${format}`, EXPORT_MIME_TYPES[format]);
  };

  const sendToContentScript = (type: string) => {
    if (tabId === undefined) return;
    chrome.tabs.sendMessage(tabId, { type });
  };

  return (
    <div className="min-w-[800px] min-h-[600px] bg-slate-50 text-slate-900">
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Chat Extractor</h1>
        <div className="flex gap-2">
          <button onClick={() => sendToContentScript('START_EXTRACTION')}>
            Extract
          </button>
          <button onClick={() => sendToContentScript('START_SCROLL')}>
            Start Scroll
          </button>
          <button onClick={() => sendToContentScript('PAUSE_SCROLL')}>
            Pause
          </button>
        </div>
      </header>

      <StatsBar />

      <main className="flex gap-4 p-4">
        <aside className="w-64 bg-white rounded-lg p-4">
          <h2 className="font-medium mb-2">Source</h2>
          <select value={platform} onChange={e => setPlatform(e.target.value)}>
            <option value="">All</option>
            <option>WhatsApp Web</option>
            <option>Telegram Web</option>
            <option>Messenger</option>
            <option>Discord</option>
            <option>Instagram</option>
          </select>

          <h2 className="font-medium mt-4 mb-2">Conversation</h2>
          <button className="w-full text-left p-2 hover:bg-slate-100 rounded">Project Discussion</button>

          <div className="mt-6">
            <button className="w-full bg-blue-600 text-white p-2 rounded" onClick={() => handleExport('json')}>
              Export JSON
            </button>
            <button className="w-full mt-2 bg-gray-200 p-2 rounded" onClick={() => handleExport('txt')}>
              Copy Text
            </button>
          </div>
        </aside>

        <section className="flex-1 bg-white rounded-lg p-4">
          <SearchFilterBar />
          <div className="flex gap-2 mt-3">
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Table</button>
            <button className={view === 'chat' ? 'active' : ''} onClick={() => setView('chat')}>Chat</button>
            <button className={view === 'json' ? 'active' : ''} onClick={() => setView('json')}>JSON</button>
            <button className={view === 'attachments' ? 'active' : ''} onClick={() => setView('attachments')}>Attachments</button>
          </div>

          {view === 'table' && <TableView messages={filteredMessages} />}
          {view === 'chat' && <ChatView messages={filteredMessages} />}
          {view === 'json' && <JsonView messages={filteredMessages} />}
          {view === 'attachments' && <AttachmentsView messages={filteredMessages} />}
        </section>
      </main>

      <footer className="bg-white border-t p-2 text-center text-xs text-slate-500">
        🔒 Processed locally — Your conversation data does not leave this browser.
      </footer>
    </div>
  );
}