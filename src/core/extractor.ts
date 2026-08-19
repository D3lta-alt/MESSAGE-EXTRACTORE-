import { PlatformAdapter } from '../adapters/base-adapter';
import { ChatMessage } from '../types/message';
import { Deduplicator } from './deduplicator';
import { ScrollManager } from './scroll-manager';

export interface ExtractorProgress {
  found: number;
  attachments: number;
  status: 'extracting' | 'paused' | 'stopped' | 'complete' | 'error';
}

export type NewMessagesHandler = (messages: ChatMessage[]) => Promise<void>;

export interface ScrollSettings {
  scrollDelayMs: number;
  settleDelayMs: number;
}

const DEFAULT_SCROLL_SETTINGS: ScrollSettings = { scrollDelayMs: 2000, settleDelayMs: 500 };

export class Extractor {
  private dedup = new Deduplicator();
  private scrollManager: ScrollManager | null = null;
  private progress: ExtractorProgress = { found: 0, attachments: 0, status: 'stopped' };
  private scrollSettings: ScrollSettings;

  constructor(
    private adapter: PlatformAdapter,
    private onNewMessages: NewMessagesHandler,
    scrollSettings?: Partial<ScrollSettings>
  ) {
    this.scrollSettings = { ...DEFAULT_SCROLL_SETTINGS, ...scrollSettings };
  }

  async extractVisibleOnce(): Promise<number> {
    const containers = this.adapter.findMessageContainers();
    const conversation = this.adapter.findConversation();
    const newMessages: ChatMessage[] = [];

    for (const el of containers) {
      const msg = this.adapter.extractMessage(el, conversation);
      if (!msg) continue;

      if (!this.dedup.has(msg)) {
        this.dedup.add(msg);
        newMessages.push(msg);
      }
    }

    if (newMessages.length > 0) {
      // Forward to the background service worker, which owns the single
      // extension-origin Database instance (see service-worker.ts).
      await this.onNewMessages(newMessages);
    }

    this.progress.found += newMessages.length;
    this.progress.attachments += newMessages.reduce((sum, m) => sum + m.attachments.length, 0);
    return newMessages.length;
  }

  async startScroll() {
    const container = this.adapter.getScrollContainer();
    if (!container) return;

    this.scrollManager = new ScrollManager(
      {
        scrollDelayMs: this.scrollSettings.scrollDelayMs,
        settleDelayMs: this.scrollSettings.settleDelayMs,
        maxNoNewMessages: 3,
        maxScrollCount: 2000
      },
      async () => {
        // Scroll toward the TOP to trigger the platform's "load older history"
        // behavior — these apps render oldest-at-top, newest-at-bottom, and
        // paginate history as the user scrolls up.
        container.scrollTop = 0;
        await new Promise((resolve) => setTimeout(resolve, this.scrollSettings.settleDelayMs));
        return this.extractVisibleOnce();
      },
      () => this.adapter.hasMoreHistory()
    );

    this.progress.status = 'extracting';
    try {
      await this.scrollManager.start();
      this.progress.status = 'complete';
    } catch (err) {
      this.progress.status = 'error';
      throw err;
    }
  }

  pauseScroll() {
    this.scrollManager?.pause();
    this.progress.status = 'paused';
  }

  resumeScroll() {
    this.scrollManager?.resume();
    this.progress.status = 'extracting';
  }

  stopScroll() {
    this.scrollManager?.stop();
    this.progress.status = 'stopped';
  }

  getProgress(): ExtractorProgress {
    return { ...this.progress };
  }

  /** Start a fresh dedup/progress context — call this when the user switches
   * to a different conversation within the same SPA session (see BUG-010). */
  reset(): void {
    this.dedup.clear();
    this.progress = { found: 0, attachments: 0, status: 'stopped' };
  }
}