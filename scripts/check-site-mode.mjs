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
 *   (with NEXT_PUBLIC_API_BASE_URL in the environment of both the build and this command, the receipt page is also
 *   checked for its "Check this receipt" button; with none, for the absence of it)
 *
 *   links     the app links (LINKS-01, FIX-60): /r/<code>, /selfie, /activate, /receipt/<code>,
 *             /u/<handle>, /c/<slug>, /content/<id> and the two /.well-known files are open, nothing wider is, and the two pages WAWU's emails link
 *             to (/reset-password, /forgot-password) are open and draw no link into
 *             the closed sign-in page.
 *
 * The script loads src/lib/site-mode.ts and src/lib/platform-services.ts as
 * they stand (Node strips their types). site-mode.ts imports app-links.ts
 * without an extension, as the app's bundler does, so a resolve hook that adds
 * ".ts" is registered first (the same one the repo's test runner uses).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { register } from "node:module";

register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){return await n(s+'.ts',c)}}",
  import.meta.url,
);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const {
  siteModeFrom, isOpenInJoinOnly, isOpenPageInJoinOnly, pageHref, signUpHref,
} = await import(join(root, "src/lib/site-mode.ts"));
const { PLATFORM_SERVICES } = await import(join(root, "src/lib/platform-services.ts"));

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
  "/_next/static/chunks/app/page-1.js", "/_next/static/css/a.css", "/_next/static/media/f.woff2", "/_next/image",
  "/robots.txt",
  "/wawu-logo-white.png", "/wawu-icon-white.svg", "/wawu-hero-desktop-creators.png", "/wawu-hero-mobile-professionals.png",
  "/who-made-this-ink.png", "/og-image.png", "/favicon.ico", "/icon.png", "/apple-icon.png",
  // the admin dashboard (the admin sign-in protects it): /admin and everything under it
  "/admin", "/admin/", "/admin/notifications", "/admin/notifications/", "/admin/x/y",
  "/wawu-theme.mp3",
  // the pages WAWU's own emails link to, and the app links with the files phones read (LINKS-01)
  "/reset-password", "/reset-password/", "/forgot-password", "/forgot-password/",
  "/r/lennox", "/r/LOGO-ART_2", "/r/lennox/", "/selfie", "/selfie/",
  "/activate", "/activate/", "/receipt/7K3M9QX2B4TV", "/receipt/7K3M-9QX2-B4TV", "/receipt/7K3M9QX2B4TV/",
  "/u/ada", "/u/Ada_Obi.2", "/u/ada.png", "/u/ada/", "/c/aba-tailors", "/c/Aba-Tailors-2", "/c/room/",
  "/content/pdf-1", "/content/3f2b8c1e-9d4a-4e7b-8a61-5c0d2f7e9b14", "/content/pdf-1/",
  "/.well-known/apple-app-site-association", "/.well-known/assetlinks.json",
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
  // files and paths that were closed before
  "/landing-video.mp4", "/landing-video-mobile.mp4", "/wawu-services.mp4", "/business-playbook-the-naija-way.pdf", "/mock/creators/x.png",
  "/join/anything", "/join/paid/x", "/terms/x", "/privacy", "/privacy/policy/x", "/index.html", "/_next/data/x/home.json", "/_next/static", "/_next",
  "/who-made-this-white.png/x", "/who-made-this-white.png.map", "/images/who-made-this-white.png", "//", "/%2e%2e/sign-in", "/home/",
  // the email pages and app links open exactly these paths and nothing wider (LINKS-01)
  "/reset-password/x", "/forgot-password/x", "/reset", "/activate/x", "/activate.html",
  "/r", "/r/", "/r//", "/r/a/b", "/r/a.png", "/r/a%20b", "/rr/x", "/x/r/lennox", "/R/lennox", "/r/" + "a".repeat(81),
  "/selfie/x", "/selfies", "/x/selfie",
  "/receipt", "/receipt/", "/receipt//", "/receipt/a/b", "/receipt/a.png", "/receipt/a_b", "/receipt/-a", "/receipt/a-", "/receipt/a--b", "/receipt/" + "a".repeat(65), "/receipts/x", "/x/receipt/a",
  "/u", "/u/", "/u//", "/u/a/b", "/u/.", "/u/..", "/u/...", "/u/a b", "/u/a-b", "/u/a%20b", "/u/@ada", "/u/" + "a".repeat(31), "/us/x", "/x/u/ada",
  "/c", "/c/", "/c//", "/c/a/b", "/c/a.png", "/c/a_b", "/c/-a", "/c/a-", "/c/a--b", "/c/" + "a".repeat(65), "/cc/x", "/x/c/room", "/communities/x",
  // the fallback page's own path is internal, and a content link has one segment of the right shape
  "/content", "/content/", "/content//", "/content/a/b", "/content/a.png", "/content/a b", "/content/a%20b", "/content/" + "a".repeat(81), "/contents/x", "/x/content/a", "/create/content",
  "/app-link", "/app-link/", "/app-link/content", "/app-link/content/pdf-1",
  "/.well-known", "/.well-known/", "/.well-known/security.txt", "/.well-known/assetlinks.json.map", "/.well-known/assetlinks.json/x",
  "/.well-known/apple-app-site-association/x",
];
for (const p of mustStayClosed) check(`closed: ${p}`, !isOpenInJoinOnly(p));

// only whole pages count as pages
eq("page: / is a page", isOpenPageInJoinOnly("/"), true);
eq("page: a file is not a page", isOpenPageInJoinOnly("/wawu-logo-white.png"), false);

// Every file in public/ is either on this list or closed. A new file cannot
// become reachable without someone editing this list.
const EXPECTED_OPEN_PUBLIC = [
  "/email-header.png", "/landing-poster.jpg", "/og-image.png", "/services-hero.jpg",
  "/wawu-hero-desktop-creators.png", "/wawu-hero-desktop-professionals.png", "/wawu-hero-mobile-creators.png", "/wawu-hero-mobile-professionals.png",
  "/wawu-icon-dark.png", "/wawu-icon-white.png", "/wawu-icon-white.svg", "/wawu-logo-dark.png", "/wawu-logo-dark.svg", "/wawu-logo-white.png", "/wawu-logo-white.svg",
  "/wawu-mascot-gospel.webp", "/wawu-theme.mp3", "/wawubasket-icon.png", "/wawubasket-logo.png", "/wawubeauty-icon.png", "/wawubeauty-logo.png",
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
const CLOSED_LINKS = ["/reset-password", "/forgot-password", "/r/lennox", "/selfie", "/activate", "/receipt/7K3M9QX2B4TV", "/u/ada", "/c/aba-tailors", "/content/pdf-1", "/sign-in", "/home", "/explore", "/learn", "/services", "/services/legal", "/services/pay", "/events", "/shop", "/wallet", "/wawu/ada.png", "/admin", "/api/x"];
const KEPT_LINKS = ["#pricing", "#comparison", "/terms", "/terms#privacy-and-data-protection", "/privacy/policy", "/join", "/join/paid"];
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

  if (mode === "join-only") {
    for (const p of ["/home", "/explore", "/learn", "/sign-in", "/sign-up", "/administrator", "/api/anything", "/wawu/ada.png", "/payment/return", "/icons/bills/airtime.png", "/landing-video.mp4"]) {
      const r = await get(p);
      check(`live: ${p} is still closed (307 to /join)`, r.status === 307 && /\/join$/.test(r.headers.get("location") ?? ""), `status ${r.status} ${r.headers.get("location") ?? ""}`);
    }
    for (const p of ["/join", "/join/paid", "/terms", "/admin/notifications"]) check(`live: ${p} answers 200`, (await get(p)).status === 200);
  }

  // The pages WAWU's emails link to and the app links (LINKS-01): open in both modes, and in join-only mode the
  // email pages draw no link into the closed sign-in page (in full mode they still do, unchanged).
  for (const p of ["/reset-password?token=t&email=a%40b.c", "/forgot-password"]) {
    const r = await get(p);
    check(`live: ${p.split("?")[0]} answers 200 in ${mode}`, r.status === 200, `status ${r.status}`);
    const page = await r.text();
    const signIn = /href="\/sign-in"/.test(page);
    check(`live: ${p.split("?")[0]} ${mode === "full" ? "still links to /sign-in" : "draws no link to /sign-in"}`, mode === "full" ? signIn : !signIn);
  }
  for (const [p, wawuAddress] of [
    ["/r/lennox", "wawu://r/lennox"],
    ["/selfie", "wawu://selfie"],
    ["/activate?token=t&email=a%40b.c", "wawu://activate"],
    ["/receipt/7K3M9QX2B4TV", "wawu://receipt/7K3M9QX2B4TV"],
    ["/u/ada.obi", "wawu://u/ada.obi"],
    ["/c/aba-tailors", "wawu://c/aba-tailors"],
    // /content/<id> shares its path with a page of the full site: the fallback page is what join-only mode serves there
    ...(mode === "join-only" ? [["/content/pdf-1", "wawu://content/pdf-1"], ["/content/3f2b8c1e-9d4a-4e7b-8a61-5c0d2f7e9b14?x=1", "wawu://content/3f2b8c1e-9d4a-4e7b-8a61-5c0d2f7e9b14"]] : []),
  ]) {
    const r = await get(p);
    check(`live: ${p} answers 200 in ${mode}`, r.status === 200, `status ${r.status}`);
    const page = await r.text();
    check(`live: ${p} says "Open in the WAWU app"`, page.includes("Open in the WAWU app"));
    check(`live: ${p} opens ${wawuAddress}`, page.includes(`href="${wawuAddress}"`));
    check(`live: ${p} is not indexed`, /name="robots" content="noindex/.test(page));
  }
  {
    // The receipt page's second button (LINKS-01 round 3): the Hub's public check page on the API origin the site was
    // built with (NEXT_PUBLIC_API_BASE_URL, read here from the same environment). With none set, no such button.
    const page = await (await get("/receipt/7K3M-9QX2-B4TV")).text();
    const rawApi = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();
    let apiOrigin = null;
    try { if (/^https?:$/.test(new URL(rawApi).protocol)) apiOrigin = new URL(rawApi).origin; } catch { /* unset or not an address */ }
    if (apiOrigin) {
      check(`live: /receipt/<code> offers "Check this receipt" to ${apiOrigin}/api/hub/r/<code> (${mode})`, page.includes(`href="${apiOrigin}/api/hub/r/7K3M-9QX2-B4TV"`) && page.includes("Check this receipt"));
      check(`live: /receipt/<code> keeps the app button beside it (${mode})`, page.includes('href="wawu://receipt/7K3M-9QX2-B4TV"'));
    } else {
      check(`live: /receipt/<code> draws no "Check this receipt" with no API origin set (${mode})`, !page.includes("Check this receipt") && !page.includes("/api/hub/r/"));
    }
  }
  for (const p of ["/r/a.b", "/r/a%20b"]) check(`live: ${p} is not an invite (${mode})`, (await get(p)).status !== 200);
  for (const p of ["/receipt/a.b", "/receipt/a%20b", "/u/...", "/u/a-b", "/c/a_b", "/c/a--b", "/activate/x"]) check(`live: ${p} is not an app link (${mode})`, (await get(p)).status !== 200);
  if (mode === "join-only") {
    for (const p of ["/content/a.b", "/content/a%20b", "/content/a/b", "/content", "/app-link/content/pdf-1"]) {
      const r = await get(p);
      check(`live: ${p} is not an app link (join-only, 307 to /join)`, r.status === 307 && /\/join$/.test(r.headers.get("location") ?? ""), `status ${r.status} ${r.headers.get("location") ?? ""}`);
    }
  } else {
    // full mode: the full site's own /content/<id> page answers, not the fallback page
    const r = await get("/content/pdf-1");
    check("live: /content/<id> in full mode is the full site's own page, not the fallback", !(await r.text()).includes("Open in the WAWU app"));
  }
  {
    const aasa = await get("/.well-known/apple-app-site-association");
    check(`live: apple-app-site-association answers 200, not a redirect (${mode})`, aasa.status === 200, `status ${aasa.status}`);
    check("live: apple-app-site-association is JSON", /application\/json/.test(aasa.headers.get("content-type") ?? ""));
    const body = await aasa.json();
    const details = body?.applinks?.details;
    check("live: apple-app-site-association has a details list", Array.isArray(details));
    for (const d of details ?? []) {
      eq("live: apple-app-site-association lists only the app paths", d.components, [
        { "/": "/r/*" }, { "/": "/selfie" }, { "/": "/activate" }, { "/": "/receipt/*" }, { "/": "/u/*" }, { "/": "/c/*" }, { "/": "/content/*" },
      ]);
      check("live: apple-app-site-association names the app", Array.isArray(d.appIDs) && d.appIDs.every((id) => /^[A-Z0-9]{10}\.africa\.wawu\.wmt$/.test(id)));
    }
    const links = await get("/.well-known/assetlinks.json");
    check(`live: assetlinks.json answers 200, not a redirect (${mode})`, links.status === 200, `status ${links.status}`);
    check("live: assetlinks.json is JSON", /application\/json/.test(links.headers.get("content-type") ?? ""));
    const list = await links.json();
    check("live: assetlinks.json is a list", Array.isArray(list));
    for (const entry of list ?? []) check("live: assetlinks.json names the app", entry?.target?.package_name === "africa.wawu.wmt" && entry.target.sha256_cert_fingerprints.length > 0);
  }
}

console.log(`\ncheck-site-mode: ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
