# WAWUAfrica Design System

A dark-first design system for **WAWUAfrica**, a Nigerian creator platform. Structural model: **passes.com** (locked content cards, price chips, stat blocks, dark chrome). Brand: **WAWU Purple #9411C9** and **Alan Sans**, from the supplied brand guidelines.

## Sources

| Source | Path | What came from it |
|---|---|---|
| Product repo | `uploads/WAWUAfrica-New-main/` | Component inventory, product truths, Trust Score model, categories, Naira, satellite apps |
| Brand guidelines | `uploads/NEW WAWU LOGO.pdf` | Colour palette (p.6), brand font Alan Sans (p.9–10) |
| Logo pack | `uploads/LOGO ESPORTS/` | Main mark and icon, in SVG / PNG / JPG |
| UI reference | passes.com | Dark surface model, locked-content card pattern, price chips, stat blocks |
| Earlier palette sheet | `uploads/Colors.svg` | Superseded by the brand guidelines PDF |

**Logo.** The mark is the smiling **W** — a rounded, organic face-like glyph, always paired with the lowercase `wawu` wordmark in the main mark. Files in `assets/`:

| File | Use |
|---|---|
| `wawu-logo.png` | Main mark — purple glyph + black wordmark. Light backgrounds. |
| `wawu-logo-ink.png` | Single-colour deep purple. Light backgrounds, print, one-colour contexts. |
| `wawu-logo-white.png` | All white. Dark and purple backgrounds — **the default in this dark-first system.** |
| `wawu-icon-purple.png` | Icon only, purple gradient. Light backgrounds. |
| `wawu-icon-ink.png` | Icon only, deep purple. |
| `wawu-icon-white.png` | Icon only, white. App chrome, nav, dark surfaces. |

Source vectors are in `uploads/LOGO ESPORTS/` (SVG, PNG, JPG for both the main mark and the icon). Never recolour the mark outside these variants, never redraw it, never place the purple-gradient version on a purple background, and never set the wordmark in a substitute typeface. Clear space: at least the height of the glyph's eyes on all sides. The icon is the app icon, avatar fallback and favicon; the main mark is for headers, splash and marketing.

Legacy repo marks (`logo-wawuafrica*.png`, `icon-app.png`) are superseded — kept only for reference against the old build.

## The product

WAWUAfrica is a **hub**, not a feed clone. Members post into six categories, buy and sell, learn, and carry a portable reputation.

- **Six post categories** — Learn, Sell, Opportunity, Event, Question, Research. **Three of them (Opportunity, Event, Research) require admin approval** before publishing, so *pending / approved / rejected* is a first-class state, not an edge case. Two more (**Learn, Question**) are *temporarily closed to posting* for abuse mitigation — they render disabled with the reason "Temporarily disabled due to misuse. It will return soon.", never hidden. Both flags live on the exported `CATEGORIES` constant; read them rather than hardcoding.
- **"Buy" is a filter, not a category** — it surfaces any post with a product attached.
- **Trust Score** — points, not vibes. Basic 0 · Verified 100 · Gold 500 · Elite 1500 · Trusted Partner 5000. Earns: course completion +50, purchase +20, sale +20, helpful contribution +10, positive rating +15, verified info +30. Loses: spam −100, fraud −200, false info −100, offensive language −50, policy violation −150. **The breakdown is only ever shown on the viewer's own profile.**
- **WAWU ID verification** is separate from plan tier — Basic, Verified User, Verified Business, Certified Professional, Trusted Partner, Official.
- **No private messaging.** Comments are the only response channel. Never design a DM.
- **Satellite apps** — WAWUBasket (goods), WAWUBeauty (services), partner learning (Alison). Anything leaving the hub carries a handoff pill.
- **Currency is the Naira (₦), always.** Never dollars.

## Content fundamentals

**Voice:** direct, second person, lowercase energy but sentence case in the UI. Short verbs on buttons — "Unlock", "Withdraw", "Book", "Continue". Never "Click here", never exclamation marks.

**Casing:** sentence case for everything except the small uppercase labels (`--text-label`, +0.06em) used on stat captions and section eyebrows. Buttons are sentence case, not Title Case.

**Money:** always `₦2,500` — the glyph, a thin space never, comma thousands, no decimals unless kobo matters. In a button: "Unlock for ₦2,500". In a chip: "PPV ₦2,500".

**Emoji:** none. Not in UI, not in empty states, not in labels. The icon set carries all that weight.

**Copy examples**
- Empty: "Nothing saved yet" / "Tap save on any drop and it lands here."
- Locked: "12 exclusive photos" → "Unlock for ₦2,500"
- Pending: "Pending review" / "Opportunities are checked by an admin before they go live."
- Error: "Something went wrong" / "Check your connection and try again."
- Coming soon: "Coming soon" on a real, named service — never as decoration.

## Visual foundations

**Colour.** One accent: WAWU Purple `#9411C9`. It marks the single primary action per screen, the active nav item, focus rings and links. Everything else is a neutral dark ramp: page `#0B0A0D` → card `#131316` → elevated `#1A1920` → tag `#201F27`. Secondary brand hues (yellow `#FFB703`, lime `#B8E83E`, aqua `#20C9C3`, coral `#FF5C5C`) carry **status and category meaning only** — never chrome, never buttons. Gold is the one exception: the Pro tier badge. Light mode redefines the same token names under `[data-theme="light"]`.

**Type.** Alan Sans throughout, 300–900. Display 44/700/−0.03em · H1 32/600 · H2 24/600 · H3 20/500 · card title 18/500 · body 16/400 · secondary 14 · caption 12 · label 11/600 uppercase +0.06em. Numerals are tabular everywhere money or stats appear.

**Spacing.** 8pt grid with a 4px half-step: 4 · 8 · 16 · 24 · 32 · 48. Card padding 14–18. Feed gap 12–14. Mobile column caps at 430px.

**Radii.** Pill for every button and chip · 14 inputs · 16 media · 20 cards · 28 sheet tops. Nothing is square.

**Elevation.** On dark, elevation is a **lighter surface plus a hairline**, not a shadow. Shadows appear only on things that truly float: modals (`0 12px 32px rgba(0,0,0,.55)`), sheets, and the purple FAB (accent glow). Cards have no shadow at all.

**Backgrounds & imagery.** Creator photography is the visual payload — cards are built around a real image with a bottom protection gradient (`rgba(11,10,13,.88)` → transparent at 68%) so chips stay legible. Locked media is blurred 18px and scaled 1.12 so the composition still reads but nothing is usable. The only gradient in the chrome is the wallet balance card and the trust progress fill (deep purple → WAWU purple). No patterns, no textures, no illustration.

**Transparency & blur.** Sticky bars and the bottom nav are `rgba(19,19,22,.86)` with a 20px backdrop blur so content scrolls visibly beneath. Chips over photography use a 10px blur with a hairline. Scrims are 72% black with a 3px blur.

**Motion.** One easing curve: `cubic-bezier(.32,.72,0,1)`. Fast 120ms (press), base 220ms (hover, colour), slow 360ms (sheets, image scale). Sheets slide up; modals fade-and-rise 8px. Skeletons shimmer at 1.4s. Nothing bounces. `prefers-reduced-motion` zeroes all of it.

**Hover & press.** Hover lightens — purple goes to `#A813E3`, neutral surfaces step up one level. Press scales to 0.98. No lift, no shadow growth, no colour inversion. Focus is a 2px purple outline at 2px offset.

**Borders.** Hairlines are `rgba(255,255,255,.08)`; interactive or emphasised edges `rgba(255,255,255,.16)`. Every card, input and elevated surface carries one — on dark, the hairline is what separates planes.

## Iconography

**Lucide**, loaded from CDN (`lucide@0.446.0`) and wrapped by the `Icon` component — this is the set the product already uses (`lucide-react`). Reference icons by PascalCase name: `<Icon name="ShieldCheck" />`. Two brand glyphs Lucide doesn't carry (`whatsapp`, `instagram`) are inlined in `Icon.jsx`, copied from the product source.

Sizing: 12–13 inline with meta, 15–17 in action rows, 18–20 default, 22–24 nav. Stroke weight carries state — 1.5 resting, 1.8–2 secondary, 2.2–2.6 active; `fill` set to the current colour marks a selected save or vote. Icons are monochrome; colour only inside a status pill, a tier badge or a purple accent tile. **No emoji, no unicode glyphs as icons, no hand-drawn SVG.**

## Index

**Foundations** — `styles.css` (entry, imports only) → `tokens/`: `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `base.css`. Specimen cards live in `guidelines/`.

**Components** (`components/<group>/`)

| Group | Components |
|---|---|
| `core/` | **Icon**, **Button**, **Avatar**, **Input**, **NairaInput** (+ `formatNaira`) |
| `content/` | **ContentCard**, **PriceChip**, **AccessBadge**, **ComingSoonPill**, **SectionHeader** |
| `identity/` | **ProfileHeader**, **VerificationBadge**, **TierBadge**, **StatBlock** |
| `trust/` | **TrustMeter**, **TrustScoreChip** |
| `feed/` | **CategoryBar**, **CategoryTag**, **StatusPill**, **HandoffPill**, **EngagementBar** |
| `navigation/` | *(removed — see note below)* |
| `overlay/` | **Sheet** (bottom sheet + modal) |
| `lists/` | **ListRow** |
| `feedback/` | **EmptyState**, **ErrorState**, **Skeleton** |

Each directory carries a `.card.html` thumbnail; each component has a `.d.ts` contract and a `.prompt.md` usage note.

**Navigation and screen kit: intentionally absent.** The bottom nav and the app UI kit were removed — the navigation model is still being decided, and shipping a wrong one would have consumers building against it. Nothing in this system assumes a nav shell; compose screens directly from the component groups above.

**Assets** — `assets/` — the WAWU logo pack (main mark and icon, three colourways each), legacy WAWUAfrica marks, WAWUBasket / WAWUBeauty logos, partner logos (SAF, University of Abuja), Africa flag, email header.

## Intentional additions

- **Icon** — a wrapper over Lucide so icon names, sizes and stroke states are consistent; the repo has the same wrapper.
- **StatBlock**, **PriceChip**, **AccessBadge**, **ComingSoonPill**, **ContentCard** — these come from the passes.com structural brief, not the current repo, since the redesign introduces paid locked content that the existing codebase doesn't have yet.
