export function getSelectorForElement(el: Element): string {
  // Priority: id > data-testid > aria-label > role > structural > class
  if (el.id) return `#${CSS.escape(el.id)}`;

  const dataTestId = el.getAttribute('data-testid');
  if (dataTestId) return `[data-testid="${dataTestId}"]`;

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return `[aria-label="${CSS.escape(ariaLabel)}"]`;

  const role = el.getAttribute('role');
  if (role) return `[role="${role}"]`;

  // structural path
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && parts.length < 3) {
    let selector = node.tagName.toLowerCase();
    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(node) + 1;
      selector += `:nth-child(${index})`;
    }
    parts.unshift(selector);
    node = node.parentElement;
  }
  return parts.join(' > ');
}

/**
 * Builds a full ancestor-chain path (tag + nth-child index at every level, up to
 * <body>) that is unique to this exact element in the current DOM. Intended for
 * dedup fingerprinting, where two different on-screen elements must never collapse
 * to the same key. Unlike getSelectorForElement (which stops early at the first
 * "good enough" attribute match — often shared by every message in a list), this
 * always walks the full chain.
 */
export function getElementDomPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body) {
    let selector = node.tagName.toLowerCase();
    const id = node.id;
    if (id) {
      parts.unshift(`${selector}#${id}`);
    } else {
      const parent = node.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(node) + 1;
        parts.unshift(`${selector}:nth-child(${index})`);
      } else {
        parts.unshift(selector);
      }
    }
    node = node.parentElement;
  }
  return parts.join(' > ');
}

export function scoreSelector(selector: string): number {
  if (selector.startsWith('#')) return 100;
  if (selector.includes('[data-testid')) return 90;
  if (selector.includes('[aria-label')) return 80;
  if (selector.includes('[role=')) return 70;
  if (selector.includes(':nth-child')) return 50;
  if (selector.startsWith('.')) return 20;
  return 10;
}