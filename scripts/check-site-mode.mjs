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
 *   brand     the brand site (BRAND-SITE, owner 2 Nov 2026): the eight pages are open and
 *             nothing under them is, every link it draws lands on an open page, every
 *             picture and download it names exists in public/ and is open, no page carries
 *             a placeholder, an em-dash or an inline style, and the app's own About page
 *             moved to /settings/about so /about is the brand page.
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
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteModeModule = await import(join(root, "src/lib/site-mode.ts"));
const {
  siteModeFrom, isOpenInJoinOnly, isOpenPageInJoinOnly, pageHref, signUpHref,
} = siteModeModule;
const { APP_ORIGIN, appUrl, appPathFor, appRedirectTarget, movedPageTarget, MOBILE_ROUTES, RENAMES } = await import(join(root, "src/lib/app-redirects.ts"));
const { PLATFORM_SERVICES } = await import(join(root, "src/lib/platform-services.ts"));
const appLinks = await import(join(root, "src/lib/app-links.ts"));
const siteConfig = await import(join(root, "src/lib/site/site-config.ts"));
const { PARTNERS } = await import(join(root, "src/lib/site/partners.ts"));
const { PRESS_ASSETS } = await import(join(root, "src/lib/site/press-assets.ts"));
const storeConfig = await import(join(root, "src/lib/site/stores.ts"));

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
  "/", "/join/paid", "/terms", "/privacy/policy",
  // the nine legal documents (owner, 26 Oct 2026): the stores need a public privacy policy address
  "/legal", "/legal/", "/legal/privacy", "/legal/privacy/", "/legal/terms", "/legal/creator-monetization", "/legal/community-guidelines",
  "/_next/static/chunks/app/page-1.js", "/_next/static/css/a.css", "/_next/static/media/f.woff2", "/_next/image",
  "/robots.txt",
  "/wawu-logo-white.png", "/wawu-icon-white.svg", "/wawu-hero-desktop-creators.png", "/wawu-hero-mobile-professionals.png",
  "/who-made-this-ink.png", "/og-image.png", "/favicon.ico", "/icon.png", "/apple-icon.png",
  // the admin dashboard (the admin sign-in protects it): /admin and everything under it
  "/admin", "/admin/", "/admin/notifications", "/admin/notifications/", "/admin/x/y",
  "/wawu-theme.mp3",
  // the brand site (BRAND-SITE, owner 2 Nov 2026): the six pages (R-141 took /who-made-this out), with and without a trailing slash, and the sitemap
  "/voices", "/voices/", "/about", "/about/", "/partners", "/partners/", "/press", "/press/", "/careers", "/careers/", "/contact", "/contact/",
  "/sitemap.xml",
  "/wawu-brand-wordmark-white.svg", "/wawu-brand-icon-colour.png", "/wawu-partner-canva.png", "/wawu-wmt-screen-today.webp", "/wawu-og-brand.png",
  // Google Play's foreground-service video (owner, 31 Oct 2026): this one file, linked from no page
  "/play/background-audio.mp4", "/play/background-audio.mp4/",
  // the two files that make a link to the site open the app (no redirect in any mode)
  "/.well-known/assetlinks.json", "/.well-known/apple-app-site-association",
  ...serviceIcons,
];
for (const p of mustBeOpen) check(`open: ${p}`, isOpenInJoinOnly(p));

const mustStayClosed = [
  // the app and everything behind it
  "/home", "/explore", "/learn", "/learn/x", "/api/anything", "/api/hub/waitlist/offers/current",
  // the reset page is the one door; the rest of the sign-in side stays shut (RESET-WEB, R-123)
  "/login", "/auth", "/auth/login", "/auth/sign-in", "/auth/forgot-password", "/auth/reset-password", "/auth/signup",
  "/reset-password/x", "/reset-password/abc/def", "/reset-passwords", "/reset-password.html", "/reset", "/Reset-Password", "/x/reset-password", "/sign-in/reset-password",
  "/api/reset-password", "/api/auth/reset-password", "/verify-email",
  // admin is whole segments only
  // sign in, sign up and R-126's upload pages are closed here (R-133): they are on usewmt.com. The three password pages are exact paths.
  "/sign-in", "/sign-in/", "/sign-up", "/sign-up/", "/create/new", "/create/new/", "/create/library", "/create/library/",
  "/sign-in/x", "/sign-up/x", "/sign-up/creator", "/forgot-password/x", "/activate/x", "/activated", "/activate.html", "/Activate", "/x/activate", "/sign-in.html", "/signin", "/signup", "/Sign-In", "/x/sign-in",
  "/create", "/create/", "/create/content", "/create/new/x", "/create/new/video", "/create/library/x", "/create/new.html", "/Create/New", "/x/create/new",
  "/upload-site", "/upload-site/", "/upload-site/new", "/upload-site/library", "/upload-site/sign-in", "/upload-site/sign-up", "/upload-site/forgot-password",
  "/onboarding", "/kyc", "/wallet/open", "/earnings", "/messages", "/settings/profile",
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
  // the brand site is eight pages, one segment each: nothing under them, no look-alikes, no files that are not at the root
  "/who-made-this/x", "/who-made-this/x/y", "/voices/x", "/voices/care", "/about/x", "/partners/x", "/partners/dreamax", "/press/x", "/press/wawu-logo.svg", "/careers/x", "/careers/apply", "/contact/x",
  "/Who-Made-This", "/Voices", "/About", "/Partners", "/Press", "/Careers", "/Contact", "/about-us", "/contact-us", "/careers.html", "/about.html", "/who-made-this.html", "/voices.html",
  "/x/about", "/x/contact", "/who-made-this-app", "/voicess", "/partner", "/career",
  // the app's own About page moved here, and stays in the app (closed)
  "/settings", "/settings/about", "/settings/notifications",
  // the sitemap is one file; robots.txt is the only other
  "/sitemap", "/sitemap.xml/x", "/sitemap.xml.map", "/Sitemap.xml", "/x/sitemap.xml", "/sitemap.txt",
  "/brand", "/brand/wawu-logo.svg", "/press/logo.png", "/partners/canva.png", "/assets/wawu-og-brand.png", "/wawu-brand-wordmark-white.svg/x", "/wawu-partner-canva.png.map", "/wawu-og-brand.zip",
  // files and paths that were closed before
  "/landing-video.mp4", "/landing-video-mobile.mp4", "/wawu-services.mp4", "/business-playbook-the-naija-way.pdf", "/mock/creators/x.png",
  // R-141: the join page and the Who Made This page are not served here any more
  "/join", "/join/", "/who-made-this", "/who-made-this/",
  // R-141 (widened): the password pages moved to usewmt.com
  "/reset-password", "/reset-password/", "/forgot-password", "/forgot-password/", "/activate", "/activate/",
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
for (const p of ["/voices", "/about", "/partners", "/press", "/careers", "/contact", "/contact/"]) eq(`page: ${p} is a page`, isOpenPageInJoinOnly(p), true);
for (const p of ["/join", "/who-made-this", "/who-made-this/x", "/about/x", "/sitemap.xml", "/wawu-og-brand.png", "/settings/about"]) eq(`page: ${p} is not a page`, isOpenPageInJoinOnly(p), false);
eq("page: /reset-password is not a page (R-141: it moved to usewmt.com)", isOpenPageInJoinOnly("/reset-password"), false);
eq("page: /reset-password/x is not a page", isOpenPageInJoinOnly("/reset-password/x"), false);
for (const p of ["/forgot-password", "/forgot-password/", "/activate", "/activate/"]) eq(`page: ${p} is not a page (R-141: it moved to usewmt.com)`, isOpenPageInJoinOnly(p), false);
for (const p of ["/sign-in", "/sign-up", "/create/new", "/create/library", "/activate/x", "/forgot-password/x"]) eq(`page: ${p} is not a page`, isOpenPageInJoinOnly(p), false);

// R-133: R-126's upload pages are gone. Nothing is rewritten, nothing of them is left in the source.
check("strip: the middleware's rewrite helper is gone", !("joinOnlyRewrite" in siteModeModule));
for (const gone of ["src/app/upload-site", "src/components/site-upload", "src/lib/site-upload", "src/lib/api/site-upload.ts", "src/app/(auth)/forgot-password", "src/app/activate", "src/app/forgot-password", "src/app/reset-password"]) {
  check(`strip: ${gone} is removed`, !existsSync(join(root, gone)));
}
{
  const leftovers = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(e.name) && /site-upload|upload-site|uploadOnly|X-Wawu-Client|joinOnlyRewrite/.test(readFileSync(full, "utf8"))) leftovers.push(relative(root, full));
    }
  };
  walk(join(root, "src"));
  eq("strip: no source file still names the upload pages' pieces", leftovers, []);
}
// R-141: the join page, the Who Made This page and everything only they used are gone; /join/paid keeps what a payment already made needs
for (const gone of ["src/app/join/page.tsx", "src/app/(site)/who-made-this", "src/app/join/components/JoinFlow.tsx", "src/app/join/components/JoinLanding.tsx", "src/app/join/components/JoinForm.tsx", "src/app/join/components/TierPicker.tsx", "src/lib/join-tiers.ts", "src/lib/join-referral.ts"]) check(`wmt-off: ${gone} is removed`, !existsSync(join(root, gone)));
check("wmt-off: /join/paid keeps its return page", existsSync(join(root, "src/app/join/paid/page.tsx")) && existsSync(join(root, "src/app/join/paid/PaidReturn.tsx")));
check("wmt-off: /join/paid is open in join-only and no page of the site links to /join or /who-made-this", isOpenPageInJoinOnly("/join/paid"));
{
  const stale = [];
  const walkSrc = (dir) => { for (const e of readdirSync(dir, { withFileTypes: true })) { const full = join(dir, e.name); if (e.isDirectory()) walkSrc(full); else if (/\.(ts|tsx)$/.test(e.name) && !full.includes("api.generated") && /(?:href|redirectUrl|origin\}?)[=:]\s*[{"'`]?[^"'`}]*\/(?:join|who-made-this)(?!\/paid|-)["'`\s}?]/.test(readFileSync(full, "utf8"))) stale.push(relative(root, full)); } };
  walkSrc(join(root, "src"));
  eq("wmt-off: no source file links to /join or /who-made-this", stale, []);
}

// Every file in public/ is either on this list or closed. A new file cannot
// become reachable without someone editing this list.
const EXPECTED_OPEN_PUBLIC = [
  "/email-header.png", "/landing-poster.jpg", "/og-image.png", "/services-hero.jpg",
  "/wawu-hero-desktop-creators.png", "/wawu-hero-desktop-professionals.png", "/wawu-hero-mobile-creators.png", "/wawu-hero-mobile-professionals.png",
  "/wawu-icon-dark.png", "/wawu-icon-white.png", "/wawu-icon-white.svg", "/wawu-logo-dark.png", "/wawu-logo-dark.svg", "/wawu-logo-white.png", "/wawu-logo-white.svg",
  "/play/background-audio.mp4", "/wawu-mascot-gospel.webp", "/wawu-theme.mp3", "/wawubasket-icon.png", "/wawubasket-logo.png", "/wawubeauty-icon.png", "/wawubeauty-logo.png",
  "/who-made-this-ink.png", "/who-made-this-og.png", "/who-made-this-white.png",
  // the brand site (BRAND-SITE, owner 2 Nov 2026): logo pack (SVG and PNG), partner logos, app screens, link-preview pictures
  ...["wordmark-colour", "wordmark-purple", "wordmark-white", "icon-colour", "icon-purple", "icon-white"].flatMap((n) => [`/wawu-brand-${n}.svg`, `/wawu-brand-${n}.png`]),
  ...["isn-hubs", "plli", "edc-pan-atlantic", "dbn", "learning-curve", "soueast", "canva", "africa-trade-gateway", "fmyd", "pencom", "nuvion", "dreamax-white", "alison"].map((n) => `/wawu-partner-${n}.png`), // Flixora removed (owner, 3 Nov 2026)
  ...["today", "wallet", "dollar", "explore", "me", "creator", "unlock"].map((n) => `/wawu-wmt-screen-${n}.webp`),
  "/wawu-og-brand.png", "/wawu-og-voices.png",
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
// R-141: the join page's hero picture and the Who Made This link-preview picture left with their pages.
check("join: the hero picture is gone from public/", !publicFiles.includes("/who-made-this-conference.webp") && !publicFiles.includes("/wawu-og-who-made-this.png"));
check("public/: the landing page's icons exist", serviceIcons.every((p) => publicFiles.includes(p)), serviceIcons.filter((p) => !publicFiles.includes(p)).join(", "));

// ---------------------------------------------------------------- landing: files it asks for (ruling 2)
// (src/app/page.tsx, the old "/" page, was replaced by the brand site's home page on 2 Nov 2026; its components stay in place, unused, and stay checked here.)
const landingSources = [
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
const CLOSED_LINKS = ["/sign-in", "/sign-up", "/create/new", "/create/library", "/home", "/explore", "/learn", "/services", "/services/legal", "/services/pay", "/events", "/shop", "/wallet", "/wawu/ada.png", "/admin", "/api/x", "/join", "/who-made-this", "/forgot-password", "/activate", "/activate?token=abc&email=ada%40example.test", "/reset-password", "/reset-password?token=abc&email=ada%40example.test"];
const KEPT_LINKS = ["#pricing", "#comparison", "/terms", "/terms#privacy-and-data-protection", "/privacy/policy", "/join/paid", "/legal", "/legal/privacy"];
for (const h of SIGN_UP) {
  eq(`join-only: sign-up ${h} opens usewmt.com`, signUpHref("join-only", h), "https://usewmt.com");
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

const ROOT_FILE = /^\/[^/]+\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|mp3|mp4|pdf)$/;

// ---------------------------------------------------------------- app addresses go to usewmt.com (WEB-STRIP, R-133)
eq("redirect: the app lives at usewmt.com", APP_ORIGIN, "https://usewmt.com");
eq("redirect: appUrl of a path", appUrl("/sign-in"), "https://usewmt.com/sign-in");
eq("redirect: appUrl of the home", appUrl("/"), "https://usewmt.com/");
const REDIRECTS = [
  // closed pages R-126 opened, and the sign-in side
  ["/sign-in", "", "https://usewmt.com/sign-in"], ["/sign-in/", "", "https://usewmt.com/sign-in"],
  ["/sign-in", "?next=%2Fcreate%2Fnew", "https://usewmt.com/sign-in?next=%2Fcreate%2Fnew"],
  ["/sign-up", "?type=creator", "https://usewmt.com/sign-up?type=creator"],
  ["/create/new", "", "https://usewmt.com/create"], ["/create/library", "", "https://usewmt.com/library"],
  // the app links the stores were given: same path, same query
  ["/u/ada", "", "https://usewmt.com/u/ada"], ["/u/ada.png", "", "https://usewmt.com/u/ada.png"],
  ["/c/lagos-makers", "?ref=1", "https://usewmt.com/c/lagos-makers?ref=1"],
  ["/content/abc123", "", "https://usewmt.com/content/abc123"], ["/receipt/R-77", "", "https://usewmt.com/receipt/R-77"],
  ["/r/CODE1", "", "https://usewmt.com/r/CODE1"], ["/selfie", "", "https://usewmt.com/selfie"],
  // what the web app called its pages
  ["/wawu/ada", "", "https://usewmt.com/u/ada"], ["/wawu/ada.png", "", "https://usewmt.com/u/ada.png"],
  ["/profile/W123", "", "https://usewmt.com/profile/W123"], ["/profile", "", "https://usewmt.com/me"],
  ["/profile/edit", "", "https://usewmt.com/edit-profile"],
  ["/communities/9", "", "https://usewmt.com/community/9"], ["/communities/new", "", "https://usewmt.com/community/new"], ["/communities", "", "https://usewmt.com/"],
  ["/events/5", "", "https://usewmt.com/events/5"], ["/events/5/edit", "", "https://usewmt.com/events/edit/5"], ["/events/mine", "", "https://usewmt.com/events/mine"],
  ["/wallet", "", "https://usewmt.com/wallet"], ["/wallet/open", "", "https://usewmt.com/"], ["/home", "", "https://usewmt.com/"],
  ["/explore", "", "https://usewmt.com/explore"], ["/messages", "", "https://usewmt.com/inbox"], ["/settings/notifications", "", "https://usewmt.com/settings/notifications"],
  ["/professionals/7", "", "https://usewmt.com/professionals/7"], ["/shop", "", "https://usewmt.com/shop"], ["/shop/orders/3", "", "https://usewmt.com/"],
  ["/learn", "", "https://usewmt.com/schools"], ["/kyc", "", "https://usewmt.com/"], ["/onboarding", "", "https://usewmt.com/"],
  ["/services/legal", "", "https://usewmt.com/"], ["/tickets", "", "https://usewmt.com/events/tickets"],
  ["/purchases", "?tab=2", "https://usewmt.com/purchases?tab=2"],
];
for (const [path, search, want] of REDIRECTS) eq(`redirect: ${path}${search} goes to ${want}`, appRedirectTarget(path, search), want);

// R-141: /join and /who-made-this go to the app's home, nothing else does
for (const p of ["/join", "/join/", "/who-made-this", "/who-made-this/"]) eq(`redirect: ${p} goes to usewmt.com (movedPageTarget)`, movedPageTarget(p, ""), "https://usewmt.com");
eq("redirect: /join drops its query (the app's home needs none)", movedPageTarget("/join", "?ref=ABC"), "https://usewmt.com");
for (const p of ["/join/paid", "/join/x", "/who-made-this/x", "/voices", "/", "/Join", "/joined", "/reset-password/x", "/activate/x", "/forgot-password/x", "/reset-passwords", "/Activate"]) eq(`redirect: ${p} is not a moved page`, movedPageTarget(p, "?x=1"), null);
// R-141 (widened): the three password pages go to the SAME path on usewmt.com, the query kept byte for byte (the mails' token and email)
for (const page of ["/reset-password", "/forgot-password", "/activate"]) {
  for (const q of [
    "", "?", "?token=abc&email=a%40b.com", "?token=tok%2B123&email=ada%2Bx%40example.test", "?email=ada%40example.test&token=0123456789abcdef0123456789abcdef", "?token=a+b&email=a@b.com",
    "?token=abc&email=a%40b.com&utm_source=mail&x=%E2%9C%93", "?a=1&a=2&b=", "?token=A%2fB%3D%3D&email=%41%42%40c.d", "?t=%25%32%30&u=;v=~._-!*'()",
  ]) {
    const got = movedPageTarget(page, q);
    eq(`redirect: ${page}${q} keeps its query byte for byte`, got, `https://usewmt.com${page}${q === "?" ? "" : q}`);
    if (q !== "" && q !== "?") check(`redirect: ${page}${q}: the query part of the target is exactly the query that came`, got.slice(got.indexOf("?")) === q);
  }
  eq(`redirect: ${page}/ (a trailing slash) goes to ${page} on usewmt.com`, movedPageTarget(`${page}/`, "?token=abc&email=a%40b.com"), `https://usewmt.com${page}?token=abc&email=a%40b.com`);
}
{
  const mw = readFileSync(join(root, "src/middleware.ts"), "utf8");
  check("redirect: the middleware answers the moved pages before it looks at the mode, and hands the query on", mw.indexOf("movedPageTarget(") > 0 && mw.indexOf("movedPageTarget(") < mw.indexOf('currentSiteMode() === "full"') && mw.includes("request.nextUrl.search"));
  check("redirect: no closed path is sent to /join any more", !/pathname\s*=\s*"\/join"/.test(mw));
}
// never redirected: well-known files, admin, the build's files, the API, payment returns, the company pages, the legal pages, the password pages, /join, site files
const NEVER = [
  "/.well-known/assetlinks.json", "/.well-known/apple-app-site-association", "/.well-known/x", "/.well-known", "/admin", "/admin/notifications", "/admin/x/y",
  "/_next/static/chunks/a.js", "/_next/image", "/api/hub/anything", "/api/anything", "/payment/return",
  "/", "/join", "/join/paid", "/terms", "/privacy/policy", "/legal", "/legal/privacy", "/legal/delete-account",
  "/voices", "/about", "/partners", "/press", "/careers", "/contact",
  "/robots.txt", "/sitemap.xml", "/favicon.ico", "/wawu-logo-white.png", "/wawu-theme.mp3", "/play/background-audio.mp4", "/icons/services/legal.png",
  // not an app address: the old closed answer (307 to /join) stays
  "/login", "/auth/login", "/verify-email", "/some/where/else", "/landing-video.mp4",
];
for (const p of NEVER) eq(`redirect: ${p} is never sent to usewmt.com`, appRedirectTarget(p, "?x=1"), null);
for (const p of mustBeOpen) eq(`redirect: the open path ${p} is not an app path`, appPathFor(p), null);

// every web page the app had either stays (open) or has an answer on usewmt.com
{
  const urls = [];
  const walk = (dir, segs) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        const group = /^\(.*\)$/.test(e.name);
        walk(full, group ? segs : [...segs, e.name.replace(/^\[\.\.\.(.+)\]$/, "x1").replace(/^\[(.+)\]$/, "x1")]);
      } else if (e.name === "page.tsx") urls.push("/" + segs.join("/"));
    }
  };
  walk(join(root, "src/app"), []);
  const appPages = urls.filter((u) => !isOpenPageInJoinOnly(u) && !/^\/(admin|payment|legal)(\/|$)/.test(u));
  check("redirect: the web app's pages were found", appPages.length >= 60, `found ${appPages.length}`);
  for (const u of appPages) check(`redirect: the web page ${u} has an answer on usewmt.com`, appPathFor(u) !== null);
  check("redirect: the closed /upload-site pages are not in the build", !urls.some((u) => u.startsWith("/upload-site")));
}

// the map against the Who Made This app itself (needs its repo): npm run check:site-mode -- --mobile-src ../wawu-wmt-mobile/src/app
const mobileSrc = process.argv.includes("--mobile-src") ? process.argv[process.argv.indexOf("--mobile-src") + 1] : null;
if (mobileSrc) {
  const found = new Set();
  const walk = (dir, segs) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) { walk(full, /^\(.*\)$/.test(e.name) ? segs : [...segs, e.name]); continue; }
      const m = /^(.+)\.(?:tsx|ts)$/.exec(e.name);
      if (!m || m[1] === "_layout" || m[1] === "+not-found") continue;
      const parts = m[1] === "index" ? segs : [...segs, m[1]];
      if (parts[0] === "dev" || parts[0] === "preview") continue;
      found.add("/" + parts.join("/"));
    }
  };
  walk(mobileSrc, []);
  const norm = (r) => r.replace(/\[[^\]]+\]/g, "*").replace(/:[a-z]+/g, "*");
  const real = new Set([...found].map(norm));
  check("mobile: the app's routes were read", found.size > 100, `found ${found.size}`);
  for (const r of MOBILE_ROUTES) check(`mobile: ${r} is a route of usewmt.com`, real.has(norm(r)));
  for (const [from, to] of RENAMES) check(`mobile: ${from} goes to ${to}, a route of usewmt.com`, to === "/" || real.has(norm(to)));
  // the other way: every app route that wawuafrica.com keeps for itself is the only one left out
  const left = [...found].filter((r) => r !== "/" && !MOBILE_ROUTES.some((m) => norm(m) === norm(r))).sort();
  eq("mobile: the only app routes not mapped are the pages wawuafrica.com keeps or moves to usewmt.com with their query", left, ["/about", "/activate", "/forgot-password", "/legal", "/privacy-policy", "/reset-password", "/terms"]);
} else console.log("check-site-mode: mobile routes NOT checked (give --mobile-src <wawu-wmt-mobile/src/app>)");

// the links on the pages that stay: none leads to a closed page. A literal path in an href, a Link or a push on these pages is open or is an appUrl().
{
  const dirs = ["src/app/join", "src/app/(site)", "src/app/legal", "src/components/legal", "src/lib/site"];
  const files = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(tsx|ts)$/.test(e.name)) files.push(full);
    }
  };
  for (const d of dirs) walk(join(root, d));
  const closedHits = [];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(/(?:href\s*=\s*\{?\s*|href:\s*|router\.(?:push|replace)\(\s*)["'`](\/[^"'`?#\s]*)/g)) {
      const path = m[1].replace(/\$\{[^}]*\}/g, "x");
      if (/^\/(?:wawu-|who-made-this-|play\/|icons\/|og-image)/.test(path) || ROOT_FILE.test(path)) continue;
      if (!isOpenPageInJoinOnly(path)) closedHits.push(`${relative(root, f)} -> ${path}`);
    }
  }
  eq("links: no page that stays links to a closed page", closedHits, []);
  for (const f of ["src/app/join/components/JoinSuccess.tsx", "src/app/(site)/_components/SiteHeader.tsx", "src/app/(site)/_components/SiteFooter.tsx"]) {
    check(`links: ${f} sends sign in to usewmt.com`, readFileSync(join(root, f), "utf8").includes('appUrl("/sign-in")'));
  }
  // the owner's rules for the pages that changed: no em-dash in what a person reads, no inline style, no hex
  for (const f of ["src/app/join/paid/PaidReturn.tsx", "src/app/join/components/JoinSuccess.tsx"]) {
    const text = readFileSync(join(root, f), "utf8");
    const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    check(`links: ${f} has no em-dash outside comments`, !code.includes("\u2014"));
    check(`links: ${f} has no inline style`, !/style=\{\{/.test(text));
    check(`links: ${f} has no hex colour`, !/#[0-9a-fA-F]{6}\b/.test(code));
    check(`links: ${f} never names the payment provider on the page`, !/>[^<{]*flutterwave/i.test(code.replace(/\{[^}]*\}/g, "")));
  }
  // R-141 (widened): nothing of the password pages is left in the source
  const authApi = readFileSync(join(root, "src/lib/api/auth.ts"), "utf8");
  check("password-off: the API calls for the three pages are gone from src/lib/api/auth.ts", !/requestPasswordReset|saveNewPassword|activateAccount|\/auth\/forgot-password|\/auth\/reset-password|\/auth\/activate/.test(authApi));
}

// ---------------------------------------------------------------- brand site (BRAND-SITE, owner 2 Nov 2026)
// wawuafrica.com's public pages: seven pages (R-141 took /who-made-this out), plain, open in join-only mode. This proves they are the eight, that nothing a
// visitor can click leads into a closed part of the site, that every picture and download exists and is served, and the
// owner's copy rules (no em-dash, no placeholder, no dead button, no inline style).
const BRAND_PAGES = ["/", "/voices", "/about", "/partners", "/press", "/careers", "/contact"];
const exists = (rel) => { try { statSync(join(root, rel)); return true; } catch { return false; } };
eq("brand: the pages the site lists (SITE_PAGES)", siteConfig.SITE_PAGES.map((p) => p.href), BRAND_PAGES);
for (const h of BRAND_PAGES) {
  check(`brand: ${h} is a page open in join-only`, isOpenPageInJoinOnly(h));
  const file = `src/app/(site)${h === "/" ? "" : h}/page.tsx`;
  check(`brand: ${h} has its page file ${file}`, exists(file));
}
check("brand: the old src/app/page.tsx is gone (the home page is the brand site's)", !exists("src/app/page.tsx"));
check("brand: the app's About page moved to /settings/about", exists("src/app/(app)/settings/about/page.tsx") && !exists("src/app/(app)/about/page.tsx"));
check("brand: the app's links to its About page point to /settings/about", readFileSync(join(root, "src/app/(app)/settings/page.tsx"), "utf8").includes('href: "/settings/about"') && readFileSync(join(root, "src/app/(app)/settings/SettingsDesktopShared.tsx"), "utf8").includes('href: "/settings/about"'));
check("brand: a sitemap lists exactly SITE_PAGES", exists("src/app/sitemap.ts") && readFileSync(join(root, "src/app/sitemap.ts"), "utf8").includes("SITE_PAGES"));
check("brand: /sitemap.xml and /robots.txt are open in join-only", isOpenInJoinOnly("/sitemap.xml") && isOpenInJoinOnly("/robots.txt"));

// every link the config files hold lands on an open page; Register is the registration link; the legal links are the existing pages
const configLinks = [...siteConfig.HEADER_NAV, ...siteConfig.FOOTER_APPS, ...siteConfig.FOOTER_COMPANY, ...siteConfig.FOOTER_LEGAL, ...siteConfig.SITE_PAGES, { label: "Join Who Made This", href: siteConfig.WMT_HREF }, { label: "Join VOICES", href: siteConfig.VOICES_HREF }];
for (const l of configLinks) check(`brand: link ${l.label} -> ${l.href} lands on an open page or on usewmt.com`, isOpenPageInJoinOnly(l.href) || l.href === "https://usewmt.com" || l.href === "https://usevoices.com");
eq("brand: the Who Made This link opens usewmt.com (R-141)", siteConfig.WMT_HREF, "https://usewmt.com");
eq("brand: the Who Made This link in the config is usewmt.com", siteConfig.FOOTER_APPS.filter((l) => /Who Made This/.test(l.label)).map((l) => l.href), ["https://usewmt.com"]);
eq("brand: the VOICES links in the config are usevoices.com or the story page", siteConfig.FOOTER_APPS.filter((l) => /VOICES/.test(l.label)).map((l) => l.href), ["https://usevoices.com", "/voices"]);
eq("brand: VOICES_HREF", siteConfig.VOICES_HREF, "https://usevoices.com");
eq("brand: the VOICES web button", storeConfig.WEB_LINKS.voices, { label: "Join VOICES", href: "https://usevoices.com" });
check("brand: no privacy@ address anywhere in src, public or docs (support@wawuafrica.com is the one address)", ![...walk(join(root, "src")), ...walk(join(root, "public")), ...(exists("docs") ? walk(join(root, "docs")) : [])].some((f) => /\.(?:tsx?|css|md|html|svg|json|txt|xml)$/.test(f) && readFileSync(f, "utf8").includes("privacy@wawuafrica.com")));
eq("brand: the legal links are the existing legal pages", siteConfig.FOOTER_LEGAL.map((l) => l.href), ["/legal/privacy", "/terms", "/legal"]);
eq("brand: the header's links", siteConfig.HEADER_NAV.map((l) => l.href), ["/voices", "/about", "/partners", "/contact"]);
eq("brand: the support email", siteConfig.CONTACT_EMAIL, "support@wawuafrica.com");
eq("brand: the WhatsApp link", siteConfig.WHATSAPP_URL, "https://wa.me/2347050722222");
eq("brand: the company", siteConfig.COMPANY, "WAWU Technology Ltd");
eq("brand: the conference cities", siteConfig.CONFERENCE_CITIES, ["Lagos", "Abuja", "Port Harcourt"]);

// the store links live in one file; VOICES is not in a store yet, so nothing links out and its page says "coming soon" (Who Made This has no store entry: its links open usewmt.com, R-141)
eq("brand: the apps the store config knows", Object.keys(storeConfig.STORE_LINKS).sort(), ["voices"]);
for (const app of Object.keys(storeConfig.STORE_LINKS)) {
  eq(`brand: ${app} has no store link yet`, storeConfig.liveStores(app), []);
  for (const url of Object.values(storeConfig.STORE_LINKS[app])) check(`brand: a ${app} store link is null or an https address`, url === null || /^https:\/\//.test(url));
}

// the partner strip: the owner's thirteen, in the owner's order, each file in public/ and served
// Owner, 3 Nov 2026: "Also remove flixora logo". Thirteen partners, the owner's order otherwise unchanged.
eq("brand: the partners, in the owner's order", PARTNERS.map((p) => p.slug), ["isn-hubs", "plli", "edc-pan-atlantic", "dbn", "learning-curve", "soueast", "canva", "africa-trade-gateway", "fmyd", "pencom", "nuvion", "dreamax", "alison"]);
for (const p of PARTNERS) {
  check(`brand: partner logo ${p.src} exists in public/`, publicFiles.includes(p.src));
  check(`brand: partner logo ${p.src} is open in join-only`, isOpenInJoinOnly(p.src));
  check(`brand: partner ${p.slug} has a name and a drawn size`, p.name.length > 2 && p.width > 0 && p.height > 0 && p.width <= 240 && p.height <= 110);
}
check("brand: the white Dreamax mark exists", publicFiles.includes("/wawu-partner-dreamax-white.png"));
// Owner, 3 Nov 2026 ("the partner logos should be horizontal in a slider and should be black and white and smaller"): the
// logos are drawn in black and white on every device, with no colour on hover. This replaces the 2 Nov check that kept them in
// their own colours. Dreamax still uses the supplied white mark, drawn dark so it reads on the light section.
check("brand: Dreamax uses the supplied white mark (not the old inverted file)", PARTNERS.find((p) => p.slug === "dreamax")?.src === "/wawu-partner-dreamax-white.png");
{
  const wall = readFileSync(join(root, "src/app/(site)/_components/LogoWall.tsx"), "utf8");
  check("brand: the partner logos are black and white (owner, 3 Nov 2026)", /\bgrayscale\b/.test(wall));
  check("brand: no logo turns to colour on hover", !/hover:(grayscale-0|filter-none|saturate)/.test(wall));
}
check("brand: the old inverted Dreamax file is gone", !publicFiles.includes("/wawu-partner-dreamax.png"));

// the press downloads: six marks, each an SVG and a PNG, in public/ and open
eq("brand: six press marks", PRESS_ASSETS.length, 6);
for (const a of PRESS_ASSETS) for (const f of [a.svg, a.png]) {
  check(`brand: press file ${f} exists in public/`, publicFiles.includes(f));
  check(`brand: press file ${f} is open in join-only`, isOpenInJoinOnly(f));
}
check("brand: BASKET and BEAUTY marks are not on the press page", !PRESS_ASSETS.some((a) => /basket|beauty/i.test(a.id + a.svg + a.png)));

// the pictures the site's own sources name exist and are open
const siteSources = [...walk(join(root, "src/app/(site)")), ...walk(join(root, "src/lib/site")), join(root, "src/app/sitemap.ts"), join(root, "src/app/robots.ts")].filter((f) => /\.(?:tsx?|css)$/.test(f));
const SITE_FILE_LITERAL = /["'`](\/(?:wawu-|who-made-this-)[A-Za-z0-9_.\-]+\.(?:png|jpe?g|webp|svg))["'`]/g;
const siteNamed = new Set();
for (const f of siteSources) for (const m of readFileSync(f, "utf8").matchAll(SITE_FILE_LITERAL)) siteNamed.add(m[1]);
check("brand: the site's sources name their pictures", siteNamed.size >= 15, `found ${siteNamed.size}`);
for (const f of siteNamed) {
  check(`brand: ${f} exists in public/`, publicFiles.includes(f));
  check(`brand: ${f} is open in join-only`, isOpenInJoinOnly(f));
}
for (const id of ["today", "wallet", "dollar", "explore", "me", "creator", "unlock"]) check(`brand: app screen ${id} exists`, publicFiles.includes(`/wawu-wmt-screen-${id}.webp`));
// Owner, 3 Nov 2026 ("the rest on the website should be replaced with the ones I share"): his own profile screenshot
// (wawu-wmt-screen-me.webp, it shows a Shop tab) is on the brand site by his instruction. This replaces the lead ruling of
// 2 Nov 2026 that kept the SLIDER 3 profile screen off the site; R-9 (no Shop tab) still governs the app itself.
// the VOICES page says only what the boss's example says: nothing about anonymity, masked voices, emoji or typed replies, or recording live
{
  const voices = readFileSync(join(root, "src/app/(site)/voices/page.tsx"), "utf8");
  check("brand: the VOICES page makes no claim the example does not", !/anonym|masked|emoji|typed repl|recorded live|your voice, live/i.test(voices));
  check("brand: the VOICES page says others reply with reactions and comments", voices.includes("Others can reply with reactions and comments."));
}
check("brand: the app screen the owner struck out (SLIDER 2: a physical card, To cash) is not used", !siteSources.some((f) => /slider[ _-]?2/i.test(readFileSync(f, "utf8"))));
const ogFiles = [...readFileSync(join(root, "src/app/(site)/_lib/page-metadata.ts"), "utf8").matchAll(/"(\/wawu-og-[a-z-]+\.png)"/g)].map((m) => m[1]);
eq("brand: the two link-preview pictures", ogFiles.sort(), ["/wawu-og-brand.png", "/wawu-og-voices.png"]);

// every literal link in the site's components lands on an open page (or is mailto, wa.me or an anchor on the page)
const HREF_LITERAL = /href(?:=|:\s*)(?:"|'|\{\s*["'`])([^"'`}]+)/g;
let hrefCount = 0;
for (const f of siteSources.filter((x) => x.endsWith(".tsx"))) {
  for (const m of readFileSync(f, "utf8").matchAll(HREF_LITERAL)) {
    const h = m[1];
    if (!h.startsWith("/") && !h.startsWith("#") && !h.startsWith("mailto:") && !h.startsWith("https://wa.me/")) continue;
    hrefCount += 1;
    if (h.startsWith("/")) check(`brand: ${relative(root, f)} links to ${h}, an open page or file`, isOpenInJoinOnly(h.split(/[?#]/)[0]));
  }
}
check("brand: the components' literal links were found", hrefCount >= 8, `found ${hrefCount}`);

// copy and code rules for everything the site draws
for (const f of siteSources) {
  const text = readFileSync(f, "utf8");
  const where = relative(root, f);
  check(`brand: ${where} has no em-dash`, !text.includes("—"));
  check(`brand: ${where} has no inline style`, !/style=\{\{/.test(text));
  check(`brand: ${where} has no placeholder`, !/\b(?:tbd|todo|lorem ipsum|coming soon page)\b|\bAdd (?:store|office|partnership|press|registered)/i.test(text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")));
  check(`brand: ${where} has no launch-date chip (the apps are not in the stores yet)`, !/\bLive 2[46] Oct|goes live on 2[46] Oct/i.test(text));
  check(`brand: ${where} has no hardcoded hex colour outside the token file`, f.endsWith(".css") || !/#[0-9a-fA-F]{6}\b/.test(text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")));
}
check("brand: no dead button (a <button> in the site is the menu button)", siteSources.filter((f) => f.endsWith(".tsx") && /<button\b/.test(readFileSync(f, "utf8"))).map((f) => relative(root, f)).join() === "src/app/(site)/_components/SiteHeader.tsx");

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
  { kind: "prefix", path: "/r/" }, { kind: "exact", path: "/selfie" },
  { kind: "prefix", path: "/receipt/" }, { kind: "prefix", path: "/u/" }, { kind: "prefix", path: "/c/" }, { kind: "prefix", path: "/content/" },
];
eq("applinks: the assetlinks path", appLinks.ASSET_LINKS_PATH, "/.well-known/assetlinks.json");
eq("applinks: the apple-app-site-association path", appLinks.APPLE_APP_SITE_ASSOCIATION_PATH, "/.well-known/apple-app-site-association");
check("applinks: both paths are open in join-only", isOpenInJoinOnly(appLinks.ASSET_LINKS_PATH) && isOpenInJoinOnly(appLinks.APPLE_APP_SITE_ASSOCIATION_PATH));
eq("applinks: the package", appLinks.ANDROID_PACKAGE, APP_PACKAGE);
eq("applinks: the iOS app id", appLinks.IOS_APP_ID, APP_IOS_ID);
eq("applinks: the paths are the app's own, without the password pages (R-133)", appLinks.APP_LINK_PATHS, APP_PATHS);
// R-133 point 4: the mails for the password pages open the web pages that stay on wawuafrica.com, never the phone app
const PASSWORD_PAGES = ["/activate", "/reset-password", "/forgot-password"];
eq("applinks: the unclaimed list names the three password pages", [...appLinks.UNCLAIMED_PASSWORD_PATHS].sort(), [...PASSWORD_PAGES].sort());

const links = appLinks.assetLinks();
eq("assetlinks: one statement", links.length, 1);
eq("assetlinks: relation", links[0].relation, ["delegate_permission/common.handle_all_urls"]);
eq("assetlinks: target", links[0].target, { namespace: "android_app", package_name: APP_PACKAGE, sha256_cert_fingerprints: APP_FINGERPRINTS });
for (const f of APP_FINGERPRINTS) check(`assetlinks: ${f.slice(0, 8)}... is 32 uppercase hex bytes`, /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));
check("assetlinks: the two fingerprints differ", new Set(APP_FINGERPRINTS).size === 2);

const aasa = appLinks.appleAppSiteAssociation();
eq("aasa: one applinks entry for the app", aasa.applinks.details.map((d) => d.appIDs), [[APP_IOS_ID]]);
const iosPatterns = aasa.applinks.details[0].components.map((c) => c["/"]);
eq("aasa: the paths, in the app's order, without the password pages", iosPatterns, ["/r/*", "/selfie", "/receipt/*", "/u/*", "/c/*", "/content/*"]);
for (const p of PASSWORD_PAGES) {
  check(`aasa: ${p} is not claimed`, !iosPatterns.some((pat) => pat === p || pat === `${p}*` || (pat.endsWith("*") && p.startsWith(pat.slice(0, -1)))));
  check(`assetlinks: ${p} is not a path the site lists (the file names no paths, so no path is claimed for it)`, !JSON.stringify(links).includes(p));
  check(`applinks: ${p} is not in APP_LINK_PATHS`, !appLinks.APP_LINK_PATHS.some((e) => e.path === p || (e.kind === "prefix" && p.startsWith(e.path))));
}
eq("aasa: nothing but a path in each component", aasa.applinks.details[0].components.map((c) => Object.keys(c)), iosPatterns.map(() => ["/"]));

// Android and iOS claim the same set: ask both matchers about the same paths. Android: path is an exact match,
// pathPrefix a prefix. iOS: "*" matches any run of characters, everything else matches itself.
const androidClaims = (p) => APP_PATHS.some((e) => (e.kind === "exact" ? p === e.path : p.startsWith(e.path)));
const iosClaims = (p) => iosPatterns.some((pat) => new RegExp("^" + pat.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$").test(p));
for (const p of [
  "/r/", "/r/abc", "/r/abc/def", "/r", "/rx", "/R/abc", "/selfie", "/selfie/", "/selfie/x", "/selfies", "/activate", "/activate/x", "/activated", "/forgot-password",
  "/receipt/1", "/receipt/", "/receipt", "/receipts/1", "/u/ada", "/u/", "/u", "/users/ada", "/c/1", "/c/", "/c", "/cx/1", "/content/xyz", "/content/", "/content",
  "/contents/x", "/reset-password", "/reset-password/", "/reset-password/x", "/reset-passwords", "/reset", "/", "/home", "/join", "/wawu/ada", "/.well-known/assetlinks.json",
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
  // the app's own filters may still list the password pages; the site does not claim them (R-133)
  const appOnly = fromApp.map(key).filter((k) => !appLinks.APP_LINK_PATHS.map(key).includes(k)).sort();
  check("app.json: every path the site claims is one the app declares", appLinks.APP_LINK_PATHS.every((e) => fromApp.map(key).includes(key(e))));
  check("app.json: the app declares no path the site leaves out except the password pages", appOnly.every((k) => appLinks.UNCLAIMED_PASSWORD_PATHS.map((p) => `exact ${p}`).includes(k)), appOnly.join());
}

// ---------------------------------------------------------------- a running build (optional)
const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const base = arg("--base");
const mode = arg("--mode");

// The old "/" (the signed-out landing page) was replaced by the brand site's home page on 2 Nov 2026, so its link-for-link
// lists (FULL_MODE_LINKS, JOIN_ONLY_LINKS) described a page that no longer exists and are gone. The live crawl below does the
// same job for every brand page: each answers 200, every link lands on an open page, every anchor has a target, every file it
// asks for answers 200, and in join-only mode the page is no different from full mode.

if (base && mode) {
  if (mode !== "full" && mode !== "join-only") throw new Error("--mode is full or join-only");
  const get = (path) => fetch(new URL(path, base), { redirect: "manual" });
  let totalLinks = 0;
  let totalFiles = 0;
  const seenFiles = new Set();

  for (const page of siteConfig.SITE_PAGES) {
    const res = await get(page.href);
    check(`live: ${page.href} answers 200 in ${mode}`, res.status === 200, `status ${res.status} ${res.headers.get("location") ?? ""}`);
    const html = await res.text();

    // the page's own facts: one title, one description, one h1, a link-preview picture that answers
    check(`live: ${page.href} has a title`, /<title>[^<]{8,}<\/title>/.test(html));
    check(`live: ${page.href} has a description`, /<meta name="description" content="[^"]{30,}"/.test(html));
    eq(`live: ${page.href} has exactly one h1`, [...html.matchAll(/<h1[\s>]/g)].length, 1);
    const og = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
    check(`live: ${page.href} has an og:image`, typeof og === "string");
    if (og) {
      const ogPath = new URL(og, base).pathname;
      check(`live: ${page.href} og:image ${ogPath} is open in join-only`, isOpenInJoinOnly(ogPath));
      const r = await get(ogPath);
      check(`live: ${page.href} og:image ${ogPath} answers 200`, r.status === 200, `status ${r.status}`);
    }
    check(`live: ${page.href} says nothing is a placeholder`, !/\btbd\b|add (?:the )?(?:store|office|address|partnership|press)/i.test(html.replace(/<script[\s\S]*?<\/script>/g, "")));
    check(`live: ${page.href} has no em-dash`, !html.replace(/<script[\s\S]*?<\/script>/g, "").includes("\u2014"));

    // every link
    const anchors = [...html.matchAll(/<a\s[^>]*?href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
    totalLinks += anchors.length;
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const a of anchors) {
      if (a.startsWith("#")) { check(`live: ${page.href} anchor ${a} has a target`, ids.has(a.slice(1))); continue; }
      if (/^(?:mailto:|https:\/\/wa\.me\/)/.test(a)) continue;
      // the Sign in links go to the app (R-133)
      if (a === appUrl("/sign-in")) { check(`live: ${page.href} sign in goes to usewmt.com`, true); continue; }
      // every Who Made This link and button opens the app (R-141)
      if (a === APP_ORIGIN) { check(`live: ${page.href} Who Made This link opens usewmt.com`, true); continue; }
      if (/^[a-z]+:/i.test(a)) { check(`live: ${page.href} link ${a} is one we expect`, false); continue; }
      const path = a.split(/[?#]/)[0];
      if (mode === "join-only") {
        const open = isOpenInJoinOnly(path);
        check(`live: ${page.href} link ${a} lands on an open page or file`, open);
      }
      if (path.startsWith("/legal")) {
        // the legal pages ask the Hub for their text; with no Hub they still answer, with their error state. Never a redirect to /join.
        const r = await get(a);
        check(`live: ${page.href} link ${a} is not sent to /join`, r.status !== 307, `status ${r.status}`);
      } else {
        const r = await get(a);
        check(`live: ${page.href} link ${a} answers 200`, r.status === 200, `status ${r.status}`);
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
    let own = 0;
    for (const u of urls) {
      const abs = new URL(u.replace(/&amp;/g, "&"), base);
      if (abs.origin !== new URL(base).origin) continue;
      own += 1;
      const key = abs.pathname + abs.search;
      if (seenFiles.has(key)) continue;
      seenFiles.add(key);
      totalFiles += 1;
      const r = await get(key);
      check(`live: ${abs.pathname} answers 200`, r.status === 200, `status ${r.status}`);
      if (abs.pathname === "/_next/image") {
        check(`live: ${abs.search.slice(0, 60)} is an image`, /^image\//.test(r.headers.get("content-type") ?? ""), r.headers.get("content-type") ?? "no content-type");
      }
    }
    check(`live: ${page.href} asked for its own files`, own >= 4, `${own} files`);
  }
  console.log(`live: ${siteConfig.SITE_PAGES.length} pages, ${totalLinks} links and ${totalFiles} different files fetched in ${mode} mode`);

  // the theme tune and Google Play's background-audio video are served in either mode (the old landing page fetched the tune; the Play form links the video)
  {
    const mp3 = await get("/wawu-theme.mp3");
    check(`live: /wawu-theme.mp3 answers 200 in ${mode}`, mp3.status === 200, `status ${mp3.status} ${mp3.headers.get("location") ?? ""}`);
    check("live: /wawu-theme.mp3 is audio", /^audio\//i.test(mp3.headers.get("content-type") ?? ""), mp3.headers.get("content-type") ?? "no content-type");
    await mp3.arrayBuffer();
    const mp4 = await get("/play/background-audio.mp4");
    check(`live: /play/background-audio.mp4 answers 200 in ${mode}`, mp4.status === 200, `status ${mp4.status} ${mp4.headers.get("location") ?? ""}`);
    check("live: /play/background-audio.mp4 is video/mp4", /^video\/mp4\b/i.test(mp4.headers.get("content-type") ?? ""), mp4.headers.get("content-type") ?? "no content-type");
    await mp4.arrayBuffer();
  }

  // the sitemap and robots.txt are open and say what they should
  {
    const r = await get("/sitemap.xml");
    check(`live: /sitemap.xml answers 200 in ${mode}`, r.status === 200, `status ${r.status}`);
    const xml = await r.text();
    for (const page of siteConfig.SITE_PAGES) {
      const want = page.href === "/" ? "/</loc>" : `${page.href}</loc>`;
      check(`live: /sitemap.xml lists ${page.href}`, xml.includes(want));
    }
    const robots = await get("/robots.txt");
    check(`live: /robots.txt answers 200 in ${mode}`, robots.status === 200, `status ${robots.status}`);
    check("live: /robots.txt names the sitemap", (await robots.text()).includes("sitemap.xml"));
  }

  // the two app-link files: 200, no redirect, application/json, the object src/lib/app-links.ts builds, in either mode
  for (const [path, want] of [[appLinks.ASSET_LINKS_PATH, appLinks.assetLinks()], [appLinks.APPLE_APP_SITE_ASSOCIATION_PATH, appLinks.appleAppSiteAssociation()]]) {
    const r = await get(path);
    check(`live: ${path} answers 200 in ${mode} (no redirect)`, r.status === 200, `status ${r.status} ${r.headers.get("location") ?? ""}`);
    check(`live: ${path} is application/json`, /^application\/json\b/i.test(r.headers.get("content-type") ?? ""), r.headers.get("content-type") ?? "no content-type");
    let body; try { body = JSON.parse(await r.text()); } catch { body = undefined; }
    eq(`live: ${path} body parses as JSON and is the app's`, body, want);
  }

  if (mode === "join-only") {
    // still closed: not an app address, so 307 to usewmt.com's home (R-141: the site has no join page to send people to)
    for (const p of ["/login", "/auth/reset-password", "/auth/login", "/reset-password/x", "/administrator", "/api/anything", "/payment/return", "/icons/bills/airtime.png", "/landing-video.mp4", "/about/x", "/who-made-this/x", "/voices/x", "/press/x", "/sitemap.xml/x", "/activate/x", "/forgot-password/x"]) {
      const r = await get(p);
      check(`live: ${p} is still closed (307 to usewmt.com)`, r.status === 307 && r.headers.get("location") === "https://usewmt.com/", `status ${r.status} ${r.headers.get("location") ?? ""}`);
    }
    // app addresses: a permanent redirect to the same place on usewmt.com, path and query kept
    for (const [p, want] of [
      ["/sign-in", "https://usewmt.com/sign-in"], ["/sign-up?type=creator", "https://usewmt.com/sign-up?type=creator"],
      ["/create/new", "https://usewmt.com/create"], ["/create/library", "https://usewmt.com/library"],
      ["/home", "https://usewmt.com/"], ["/explore", "https://usewmt.com/explore"], ["/learn", "https://usewmt.com/schools"],
      ["/wawu/ada", "https://usewmt.com/u/ada"], ["/wawu/ada.png", "https://usewmt.com/u/ada.png"], ["/u/ada?x=1", "https://usewmt.com/u/ada?x=1"],
      ["/content/abc", "https://usewmt.com/content/abc"], ["/receipt/R1", "https://usewmt.com/receipt/R1"], ["/profile/W1", "https://usewmt.com/profile/W1"],
    ]) {
      const r = await get(p);
      check(`live: ${p} is sent to ${want} (308)`, r.status === 308 && r.headers.get("location") === want, `status ${r.status} ${r.headers.get("location") ?? ""}`);
    }
    // R-141: the join page and the Who Made This page are a permanent redirect to usewmt.com, with or without a query (a trailing slash first takes Next's own 308 to the slashless path)
    for (const p of ["/join", "/join?ref=ABC", "/who-made-this"]) {
      const r = await get(p);
      check(`live: ${p} is sent to usewmt.com (308)`, r.status === 308 && r.headers.get("location") === "https://usewmt.com/", `status ${r.status} ${r.headers.get("location") ?? ""}`);
    }
    // the settings the owner named stay as they are
    for (const p of ["/.well-known/assetlinks.json", "/.well-known/apple-app-site-association", "/admin/notifications"]) check(`live: ${p} is not redirected`, (await get(p)).status === 200);
    {
      const r = await get("/.well-known/other");
      check("live: /.well-known/other gets no app redirect (only the closed 307 to usewmt.com's home)", r.status === 307 && r.headers.get("location") === "https://usewmt.com/", `status ${r.status} ${r.headers.get("location") ?? ""}`);
      const m = await get("/_next/static/missing.js");
      check("live: /_next/static/missing.js is never sent to usewmt.com", !(m.headers.get("location") ?? "").includes("usewmt.com"), `status ${m.status} ${m.headers.get("location") ?? ""}`);
    }
    // R-141 (widened): the password pages go to the same path on usewmt.com, the query kept byte for byte
    for (const [p, want] of [
      ["/activate?token=abc&email=ada%40example.test", "https://usewmt.com/activate?token=abc&email=ada%40example.test"], ["/activate", "https://usewmt.com/activate"],
      ["/forgot-password", "https://usewmt.com/forgot-password"],
      ["/reset-password?token=tok%2B123&email=ada%2Bx%40example.test&n=a+b", "https://usewmt.com/reset-password?token=tok%2B123&email=ada%2Bx%40example.test&n=a+b"],
      ["/reset-password", "https://usewmt.com/reset-password"],
    ]) {
      const r = await get(p);
      check(`live: ${p} is sent to ${want} (308)`, r.status === 308 && r.headers.get("location") === want, `status ${r.status} ${r.headers.get("location") ?? ""}`);
    }
    for (const p of ["/join/paid", "/terms", "/admin/notifications", ...BRAND_PAGES]) check(`live: ${p} answers 200`, (await get(p)).status === 200);
  }

  // R-141: the password pages are redirected in every mode, not only in join-only
  for (const [p, want] of [["/reset-password?token=abc123&email=ada%40example.test", "https://usewmt.com/reset-password?token=abc123&email=ada%40example.test"], ["/activate?token=abc&email=a%40b.com", "https://usewmt.com/activate?token=abc&email=a%40b.com"], ["/forgot-password", "https://usewmt.com/forgot-password"]]) {
    const r = await get(p);
    check(`live: ${p} is sent to usewmt.com in ${mode} (308)`, r.status === 308 && r.headers.get("location") === want, `status ${r.status} ${r.headers.get("location") ?? ""}`);
  }
}

console.log(`\ncheck-site-mode: ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
