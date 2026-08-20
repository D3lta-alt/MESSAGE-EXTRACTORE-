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

    // WhatsApp Web stamps every bubble with data-pre-plain-text, formatted like
    // "[10:15 AM, 1/1/2026] Jane Doe: " — it's what powers WA's own "copy message"
    // feature, so it's far more stable than the visible meta spans/time elements,
    // which are unlabeled and get restructured across WA's frequent UI updates.
    const metaEl = el.querySelector('[data-pre-plain-text]');
    const rawMeta = metaEl?.getAttribute('data-pre-plain-text') || '';
    const metaMatch = rawMeta.match(/^\[(.+?)\]\s*(.*?):\s*$/);

    let sender = metaMatch?.[2]?.trim() || null;
    let timestamp = metaMatch?.[1]?.trim() || null;

    // Fall back to the visible meta elements if the attribute is missing or
    // didn't match the expected format (e.g. a locale that formats it differently).
    if (!timestamp) {
      const timeEl = el.querySelector('[data-testid="msg-meta"] time, .copyable-text time');
      timestamp = timeEl?.getAttribute('datetime') || normalizeText(timeEl?.textContent) || null;
    }
    if (!sender) {
      const senderEl = el.querySelector('[data-testid="msg-meta"] [aria-label], [data-testid="author"]');
      sender = normalizeText(senderEl?.textContent) || null;
    }

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
      sender: '[data-pre-plain-text] (parsed) — falls back to [data-testid="msg-meta"] [aria-label]',
      text: '[data-testid="msg-text"], .selectable-text',
      timestamp: '[data-pre-plain-text] (parsed) — falls back to [data-testid="msg-meta"] time',
      attachment: 'img, video, audio, a[href]'
    };
  }
}