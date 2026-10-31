/**
 * Proves the site mode does what the owner asked (src/lib/site-mode.ts,
 * src/middleware.ts, the landing page).
 *
 * On production (join-only) wawuafrica.com serves the landing page and the
 * registration link and nothing else (owner, 10 and 12 Oct 2026). This checks:
 *
 *   mode      which mode applies for which environment
 *   open      the exact paths join-only lets through (the admin dashboard, /admin and
 *             everything under it, is one of them: the admin sign-in protects it), and a long list that it
 *             must keep closed (a profile path ending ".png", a nested path,
 *             /icons/bills ...). Every file in public/ is classified, so a new
 *             file cannot become reachable by accident.
 *   landing   every file the landing page asks for is open (its service icons,
 *             its images, the sound it plays) and its links follow the rule:
 *             sign-up buttons go to /join, links into closed pages are not
 *             drawn, anchors and open pages stay, and in full mode nothing moved.
 *   applinks  the two files that make a link to the site open the WAWU app
 *             (/.well-known/assetlinks.json and /.well-known/apple-app-site-association,
 *             src/lib/app-links.ts) are open in every mode, nothing else under
 *             /.well-known is, their content is what the app declares, and the
 *             Android and iOS path sets are the same set.
 *
 * Run (no server, no build):
 *     npm run check:site-mode
 *
 * Run against a built site too (`next build`, then `next start`), once for each
 * mode it is started in; this crawls "/" and fetches everything it finds:
 *     SITE_MODE=full npx next start -p 6471
 *     npm run check:site-mode -- --base http://localhost:6471 --mode full
 *
 *     VERCEL_ENV=production npx next start -p 6471      (join-only, the default there)
 *     npm run check:site-mode -- --base http://localhost:6471 --mode join-only
 *
 * The two app-link files are fetched too, in either mode (status 200, no
 * redirect, application/json, a body that parses and equals src/lib/app-links.ts).
 *
 * To check the paths against the app itself, give it the app's app.json:
 *     npm run check:site-mode -- --app-json ../wawu-wmt-mobile/app.json
 * (path prefixes and exact paths of the Android intent filters, the iOS
 * associated domain, the package and the bundle id).
 *
 * The script loads src/lib/site-mode.ts, src/lib/platform-services.ts and
 * src/lib/app-links.ts as they stand (Node strips their types; all are free of
 * runtime imports).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const {
  siteModeFrom, isOpenInJoinOnly, isOpenPageInJoinOnly, pageHref, signUpHref,
} = await import(join(root, "src/lib/site-mode.ts"));
const { PLATFORM_SERVICES } = await import(join(root, "src/lib/platform-services.ts"));
const appLinks = await import(join(root, "src/lib/app-links.ts"));

let passed = 0;
const failures = [];
function check(name, ok, detail = "") {
  if (ok) { passed += 1; return; }
  failures.push(`${name}${detail ? "  " + detail : ""}`);
  console.log(`FAIL  ${name}${detail ? "  " + detail : ""}`);
}
const eq = (name, got, want) => check(name, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ---------------------------------------------------------------- mode
eq("mode: nothing set is full", siteModeFrom({}), "full");
eq("mode: preview is full", siteModeFrom({ VERCEL_ENV: "preview" }), "full");
eq("mode: development is full", siteModeFrom({ VERCEL_ENV: "development" }), "full");
eq("mode: production is join-only", siteModeFrom({ VERCEL_ENV: "production" }), "join-only");
eq("mode: SITE_MODE=full beats production", siteModeFrom({ SITE_MODE: "full", VERCEL_ENV: "production" }), "full");
eq("mode: SITE_MODE=join-only beats preview", siteModeFrom({ SITE_MODE: "join-only", VERCEL_ENV: "preview" }), "join-only");
eq("mode: value is trimmed and case-insensitive", siteModeFrom({ SITE_MODE: " Full ", VERCEL_ENV: "production" }), "full");
eq("mode: a typo on production stays closed", siteModeFrom({ SITE_MODE: "ful", VERCEL_ENV: "production" }), "join-only");
eq("mode: a typo elsewhere is full", siteModeFrom({ SITE_MODE: "ful" }), "full");

// ---------------------------------------------------------------- open paths
const serviceIcons = PLATFORM_SERVICES.map((s) => s.iconImageSrc);
const mustBeOpen = [
  "/", "/join", "/join/", "/join/paid", "/terms", "/privacy/policy",
  // the nine legal documents (owner, 26 Oct 2026): the stores need a public privacy policy address
  "/legal", "/legal/", "/legal/privacy", "/legal/privacy/", "/legal/terms", "/legal/creator-monetization", "/legal/community-guidelines",
  "/_next/static/chunks/app/page-1.js", "/_next/static/css/a.css", "/_next/static/media/f.woff2", "/_next/image",
  "/robots.txt",
  "/wawu-logo-white.png", "/wawu-icon-white.svg", "/wawu-hero-desktop-creators.png", "/wawu-hero-mobile-professionals.png",
  "/who-made-this-ink.png", "/og-image.png", "/favicon.ico", "/icon.png", "/apple-icon.png",
  // the admin dashboard (the admin sign-in protects it): /admin and everything under it
  "/admin", "/admin/", "/admin/notifications", "/admin/notifications/", "/admin/x/y",
  "/wawu-theme.mp3",
  // Google Play's foreground-service video (owner, 31 Oct 2026): this one file, linked from no page
  "/play/background-audio.mp4", "/play/background-audio.mp4/",
  // the two files that make a link to the site open the app (no redirect in any mode)
  "/.well-known/assetlinks.json", "/.well-known/apple-app-site-association",
  ...serviceIcons,
];
for (const p of mustBeOpen) check(`open: ${p}`, isOpenInJoinOnly(p));

const mustStayClosed = [
  // the app and everything behind it
  "/home", "/explore", "/learn", "/learn/x", "/sign-in", "/sign-up", "/api/anything", "/api/hub/waitlist/offers/current",
  // admin is whole segments only
  "/administrator", "/adminx/y", "/x/admin", "/api/hub/admin/notifications/email/campaigns",
  "/payment/return", "/wallet", "/events", "/services", "/services/legal", "/services/pay", "/shop", "/tickets", "/wawu/ada", "/communities",
  // a profile whose handle ends in a file extension is a page, not a file
  "/wawu/ada.png", "/wawu/ada.png/", "/wawu/ada.mp3",
  // the landing page's files, and nothing wider
  "/icons/bills/airtime.png", "/icons/unused/sports.png", "/icons/services", "/icons/services/", "/icons/services/x/y.png", "/icons/services/legal.png/x",
  "/icons/services/legal.PNG", "/icons/services/legal.png.map", "/icons/services/legal.jpg", "/icons/services/Legal.png", "/icons/other/legal.png",
  "/wawu-theme.mp3/x", "/wawu-theme.mp4", "/wawu-theme.mp3.map", "/other.mp3", "/x/wawu-theme.mp3",
  // the Play video's one path, and nothing wider
  "/play", "/play/", "/play/other.mp4", "/play/background-audio.mp3", "/play/background-audio.mp4/x", "/play/background-audio.mp4.map", "/play/Background-Audio.mp4",
  "/play/x/background-audio.mp4", "/x/play/background-audio.mp4", "/background-audio.mp4",
  // files and paths that were closed before
  "/landing-video.mp4", "/landing-video-mobile.mp4", "/wawu-services.mp4", "/business-playbook-the-naija-way.pdf", "/mock/creators/x.png",
  "/join/anything", "/join/paid/x", "/terms/x", "/privacy", "/privacy/policy/x",
  // /legal is one document deep, in lower case, and not a file
  "/legal/privacy/x", "/legalx", "/legal/Privacy", "/legal/privacy.png", "/legal/a_b", "/x/legal", "/x/legal/privacy", "/index.html", "/_next/data/x/home.json", "/_next/static", "/_next",
  "/who-made-this-white.png/x", "/who-made-this-white.png.map", "/images/who-made-this-white.png", "//", "/%2e%2e/sign-in", "/home/",
  // the two app-link files, and nothing wider under /.well-known
  "/.well-known", "/.well-known/", "/.well-known/security.txt", "/.well-known/change-password", "/.well-known/openid-configuration",
  "/.well-known/assetlinks.json/x", "/.well-known/assetlinks.json.map", "/.well-known/assetlinks", "/.well-known/Assetlinks.json",
  "/.well-known/apple-app-site-association/x", "/.well-known/apple-app-site-association.json", "/.well-known/Apple-App-Site-Association",
  "/x/.well-known/assetlinks.json", "/well-known/assetlinks.json", "/assetlinks.json", "/apple-app-site-association",
];
for (const p of mustStayClosed) check(`closed: ${p}`, !isOpenInJoinOnly(p));

// only whole pages count as pages
eq("page: / is a page", isOpenPageInJoinOnly("/"), true);
eq("page: a file is not a page", isOpenPageInJoinOnly("/wawu-logo-white.png"), false);
eq("page: /legal is a page", isOpenPageInJoinOnly("/legal"), true);
eq("page: /legal/privacy is a page", isOpenPageInJoinOnly("/legal/privacy"), true);
eq("page: /legal/privacy/x is not a page", isOpenPageInJoinOnly("/legal/privacy/x"), false);

// Every file in public/ is either on this list or closed. A new file cannot
// become reachable without someone editing this list.
const EXPECTED_OPEN_PUBLIC = [
  "/email-header.png", "/landing-poster.jpg", "/og-image.png", "/services-hero.jpg",
  "/wawu-hero-desktop-creators.png", "/wawu-hero-desktop-professionals.png", "/wawu-hero-mobile-creators.png", "/wawu-hero-mobile-professionals.png",
  "/wawu-icon-dark.png", "/wawu-icon-white.png", "/wawu-icon-white.svg", "/wawu-logo-dark.png", "/wawu-logo-dark.svg", "/wawu-logo-white.png", "/wawu-logo-white.svg",
  "/play/background-audio.mp4", "/wawu-mascot-gospel.webp", "/wawu-theme.mp3", "/wawubasket-icon.png", "/wawubasket-logo.png", "/wawubeauty-icon.png", "/wawubeauty-logo.png",
  "/who-made-this-conference.webp", "/who-made-this-ink.png", "/who-made-this-og.png", "/who-made-this-white.png",
  ...serviceIcons,
].sort();
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const full = join(dir, n);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const publicFiles = walk(join(root, "public")).map((f) => "/" + relative(join(root, "public"), f).split("\\").join("/"));
const openPublic = publicFiles.filter((p) => isOpenInJoinOnly(p)).sort();
eq("public/: the files join-only serves are exactly the expected list", openPublic, EXPECTED_OPEN_PUBLIC);
// The /join hero picture (HERO_IMAGE in join-content.ts) is a root file in public/ and join-only serves it.
const heroSrc = /HERO_IMAGE[^=]*=\s*\{[^}]*?src:\s*"(\/[^"]+)"/s.exec(readFileSync(join(root, "src/app/join/components/join-content.ts"), "utf8"))?.[1];
check("join: the hero picture is named in join-content.ts", typeof heroSrc === "string");
check("join: the hero picture exists in public/", publicFiles.includes(heroSrc));
check("join: the hero picture is open in join-only", isOpenInJoinOnly(heroSrc ?? "/none"));
check("public/: the landing page's icons exist", serviceIcons.every((p) => publicFiles.includes(p)), serviceIcons.filter((p) => !publicFiles.includes(p)).join(", "));

// ---------------------------------------------------------------- landing: files it asks for (ruling 2)
const landingSources = [
  "src/app/page.tsx",
  "src/app/(marketing)/components/LandingContent.tsx",
  "src/app/(marketing)/components/LandingAuthCta.tsx",
  "src/app/(marketing)/components/EarningsCalculator.tsx",
  "src/app/(marketing)/components/SmartScheduler.tsx",
  "src/app/(marketing)/components/FaqAccordion.tsx",
  "src/app/(marketing)/components/HeroRotatingWord.tsx",
  "src/components/layout/SoundToggle.tsx",
  "src/lib/sound.ts",
  "src/lib/platform-services.ts",
];
const FILE_LITERAL = /["'`](\/[A-Za-z0-9_.\-/]+\.(?:png|jpe?g|gif|webp|avif|svg|ico|mp3|mp4|webm|woff2?|ttf|otf|pdf|json|css|js))["'`]/g;
const referenced = new Set();
for (const rel of landingSources) {
  const text = readFileSync(join(root, rel), "utf8");
  for (const m of text.matchAll(FILE_LITERAL)) {
    if (m[1].startsWith("/api/")) continue;
    referenced.add(m[1]);
  }
}
check("landing: the source names the files it uses", referenced.size >= 12, `found ${referenced.size}`);
for (const f of referenced) {
  check(`landing file exists in public/: ${f}`, publicFiles.includes(f));
  check(`landing file is open in join-only: ${f}`, isOpenInJoinOnly(f));
}

// ---------------------------------------------------------------- landing: links (ruling 3)
const SIGN_UP = ["/sign-up", "/sign-up?type=creator", "/sign-up?type=creator&x=1"];
const CLOSED_LINKS = ["/sign-in", "/home", "/explore", "/learn", "/services", "/services/legal", "/services/pay", "/events", "/shop", "/wallet", "/wawu/ada.png", "/admin", "/api/x"];
const KEPT_LINKS = ["#pricing", "#comparison", "/terms", "/terms#privacy-and-data-protection", "/privacy/policy", "/join", "/join/paid", "/legal", "/legal/privacy"];
for (const h of SIGN_UP) {
  eq(`join-only: sign-up ${h} goes to /join`, signUpHref("join-only", h), "/join");
  eq(`full: sign-up ${h} is unchanged`, signUpHref("full", h), h);
}
for (const h of CLOSED_LINKS) {
  eq(`join-only: ${h} is not drawn`, pageHref("join-only", h), null);
  eq(`full: ${h} is unchanged`, pageHref("full", h), h);
}
for (const h of KEPT_LINKS) {
  eq(`join-only: ${h} stays`, pageHref("join-only", h), h);
  eq(`full: ${h} is unchanged`, pageHref("full", h), h);
}
// The landing sources hand every link to these two functions: no literal path href is left in the JSX.
for (const rel of ["src/app/(marketing)/components/LandingContent.tsx", "src/app/(marketing)/components/LandingAuthCta.tsx"]) {
  const text = readFileSync(join(root, rel), "utf8");
  const raw = [...text.matchAll(/href=(?:"|'|\{\s*["'`])\/[^"'`}]*/g)].map((m) => m[0]);
  eq(`landing: ${rel.split("/").pop()} has no literal path href in JSX`, raw, []);
}

// ---------------------------------------------------------------- app links (Android assetlinks, iOS apple-app-site-association)
// What the app declares (mobile repo app.json, branch wmt/IAP-02): written out here so the check needs no other repo;
// `--app-json <file>` compares the real app.json against it and against src/lib/app-links.ts.
const APP_PACKAGE = "africa.wawu.wmt";
const APP_IOS_ID = "N66V4S62J6.africa.wawu.wmt";
const APP_FINGERPRINTS = [
  "86:7C:4D:4A:B3:F6:87:CC:66:D5:EE:03:C4:33:76:46:C3:18:63:23:90:7A:48:60:79:B9:AC:EA:50:E0:9E:3A",
  "7F:D4:5F:00:CA:E0:A5:3C:5B:B9:BA:B5:D5:B3:EC:0C:AE:B3:8A:48:15:59:00:5C:71:F3:E3:0F:2F:68:3A:A3",
];
// the Android intent filters' paths: pathPrefix "/r/", path "/selfie", and so on
const APP_PATHS = [
  { kind: "prefix", path: "/r/" }, { kind: "exact", path: "/selfie" }, { kind: "exact", path: "/activate" },
  { kind: "prefix", path: "/receipt/" }, { kind: "prefix", path: "/u/" }, { kind: "prefix", path: "/c/" }, { kind: "prefix", path: "/content/" },
];
eq("applinks: the assetlinks path", appLinks.ASSET_LINKS_PATH, "/.well-known/assetlinks.json");
eq("applinks: the apple-app-site-association path", appLinks.APPLE_APP_SITE_ASSOCIATION_PATH, "/.well-known/apple-app-site-association");
check("applinks: both paths are open in join-only", isOpenInJoinOnly(appLinks.ASSET_LINKS_PATH) && isOpenInJoinOnly(appLinks.APPLE_APP_SITE_ASSOCIATION_PATH));
eq("applinks: the package", appLinks.ANDROID_PACKAGE, APP_PACKAGE);
eq("applinks: the iOS app id", appLinks.IOS_APP_ID, APP_IOS_ID);
eq("applinks: the paths are the app's own", appLinks.APP_LINK_PATHS, APP_PATHS);

const links = appLinks.assetLinks();
eq("assetlinks: one statement", links.length, 1);
eq("assetlinks: relation", links[0].relation, ["delegate_permission/common.handle_all_urls"]);
eq("assetlinks: target", links[0].target, { namespace: "android_app", package_name: APP_PACKAGE, sha256_cert_fingerprints: APP_FINGERPRINTS });
for (const f of APP_FINGERPRINTS) check(`assetlinks: ${f.slice(0, 8)}... is 32 uppercase hex bytes`, /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));
check("assetlinks: the two fingerprints differ", new Set(APP_FINGERPRINTS).size === 2);

const aasa = appLinks.appleAppSiteAssociation();
eq("aasa: one applinks entry for the app", aasa.applinks.details.map((d) => d.appIDs), [[APP_IOS_ID]]);
const iosPatterns = aasa.applinks.details[0].components.map((c) => c["/"]);
eq("aasa: the paths, in the app's order", iosPatterns, ["/r/*", "/selfie", "/activate", "/receipt/*", "/u/*", "/c/*", "/content/*"]);
eq("aasa: nothing but a path in each component", aasa.applinks.details[0].components.map((c) => Object.keys(c)), iosPatterns.map(() => ["/"]));

// Android and iOS claim the same set: ask both matchers about the same paths. Android: path is an exact match,
// pathPrefix a prefix. iOS: "*" matches any run of characters, everything else matches itself.
const androidClaims = (p) => APP_PATHS.some((e) => (e.kind === "exact" ? p === e.path : p.startsWith(e.path)));
const iosClaims = (p) => iosPatterns.some((pat) => new RegExp("^" + pat.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$").test(p));
for (const p of [
  "/r/", "/r/abc", "/r/abc/def", "/r", "/rx", "/R/abc", "/selfie", "/selfie/", "/selfie/x", "/selfies", "/activate", "/activate/x", "/activated",
  "/receipt/1", "/receipt/", "/receipt", "/receipts/1", "/u/ada", "/u/", "/u", "/users/ada", "/c/1", "/c/", "/c", "/cx/1", "/content/xyz", "/content/", "/content",
  "/contents/x", "/", "/home", "/join", "/wawu/ada", "/.well-known/assetlinks.json",
]) eq(`applinks: Android and iOS agree on ${p}`, iosClaims(p), androidClaims(p));
check("applinks: the matchers claim /r/abc and not /home (the probe works)", iosClaims("/r/abc") && !iosClaims("/home"));

// the responses themselves: 200, application/json, a body that parses and is the same object
for (const [name, make, want] of [["assetlinks", appLinks.assetLinks, links], ["apple-app-site-association", appLinks.appleAppSiteAssociation, aasa]]) {
  const res = appLinks.appLinkJsonResponse(make());
  check(`applinks: ${name} answers 200`, res.status === 200, `status ${res.status}`);
  eq(`applinks: ${name} is application/json`, res.headers.get("content-type"), "application/json");
  check(`applinks: ${name} sends no redirect`, !res.headers.has("location"));
  let parsed; try { parsed = JSON.parse(await res.text()); } catch { parsed = undefined; }
  eq(`applinks: ${name} body is JSON and is the same object`, parsed, want);
}

// the app's own app.json (optional): the same package, bundle id, domain and paths
const appJsonPath = (() => { const i = process.argv.indexOf("--app-json"); return i >= 0 ? process.argv[i + 1] : undefined; })();
if (appJsonPath) {
  const expo = JSON.parse(readFileSync(appJsonPath, "utf8")).expo;
  eq("app.json: Android package", expo.android.package, APP_PACKAGE);
  eq("app.json: iOS bundle identifier", `N66V4S62J6.${expo.ios.bundleIdentifier}`, APP_IOS_ID);
  eq("app.json: iOS associated domains", expo.ios.associatedDomains, ["applinks:wawuafrica.com"]);
  const verified = expo.android.intentFilters.filter((f) => f.autoVerify === true);
  check("app.json: an Android intent filter has autoVerify", verified.length >= 1);
  const data = verified.flatMap((f) => f.data);
  check("app.json: every verified entry is https on wawuafrica.com", data.every((d) => d.scheme === "https" && d.host === "wawuafrica.com"));
  const fromApp = data.map((d) => (d.pathPrefix !== undefined ? { kind: "prefix", path: d.pathPrefix } : { kind: "exact", path: d.path }));
  check("app.json: every verified entry names a path or a path prefix", data.every((d) => (d.pathPrefix !== undefined) !== (d.path !== undefined)));
  const key = (e) => `${e.kind} ${e.path}`;
  eq("app.json: the Android paths are exactly src/lib/app-links.ts (and so the iOS file)", fromApp.map(key).sort(), appLinks.APP_LINK_PATHS.map(key).sort());
}

// ---------------------------------------------------------------- a running build (optional)
const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const base = arg("--base");
const mode = arg("--mode");

// "/" as built before this change, link for link, in full mode (the anchors in the page, in order).
const FULL_MODE_LINKS = [
  "/explore", "/learn", "/sign-in", "/sign-up", "/sign-up?type=creator", "/services/legal", "/events", "/services/pay",
  "/sign-up?type=creator", "#pricing", "/sign-up?type=creator", "/sign-up?type=creator", "/sign-up", "#comparison",
  "/sign-up?type=creator", "/learn", "/sign-up?type=creator", "/learn", "/sign-up?type=creator", "#comparison",
  "/sign-up?type=creator", "/learn", "/sign-in", "/sign-up", "/sign-up?type=creator", "#pricing", "/explore", "/learn", "/services", "/terms",
];
// The same page in join-only mode: twelve sign-up and get-started links (all to /join), the in-page anchors, and the terms.
const JOIN_ONLY_LINKS = [...Array(12).fill("/join"), "#pricing", "#pricing", "#comparison", "#comparison", "/terms"];

if (base && mode) {
  if (mode !== "full" && mode !== "join-only") throw new Error("--mode is full or join-only");
  const get = (path) => fetch(new URL(path, base), { redirect: "manual" });
  const res = await get("/");
  check(`live: / answers 200 in ${mode}`, res.status === 200, `status ${res.status}`);
  const html = await res.text();

  // every link
  const anchors = [...html.matchAll(/<a\s[^>]*?href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  // header "Sign in" and "Sign up" sit before the hero in markup order; compare as multisets so a layout change cannot hide a link
  const sortList = (l) => [...l].sort();
  eq(`live: the links on / in ${mode} mode`, sortList(anchors), sortList(mode === "full" ? FULL_MODE_LINKS : JOIN_ONLY_LINKS));
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const a of anchors) {
    if (a.startsWith("#")) { check(`live: anchor ${a} has a target`, ids.has(a.slice(1))); continue; }
    if (mode === "join-only") {
      check(`live: link ${a} lands on an open page`, ["/join", "/terms", "/privacy/policy"].includes(a.split(/[?#]/)[0]));
      const r = await get(a);
      check(`live: link ${a} answers 200`, r.status === 200, `status ${r.status}`);
    }
  }

  // every file the page and its stylesheets ask for
  const urls = new Set();
  for (const m of html.matchAll(/\s(?:src|poster|data-src)="([^"]+)"/g)) urls.add(m[1]);
  for (const m of html.matchAll(/\ssrcSet="([^"]+)"|\ssrcset="([^"]+)"/g)) for (const part of (m[1] ?? m[2]).split(",")) urls.add(part.trim().split(/\s+/)[0]);
  for (const m of html.matchAll(/<link\s[^>]*?href="([^"]+)"/g)) urls.add(m[1]);
  const cssFiles = [...urls].filter((u) => u.startsWith("/_next/static/css/"));
  for (const css of cssFiles) {
    const text = await (await get(css)).text();
    for (const m of text.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/g)) if (!m[1].startsWith("data:")) urls.add(new URL(m[1], new URL(css, base)).href);
  }
  // what the page's markup names without a src attribute: the service icons are <img src>, found above; the sound track is fetched on a tap
  urls.add("/wawu-theme.mp3");
  let own = 0;
  for (const u of urls) {
    const abs = new URL(u.replace(/&amp;/g, "&"), base);
    if (abs.origin !== new URL(base).origin) continue;
    own += 1;
    const r = await get(abs.pathname + abs.search);
    check(`live: ${abs.pathname} answers 200`, r.status === 200, `status ${r.status}`);
  }
  check("live: the page asked for its own files", own >= 12, `${own} files`);
  console.log(`live: ${anchors.length} links and ${own} files fetched in ${mode} mode`);

  // the two app-link files: 200, no redirect, application/json, the object src/lib/app-links.ts builds, in either mode
  for (const [path, want] of [[appLinks.ASSET_LINKS_PATH, appLinks.assetLinks()], [appLinks.APPLE_APP_SITE_ASSOCIATION_PATH, appLinks.appleAppSiteAssociation()]]) {
    const r = await get(path);
    check(`live: ${path} answers 200 in ${mode} (no redirect)`, r.status === 200, `status ${r.status} ${r.headers.get("location") ?? ""}`);
    check(`live: ${path} is application/json`, /^application\/json\b/i.test(r.headers.get("content-type") ?? ""), r.headers.get("content-type") ?? "no content-type");
    let body; try { body = JSON.parse(await r.text()); } catch { body = undefined; }
    eq(`live: ${path} body parses as JSON and is the app's`, body, want);
  }

  if (mode === "join-only") {
    for (const p of ["/home", "/explore", "/learn", "/sign-in", "/sign-up", "/administrator", "/api/anything", "/wawu/ada.png", "/payment/return", "/icons/bills/airtime.png", "/landing-video.mp4"]) {
      const r = await get(p);
      check(`live: ${p} is still closed (307 to /join)`, r.status === 307 && /\/join$/.test(r.headers.get("location") ?? ""), `status ${r.status} ${r.headers.get("location") ?? ""}`);
    }
    for (const p of ["/join", "/join/paid", "/terms", "/admin/notifications"]) check(`live: ${p} answers 200`, (await get(p)).status === 200);
  }
}

console.log(`\ncheck-site-mode: ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
