import { getSelectorForElement, scoreSelector } from './dom-utils';

interface InspectorConfig {
  container?: string;
  sender?: string;
  text?: string;
  timestamp?: string;
  attachment?: string;
}

export class ElementInspector {
  private overlay: HTMLDivElement | null = null;
  private config: InspectorConfig = {};
  private currentTarget: 'container' | 'sender' | 'text' | 'timestamp' | 'attachment' | null = null;

  start(target: 'container' | 'sender' | 'text' | 'timestamp' | 'attachment') {
    this.currentTarget = target;
    this.createOverlay();
    document.addEventListener('mouseover', this.onMouseOver, true);
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  stop() {
    document.removeEventListener('mouseover', this.onMouseOver, true);
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    this.overlay?.remove();
    this.overlay = null;
    this.currentTarget = null;
  }

  getConfig(): InspectorConfig {
    return this.config;
  }

  private createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647;
      pointer-events: none;
      background: rgba(255,255,255,0.01);
      border: 2px solid #3b82f6;
    `;
    document.body.appendChild(this.overlay);
  }

  private onMouseOver = (e: MouseEvent) => {
    if (!this.overlay) return;
    const target = e.target as HTMLElement;
    this.overlay.style.border = '2px solid #3b82f6';
    this.overlay.style.background = 'rgba(59,130,246,0.05)';
    this.overlay.style.left = target.getBoundingClientRect().left + 'px';
    this.overlay.style.top = target.getBoundingClientRect().top + 'px';
    this.overlay.style.width = target.getBoundingClientRect().width + 'px';
    this.overlay.style.height = target.getBoundingClientRect().height + 'px';
  };

  private onClick = (e: MouseEvent) => {
    if (!this.currentTarget) return;
    e.preventDefault();
    e.stopPropagation();

    const el = e.target as HTMLElement;
    const selector = getSelectorForElement(el);
    this.config[this.currentTarget] = selector;

    // Show selection
    this.overlay!.style.border = '2px solid #22c55e';
    this.overlay!.style.background = 'rgba(34,197,94,0.1)';
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.stop();
  };
}