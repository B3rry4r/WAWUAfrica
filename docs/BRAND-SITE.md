# The WAWU brand site (BRAND-SITE, owner 2 Nov 2026)

wawuafrica.com is the WAWU brand website: a landing site for the company and its two apps. The web app comes later. `/join` (the registration link) is untouched.

## Pages

| Path | File | What it is |
|---|---|---|
| `/` | `src/app/(site)/page.tsx` | Home: hero with the rotating word, marquee, known for, the two apps, conference, how we build, partner strip, build with WAWU |
| `/who-made-this` | `src/app/(site)/who-made-this/page.tsx` | App page: what it is, four app screens, how it works, conference, questions |
| `/voices` | `src/app/(site)/voices/page.tsx` | App page in VOICES green (the only green on the site) |
| `/about` | `src/app/(site)/about/page.tsx` | What we do, how we build, the apps, the company (WAWU Technology Ltd, no address) |
| `/partners` | `src/app/(site)/partners/page.tsx` | Who we work with, the Dreamax x WAWU feature, the 14-logo wall, contact |
| `/press` | `src/app/(site)/press/page.tsx` | About, media contact, the WAWU logo pack as downloads (SVG and PNG) |
| `/careers` | `src/app/(site)/careers/page.tsx` | No open roles; how to write in |
| `/contact` | `src/app/(site)/contact/page.tsx` | support@wawuafrica.com and WhatsApp +234 705 072 2222 |

Privacy and Terms in the footer link to the existing pages: `/legal/privacy`, `/terms`, and `/legal` for all nine documents. `/sitemap.xml` (`src/app/sitemap.ts`) lists the eight pages and `/robots.txt` (`src/app/robots.ts`) points at it.

Shared pieces are in `src/app/(site)/_components/`; the look is `src/app/(site)/site.css` (tokens scoped to `.wawu-site`, mapped in `tailwind.config.ts` under `site`). The font is Alan Sans through `next/font/local`. Contact details, nav, footer links, store links, the partner list and the press files are data in `src/lib/site/` (no imports, so `scripts/check-site-mode.mjs` loads them).

## Turning the app stores on

`src/lib/site/stores.ts`. Both apps have `appStore: null` and `googlePlay: null`, so every page says "Coming soon on the App Store and Google Play". Replace a `null` with the store address (one line). That store's button is then drawn in place of the "coming soon" line on the app's page; the tiles on the home and About pages name the live store as text. Nothing else changes.

## Partner logos (`/partners`, and the strip on `/`)

Files are at the root of `public/` (`wawu-partner-<slug>.png`), trimmed of white space and sized in `src/lib/site/partners.ts` so each logo has about the same visual weight. Every logo is shown in its own colours, as supplied, on one tile each (white tiles; a black tile for Dreamax). On a phone the wall is two tiles to a row, with the very long Soueast logo taking a whole row.

Order: ISN Hubs, Pistis Life and Leadership Institute (PLLI), Enterprise Development Centre (Pan-Atlantic University), Development Bank of Nigeria, Learning Curve, Soueast, Canva, Africa Trade Gateway, Federal Ministry of Youth Development, PenCom, Nuvion, Dreamax, Alison. (Flixora was removed on the owner's word, 3 Nov 2026.)

- The Enterprise Development Centre and Pan-Atlantic University logo is one file.
- ISN Hubs came as a 116 x 69 picture (86 x 39 after trimming) and is drawn at that exact pixel size, the largest it stays sharp. A larger file from ISN Hubs would let it grow to match the others.
- Dreamax came white on black and is shown as supplied: `wawu-partner-dreamax-white.png` (the white mark on a clear background) on a black tile. The same file is used in the featured partnership.

## Pictures and downloads

- App screens: `wawu-wmt-screen-{home,feed,creator,unlock}.webp`, the owner's store pictures SLIDER 1, 4, 5 and 6 cropped to the phone. SLIDER 2 (a physical card and "To cash") is not used. SLIDER 3 is not used either: it shows a Shop tab on the profile, and R-9 says profiles have no Shop tab.
- Logo pack: `wawu-brand-{wordmark,icon}-{colour,purple,white}.{svg,png}`. Wordmark 1 is deep purple, 2 white, 3 full colour. BASKET and BEAUTY are not shown.
- Link previews: `wawu-og-{brand,who-made-this,voices}.png` (1200 x 630).
- All of these are root files in `public/`, because join-only mode serves root files with a picture extension and nothing deeper. `scripts/check-site-mode.mjs` lists them.

## Site mode

`src/lib/site-mode.ts`: the seven new pages are added to `OPEN_PAGES` (with `/`, eight in all), and `/sitemap.xml` is open next to `/robots.txt`. Nothing under a page is open (`/about/x` is closed) and every other closed path still answers 307 to `/join`. `/join`, `/join/paid`, `/legal/*`, `/terms`, `/reset-password`, `/play/*`, `/wawu-theme.mp3` and `/.well-known/*` are unchanged.

`scripts/check-site-mode.mjs`: assertions were added only (brand section, open and closed paths, the public file list, the live crawl). The one change to an existing check is that the live crawl of `/` compared the old landing page's links link for link; that page is gone, so the crawl now covers all eight brand pages (status, title, description, one h1, link-preview picture, every link, every file) in both modes, and `src/app/page.tsx` is no longer in the landing source list because the file is deleted.

## What moved or became unused

- The signed-in app's About page moved from `/about` to `/settings/about` (the route is now the brand page); its two links in Settings were updated.
- `src/app/page.tsx` (the old landing page) is deleted. Only that page used `LandingContent`, `EarningsCalculator`, `SmartScheduler`, `FaqAccordion` and `HeroRotatingWord` (all in `src/app/(marketing)/components/`); they stay in place, unused, because `check-site-mode.mjs` still checks them. `CreatorCarousel` had no user before this. `LandingAuthCta`, `SoundToggle` and `platform-services` are used elsewhere and unchanged.

## Changed from the boss's example, and why

- The stand-in leaf logo is the smiling W wordmark from the owner's logo pack (header, footer, press, link previews).
- Fonts: Alan Sans (the brand font) from `next/font`, not Bricolage Grotesque and Instrument Sans from Google Fonts.
- "Live 24 Oct / 26 Oct" chips are gone (not live): "Coming soon on the App Store and Google Play" and Register.
- "Sign up free" became "Signing up costs nothing" (the copy check bans the word "free").
- A verified tick "unlocks uploading" was wrong (R-7: free accounts upload too, the tick lifts limits): "lifts your upload limits".
- The VOICES page says only what the boss's example says (Talk, Listen, Vote; speak, no typing; others reply with reactions and comments); the launch date is now "coming soon". "Get hired" became "offer your services".
- Every `tbd` highlight is gone: no address (the company name only), no partnership form, no press kit placeholder.
- New: partner logo wall, the Dreamax x WAWU feature (the slides' text, not the slide pictures), app screens, FAQ on both app pages, per-page title, description and link-preview picture, sitemap.
