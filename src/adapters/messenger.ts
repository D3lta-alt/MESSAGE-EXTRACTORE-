import { GenericAdapter } from './generic';

export class MessengerAdapter extends GenericAdapter {
  platformName = 'Messenger';

  detectPlatform(): boolean {
    return !!document.querySelector('[role="main"] [data-testid="message-container"]');
  }

  // TODO: Implement Messenger-specific selectors
}