import { ChatMessage } from '../types/message';

export interface ParticipantStat {
  name: string;
  messageCount: number;
}

export interface ExtractionStats {
  totalMessages: number;
  participants: ParticipantStat[];
  attachmentCount: number;
  attachmentsByType: Record<string, number>;
  dateRange: { start: string | null; end: string | null };
  durationLabel: string | null;
  /** True if one or more timestamps couldn't be parsed into a real date, so
   * dateRange/durationLabel are based on a subset of messages. Raw timestamp
   * format varies by platform (and locale), so this is best-effort. */
  hasUnparsedTimestamps: boolean;
}

/**
 * Best-effort timestamp parser. Adapters store whatever raw timestamp string
 * the source platform renders, which isn't always something `new Date()`
 * handles on its own (e.g. WhatsApp's "10:15 AM, 1/1/2026" puts time before
 * date). Tries a couple of common shapes before falling back to the native
 * parser, and gives up cleanly (returns null) rather than guessing wrong.
 */
export function parseMessageTimestamp(ts: string | null | undefined): Date | null {
  if (!ts) return null;

  // "<time>, <date>" — e.g. WhatsApp's "10:15 AM, 1/1/2026"
  const timeThenDate = ts.match(/^(.+?),\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (timeThenDate) {
    const [, , a, b, yearRaw] = timeThenDate;
    const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
    // Ambiguous day/month order — try month-first (US), fall back to day-first.
    const candidates = [
      new Date(`${ts.split(',')[0]}, ${a}/${b}/${year}`),
      new Date(year, Number(a) - 1, Number(b)),
      new Date(year, Number(b) - 1, Number(a)),
    ];
    const valid = candidates.find((d) => !isNaN(d.getTime()));
    if (valid) return valid;
  }

  const native = new Date(ts);
  return isNaN(native.getTime()) ? null : native;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDuration(start: Date, end: Date): string {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (remMonths > 0) parts.push(`${remMonths} month${remMonths !== 1 ? 's' : ''}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  return parts.join(', ');
}

export function computeExtractionStats(messages: ChatMessage[]): ExtractionStats {
  const participantCounts = new Map<string, number>();
  const attachmentsByType: Record<string, number> = {};
  let attachmentCount = 0;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  let unparsedCount = 0;

  for (const m of messages) {
    if (m.sender) {
      participantCounts.set(m.sender, (participantCounts.get(m.sender) || 0) + 1);
    }
    for (const att of m.attachments) {
      attachmentCount++;
      attachmentsByType[att.type] = (attachmentsByType[att.type] || 0) + 1;
    }
    const d = parseMessageTimestamp(m.timestamp);
    if (d) {
      if (!minDate || d < minDate) minDate = d;
      if (!maxDate || d > maxDate) maxDate = d;
    } else if (m.timestamp) {
      unparsedCount++;
    }
  }

  const participants = Array.from(participantCounts.entries())
    .map(([name, messageCount]) => ({ name, messageCount }))
    .sort((a, b) => b.messageCount - a.messageCount);

  return {
    totalMessages: messages.length,
    participants,
    attachmentCount,
    attachmentsByType,
    dateRange: {
      start: minDate ? formatDate(minDate) : null,
      end: maxDate ? formatDate(maxDate) : null,
    },
    durationLabel: minDate && maxDate ? formatDuration(minDate, maxDate) : null,
    hasUnparsedTimestamps: unparsedCount > 0,
  };
}

/** Derives a single "source" summary from a message list that may span more
 * than one platform/conversation (e.g. if the person extracted several chats
 * over time). Falls back to a "Multiple" label rather than picking one
 * arbitrarily and hiding the rest. */
export function deriveSource(messages: ChatMessage[]): {
  platform: string;
  conversation: string;
  isMixed: boolean;
} {
  if (messages.length === 0) return { platform: 'No data yet', conversation: '—', isMixed: false };
  const platforms = new Set(messages.map((m) => m.platform));
  const conversations = new Set(messages.map((m) => m.conversation));
  return {
    platform: platforms.size === 1 ? messages[0].platform : `${platforms.size} platforms`,
    conversation: conversations.size === 1 ? messages[0].conversation : `${conversations.size} conversations`,
    isMixed: platforms.size > 1 || conversations.size > 1,
  };
}

const SENDER_PALETTE = [
  { text: 'ce-sender-blue', badge: 'ce-badge-blue' },
  { text: 'ce-sender-pink', badge: 'ce-badge-pink' },
  { text: 'ce-sender-teal', badge: 'ce-badge-teal' },
  { text: 'ce-sender-amber', badge: 'ce-badge-amber' },
  { text: 'ce-sender-violet', badge: 'ce-badge-violet' },
  { text: 'ce-sender-rose', badge: 'ce-badge-rose' },
  { text: 'ce-sender-cyan', badge: 'ce-badge-cyan' },
  { text: 'ce-sender-lime', badge: 'ce-badge-lime' },
];

/** Deterministic per-sender color so the same person always gets the same color across the whole page. */
export function senderColor(name: string | null): { text: string; badge: string } {
  if (!name) return { text: 'ce-sender-muted', badge: 'ce-badge-muted' };
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return SENDER_PALETTE[hash % SENDER_PALETTE.length];
}

const TYPE_BADGE: Record<string, string> = {
  text: 'ce-badge-text', image: 'ce-badge-image', video: 'ce-badge-video',
  audio: 'ce-badge-audio', voice: 'ce-badge-audio', document: 'ce-badge-document',
  sticker: 'ce-badge-sticker', gif: 'ce-badge-gif', link: 'ce-badge-link',
  system: 'ce-badge-muted', unknown: 'ce-badge-muted',
};

export function typeBadgeClass(type: string): string {
  return TYPE_BADGE[type] || TYPE_BADGE.unknown;
}
