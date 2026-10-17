/**
 * The website paths that are APP LINKS (LINKS-01).
 *
 * An app link is an https address on wawuafrica.com that the WAWU app opens
 * when it is installed. Six exist, and only these six:
 *
 *   /r/<code>        an invite, as a person shares it (the app claims the code)
 *   /selfie          where the hosted selfie page sends a person back to
 *   /activate        the "Set My Password" button in the activation email
 *                    (the app opens sign-in; the query is not read)
 *   /receipt/<code>  a receipt's check address (its own path, never /r/)
 *   /u/<handle>      a profile, as a person shares it
 *   /c/<slug>        a community room, as the Hub issues the link
 *
 * Without the app installed, each path shows a small "Open in the WAWU app"
 * page (src/components/open-in-app). Every other website route is outside this
 * file and unchanged. /join stays the registration campaign; nothing here
 * touches it.
 *
 * The same list drives four things, so they cannot drift apart:
 *   - the join-only middleware lets exactly these paths (and the two files
 *     below) through, see isAppLinkPath and isOpenInJoinOnly in site-mode.ts;
 *   - /.well-known/apple-app-site-association names them for iOS;
 *   - /.well-known/assetlinks.json is what Android checks the app against
 *     (Android's path list lives in the app's own intent filters);
 *   - the fallback pages read the code and the app address from here.
 *
 * Pure functions, no imports: the middleware calls them in the Edge runtime
 * and scripts/check-site-mode.mjs loads this file as it stands.
 *
 * Two values belong to the people who sign the app and are NOT in this
 * repository. They are read from the environment, never typed here:
 *
 *   APPLE_TEAM_ID                    the 10-character Apple developer team id
 *   ANDROID_SHA256_CERT_FINGERPRINTS the app's signing certificate SHA-256
 *                                    fingerprint(s), comma separated
 *
 * While one is unset its file lists no app for that platform (valid, empty).
 */

/** The app's iOS bundle identifier and Android package (app.json in the mobile repo). */
export const APP_ID = "africa.wawu.wmt";

/** The app's own address scheme (app.json "scheme"): opens the app from a button, installed or not. */
export const APP_SCHEME = "wawu";

/** The path every invite lives under: /r/<code>. */
export const INVITE_PREFIX = "/r/";

/** Where the hosted selfie page returns to. Its own path: never /join. */
export const SELFIE_PATH = "/selfie";

/** The activation email's button lands here (wawu-id builds FRONTEND_URL/activate?token&email). */
export const ACTIVATE_PATH = "/activate";

/** A receipt's check address: /receipt/<code>. Its own path, because /r/ is the invite path. */
export const RECEIPT_PREFIX = "/receipt/";

/** A profile as it is shared: /u/<handle>. */
export const PROFILE_PREFIX = "/u/";

/** A community room as its link is issued: /c/<slug>. */
export const ROOM_PREFIX = "/c/";

/** The two files the phones read to check the app owns these paths. Served as they are, never redirected. */
export const AASA_PATH = "/.well-known/apple-app-site-association";
export const ASSETLINKS_PATH = "/.well-known/assetlinks.json";

/** The patterns iOS is given, in apple-app-site-association form. Exactly the app paths. */
export const APP_LINK_PATTERNS = [
  `${INVITE_PREFIX}*`,
  SELFIE_PATH,
  ACTIVATE_PATH,
  `${RECEIPT_PREFIX}*`,
  `${PROFILE_PREFIX}*`,
  `${ROOM_PREFIX}*`,
] as const;

/** Names of the two settings above, so the route files, the checks and the hand-off notes agree. */
export const APPLE_TEAM_ID_SETTING = "APPLE_TEAM_ID";
export const ANDROID_FINGERPRINTS_SETTING = "ANDROID_SHA256_CERT_FINGERPRINTS";

/**
 * An invite code as the app reads one (codeFromLink in the mobile repo): letters,
 * digits, dash and underscore, 1 to 80 characters. One path segment, no dots.
 */
const INVITE_CODE = /^[A-Za-z0-9_-]{1,80}$/;

/**
 * A receipt code as it may be typed or followed (normalReceiptCode in the Hub):
 * letters and digits, with hyphens a person adds between groups, up to 64
 * characters. The Hub reads the real shape (12 characters of Crockford base 32);
 * the website only checks that the segment cannot be anything else.
 */
const RECEIPT_CODE = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const RECEIPT_CODE_MAX = 64;

/**
 * A handle as the Hub takes one (UpdateUserProfileDto.handle): letters, digits,
 * dots and underscores, 1 to 30 characters. One segment that is not only dots
 * (a "." or ".." segment is a path step, never a person).
 */
const HANDLE = /^(?=[A-Za-z0-9_.]*[A-Za-z0-9_])[A-Za-z0-9_.]{1,30}$/;

/**
 * A room slug as the Hub makes one (community-slug.ts): lower-case letters and
 * digits in groups joined by single hyphens, up to 64 characters. Capitals are
 * accepted here because the Hub lower-cases what it is given.
 */
const ROOM_SLUG = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const ROOM_SLUG_MAX = 64;

/** The same path with trailing slashes taken off (the root stays "/"). */
function trimmed(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

/** The one segment after a prefix when it has the right shape, or null when the path is not exactly prefix + segment. */
function segmentAfter(pathname: string, prefix: string, shape: RegExp, max: number): string | null {
  const path = trimmed(pathname);
  if (!path.startsWith(prefix)) return null;
  const segment = path.slice(prefix.length);
  return segment.length <= max && shape.test(segment) ? segment : null;
}

/** The code in /r/<code>, or null when the path is not exactly that. */
export function inviteCodeFrom(pathname: string): string | null {
  return segmentAfter(pathname, INVITE_PREFIX, INVITE_CODE, 80);
}

/** The code in /receipt/<code>, or null when the path is not exactly that. */
export function receiptCodeFrom(pathname: string): string | null {
  return segmentAfter(pathname, RECEIPT_PREFIX, RECEIPT_CODE, RECEIPT_CODE_MAX);
}

/** The handle in /u/<handle>, or null when the path is not exactly that. */
export function profileHandleFrom(pathname: string): string | null {
  return segmentAfter(pathname, PROFILE_PREFIX, HANDLE, 30);
}

/** The slug in /c/<slug>, or null when the path is not exactly that. */
export function roomSlugFrom(pathname: string): string | null {
  return segmentAfter(pathname, ROOM_PREFIX, ROOM_SLUG, ROOM_SLUG_MAX);
}

/** True for the six app links (/r/<code>, /selfie, /activate, /receipt/<code>, /u/<handle>, /c/<slug>), and nothing else. */
export function isAppLinkPath(pathname: string): boolean {
  const path = trimmed(pathname);
  return (
    path === SELFIE_PATH ||
    path === ACTIVATE_PATH ||
    inviteCodeFrom(path) !== null ||
    receiptCodeFrom(path) !== null ||
    profileHandleFrom(path) !== null ||
    roomSlugFrom(path) !== null
  );
}

/** True for the two files under /.well-known that name the app paths. */
export function isAppLinkFile(pathname: string): boolean {
  const path = trimmed(pathname);
  return path === AASA_PATH || path === ASSETLINKS_PATH;
}

/** The app's own address for a path: wawu://r/<code>, wawu://selfie and so on. Opens the app when it is installed. */
export function appAddressFor(pathname: string): string {
  return `${APP_SCHEME}://${trimmed(pathname).replace(/^\/+/, "")}`;
}

/** An Apple team id is 10 letters or digits. Anything else is not used. */
export function appleTeamIdFrom(raw: string | undefined): string | null {
  const id = (raw ?? "").trim();
  return /^[A-Z0-9]{10}$/.test(id) ? id : null;
}

/**
 * Signing fingerprints as Android writes them: 32 bytes as 64 hex digits, colon
 * separated (AA:BB:...). A comma separated list is taken, each entry upper-cased
 * and checked; entries that are not a fingerprint are left out.
 */
export function fingerprintsFrom(raw: string | undefined): string[] {
  const out: string[] = [];
  for (const part of (raw ?? "").split(",")) {
    const value = part.trim().toUpperCase();
    if (/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value) && !out.includes(value)) out.push(value);
  }
  return out;
}

/** What /.well-known/apple-app-site-association says. No team id: it names no app. */
export function appleAppSiteAssociation(env: { APPLE_TEAM_ID?: string }) {
  const team = appleTeamIdFrom(env.APPLE_TEAM_ID);
  return {
    applinks: {
      details: team
        ? [{ appIDs: [`${team}.${APP_ID}`], components: APP_LINK_PATTERNS.map((pattern) => ({ "/": pattern })) }]
        : [],
    },
  };
}

/** What /.well-known/assetlinks.json says. No fingerprint: it names no app. */
export function assetLinks(env: { ANDROID_SHA256_CERT_FINGERPRINTS?: string }) {
  const prints = fingerprintsFrom(env.ANDROID_SHA256_CERT_FINGERPRINTS);
  return prints.length === 0
    ? []
    : [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: { namespace: "android_app", package_name: APP_ID, sha256_cert_fingerprints: prints },
        },
      ];
}
