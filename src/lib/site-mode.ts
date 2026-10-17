/**
 * Which parts of the site a request may reach, and what the landing page draws.
 *
 * On production wawuafrica.com serves the event registration link (owner,
 * 10 Oct 2026, R-48) and its landing page (owner, 12 Oct 2026: "the landing
 * page should" show); everything else is unreachable. `SITE_MODE` says which:
 *
 *   join-only   the landing page, /join and what they need, nothing else
 *   full        the whole site, as before
 *
 * Unset (or anything else), the default is `join-only` when Vercel says this
 * is the production deployment (`VERCEL_ENV=production`) and `full` everywhere
 * else, so previews, local runs and the test walks keep the whole site. Setting
 * `SITE_MODE=full` in Vercel reopens everything with no code change. A typo in
 * the value falls back to that default, which on production is the closed one.
 *
 * Pure functions; the one import is the app-link list (app-links.ts, itself
 * import-free). The middleware calls them in the Edge runtime, and
 * scripts/check-site-mode.mjs loads this file as it stands.
 */
import { isAppLinkFile, isAppLinkPath } from "./app-links";

export type SiteMode = "join-only" | "full";

export function siteModeFrom(env: { SITE_MODE?: string; VERCEL_ENV?: string }): SiteMode {
  const explicit = (env.SITE_MODE ?? "").trim().toLowerCase();
  if (explicit === "full" || explicit === "join-only") return explicit;
  return env.VERCEL_ENV === "production" ? "join-only" : "full";
}

/**
 * The mode right now, read from the process environment each time it is
 * called. The middleware calls it per request, and the landing page (a dynamic
 * route, see src/app/page.tsx) calls it per render: both read the same two
 * variables the same way, so they cannot disagree. Bracket access, so the
 * build cannot freeze the values: changing SITE_MODE (or the deployment's
 * VERCEL_ENV) changes behaviour without a rebuild of the code.
 */
export function currentSiteMode(): SiteMode {
  return siteModeFrom({ SITE_MODE: process.env["SITE_MODE"], VERCEL_ENV: process.env["VERCEL_ENV"] });
}

/**
 * The pages that stay open in join-only mode.
 *
 * `/` is the landing page (owner, 12 Oct 2026). `/privacy/policy` is what the
 * consent line links to; it redirects to the one Master Terms, Privacy and
 * Platform Policy document, so `/terms` (which holds the privacy provisions)
 * has to stay open or that link would end on /join.
 */
const OPEN_PAGES = new Set(["/", "/join", "/join/paid", "/privacy/policy", "/terms"]);

/**
 * The pages WAWU's own emails link to (LINKS-01). They worked before join-only
 * mode closed them, so they are open again, unchanged, until the app draws its
 * own screens for them:
 *
 *   /reset-password   "Reset Password" in the password-reset email
 *   /forgot-password  "Secure My Account" in the sign-in alert email
 *
 * Kept apart from OPEN_PAGES on purpose: the landing page may link to an open
 * page (pageHref), and it must not start linking to these.
 */
const EMAIL_LINK_PAGES = new Set(["/reset-password", "/forgot-password"]);

/**
 * Files at the ROOT of the site with a static extension: images and icons
 * (the logo, the link-preview image, favicon, icon, apple-icon) and fonts.
 * Root only, on purpose: a nested path such as `/wawu/ada.png` is a profile
 * page whose handle happens to end in ".png", not a file.
 */
const ROOT_STATIC_FILE = /^\/[^/]+\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/;

/**
 * The landing page's own files that are not at the site root, so the root
 * rule above does not cover them. Exactly these and nothing wider.
 *
 *   /icons/services/<name>.png   the service icons in the landing page's strip
 *                                (src/lib/platform-services.ts): one directory,
 *                                one path segment, .png. /icons/bills and
 *                                /icons/unused stay closed.
 *   /wawu-theme.mp3              the WAWU theme the sound button plays. Fetched
 *                                only when somebody taps the button.
 *
 * A path with a further segment or another extension is not matched, and no
 * page lives under /icons, so neither can open a page.
 */
const LANDING_SERVICE_ICON = /^\/icons\/services\/[a-z0-9-]+\.png$/;
const LANDING_FILES = new Set(["/wawu-theme.mp3"]);

/** The same path with trailing slashes taken off (the root stays "/"). */
function trimmed(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

/** True when join-only mode serves this PAGE (as opposed to a file). */
export function isOpenPageInJoinOnly(pathname: string): boolean {
  return OPEN_PAGES.has(trimmed(pathname));
}

/**
 * The admin dashboard pages: `/admin` and everything under it (owner, 13 Oct
 * 2026, the email campaign tool at /admin/notifications). They stay reachable
 * in join-only mode because the admin sign-in protects them: every call they
 * make needs an admin token from the Hub, and the pages show a sign-in form
 * first. Whole segments only, so `/administrator` and `/adminx` stay closed.
 * Never linked from the landing page (see `pageHref`, which does not use this).
 */
function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

/** True when join-only mode lets this path through. Every other path is sent to /join. */
export function isOpenInJoinOnly(pathname: string): boolean {
  const path = trimmed(pathname);
  if (OPEN_PAGES.has(path)) return true;
  if (EMAIL_LINK_PAGES.has(path)) return true;
  // The app links (/r/<code>, /selfie, /activate, /receipt/<code>, /u/<handle>, /c/<slug>, /content/<id>) and the two files phones read to check them.
  if (isAppLinkPath(path) || isAppLinkFile(path)) return true;
  if (isAdminPath(path)) return true;
  if (path.startsWith("/_next/static/") || path === "/_next/image") return true;
  if (path === "/robots.txt") return true;
  if (LANDING_FILES.has(path) || LANDING_SERVICE_ICON.test(path)) return true;
  return ROOT_STATIC_FILE.test(path);
}

/**
 * What a link on the landing page becomes in a mode. In `full` mode nothing
 * changes, link for link. In `join-only` mode (owner, 12 Oct 2026, show only
 * what is built, R-47):
 *
 *   signUpHref  a sign-up or get-started button goes to /join, whatever it
 *               pointed at.
 *   pageHref    any other link keeps its address if it lands on an open page or
 *               an in-page anchor, and is `null` (not drawn) if it would lead
 *               into a closed part of the site.
 */
export function signUpHref(mode: SiteMode, fullHref: string): string {
  return mode === "full" ? fullHref : "/join";
}

export function pageHref(mode: SiteMode, fullHref: string): string | null {
  if (mode === "full" || fullHref.startsWith("#")) return fullHref;
  const path = fullHref.split(/[?#]/)[0] ?? "";
  return isOpenPageInJoinOnly(path) ? fullHref : null;
}
