/**
 * Which parts of the site a request may reach.
 *
 * On production wawuafrica.com is, for now, only the event registration link
 * (owner, 10 Oct 2026): everything else is unreachable. `SITE_MODE` says which:
 *
 *   join-only   /join and what it needs, nothing else
 *   full        the whole site, as before
 *
 * Unset (or anything else), the default is `join-only` when Vercel says this
 * is the production deployment (`VERCEL_ENV=production`) and `full` everywhere
 * else, so previews, local runs and the test walks keep the whole site. Setting
 * `SITE_MODE=full` in Vercel reopens everything with no code change. A typo in
 * the value falls back to that default, which on production is the closed one.
 *
 * Pure functions, no imports: the middleware calls them in the Edge runtime.
 */
export type SiteMode = "join-only" | "full";

export function siteModeFrom(env: { SITE_MODE?: string; VERCEL_ENV?: string }): SiteMode {
  const explicit = (env.SITE_MODE ?? "").trim().toLowerCase();
  if (explicit === "full" || explicit === "join-only") return explicit;
  return env.VERCEL_ENV === "production" ? "join-only" : "full";
}

/**
 * The pages that stay open in join-only mode.
 *
 * `/privacy/policy` is what the consent line links to; it redirects to the one
 * Master Terms, Privacy and Platform Policy document, so `/terms` (which holds
 * the privacy provisions) has to stay open or that link would end on /join.
 */
const OPEN_PAGES = new Set(["/join", "/join/paid", "/privacy/policy", "/terms"]);

/**
 * Files at the ROOT of the site with a static extension: images and icons
 * (the logo, the link-preview image, favicon, icon, apple-icon) and fonts.
 * Root only, on purpose: a nested path such as `/wawu/ada.png` is a profile
 * page whose handle happens to end in ".png", not a file.
 */
const ROOT_STATIC_FILE = /^\/[^/]+\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/;

/** True when join-only mode lets this path through. Every other path is sent to /join. */
export function isOpenInJoinOnly(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (OPEN_PAGES.has(path)) return true;
  if (path.startsWith("/_next/static/") || path === "/_next/image") return true;
  if (path === "/robots.txt") return true;
  return ROOT_STATIC_FILE.test(path);
}
