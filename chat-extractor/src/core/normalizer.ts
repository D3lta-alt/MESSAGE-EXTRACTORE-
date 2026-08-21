import { ChatMessage, Attachment, MessageType } from '../types/message';

export function normalizeText(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  return raw.trim().replace(/\u200b/g, '').replace(/\s+\n/g, '\n');
}

/**
 * Like reading `.textContent`, but substitutes the `alt` text of any <img>
 * elements found within (falling back to `title`). Several chat platforms —
 * Instagram and Messenger confirmed among them — render emoji as small
 * <img> tags rather than literal emoji characters, so plain `.textContent`
 * silently drops every emoji in a message. Any adapter reading message text
 * from a DOM element should use this instead of raw `.textContent`.
 */
export function extractTextContent(el: Element | null | undefined): string | null {
  if (!el) return null;
  let out = '';
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elNode = node as Element;
      if (elNode.tagName === 'IMG') {
        out += elNode.getAttribute('alt') || elNode.getAttribute('title') || '';
      } else {
        elNode.childNodes.forEach(walk);
      }
    }
  };
  el.childNodes.forEach(walk);
  return normalizeText(out);
}

export function detectMessageType(
  text: string | null,
  attachments: Attachment[]
): MessageType {
  if (attachments.length > 0) {
    const types = attachments.map(a => a.type);
    if (types.includes('gif')) return 'gif';
    if (types.includes('sticker')) return 'sticker';
    if (types.includes('image')) return 'image';
    if (types.includes('video')) return 'video';
    if (types.includes('voice') || types.includes('audio')) return 'voice';
    if (types.includes('document') || types.includes('pdf')) return 'document';
    return 'unknown';
  }
  if (!text) return 'system';
  const urlOnly = /^(https?:\/\/[^\s]+)$/.test(text);
  if (urlOnly) return 'link';
  return 'text';
}

export function extractLinks(text: string | null): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return Array.from(text.matchAll(urlRegex), m => m[1]);
}

export function sanitizeHtml(html: string): string {
  // DOMPurify is recommended in production.
  // Fallback: escape all HTML tags.
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}