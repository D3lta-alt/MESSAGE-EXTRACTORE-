// src/background/service-worker.ts
//
// Owns the single, extension-origin Database instance (chrome-extension://<id>).
// Content scripts run in the page's origin and cannot see this data directly, so
// they forward extracted messages here via chrome.runtime.sendMessage; the popup
// (which shares this same extension origin) reads it back the same way.

import { Database } from '../storage/database';
import { ChatMessage } from '../types/message';

const db = new Database();
let dbReady: Promise<void> | null = null;

function ensureDb(): Promise<void> {
  if (!dbReady) dbReady = db.open();
  return dbReady;
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Chat Extractor installed', details.reason);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'GET_VERSION': {
          sendResponse({ version: chrome.runtime.getManifest().version });
          break;
        }
        case 'EXTRACT_MESSAGES': {
          await ensureDb();
          const messages: ChatMessage[] = message.messages || [];
          for (const msg of messages) {
            await db.addMessage(msg);
          }
          const all = await db.getMessages();
          sendResponse({ success: true, total: all.length });
          // Live-update any popup that's currently open. If none is open, this
          // rejects with "Receiving end does not exist" — safe to ignore, since
          // the popup pulls the current data itself via GET_MESSAGES on mount.
          chrome.runtime.sendMessage({ type: 'PROGRESS_UPDATE', messages: all }).catch(() => {});
          break;
        }
        case 'GET_MESSAGES': {
          await ensureDb();
          const all = await db.getMessages(message.conversation);
          sendResponse({ success: true, messages: all });
          break;
        }
        case 'CLEAR_MESSAGES': {
          await ensureDb();
          await db.clear();
          sendResponse({ success: true });
          break;
        }
        default:
          // Not one of ours (e.g. a message intended for the content script) — ignore.
          break;
      }
    } catch (err) {
      sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  })();
  return true;
});