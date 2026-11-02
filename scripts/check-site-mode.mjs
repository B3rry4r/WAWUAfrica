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
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const {
  siteModeFrom, isOpenInJoinOnly, isOpenPageInJoinOnly, pageHref, signUpHref,
} = await import(join(root, "src/lib/site-mode.ts"));
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
  "/", "/join", "/join/", "/join/paid", "/terms", "/privacy/policy",
  // the nine legal documents (owner, 26 Oct 2026): the stores need a public privacy policy address
  "/legal", "/legal/", "/legal/privacy", "/legal/privacy/", "/legal/terms", "/legal/creator-monetization", "/legal/community-guidelines",
  "/_next/static/chunks/app/page-1.js", "/_next/static/css/a.css", "/_next/static/media/f.woff2", "/_next/image",
  "/robots.txt",
  // the page the password-reset mail links to (RESET-WEB, R-123): exactly this path, the query is not part of it
  "/reset-password", "/reset-password/",
  "/wawu-logo-white.png", "/wawu-icon-white.svg", "/wawu-hero-desktop-creators.png", "/wawu-hero-mobile-professionals.png",
  "/who-made-this-ink.png", "/og-image.png", "/favicon.ico", "/icon.png", "/apple-icon.png",
  // the admin dashboard (the admin sign-in protects it): /admin and everything under it
  "/admin", "/admin/", "/admin/notifications", "/admin/notifications/", "/admin/x/y",
  "/wawu-theme.mp3",
  // the brand site (BRAND-SITE, owner 2 Nov 2026): the eight pages, with and without a trailing slash, and the sitemap
  "/who-made-this", "/who-made-this/", "/voices", "/voices/", "/about", "/about/", "/partners", "/partners/", "/press", "/press/", "/careers", "/careers/", "/contact", "/contact/",
  "/sitemap.xml",
  "/wawu-brand-wordmark-white.svg", "/wawu-brand-icon-colour.png", "/wawu-partner-canva.png", "/wawu-wmt-screen-home.webp", "/wawu-og-brand.png",
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
  // the reset page is the one door; the rest of the sign-in side stays shut (RESET-WEB, R-123)
  "/forgot-password", "/forgot-password/", "/login", "/sign-in/", "/sign-up/", "/auth", "/auth/login", "/auth/sign-in", "/auth/forgot-password", "/auth/reset-password", "/auth/signup",
  "/reset-password/x", "/reset-password/abc/def", "/reset-passwords", "/reset-password.html", "/reset", "/Reset-Password", "/x/reset-password", "/sign-in/reset-password",
  "/api/reset-password", "/api/auth/reset-password", "/activate", "/verify-email",
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
for (const p of ["/who-made-this", "/voices", "/about", "/partners", "/press", "/careers", "/contact", "/contact/"]) eq(`page: ${p} is a page`, isOpenPageInJoinOnly(p), true);
for (const p of ["/who-made-this/x", "/about/x", "/sitemap.xml", "/wawu-og-brand.png", "/settings/about"]) eq(`page: ${p} is not a page`, isOpenPageInJoinOnly(p), false);
eq("page: /reset-password is a page", isOpenPageInJoinOnly("/reset-password"), true);
eq("page: /reset-password/ is a page", isOpenPageInJoinOnly("/reset-password/"), true);
eq("page: /reset-password/x is not a page", isOpenPageInJoinOnly("/reset-password/x"), false);
eq("page: /forgot-password is not a page", isOpenPageInJoinOnly("/forgot-password"), false);

// Every file in public/ is either on this list or closed. A new file cannot
// become reachable without someone editing this list.
const EXPECTED_OPEN_PUBLIC = [
  "/email-header.png", "/landing-poster.jpg", "/og-image.png", "/services-hero.jpg",
  "/wawu-hero-desktop-creators.png", "/wawu-hero-desktop-professionals.png", "/wawu-hero-mobile-creators.png", "/wawu-hero-mobile-professionals.png",
  "/wawu-icon-dark.png", "/wawu-icon-white.png", "/wawu-icon-white.svg", "/wawu-logo-dark.png", "/wawu-logo-dark.svg", "/wawu-logo-white.png", "/wawu-logo-white.svg",
  "/play/background-audio.mp4", "/wawu-mascot-gospel.webp", "/wawu-theme.mp3", "/wawubasket-icon.png", "/wawubasket-logo.png", "/wawubeauty-icon.png", "/wawubeauty-logo.png",
  "/who-made-this-conference.webp", "/who-made-this-ink.png", "/who-made-this-og.png", "/who-made-this-white.png",
  // the brand site (BRAND-SITE, owner 2 Nov 2026): logo pack (SVG and PNG), partner logos, app screens, link-preview pictures
  ...["wordmark-colour", "wordmark-purple", "wordmark-white", "icon-colour", "icon-purple", "icon-white"].flatMap((n) => [`/wawu-brand-${n}.svg`, `/wawu-brand-${n}.png`]),
  ...["isn-hubs", "plli", "edc-pan-atlantic", "dbn", "learning-curve", "soueast", "canva", "flixora", "africa-trade-gateway", "fmyd", "pencom", "nuvion", "dreamax-white", "alison"].map((n) => `/wawu-partner-${n}.png`),
  ...["home", "feed", "creator", "unlock"].map((n) => `/wawu-wmt-screen-${n}.webp`),
  "/wawu-og-brand.png", "/wawu-og-who-made-this.png", "/wawu-og-voices.png",
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
const CLOSED_LINKS = ["/forgot-password", "/sign-in", "/home", "/explore", "/learn", "/services", "/services/legal", "/services/pay", "/events", "/shop", "/wallet", "/wawu/ada.png", "/admin", "/api/x"];
const KEPT_LINKS = ["/reset-password", "/reset-password?token=abc&email=ada%40example.test", "#pricing", "#comparison", "/terms", "/terms#privacy-and-data-protection", "/privacy/policy", "/join", "/join/paid", "/legal", "/legal/privacy"];
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

// ---------------------------------------------------------------- brand site (BRAND-SITE, owner 2 Nov 2026)
// wawuafrica.com's public pages: eight pages, plain, open in join-only mode. This proves they are the eight, that nothing a
// visitor can click leads into a closed part of the site, that every picture and download exists and is served, and the
// owner's copy rules (no em-dash, no placeholder, no dead button, no inline style).
const BRAND_PAGES = ["/", "/who-made-this", "/voices", "/about", "/partners", "/press", "/careers", "/contact"];
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
const configLinks = [...siteConfig.HEADER_NAV, ...siteConfig.FOOTER_APPS, ...siteConfig.FOOTER_COMPANY, ...siteConfig.FOOTER_LEGAL, ...siteConfig.SITE_PAGES, { label: "Register", href: siteConfig.REGISTER_HREF }];
for (const l of configLinks) check(`brand: link ${l.label} -> ${l.href} lands on an open page`, isOpenPageInJoinOnly(l.href));
eq("brand: Register is the registration link", siteConfig.REGISTER_HREF, "/join");
eq("brand: the legal links are the existing legal pages", siteConfig.FOOTER_LEGAL.map((l) => l.href), ["/legal/privacy", "/terms", "/legal"]);
eq("brand: the header's links", siteConfig.HEADER_NAV.map((l) => l.href), ["/who-made-this", "/voices", "/about", "/partners", "/contact"]);
eq("brand: the support email", siteConfig.CONTACT_EMAIL, "support@wawuafrica.com");
eq("brand: the WhatsApp link", siteConfig.WHATSAPP_URL, "https://wa.me/2347050722222");
eq("brand: the company", siteConfig.COMPANY, "WAWU Technology Ltd");
eq("brand: the conference cities", siteConfig.CONFERENCE_CITIES, ["Lagos", "Abuja", "Port Harcourt"]);

// the store links live in one file; neither app is in a store yet, so nothing links out and every page says "coming soon"
eq("brand: the two apps the store config knows", Object.keys(storeConfig.STORE_LINKS).sort(), ["voices", "who-made-this"]);
for (const app of Object.keys(storeConfig.STORE_LINKS)) {
  eq(`brand: ${app} has no store link yet`, storeConfig.liveStores(app), []);
  for (const url of Object.values(storeConfig.STORE_LINKS[app])) check(`brand: a ${app} store link is null or an https address`, url === null || /^https:\/\//.test(url));
}

// the partner wall: the owner's fourteen, in the owner's order, each file in public/ and served
eq("brand: the partners, in the owner's order", PARTNERS.map((p) => p.slug), ["isn-hubs", "plli", "edc-pan-atlantic", "dbn", "learning-curve", "soueast", "canva", "flixora", "africa-trade-gateway", "fmyd", "pencom", "nuvion", "dreamax", "alison"]);
for (const p of PARTNERS) {
  check(`brand: partner logo ${p.src} exists in public/`, publicFiles.includes(p.src));
  check(`brand: partner logo ${p.src} is open in join-only`, isOpenInJoinOnly(p.src));
  check(`brand: partner ${p.slug} has a name and a drawn size`, p.name.length > 2 && p.width > 0 && p.height > 0 && p.width <= 240 && p.height <= 110);
}
check("brand: the white Dreamax mark exists", publicFiles.includes("/wawu-partner-dreamax-white.png"));
check("brand: Dreamax is shown as supplied, white on a black tile (not inverted)", PARTNERS.find((p) => p.slug === "dreamax")?.tile === "black" && PARTNERS.find((p) => p.slug === "dreamax")?.src === "/wawu-partner-dreamax-white.png");
check("brand: the logo wall draws logos in their own colours (no grey filter)", !/grayscale|site-logo-img/.test(readFileSync(join(root, "src/app/(site)/_components/LogoWall.tsx"), "utf8") + readFileSync(join(root, "src/app/(site)/site.css"), "utf8")));
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
for (const id of ["home", "feed", "creator", "unlock"]) check(`brand: app screen ${id} exists`, publicFiles.includes(`/wawu-wmt-screen-${id}.webp`));
// SLIDER 3 shows a Shop tab on the profile and R-9 says there is no Shop tab: it is not on the site (lead ruling, 2 Nov 2026)
check("brand: the SLIDER 3 profile screen is not in public/", !publicFiles.includes("/wawu-wmt-screen-profile.webp"));
check("brand: no source names the SLIDER 3 profile screen", !siteSources.some((f) => /screen-profile|["'`]profile["'`]\s*\|/.test(readFileSync(f, "utf8")) || /slider[ _-]?3/i.test(readFileSync(f, "utf8"))));
// the VOICES page says only what the boss's example says: nothing about anonymity, masked voices, emoji or typed replies, or recording live
{
  const voices = readFileSync(join(root, "src/app/(site)/voices/page.tsx"), "utf8");
  check("brand: the VOICES page makes no claim the example does not", !/anonym|masked|emoji|typed repl|recorded live|your voice, live/i.test(voices));
  check("brand: the VOICES page says others reply with reactions and comments", voices.includes("Others can reply with reactions and comments."));
}
check("brand: the app screen the owner struck out (SLIDER 2: a physical card, To cash) is not used", !siteSources.some((f) => /slider[ _-]?2/i.test(readFileSync(f, "utf8"))));
const ogFiles = [...readFileSync(join(root, "src/app/(site)/_lib/page-metadata.ts"), "utf8").matchAll(/"(\/wawu-og-[a-z-]+\.png)"/g)].map((m) => m[1]);
eq("brand: the three link-preview pictures", ogFiles.sort(), ["/wawu-og-brand.png", "/wawu-og-voices.png", "/wawu-og-who-made-this.png"]);

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
  { kind: "prefix", path: "/r/" }, { kind: "exact", path: "/selfie" }, { kind: "exact", path: "/activate" }, { kind: "exact", path: "/reset-password" },
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
eq("aasa: the paths, in the app's order", iosPatterns, ["/r/*", "/selfie", "/activate", "/reset-password", "/receipt/*", "/u/*", "/c/*", "/content/*"]);
eq("aasa: nothing but a path in each component", aasa.applinks.details[0].components.map((c) => Object.keys(c)), iosPatterns.map(() => ["/"]));

// Android and iOS claim the same set: ask both matchers about the same paths. Android: path is an exact match,
// pathPrefix a prefix. iOS: "*" matches any run of characters, everything else matches itself.
const androidClaims = (p) => APP_PATHS.some((e) => (e.kind === "exact" ? p === e.path : p.startsWith(e.path)));
const iosClaims = (p) => iosPatterns.some((pat) => new RegExp("^" + pat.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$").test(p));
for (const p of [
  "/r/", "/r/abc", "/r/abc/def", "/r", "/rx", "/R/abc", "/selfie", "/selfie/", "/selfie/x", "/selfies", "/activate", "/activate/x", "/activated",
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
  eq("app.json: the Android paths are exactly src/lib/app-links.ts (and so the iOS file)", fromApp.map(key).sort(), appLinks.APP_LINK_PATHS.map(key).sort());
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
    for (const p of ["/forgot-password", "/login", "/auth/reset-password", "/auth/login", "/reset-password/x", "/home", "/explore", "/learn", "/sign-in", "/sign-up", "/administrator", "/api/anything", "/wawu/ada.png", "/payment/return", "/icons/bills/airtime.png", "/landing-video.mp4", "/settings/about", "/about/x", "/who-made-this/x", "/voices/x", "/press/x", "/sitemap.xml/x"]) {
      const r = await get(p);
      check(`live: ${p} is still closed (307 to /join)`, r.status === 307 && /\/join$/.test(r.headers.get("location") ?? ""), `status ${r.status} ${r.headers.get("location") ?? ""}`);
    }
    for (const p of ["/join", "/join/paid", "/terms", "/admin/notifications", ...BRAND_PAGES]) check(`live: ${p} answers 200`, (await get(p)).status === 200);
  }

  // the password-reset page (RESET-WEB, R-123): open in join-only with its query kept, and the page itself sends nobody into the closed site
  {
    const path = "/reset-password?token=abc123&email=ada%40example.test";
    const r = await get(path);
    check(`live: ${path} answers 200 in ${mode} (no redirect)`, r.status === 200, `status ${r.status} ${r.headers.get("location") ?? ""}`);
    const page = await r.text();
    check(`live: the reset page has its title and form in ${mode}`, page.includes("Set a new password") && page.includes("Save new password"));
    const hrefs = [...page.matchAll(/<a\s[^>]*?href="([^"]*)"/g)].map((m) => m[1]);
    if (mode === "join-only") {
      check("live: the reset page in join-only mode links to no closed page", hrefs.every((h) => h.startsWith("#") || /^\/(?:join|terms|privacy\/policy|legal)\b/.test(h) || /^https?:/.test(h)), hrefs.join(" "));
      check("live: the reset page in join-only mode says to sign in in the app", page.includes("Who Made This?"));
    } else {
      check("live: the reset page in full mode still links back to sign in", hrefs.includes("/sign-in"), hrefs.join(" "));
    }
    const bare = await get("/reset-password");
    check(`live: /reset-password with no query answers 200 in ${mode}`, bare.status === 200, `status ${bare.status}`);
  }
}

console.log(`\ncheck-site-mode: ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
