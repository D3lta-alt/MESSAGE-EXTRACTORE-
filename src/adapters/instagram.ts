import { PlatformAdapter } from './base-adapter';
import { ChatMessage, Attachment } from '../types/message';
import { normalizeText, detectMessageType, extractLinks } from '../core/normalizer';
import { AttachmentManager } from '../core/attachment-manager';
import { getElementDomPath } from '../content/dom-utils';

/**
 * ⚠️ Best-effort adapter — unlike the other adapters in this file, this one
 * has NOT been verified against a live, logged-in Instagram DM thread (that
 * requires an authenticated session this environment doesn't have). It's
 * written on the working hypothesis that Instagram Direct, also a Meta
 * product, reuses the same accessible ARIA-grid message-list component as
 * Messenger (`[role="grid"]` > `[role="row"]` > `[role="gridcell"]`, with
 * screen-reader-only <h4>/<h2> headings for sender/timestamp — see
 * messenger.ts for the reasoning).
 *
 * Platform DETECTION (hostname + path) is solid and won't need adjusting.
 * The DOM-shape assumptions below might not be — if a real extraction run
 * comes back with 0 messages, use Inspector Mode (Options page → Element
 * Inspector) to click the real container/sender/text/timestamp elements on
 * the page; your picks override every selector here immediately, no rebuild
 * needed.
 */
export class InstagramAdapter implements PlatformAdapter {
  platformName = 'Instagram';

  constructor(private overrides: Record<string, string> = {}) {}

  detectPlatform(): boolean {
    return /(^|\.)instagram\.com$/.test(location.hostname) && /^\/direct\//.test(location.pathname);
  }

  findConversation(): string {
    const grid = this.getGrid();
    const label = grid?.getAttribute('aria-label') || '';
    const match = label.match(/conversation with (.+)$/i);
    if (match?.[1]) return match[1].trim();

    // Fallback: Instagram DM thread headers commonly show the other person's
    // username/name near the top of the thread panel.
    const heading = document.querySelector('div[role="main"] header h1, div[role="main"] header span');
    return normalizeText(heading?.textContent) || document.title || 'Unknown conversation';
  }

  findConversationId(): string | null {
    // /direct/t/<thread-id>/
    const match = location.pathname.match(/\/direct\/t\/([^/]+)/);
    return match?.[1] || null;
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
    // Deliberately fails closed (returns nothing) rather than falling back to
    // a generic list-item selector if the grid isn't found — see messenger.ts
    // for why that fallback is actively harmful rather than just imprecise.
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
      container: this.overrides.container || '[role="grid"] [role="row"] (unverified — confirm live)',
      sender: this.overrides.sender || 'h4 (unverified — confirm live)',
      text: this.overrides.text || '(gridcell content, minus h2/h4 headings — unverified)',
      timestamp: this.overrides.timestamp || 'h2 (unverified — confirm live)',
      attachment: this.overrides.attachment || 'img[src], video, audio, a[href]'
    };
  }
}
