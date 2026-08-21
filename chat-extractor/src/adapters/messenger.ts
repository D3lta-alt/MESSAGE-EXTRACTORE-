import { PlatformAdapter } from './base-adapter';
import { ChatMessage, Attachment } from '../types/message';
import { normalizeText, detectMessageType, extractLinks } from '../core/normalizer';
import { AttachmentManager } from '../core/attachment-manager';
import { getElementDomPath } from '../content/dom-utils';

/**
 * Messenger's message list is an ARIA grid (Meta's shared accessible-list
 * component): a `div[role="grid"]` containing one `div[role="row"]` per message,
 * each wrapping a `div[role="gridcell"]`. Two accessibility-only headings carry
 * the metadata a screen reader needs but the eye doesn't: an <h4> announcing who
 * sent it ("You sent" / "Jane Doe sent") and an <h2> announcing when. These are
 * real semantic tags rather than styling classes, so — unlike Messenger's
 * auto-generated CSS class names, which rotate — they're a stable target.
 *
 * This was previously an unimplemented stub that fell through to
 * GenericAdapter's generic `li, article, [role="listitem"]` selector, which
 * matches the chat-info side panel's menu items just as readily as an actual
 * message, and is why extraction returned rows like "Media, files and links"
 * and "Chat Info" instead of real messages.
 *
 * If this ever drifts out of sync with Messenger's live markup, the extension's
 * built-in Inspector Mode (Options page) lets you click the real elements and
 * override any of these selectors without needing a code change.
 */
export class MessengerAdapter implements PlatformAdapter {
  platformName = 'Messenger';

  constructor(private overrides: Record<string, string> = {}) {}

  detectPlatform(): boolean {
    const host = location.hostname;
    if (/(^|\.)messenger\.com$/.test(host)) return true;
    if (/(^|\.)facebook\.com$/.test(host) && /^\/messages\b/.test(location.pathname)) return true;
    return false;
  }

  findConversation(): string {
    const grid = this.getGrid();
    const label = grid?.getAttribute('aria-label') || '';
    const match = label.match(/conversation with (.+)$/i);
    return match?.[1]?.trim() || document.title || 'Unknown conversation';
  }

  findConversationId(): string | null {
    return location.pathname.split('/').filter(Boolean).pop() || null;
  }

  private getGrid(): HTMLElement | null {
    return document.querySelector('[role="grid"]');
  }

  findMessageContainers(): HTMLElement[] {
    if (this.overrides.container) {
      return Array.from(document.querySelectorAll<HTMLElement>(this.overrides.container));
    }
    const grid = this.getGrid();
    if (!grid) return [];
    // Intentionally NOT falling back to a generic list/item selector here —
    // that's exactly the bug this adapter replaces. If the grid isn't found,
    // returning nothing (rather than guessing) is the correct failure mode.
    return Array.from(grid.querySelectorAll<HTMLElement>('[role="row"]'));
  }

  extractMessage(el: HTMLElement, conversation: string): ChatMessage | null {
    const scope = (el.querySelector('[role="gridcell"]') as HTMLElement | null) || el;

    const sender = this.extractSender(scope);
    const timestamp = this.extractTimestamp(scope);
    const text = this.extractText(scope);
    const attachments = this.extractAttachments(scope);

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

  private extractSender(scope: HTMLElement): string | null {
    if (this.overrides.sender) {
      return normalizeText(scope.querySelector(this.overrides.sender)?.textContent);
    }
    const heading = scope.querySelector('h4');
    const raw = normalizeText(heading?.textContent);
    if (!raw) return null;
    return raw.replace(/\s+sent$/i, '').trim() || null;
  }

  private extractTimestamp(scope: HTMLElement): string | null {
    if (this.overrides.timestamp) {
      const el = scope.querySelector(this.overrides.timestamp);
      return el?.getAttribute('datetime') || normalizeText(el?.textContent);
    }
    const heading = scope.querySelector('h2');
    if (!heading) return null;
    const visible = heading.querySelector('[aria-hidden="true"]');
    return normalizeText(visible?.textContent) || normalizeText(heading.textContent);
  }

  private extractText(scope: HTMLElement): string | null {
    if (this.overrides.text) {
      return normalizeText(scope.querySelector(this.overrides.text)?.textContent);
    }
    // Strip the sender/timestamp headings so their (often screen-reader-only)
    // text doesn't leak into the message body, then read what's left.
    const clone = scope.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('h2, h4').forEach((n) => n.remove());
    return normalizeText(clone.textContent);
  }

  extractAttachments(el: HTMLElement): Attachment[] {
    const sel = this.overrides.attachment || 'img[src], video, audio, a[href]';
    const attachments: Attachment[] = [];
    el.querySelectorAll(sel).forEach((media) => {
      if (AttachmentManager.isLikelyAvatar(media)) return;
      const att = AttachmentManager.extractFromElement(media);
      if (att) attachments.push(att);
    });
    return attachments;
  }

  getScrollContainer(): HTMLElement | null {
    return this.getGrid();
  }

  hasMoreHistory(): boolean {
    const grid = this.getGrid();
    if (!grid) return true;
    const spinner = grid.querySelector('[role="progressbar"], svg[aria-label*="Loading" i]');
    return !spinner;
  }

  getUserSelectors(): Record<string, string> {
    return {
      container: this.overrides.container || '[role="grid"] [role="row"]',
      sender: this.overrides.sender || 'h4 (parsed, strips trailing "sent")',
      text: this.overrides.text || '(gridcell content, minus h2/h4 headings)',
      timestamp: this.overrides.timestamp || 'h2',
      attachment: this.overrides.attachment || 'img[src], video, audio, a[href]'
    };
  }
}
