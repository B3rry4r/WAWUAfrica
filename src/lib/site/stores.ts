/**
 * Where the two apps can be downloaded (BRAND-SITE, owner 2 Nov 2026).
 *
 * VOICES is not in the stores yet, so every store link is null. Its live web app is
 * https://usevoices.com, so every VOICES button on this site opens that (WEB_LINKS). (Who Made This is not
 * here: its links open usewmt.com, R-141.) To turn a store on, set its entry to the store address (one line):
 * the page then draws that store's button next to the web button. Nothing else changes.
 *
 * No imports (scripts/check-site-mode.mjs loads this file).
 */
export type SiteApp = "voices";

export interface StoreLinks {
  appStore: string | null;
  googlePlay: string | null;
}

export const STORE_LINKS: Record<SiteApp, StoreLinks> = {
  voices: { appStore: null, googlePlay: null },
};

/** The live web app of each app: where "Join VOICES" goes. */
export const WEB_LINKS: Record<SiteApp, { label: string; href: string }> = {
  voices: { label: "Join VOICES", href: "https://usevoices.com" },
};

export function liveStores(app: SiteApp): { name: "App Store" | "Google Play"; href: string }[] {
  const links = STORE_LINKS[app];
  const out: { name: "App Store" | "Google Play"; href: string }[] = [];
  if (links.appStore) out.push({ name: "App Store", href: links.appStore });
  if (links.googlePlay) out.push({ name: "Google Play", href: links.googlePlay });
  return out;
}
