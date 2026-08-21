export function getSelectorForElement(el: Element, sibling?: Element | null): string {
  // Priority: id > data-testid > aria-label > role > shared-class > structural
  if (el.id) return `#${CSS.escape(el.id)}`;

  const dataTestId = el.getAttribute('data-testid');
  if (dataTestId) return `[data-testid="${dataTestId}"]`;

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return `[aria-label="${CSS.escape(ariaLabel)}"]`;

  const role = el.getAttribute('role');
  if (role) return `[role="${role}"]`;

  // No stable attribute hooks — common on pages (e.g. Instagram) that use
  // auto-generated atomic CSS classes instead of semantic attributes. If a
  // structurally-similar sibling was supplied (see findRepeatingAncestor),
  // use only the classes the two elements have in common: shared classes are
  // far more likely to reflect the element's real structural role, while
  // classes unique to one instance are often one-off state (e.g. "unread",
  // "selected") that would make the selector too narrow to match every
  // message.
  if (sibling) {
    const shared = getSharedClasses(el, sibling);
    if (shared.length > 0) {
      return el.tagName.toLowerCase() + shared.map((c) => `.${CSS.escape(c)}`).join('');
    }
  }
  const ownClasses = classListOf(el);
  if (ownClasses.length > 0) {
    return el.tagName.toLowerCase() + ownClasses.map((c) => `.${CSS.escape(c)}`).join('');
  }

  // Last resort: structural path (fragile — breaks if a sibling is added or
  // removed on some messages but not others, e.g. a reaction row).
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

function classListOf(el: Element): string[] {
  const raw = typeof el.className === 'string' ? el.className : (el as HTMLElement).getAttribute('class') || '';
  return raw.trim().split(/\s+/).filter(Boolean);
}

function getSharedClasses(a: Element, b: Element): string[] {
  const aClasses = new Set(classListOf(a));
  return classListOf(b).filter((c) => aClasses.has(c));
}

/**
 * Given any element inside a repeated list item (e.g. a chat message
 * bubble), climbs the ancestor chain to find the actual repeating "row"
 * container — the highest ancestor that (a) has at least one sibling built
 * from the same tag with a substantially overlapping class list, and (b)
 * itself carries real text content rather than being purely decorative
 * (e.g. an emoji glyph's wrapper, which repeats within a single message but
 * isn't a message boundary itself, and — since emoji render as <img alt="…">
 * — contributes no textContent, so it's naturally excluded here).
 *
 * This lets Inspector Mode work from any click inside a message, rather
 * than requiring the user to click the exact bubble boundary — which is
 * hard to do reliably on pages built with atomic/utility CSS, where every
 * nested wrapper looks like a plain, unstyled <div>.
 */
export function findRepeatingAncestor(
  el: Element,
  maxDepth = 20
): { element: Element; sibling: Element | null } {
  let node: Element = el;
  let best: { element: Element; sibling: Element | null } = { element: el, sibling: null };

  for (let i = 0; i < maxDepth; i++) {
    const parent = node.parentElement;
    if (!parent || parent === document.body || parent === document.documentElement) break;

    const siblings = Array.from(parent.children).filter((c) => c !== node);
    const match = siblings.find((sib) => isStructurallySimilar(node, sib));
    const hasText = (node.textContent || '').trim().length > 2;

    if (match && hasText) {
      best = { element: node, sibling: match };
    }

    node = parent;
  }

  return best;
}

function isStructurallySimilar(a: Element, b: Element): boolean {
  if (a.tagName !== b.tagName) return false;
  const aClasses = classListOf(a);
  const bClasses = classListOf(b);
  if (aClasses.length === 0 && bClasses.length === 0) {
    // No classes on either side — fall back to comparing child-tag "shape".
    const aShape = Array.from(a.children).map((c) => c.tagName).join(',');
    const bShape = Array.from(b.children).map((c) => c.tagName).join(',');
    return aShape === bShape && aShape.length > 0;
  }
  const shared = getSharedClasses(a, b);
  // Require meaningful overlap, not just one incidental shared utility class.
  return shared.length >= Math.max(2, Math.floor(Math.min(aClasses.length, bClasses.length) * 0.5));
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