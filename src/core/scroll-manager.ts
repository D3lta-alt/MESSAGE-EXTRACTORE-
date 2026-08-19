export interface ScrollManagerConfig {
  scrollDelayMs: number;
  settleDelayMs: number;
  maxNoNewMessages: number;
  maxScrollCount?: number;
}

export class ScrollManager {
  private running = false;
  private paused = false;
  private consecutiveNoNew = 0;
  private scrollCount = 0;

  constructor(
    private config: ScrollManagerConfig = {
      scrollDelayMs: 2000,
      settleDelayMs: 500,
      maxNoNewMessages: 3,
      maxScrollCount: 2000
    },
    private onScroll: () => Promise<number>, // returns number of new messages found
    private hasMoreHistory?: () => boolean // optional platform signal; see BUG-012
  ) {}

  async start() {
    this.running = true;
    this.paused = false;
    this.consecutiveNoNew = 0;
    this.scrollCount = 0;

    while (this.running && this.scrollCount < this.config.maxScrollCount!) {
      if (this.paused) {
        await this.sleep(500);
        continue;
      }

      let newMessages: number;
      try {
        newMessages = await this.onScroll();
      } catch (err) {
        this.running = false;
        throw err;
      }

      const moreHistoryAvailable = this.hasMoreHistory ? this.hasMoreHistory() : true;

      if (newMessages === 0) {
        this.consecutiveNoNew++;
        if (this.consecutiveNoNew >= this.config.maxNoNewMessages || !moreHistoryAvailable) break;
      } else {
        this.consecutiveNoNew = 0;
      }

      this.scrollCount++;
      await this.sleep(this.config.scrollDelayMs);
    }
    this.running = false;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  stop() {
    this.running = false;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}