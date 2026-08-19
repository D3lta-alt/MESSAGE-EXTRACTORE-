import { GenericAdapter } from './generic';

export class DiscordAdapter extends GenericAdapter {
  platformName = 'Discord';

  detectPlatform(): boolean {
    return !!document.querySelector('[class*="messagesWrapper"]');
  }

  // TODO: Implement Discord-specific selectors
}