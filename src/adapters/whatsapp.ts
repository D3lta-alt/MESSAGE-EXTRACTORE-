import { PlatformAdapter } from './base-adapter';
import { ChatMessage, Attachment } from '../types/message';
import { normalizeText, detectMessageType, extractLinks } from '../core/normalizer';
import { AttachmentManager } from '../core/attachment-manager';
import { getElementDomPath } from '../content/dom-utils';

export class WhatsAppAdapter implements PlatformAdapter {
  platformName = 'WhatsApp Web';

  detectPlatform(): boolean {
    return !!document.querySelector('#app, [data-testid="conversation-panel-messages"]');
  }

  findConversation(): string {
    const header = document.querySelector('[data-testid="conversation-header"] span[title]');
    return header?.getAttribute('title') || 'Unknown conversation';
  }

  findConversationId(): string | null {
    return location.pathname.split('/').pop() || null;
  }

  findMessageContainers(): HTMLElement[] {
    // Stable structural selectors first
    const primary = Array.from(
      document.querySelectorAll('[data-testid="conversation-panel-messages"] [data-testid="msg-container"]')
    ) as HTMLElement[];

    if (primary.length) return primary;

    // Fallback: structural relationship
    const fallback = Array.from(
      document.querySelectorAll('[data-testid="conversation-panel-messages"] div[data-id]')
    ) as HTMLElement[];

    return fallback;
  }

  extractMessage(el: HTMLElement, conversation: string): ChatMessage | null {
    const textEl = el.querySelector('[data-testid="msg-text"], .selectable-text');
    const text = normalizeText(textEl?.textContent);

    const senderEl = el.querySelector('[data-testid="msg-meta"] span');
    const sender = normalizeText(senderEl?.textContent) || null;

    const timeEl = el.querySelector('[data-testid="msg-meta"] time, .copyable-text time');
    const timestamp = timeEl?.getAttribute('datetime') || normalizeText(timeEl?.textContent) || null;

    const attachments = this.extractAttachments(el);

    if (!text && attachments.length === 0) return null;

    const type = detectMessageType(text, attachments);

    return {
      id: 'msg_' + Math.random().toString(36).slice(2),
      platform: this.platformName,
      conversation,
      conversationId: this.findConversationId(),
      sender,
      timestamp,
      text,
      type,
      attachments,
      links: extractLinks(text),
      replyTo: null,
      extractedAt: new Date().toISOString(),
      domPath: getElementDomPath(el)
    };
  }

  extractAttachments(el: HTMLElement): Attachment[] {
    const mediaSelectors = [
      'img[src*="blob:"], img[src*="data:"]',
      'div[data-testid="media-image"] img',
      'div[data-testid="media-video"] video',
      'div[data-testid="audio-player"] audio',
      'a[href*=".pdf"], a[href*=".doc"], a[href*=".xls"]'
    ];

    const attachments: Attachment[] = [];
    for (const sel of mediaSelectors) {
      el.querySelectorAll(sel).forEach(media => {
        const att = AttachmentManager.extractFromElement(media);
        if (att) attachments.push(att);
      });
    }
    return attachments;
  }

  getScrollContainer(): HTMLElement | null {
    return document.querySelector('[data-testid="conversation-panel-messages"]') ||
           document.querySelector('#main') as HTMLElement | null;
  }

  hasMoreHistory(): boolean {
    const spinner = document.querySelector('[data-testid="loading"]');
    return !spinner;
  }

  getUserSelectors(): Record<string, string> {
    return {
      container: '[data-testid="conversation-panel-messages"] [data-testid="msg-container"]',
      sender: '[data-testid="msg-meta"] span',
      text: '[data-testid="msg-text"], .selectable-text',
      timestamp: '[data-testid="msg-meta"] time',
      attachment: 'img, video, audio, a[href]'
    };
  }
}