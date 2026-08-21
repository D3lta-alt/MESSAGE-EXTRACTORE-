import React from 'react';
import { ChatMessage } from '../../types/message';
import { ExtractionStats, deriveSource } from '../../core/stats';
import { ExportManager } from '../../core/export-manager';
import { IconLogo, IconMessage, IconUsers, IconCalendar, IconClock, IconPaperclip, IconDownload, IconCopy, IconRefresh, IconLock } from '../icons';

interface SidebarProps { messages: ChatMessage[]; stats: ExtractionStats; loading: boolean; }

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return <div className="ce-summary-row"><span className="ce-summary-icon">{icon}</span><div><div className="ce-label">{label}</div><div className="ce-value">{value}</div></div></div>;
}

export function Sidebar({ messages, stats, loading }: SidebarProps) {
  const source = deriveSource(messages);

  const copyAllAsText = async () => {
    try { await navigator.clipboard.writeText(ExportManager.toTxt(messages)); } catch { /* clipboard may be unavailable */ }
  };

  const startNewExtraction = () => {
    if (confirm('Close the results dashboard and return to the chat page for a new extraction?')) window.close();
  };

  return (
    <aside className="ce-sidebar">
      <div className="ce-brand">
        <div className="ce-brand-mark"><IconLogo /></div>
        <span>Chat Extractor</span>
        <small>v1.0.0</small>
      </div>

      <div className={loading ? 'ce-status loading' : 'ce-status'}>
        <span className="ce-status-dot" />
        {loading ? 'Loading extraction…' : 'Extraction Completed'}
      </div>

      <div className="ce-sidebar-scroll">
        <div className="ce-card">
          <div className="ce-card-title">SOURCE</div>
          <div className="ce-source-row"><span className="ce-source-badge"><IconLogo /></span><div><strong>{source.platform}</strong><small>Local browser session</small></div></div>
        </div>

        <div className="ce-card">
          <div className="ce-card-title">CONVERSATION</div>
          <div className="ce-conversation"><span className="ce-round-icon"><IconUsers /></span><div><strong>{source.conversation}</strong><small>Participants: {stats.participants.length}</small></div></div>
        </div>

        <div className="ce-card ce-summary-card">
          <div className="ce-card-title">EXTRACTION SUMMARY</div>
          <SummaryRow icon={<IconMessage />} label="Total Messages" value={stats.totalMessages.toLocaleString()} />
          <SummaryRow icon={<IconUsers />} label="Participants" value={stats.participants.length} />
          <SummaryRow icon={<IconCalendar />} label="Date Range" value={stats.dateRange.start && stats.dateRange.end ? `${stats.dateRange.start} - ${stats.dateRange.end}` : 'Unknown'} />
          <SummaryRow icon={<IconClock />} label="Duration" value={stats.durationLabel || 'Unknown'} />
          <SummaryRow icon={<IconPaperclip />} label="Attachments" value={stats.attachmentCount.toLocaleString()} />
        </div>
      </div>

      <div className="ce-sidebar-actions">
        <button className="ce-btn ce-btn-primary" onClick={() => ExportManager.download(ExportManager.toJson(messages), 'chat-export.json', 'application/json')}>
          <IconDownload /> Export Messages
        </button>
        <button className="ce-btn ce-btn-secondary" onClick={copyAllAsText}><IconCopy /> Copy All as Text</button>
        <button className="ce-btn ce-btn-danger" onClick={startNewExtraction}><IconRefresh /> Start New Extraction</button>
        <div className="ce-privacy"><IconLock /> Processed locally — never leaves this browser</div>
      </div>
    </aside>
  );
}
