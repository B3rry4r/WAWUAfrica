/**
 * Where an old app address on wawuafrica.com goes now (WEB-STRIP, R-133).
 *
 * wawuafrica.com keeps the legal pages, the company
 * pages and the site's files. Everything that was the app lives at https://usewmt.com, so a person who opens an old
 * profile, piece, community, ticket or receipt link here is sent to the same place there with a permanent redirect
 * (308, the method and the query are kept).
 *
 * The map is built from the Who Made This app's own routes (`src/app/` in wawu-wmt-mobile, as of 11 Nov 2026), not
 * from memory:
 *
 *   1. RENAMES        the few web addresses whose page lives at a different address on usewmt.com.
 *   2. MOBILE_ROUTES  the same address exists on usewmt.com: the path and query are kept as they are.
 *   3. a web app root, or the first segment of a usewmt.com route, with no page of that address: usewmt.com's home.
 *   4. anything else is not an app path (the caller sends it to usewmt.com's home, R-141).
 *
 * Never redirected: /.well-known/*, /admin*, /_next/*, /api/* and /payment/*. The open pages (company, legal,
 * password pages) are decided before this runs, so they never reach it.
 *
 * Pure functions, no imports: the middleware calls them in the Edge runtime, and scripts/check-site-mode.mjs loads
 * this file as it stands (and, with --mobile-src, checks every target against the app's routes).
 */

/** Where the Who Made This web app lives. */
export const APP_ORIGIN = "https://usewmt.com";

/** An address on usewmt.com (used for every link on a page that stays and used to go to a closed page). */
export function appUrl(path: string): string {
  return `${APP_ORIGIN}${path}`;
}

/**
 * The pages of the Who Made This app (usewmt.com) that have the address they had on the web app, in the app's
 * own spelling: `[name]` is one path segment. Left out on purpose: /about, /legal, /terms, /privacy-policy,
 * /dev/* and /preview/*. (/reset-password, /forgot-password and /activate are in `movedPageTarget`: same path, query kept.)
 */
export const MOBILE_ROUTES: readonly string[] = [
  "/account-type", "/accounts", "/add-money", "/add-money/status", "/add-money/way", "/add-work", "/bills",
  "/bills/airtime", "/bills/cable", "/bills/data", "/bills/electricity", "/bills/items", "/bills/number",
  "/bills/receipt/[id]", "/bills/review", "/c/[slug]", "/capital", "/capital/order", "/capital/product",
  "/capital/review", "/capital/withdraw", "/cards", "/cards/[id]", "/cards/new", "/categories", "/change-pin",
  "/chat/[id]", "/chat/send", "/checkout", "/claim-code", "/claim-offer", "/community/[id]",
  "/community/created/[id]", "/community/new", "/community/pass/[id]", "/community/requests/[id]", "/confirm-email",
  "/content/[id]", "/create", "/create-details", "/create-format", "/create-preview", "/create-price",
  "/create-review", "/create-upload", "/creator", "/creator-setup", "/creators", "/crypto-receive", "/crypto-send",
  "/earnings", "/edit-profile", "/email-code", "/events", "/events/[id]", "/events/dashboard/[id]",
  "/events/door/[id]", "/events/edit/[id]", "/events/host", "/events/links/[id]", "/events/mine",
  "/events/orders/[orderId]", "/events/sent-back/[id]", "/events/ticket-types/[id]", "/events/tickets",
  "/events/tickets/[ticketId]", "/explore", "/fx-receipt", "/hear-name", "/inbox", "/interests", "/invite",
  "/invite-card", "/invite-rules", "/legal-book", "/legal-documents", "/legal-documents/[slug]", "/legal-fixed",
  "/legal-matter", "/library", "/library/[id]", "/library/[id]/edit", "/library/[id]/lessons",
  "/library/[id]/replace", "/me", "/movies", "/movies/[id]", "/movies/[id]/trailer", "/movies/all", "/movies/search",
  "/notifications", "/open-wallet", "/open-wallet-account", "/open-wallet-address", "/open-wallet-checking",
  "/open-wallet-details", "/open-wallet-id", "/open-wallet-pin", "/open-wallet-rejected", "/open-wallet-selfie",
  "/paid-message-settings", "/paid-questions/[wawuId]", "/paid-thread/[wawuId]", "/pass", "/payout-account",
  "/people-to-follow", "/phone-code", "/photo-position", "/points", "/points-buy", "/points-convert",
  "/professional-apply", "/professional-listings", "/professionals", "/professionals/[id]", "/profile/[wawuId]",
  "/publish", "/purchases", "/r/[code]", "/receipt/[code]", "/reset-pin", "/role", "/saved", "/schools",
  "/schools/[id]", "/schools/courses/[id]", "/schools/enrol/[courseId]", "/schools/enrolments/[id]", "/schools/mine",
  "/search", "/selfie", "/send", "/send/abroad", "/send/abroad/amount", "/send/abroad/new", "/send/abroad/receipt",
  "/send/abroad/review", "/send/amount", "/send/bank", "/send/failed", "/send/receipt", "/send/review", "/settings",
  "/settings/blocked", "/settings/delete-account", "/settings/delete-account/confirm",
  "/settings/delete-account/scheduled", "/settings/notifications", "/settings/password", "/settings/privacy",
  "/shop", "/shop-product", "/sign-in", "/sign-up", "/social-links", "/studio", "/studio-tool", "/suspended",
  "/swap", "/tgif", "/tier-done", "/tier-offer", "/tiers", "/transactions", "/transactions/[id]", "/u/[handle]",
  "/verification", "/verify-bonus", "/voice-consent", "/voice-intro", "/wallet", "/wallet-settings",
  "/wallet-statement", "/welcome", "/withdraw", "/withdraw/failed", "/withdraw/receipt", "/works/[wawuId]",
  "/works/[wawuId]/[workId]", "/your-details", "/your-tier",
];

/**
 * Web app addresses whose page has another address on usewmt.com. `:name` takes one segment and may be used in the
 * target. Checked in order, before MOBILE_ROUTES.
 */
export const RENAMES: readonly (readonly [string, string])[] = [
  ["/home", "/"],
  ["/wawu/:handle", "/u/:handle"],
  ["/communities/new", "/community/new"],
  ["/communities/:id", "/community/:id"],
  ["/communities/:id/requests", "/community/requests/:id"],
  ["/messages", "/inbox"],
  ["/profile", "/me"],
  ["/profile/edit", "/edit-profile"],
  ["/profile/verification", "/verification"],
  ["/create/new", "/create"],
  ["/create/content", "/create"],
  ["/create/library", "/library"],
  ["/creator/setup", "/creator-setup"],
  ["/explore/categories", "/categories"],
  ["/explore/creators", "/creators"],
  ["/events/new", "/events/host"],
  ["/events/:id/edit", "/events/edit/:id"],
  ["/events/:id/manage", "/events/dashboard/:id"],
  ["/events/:id/scan", "/events/door/:id"],
  ["/tickets", "/events/tickets"],
  ["/professionals/apply", "/professional-apply"],
  ["/professionals/mine", "/professional-listings"],
  ["/learn", "/schools"],
  ["/learn/courses/:id", "/schools/courses/:id"],
  ["/settings/about", "/about"],
  ["/privacy", "/settings/privacy"],
  ["/privacy/blocked", "/settings/blocked"],
];

/**
 * First segments of web app pages that have no page of that address on usewmt.com: they go to usewmt.com's home.
 * (A first segment that is one of usewmt.com's own routes is covered by MOBILE_ROUTES and needs no entry.)
 */
const WEB_APP_ROOTS: ReadonlySet<string> = new Set([
  "communities", "kyc", "onboarding", "learn", "services", "tickets", "messages", "home", "wawu",
  "settings", "profile", "explore", "events", "create", "creator", "professionals", "shop", "wallet", "notifications",
]);

/** The same path with trailing slashes taken off (the root stays "/"). */
function trimmed(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

/** `/events/:id/edit` against `/events/42/edit`: the params it took, or null when the path does not fit. */
function matchPattern(pattern: string, path: string, open: "colon" | "bracket"): Record<string, string> | null {
  const want = pattern.split("/");
  const got = path.split("/");
  if (want.length !== got.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < want.length; i += 1) {
    const w = want[i] as string;
    const g = got[i] as string;
    const name = open === "colon" ? (w.startsWith(":") ? w.slice(1) : null) : (w.startsWith("[") && w.endsWith("]") ? w.slice(1, -1) : null);
    if (name !== null) {
      if (g === "") return null;
      params[name] = g;
    } else if (w !== g) return null;
  }
  return params;
}

/**
 * The Who Made This pages wawuafrica.com no longer serves (R-141, owner, 12 Nov 2026): the join page and the Who
 * Made This brand page go to the app's home, in every site mode.
 */
const WMT_CLOSED_PAGES: ReadonlySet<string> = new Set(["/join", "/who-made-this"]);

/**
 * The password pages moved to the app (R-141, widened by the owner 12 Nov 2026). The mails WAWU ID sends still link
 * to wawuafrica.com/reset-password, /activate and /forgot-password, so each goes to the SAME path on usewmt.com with
 * the query string kept exactly as it came (the token and the email are in it).
 */
const PASSWORD_PAGES: ReadonlySet<string> = new Set(["/reset-password", "/forgot-password", "/activate"]);

/**
 * Where a page that moved to usewmt.com goes, or null for any other path. `search` is the query string as the
 * request carried it, with its leading "?" (or ""), and is appended byte for byte to a password page's address.
 */
export function movedPageTarget(pathname: string, search: string): string | null {
  const path = trimmed(pathname);
  if (WMT_CLOSED_PAGES.has(path)) return APP_ORIGIN;
  if (PASSWORD_PAGES.has(path)) return `${APP_ORIGIN}${path}${search === "?" ? "" : search}`;
  return null;
}

/** True for the paths this module never redirects: well-known files, admin, the build's files, the API, payment returns. */
function isNeverRedirected(path: string): boolean {
  return (
    path === "/.well-known" || path.startsWith("/.well-known/") ||
    path === "/admin" || path.startsWith("/admin/") ||
    path === "/_next" || path.startsWith("/_next/") ||
    path === "/api" || path.startsWith("/api/") ||
    path === "/payment" || path.startsWith("/payment/")
  );
}

const MOBILE_ROOTS: ReadonlySet<string> = new Set(MOBILE_ROUTES.map((r) => r.split("/")[1] as string));

/**
 * The path on usewmt.com (no query) an app address goes to, or null when the address is not an app address.
 * Case matters, like the pages themselves: `/Wallet` is not `/wallet`.
 */
export function appPathFor(pathname: string): string | null {
  const path = trimmed(pathname);
  if (path === "/" || isNeverRedirected(path)) return null;
  for (const [from, to] of RENAMES) {
    const params = matchPattern(from, path, "colon");
    if (params) return to.replace(/:([a-z]+)/g, (_m, n: string) => params[n] ?? "");
  }
  if (MOBILE_ROUTES.some((r) => matchPattern(r, path, "bracket"))) return path;
  const root = path.split("/")[1] as string;
  if (WEB_APP_ROOTS.has(root) || MOBILE_ROOTS.has(root)) return "/";
  return null;
}

/** The full address (with the query kept) an app address goes to on usewmt.com, or null when it is not an app address. */
export function appRedirectTarget(pathname: string, search: string): string | null {
  const path = appPathFor(pathname);
  if (path === null) return null;
  const query = search && search !== "?" ? search : "";
  return `${APP_ORIGIN}${path}${query}`;
}
