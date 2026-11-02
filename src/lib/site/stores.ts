/**
 * Where the two apps can be downloaded (BRAND-SITE, owner 2 Nov 2026).
 *
 * Neither app is in the stores yet, so every link is null and each page says
 * which stores the app is headed for, with a Register button. To turn a store
 * on, set its entry to the store address (one line): the page then draws that
 * store's button in place of that line. Nothing else changes.
 *
 * No imports (scripts/check-site-mode.mjs loads this file).
 */
export type SiteApp = "who-made-this" | "voices";

export interface StoreLinks {
  appStore: string | null;
  googlePlay: string | null;
}

export const STORE_LINKS: Record<SiteApp, StoreLinks> = {
  "who-made-this": { appStore: null, googlePlay: null },
  voices: { appStore: null, googlePlay: null },
};

export function liveStores(app: SiteApp): { name: "App Store" | "Google Play"; href: string }[] {
  const links = STORE_LINKS[app];
  const out: { name: "App Store" | "Google Play"; href: string }[] = [];
  if (links.appStore) out.push({ name: "App Store", href: links.appStore });
  if (links.googlePlay) out.push({ name: "Google Play", href: links.googlePlay });
  return out;
}
