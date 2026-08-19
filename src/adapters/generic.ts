import { PlatformAdapter } from './base-adapter';
import { ChatMessage, Attachment } from '../types/message';
import { normalizeText, detectMessageType, extractLinks } from '../core/normalizer';
import { AttachmentManager } from '../core/attachment-manager';
import { getElementDomPath } from '../content/dom-utils';

export class GenericAdapter implements PlatformAdapter {
  platformName = 'Generic DOM';

  private selectors: Record<string, string>;

  constructor(selectors?: Record<string, string>) {
    this.selectors = selectors || {};
  }

  detectPlatform(): boolean {
    return true; // fallback for any page
  }

  findConversation(): string {
    return document.title || 'Unknown conversation';
  }

  findConversationId(): string | null {
    return location.href;
  }

  getSelectors(): Record<string, string> {
    const defaults = {
      container: '[data-testid="message"], [data-message], [role="listitem"], article, li',
      sender: '[data-sender], [aria-label*="sender"]',
      text: '[data-text], .message, .text',
      timestamp: 'time, [datetime], [data-timestamp], .time',
      attachment: 'img, video, audio, a[href$=".pdf"], a[href$=".doc"], a[href$=".xls"]'
    };
    return {
      ...defaults,
      ...this.selectors
    };
  }

  findMessageContainers(): HTMLElement[] {
    const sel = this.getSelectors().container;
    return Array.from(document.querySelectorAll<HTMLElement>(sel));
  }

  extractMessage(el: HTMLElement, conversation: string): ChatMessage | null {
    const sel = this.getSelectors();
    const text = normalizeText(el.querySelector(sel.text)?.textContent || el.textContent);
    const sender = normalizeText(el.querySelector(sel.sender)?.textContent) || null;
    const timeEl = el.querySelector(sel.timestamp);
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
    const sel = this.getSelectors().attachment;
    const attachments: Attachment[] = [];
    el.querySelectorAll(sel).forEach(media => {
      const att = AttachmentManager.extractFromElement(media);
      if (att) attachments.push(att);
    });
    return attachments;
  }

  getScrollContainer(): HTMLElement | null {
    return document.scrollingElement as HTMLElement;
  }

  hasMoreHistory(): boolean {
    return true;
  }

  getUserSelectors(): Record<string, string> {
    return this.getSelectors();
  }
}