export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice'
  | 'document'
  | 'sticker'
  | 'gif'
  | 'link'
  | 'system'
  | 'unknown';

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'voice' | 'document' | 'pdf' | 'sticker' | 'gif' | 'other';
  mimeType?: string | null;
  size?: number | null;
  caption?: string | null;
  previewAvailable: boolean;
  downloadAvailable: boolean;
  url?: string | null;
  blobUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: string | null;
  sender?: string | null;
  timestamp?: string | null;
}

export interface ChatMessage {
  id: string;
  platform: string;
  conversation: string;
  conversationId?: string | null;
  sender: string | null;
  timestamp: string | null;
  text: string | null;
  type: MessageType;
  attachments: Attachment[];
  links: string[];
  replyTo?: string | null;
  extractedAt: string;
  domPath?: string;   // internal fingerprint aid
  messageIndex?: number; // sequential index within conversation
}

export interface ExtractionSession {
  id: string;
  platform: string;
  conversation: string;
  startedAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  stats: {
    totalMessages: number;
    participants: Set<string>;
    attachmentCount: number;
  };
}