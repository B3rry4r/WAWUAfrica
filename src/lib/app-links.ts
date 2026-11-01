/**
 * What wawuafrica.com tells Android and iOS so a link to the site opens the
 * WAWU app (mobile repo, app.json: Android `intentFilters` with `autoVerify`
 * and iOS `associatedDomains` `applinks:wawuafrica.com`).
 *
 *   /.well-known/assetlinks.json              Android: which app and which
 *                                             signing keys may claim this host
 *   /.well-known/apple-app-site-association   iOS: which app and which paths
 *
 * Both are served by route handlers (src/app/.well-known/...), as
 * `application/json` with a 200 and no redirect, in every site mode
 * (src/lib/site-mode.ts keeps the two paths open in join-only). Every value
 * here is public: a package name, a Team ID plus bundle id, and the SHA-256
 * fingerprints of the signing certificates (a fingerprint is not a key).
 *
 * The path list is the app's own. Android's intent filters hold it in
 * app.json; Apple's file holds it here, so it is written once as data and both
 * sides are derived from it. Change it only with the app's intent filters:
 * `npm run check:site-mode -- --app-json <app.json>` compares the two.
 *
 * Pure data and functions, no imports: scripts/check-site-mode.mjs loads this
 * file as it stands.
 */

export const ANDROID_PACKAGE = "africa.wawu.wmt";

/** Team ID, a dot, then the bundle identifier. */
export const IOS_APP_ID = "N66V4S62J6.africa.wawu.wmt";

/**
 * SHA-256 fingerprints of the certificates that sign the app: the Google Play
 * app signing key (what a phone sees for an install from Play) and the upload
 * key (what a build signed locally or by EAS carries before Play re-signs it).
 */
export const ANDROID_CERT_FINGERPRINTS = [
  "86:7C:4D:4A:B3:F6:87:CC:66:D5:EE:03:C4:33:76:46:C3:18:63:23:90:7A:48:60:79:B9:AC:EA:50:E0:9E:3A",
  "7F:D4:5F:00:CA:E0:A5:3C:5B:B9:BA:B5:D5:B3:EC:0C:AE:B3:8A:48:15:59:00:5C:71:F3:E3:0F:2F:68:3A:A3",
] as const;

/**
 * The paths on https://wawuafrica.com that open the app, exactly as the
 * Android intent filters name them: `exact` is `path`, `prefix` is
 * `pathPrefix`.
 */
export const APP_LINK_PATHS: readonly { kind: "exact" | "prefix"; path: string }[] = [
  { kind: "prefix", path: "/r/" },
  { kind: "exact", path: "/selfie" },
  { kind: "exact", path: "/activate" },
  // RESET-APP (R-123), HELD: the Forgot password email's link opens the app's New password screen. Merge this only when the
  // build that has that screen is on phones: an iPhone on an older build would open the app on a route it does not have.
  { kind: "exact", path: "/reset-password" },
  { kind: "prefix", path: "/receipt/" },
  { kind: "prefix", path: "/u/" },
  { kind: "prefix", path: "/c/" },
  { kind: "prefix", path: "/content/" },
];

/** The two files, as the paths they are served on. */
export const ASSET_LINKS_PATH = "/.well-known/assetlinks.json";
export const APPLE_APP_SITE_ASSOCIATION_PATH = "/.well-known/apple-app-site-association";

/** The body of /.well-known/assetlinks.json. */
export function assetLinks() {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: [...ANDROID_CERT_FINGERPRINTS],
      },
    },
  ];
}

/**
 * The iOS pattern for one path: an exact path as it is, a prefix with a
 * trailing `*` (Apple's `*` matches any run of characters, "/r/" included
 * with nothing after it, as Android's `pathPrefix` does).
 */
export function applePathPattern(entry: { kind: "exact" | "prefix"; path: string }): string {
  return entry.kind === "prefix" ? `${entry.path}*` : entry.path;
}

/** The body of /.well-known/apple-app-site-association. */
export function appleAppSiteAssociation() {
  return {
    applinks: {
      details: [
        {
          appIDs: [IOS_APP_ID],
          components: APP_LINK_PATHS.map((entry) => ({ "/": applePathPattern(entry) })),
        },
      ],
    },
  };
}

/** A JSON response for either file: 200, `application/json`, cacheable for an hour. */
export function appLinkJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2) + "\n", {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
