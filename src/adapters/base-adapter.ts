import { ChatMessage, Attachment } from '../types/message';

export interface PlatformAdapter {
  readonly platformName: string;
  detectPlatform(): boolean;
  findConversation(): string;
  findConversationId(): string | null;
  findMessageContainers(): HTMLElement[];
  extractMessage(el: HTMLElement, conversation: string): ChatMessage | null;
  extractAttachments(el: HTMLElement): Attachment[];
  getScrollContainer(): HTMLElement | null;
  hasMoreHistory(): boolean;
  getUserSelectors(): Record<string, string>;
}