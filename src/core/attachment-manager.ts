import { Attachment } from '../types/message';

export class AttachmentManager {
  static detectAttachmentType(el: Element): Attachment['type'] | null {
    const tag = el.tagName.toLowerCase();
    const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
    const aria = el.getAttribute('aria-label') || '';

    if (tag === 'img') {
      if (/sticker/i.test(aria) || /sticker/i.test(src)) return 'sticker';
      if (/gif/i.test(src) || /\.gif($|\?)/i.test(src)) return 'gif';
      return 'image';
    }
    if (tag === 'video') return 'video';
    if (tag === 'audio') {
      return /voice/i.test(aria) || /voice/i.test(src) ? 'voice' : 'audio';
    }
    if (tag === 'a' || tag === 'object' || tag === 'embed') {
      const href = el.getAttribute('href') || src;
      if (/\.pdf($|\?)/i.test(href)) return 'pdf';
      if (/\.(doc|docx|txt|zip|rar|xls|xlsx|ppt|pptx)$/i.test(href)) return 'document';
      return 'other';
    }
    return null;
  }

  static extractFromElement(el: Element): Attachment | null {
    const type = this.detectAttachmentType(el);
    if (!type) return null;

    const name =
      el.getAttribute('alt') ||
      el.getAttribute('title') ||
      el.getAttribute('aria-label') ||
      this.guessFileName(el, type) ||
      'Attachment';

    const src = el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('href') || null;

    return {
      id: 'att_' + Math.random().toString(36).slice(2),
      name,
      type,
      mimeType: this.inferMime(type, name),
      size: this.tryParseSize(el),
      caption: null,
      previewAvailable: type === 'image' || type === 'video' || type === 'gif' || type === 'sticker',
      downloadAvailable: !!src,
      url: src,
      blobUrl: null,
      thumbnailUrl: src,
      duration: el.getAttribute('data-duration') || null,
      sender: null,
      timestamp: null
    };
  }

  static inferMime(type: string, name: string): string | null {
    // simple mapping
    if (type === 'pdf') return 'application/pdf';
    if (type === 'image') return 'image/*';
    if (type === 'video') return 'video/*';
    if (type === 'audio' || type === 'voice') return 'audio/*';
    if (type === 'gif') return 'image/gif';
    if (type === 'sticker') return 'image/webp';
    if (/\.docx?$/i.test(name)) return 'application/msword';
    if (/\.xlsx?$/i.test(name)) return 'application/vnd.ms-excel';
    if (/\.pptx?$/i.test(name)) return 'application/vnd.ms-powerpoint';
    return null;
  }

  private static tryParseSize(el: Element): number | null {
    const size = el.getAttribute('data-size') || el.getAttribute('size');
    if (size) {
      const parsed = parseFloat(size);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  }

  private static guessFileName(el: Element, type: string): string | null {
    const src = el.getAttribute('src') || el.getAttribute('href') || '';
    if (src) {
      const path = new URL(src, location.origin).pathname;
      const name = path.split('/').pop();
      if (name && name !== '/') return decodeURIComponent(name);
    }
    return type || 'Attachment';
  }
}