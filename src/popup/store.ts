import create from 'zustand';
import { ChatMessage } from '../types/message';

interface Stats {
  totalMessages: number;
  participants: number;
  attachments: number;
}

function computeStats(messages: ChatMessage[]): Stats {
  const participants = new Set(
    messages.map((m) => m.sender).filter((s): s is string => !!s)
  );
  const attachments = messages.reduce((sum, m) => sum + m.attachments.length, 0);
  return { totalMessages: messages.length, participants: participants.size, attachments };
}

interface AppState {
  messages: ChatMessage[];
  stats: Stats;
  search: string;
  setMessages: (msgs: ChatMessage[]) => void;
  setSearch: (s: string) => void;
  setStats: (stats: Stats) => void;
}

export const useStore = create<AppState>((set) => ({
  messages: [],
  stats: { totalMessages: 0, participants: 0, attachments: 0 },
  search: '',
  setMessages: (messages) => set({ messages, stats: computeStats(messages) }),
  setSearch: (search) => set({ search }),
  setStats: (stats) => set({ stats })
}));