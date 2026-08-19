import { test, expect } from 'vitest';
import { ExportManager } from '../src/core/export-manager';
import { ChatMessage } from '../src/types/message';

test('TXT export format', () => {
  const msgs: ChatMessage[] = [{
    id: '1', platform: 'x', conversation: 'c',
    timestamp: '12:00', sender: 'Rahul', text: 'Hi', type: 'text',
    attachments: [], links: [], extractedAt: ''
  }];
  const txt = ExportManager.toTxt(msgs);
  expect(txt).toContain('[12:00] Rahul:');
});