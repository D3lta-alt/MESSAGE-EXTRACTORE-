import React, { useEffect, useMemo, useState } from 'react';
import { ChatMessage } from '../types/message';
import { computeExtractionStats, deriveSource } from '../core/stats';
import { Sidebar } from './components/Sidebar';
import { MessagesTab } from './components/MessagesTab';
import { StatisticsTab } from './components/StatisticsTab';
import { ParticipantsTab } from './components/ParticipantsTab';
import { AttachmentsTab } from './components/AttachmentsTab';
import { SettingsTab } from './components/SettingsTab';
import { IconCheck, IconMessage, IconUsers, IconPaperclip, IconCalendar, IconSettings } from './icons';

export type Tab = 'messages' | 'statistics' | 'participants' | 'attachments' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'messages', label: 'Messages', icon: <IconMessage /> },
  { id: 'statistics', label: 'Statistics', icon: <IconCalendar /> },
  { id: 'participants', label: 'Participants', icon: <IconUsers /> },
  { id: 'attachments', label: 'Attachments', icon: <IconPaperclip /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

export function ResultsApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('messages');

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_MESSAGES' }, (response) => {
      if (response?.messages) setMessages(response.messages);
      setLoading(false);
    });

    const listener = (msg: any) => {
      if (msg.type === 'PROGRESS_UPDATE' && msg.messages) setMessages(msg.messages);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const stats = useMemo(() => computeExtractionStats(messages), [messages]);
  const source = useMemo(() => deriveSource(messages), [messages]);

  return (
    <div className="ce-app">
      <Sidebar messages={messages} stats={stats} loading={loading} />

      <main className="ce-main">
        <header className="ce-main-header">
          <div>
            <h1>Extraction Result</h1>
            <p>{source.conversation}</p>
          </div>
          {!loading && messages.length > 0 && (
            <div className="ce-complete">
              <span>{stats.totalMessages.toLocaleString()} messages extracted</span>
              <IconCheck />
            </div>
          )}
        </header>

        <nav className="ce-tabs" aria-label="Extraction result sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? 'ce-tab active' : 'ce-tab'}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="ce-empty"><p>Loading extracted messages…</p></div>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="ce-content">
            {tab === 'messages' && <MessagesTab messages={messages} conversationTitle={source.conversation} />}
            {tab === 'statistics' && <StatisticsTab stats={stats} />}
            {tab === 'participants' && <ParticipantsTab stats={stats} />}
            {tab === 'attachments' && <AttachmentsTab messages={messages} />}
            {tab === 'settings' && <SettingsTab />}
          </section>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="ce-empty ce-empty-large">
      <div className="ce-empty-icon"><IconMessage /></div>
      <h2>No messages extracted yet</h2>
      <p>Open the extension popup on a supported chat page and click Extract, then open the full results dashboard.</p>
    </div>
  );
}
