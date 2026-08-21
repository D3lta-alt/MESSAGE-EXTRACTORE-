import { GenericAdapter } from './generic';

export class TelegramAdapter extends GenericAdapter {
  platformName = 'Telegram Web';

  detectPlatform(): boolean {
    return !!document.querySelector('.messages-container, [data-messages-container]');
  }

  // TODO: Implement Telegram-specific selectors
}