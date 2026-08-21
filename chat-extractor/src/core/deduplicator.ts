import { ChatMessage } from '../types/message';

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h' + hash.toString(16);
}

export function createFingerprint(msg: ChatMessage): string {
  const parts = [
    msg.sender ?? '',
    msg.timestamp ?? '',
    msg.text ?? '',
    msg.attachments.map(a => a.name ?? a.url ?? a.blobUrl ?? a.type).join('|')
  ];
  return hashString(parts.join('\u0001'));
}

export class Deduplicator {
  private fingerprints = new Set<string>();
  private domIndex = new Map<string, string>(); // domPath -> fingerprint

  has(msg: ChatMessage): boolean {
    const fp = createFingerprint(msg);

    if (msg.domPath) {
      const existing = this.domIndex.get(msg.domPath);
      // Only treat a domPath match as "already seen" when its stored fingerprint
      // agrees with this message's content. A domPath collision with a *different*
      // fingerprint is not a duplicate — it falls through to the fingerprint check below.
      if (existing && existing === fp) return true;
    }

    return this.fingerprints.has(fp);
  }

  add(msg: ChatMessage): void {
    const fp = createFingerprint(msg);
    this.fingerprints.add(fp);
    if (msg.domPath) this.domIndex.set(msg.domPath, fp);
  }

  clear(): void {
    this.fingerprints.clear();
    this.domIndex.clear();
  }
}