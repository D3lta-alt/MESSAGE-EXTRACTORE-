import { PlatformAdapter } from '../adapters/base-adapter';
import { WhatsAppAdapter } from '../adapters/whatsapp';
import { TelegramAdapter } from '../adapters/telegram';
import { MessengerAdapter } from '../adapters/messenger';
import { DiscordAdapter } from '../adapters/discord';
import { InstagramAdapter } from '../adapters/instagram';
import { GenericAdapter } from '../adapters/generic';
import { Extractor, ScrollSettings } from '../core/extractor';
import { ChatMessage } from '../types/message';
import { ElementInspector } from './inspector';
import { storageKeyFor } from '../core/platform-key';

let extractor: Extractor | null = null;
let currentConversationId: string | null = null;
let inspector: ElementInspector | null = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'DETECT_PLATFORM': {
          const adapter = await detectAdapter();
          sendResponse({ platform: adapter.platformName, supported: adapter.detectPlatform() });
          break;
        }
        case 'START_EXTRACTION': {
          const adapter = await detectAdapter();
          const ext = await getExtractor(adapter);
          const newCount = await ext.extractVisibleOnce();
          sendResponse({ success: true, newCount, progress: ext.getProgress() });
          break;
        }
        case 'START_SCROLL': {
          if (extractor) await extractor.startScroll();
          sendResponse({ success: true, progress: extractor?.getProgress() });
          break;
        }
        case 'PAUSE_SCROLL': {
          extractor?.pauseScroll();
          sendResponse({ success: true });
          break;
        }
        case 'RESUME_SCROLL': {
          extractor?.resumeScroll();
          sendResponse({ success: true });
          break;
        }
        case 'STOP_SCROLL': {
          extractor?.stopScroll();
          sendResponse({ success: true });
          break;
        }
        case 'START_INSPECTOR': {
          if (!inspector) inspector = new ElementInspector();
          inspector.start(message.target);
          sendResponse({ success: true });
          break;
        }
        case 'STOP_INSPECTOR': {
          inspector?.stop();
          const adapter = await detectAdapter();
          sendResponse({ config: inspector?.getConfig(), platform: adapter.platformName });
          break;
        }
        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (err) {
      sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  })();
  return true; // keep channel open for async
});

/** Forwards newly-extracted messages to the background worker, which owns the
 * single extension-origin Database (see BUG-005 / service-worker.ts). */
async function sendMessagesToBackground(messages: ChatMessage[]): Promise<void> {
  const response = await chrome.runtime.sendMessage({ type: 'EXTRACT_MESSAGES', messages });
  if (!response?.success) {
    throw new Error(response?.error || 'Failed to persist extracted messages');
  }
}

async function detectAdapter(): Promise<PlatformAdapter> {
  const { userSelectorsByPlatform } = await chrome.storage.local.get<{
    userSelectorsByPlatform?: Record<string, Record<string, string>>;
  }>('userSelectorsByPlatform');
  const byPlatform = userSelectorsByPlatform || {};
  const overridesFor = (platformName: string) => byPlatform[storageKeyFor(platformName)] || {};

  const adapters: PlatformAdapter[] = [
    new WhatsAppAdapter(),
    new TelegramAdapter(overridesFor('Telegram Web')),
    new MessengerAdapter(overridesFor('Messenger')),
    new DiscordAdapter(overridesFor('Discord')),
    new InstagramAdapter(overridesFor('Instagram')),
    new GenericAdapter(overridesFor('Generic DOM'))
  ];
  for (const adapter of adapters) {
    if (adapter.detectPlatform()) return adapter;
  }
  return new GenericAdapter(overridesFor('Generic DOM'));
}

/** Returns the current Extractor, resetting its dedup/progress state whenever
 * the active conversation has changed since the last call (see BUG-010) — these
 * platforms are all SPAs, so switching chats never reloads the content script. */
async function getExtractor(adapter: PlatformAdapter): Promise<Extractor> {
  const conversationId = adapter.findConversationId();

  if (!extractor) {
    const { scrollSettings } = await chrome.storage.local.get<{ scrollSettings?: Partial<ScrollSettings> }>('scrollSettings');
    extractor = new Extractor(adapter, sendMessagesToBackground, scrollSettings);
    currentConversationId = conversationId;
    return extractor;
  }

  if (conversationId !== currentConversationId) {
    extractor.reset();
    currentConversationId = conversationId;
  }

  return extractor;
}