/** Storage key a platform's selector overrides are namespaced under —
 * intentionally distinct from the human-readable platformName. See BUG-016:
 * selectors used to be stored under one flat key shared by every platform,
 * so an Inspector Mode pick made on Messenger would silently also apply to
 * Telegram, Discord, and Instagram. Shared (rather than living in
 * content-script.ts) so the options page can compute the same key without
 * importing a module that registers its own chrome.runtime.onMessage
 * listener as a side effect. */
export function storageKeyFor(platformName: string): string {
  return platformName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
