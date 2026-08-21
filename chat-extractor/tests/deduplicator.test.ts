import { describe, test, expect } from 'vitest';
import { Deduplicator, createFingerprint } from '../src/core/deduplicator';
import { ChatMessage } from '../src/types/message';

const baseMsg: ChatMessage = {
  id: '1', platform: 'x', conversation: 'c', sender: 'A', timestamp: '10:00',
  text: 'hello', type: 'text', attachments: [], links: [], extractedAt: ''
};

describe('Deduplicator', () => {
  test('identical messages deduplicated', () => {
    const d = new Deduplicator();
    const msg: ChatMessage = { ...baseMsg };
    d.add(msg);
    expect(d.has({ ...msg, id: '2' })).toBe(true);
  });

  test('different attachments create different fingerprint', () => {
    const fp1 = createFingerprint({
      ...baseMsg,
      attachments: [{ id: 'a1', name: 'a.pdf', type: 'document', previewAvailable: false, downloadAvailable: true }]
    });
    const fp2 = createFingerprint({
      ...baseMsg,
      attachments: [{ id: 'a2', name: 'b.pdf', type: 'document', previewAvailable: false, downloadAvailable: true }]
    });
    expect(fp1).not.toEqual(fp2);
  });
});