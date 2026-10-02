# WAWUAfrica Web — agent rules

Next.js 14 (App Router), TypeScript, Tailwind. Consumer app for a Nigerian creator
content marketplace. Ground-up rebuild — it replaces the old post-feed app entirely.
The backend is also being rewritten against the existing database, so treat API
contracts in `docs/02_TECHNICAL_CONTEXT.md` as the target shape, not as live endpoints.

## The mobile app is the product, and this web app follows it
- **The mobile app is the product and the authority.** Its repo is
  `MOXN-AFRICA/wawu-wmt-mobile`. The backend changes to fit it. This web app
  follows it after launch (DECISIONS.md, Authority (owner, 1 Oct 2026), in the
  mobile repo). The app is built with Expo (R-3, owner, 1 Oct 2026).
- **Rulings live in the mobile repo's `DECISIONS.md`.** Every ruling id in
  this file (R-1 and so on) is from there. If a note here disagrees with a
  ruling, the ruling wins and the note gets corrected.
- **How work is built and verified:** the mobile repo's `docs/WORKFLOW.md`. It
  covers every repo a task touches, this one included. Task files for web work
  live in the mobile repo's `tasks/`. Start those sessions with both repos
  attached.
- **Until launch, the web keeps working as built.** It stays on Flutterwave
  (see the wallet note). Where a ruling changes how something works, the mobile
  app builds it first and the web follows after launch. Web features the mobile
  design doesn't draw are neither kept nor cut until the owner rules each one
  (D14, task OPS-07).
- "Mobile" in "Current phase" below means this web app's mobile-width layout,
  not the mobile app.

## Read before writing code
- The mobile repo's `DECISIONS.md` and `docs/WORKFLOW.md`. They outrank
  everything below.
- `docs/00_PLATFORM_MAP.md` — what the app is, what was cut
- `docs/01_SPEC.md` — the monetization model as it stands today.
- `docs/02_TECHNICAL_CONTEXT.md` — data model and API contracts
- `docs/03_USER_FLOWS.md` — flows per persona
- `docs/05_CONVENTIONS.md` — how we write code here
- `design/screens/*.dc.html` — the approved mobile designs. Open them.
- `design/screens/desktop/*.dc.html` — the approved desktop designs (shell, all
  17 desktop screens, and the flow canvas). Open them.

## Current phase
**The mobile app comes first.** New product work is built there, and this web
app follows it after launch (see the section above). Where the web stands:

**Mobile is built and design-conformant** (audited against every mobile screen;
product-rule violations, dead ends, and convention drift fixed — see git log).
**Desktop is built, not pending.** This line used to say desktop "has not
started yet"; an independent QA pass found 107 files carrying `xl:` breakpoints,
a Sidebar, a DesktopHeader and a ThreePaneLayout, with two desktop artboards
matching their designs picture-to-picture. A next developer reading the old
sentence would have rebuilt what is already there. What remains is conformance:
most desktop artboards in `design/screens/desktop/*.dc.html` have never been
compared to the built screen. Same account-type and gate rules as mobile.

## Product notes

These are how the product currently works, so code matches itself — not rules to
quote back at the product owner. If they ask for something that contradicts a
line here, build it and update the line. Licensing, custody and regulatory
questions belong to the owner (R-1, owner, 1 and 2 Oct 2026): no task waits on
them, and no task reopens them. This paragraph used to name the wallet note as
the one line to check before building, because custody decided whether a CBN
licence was needed; R-1 settled that. A note that cites a ruling id says what
the ruling decided. Some of those describe the mobile app first, and the web
keeps its current behaviour until it follows after launch.
- Naira (₦) only at launch. Dollar and crypto accounts come after launch
  (R-16, owner, 2 Oct 2026). Until then, never dollars.
- **Revenue split is a flat 85/15, on every stream, with no exceptions.**
  Never invent a rate. WAWU Credits were the last exception, at 90/10; the
  product owner moved them to 85/15 on 21 Sep 2026 ("Credits follow 85 15"),
  so there is now exactly ONE split in the product. This line used to say the
  opposite and to warn against collapsing the two rates; that warning is
  retired, not merely ignored. There is also no Pro tier to earn a better
  rate with (see the subscription note below).
- **Wallets run on Fintava, under Loma Bank's licence** (R-1, owner, 1 and 2
  Oct 2026). Fintava is the technology. The licence is Loma Bank's (Iyin Ekiti
  MFB). Every WAWU wallet, Naira and crypto, rides on it. Fintava replaces
  Flutterwave as the money rail. Legal and licensing are the owner's (see
  above).
  - **This web app stays on Flutterwave until after launch.** Its wallets
    today are Flutterwave payout subaccounts (built 5 Sep 2026). Don't move
    the web to Fintava or take Flutterwave out here before then: that is
    after-launch work. Backend changes are additive, so nothing the web calls
    changes behaviour (the protected route suite, task MONEY-01).
  - **Money held between payer and payee sits in WAWU's merchant wallet**
    (R-19, owner, 2 Oct 2026). Fintava can't reserve part of a customer's
    balance, so paid DMs, tickets and bills move the money into WAWU's own
    Fintava wallet, then on to the payee or back to the payer.
  - **Fees: the user pays Fintava's fee plus WAWU's fee on top** (R-10, owner,
    2 Oct 2026). For example, a bank send costs ₦40 (Fintava) + ₦25 (WAWU) =
    ₦65. The fee quote shows the total, read from config, never from a design.
  - **The provider's balance is the truth.** Never add up our own records,
    client-side or in the hub, and show that as a balance.
  - This replaces the 5 Sep 2026 note, which said each wallet was a
    Flutterwave payout subaccount and that WAWU never holds the money.
- **WAWU Credits render as a COUNT** ("48 credits"), never a naira value, never cashable.
- **"WAWU Credits" is the name.** The build brief's monetisation table calls
  this "community chat tokens"; it is the same instrument, already built, and
  its price is not TBC. Product owner, 21 Sep 2026: "it's wawu credits not the
  other name". There is no second currency.
- **No free trial.** The 7-day credits trial is gone (21 Sep 2026, "no 7 day
  silly trials"). Every metered community message costs a credit, and a sender
  with none is asked to buy some. Balances already granted were untouched: the
  free allowance was withdrawn, not the credits.
- No DRM, no screenshot-blocking, no liveness/Face-ID. These do not exist in this product.
- **Creator is an ACCOUNT TYPE**, not a trust-tier badge or an earned level.
- **There is no subscription and no creator tier** (product-owner reversal,
  20 Sep 2026, build brief B1). Registration, profile creation and listing are
  free; uploading is NOT gated on payment. Basic/Pro/Pro Max are gone, along
  with the referral codes that discounted them. Revenue now comes from discrete
  paid actions: verification, paid featuring, paid advertising, WAWU Credits
  for community chat. This replaced the earlier "a paid subscription unlocks uploading" note.
- **Identity checks happen when someone opens a wallet, not at sign-up**
  (R-6, owner, 2 Oct 2026). Sign-up is email and phone only. "Open your
  wallet" starts the first time someone taps Wallet or anything that moves
  money. Earning is not gated on it: a creator without a wallet keeps earning,
  and the money waits and lands the moment they open one (R-11, owner, 2 Oct
  2026). There is no "Move to wallet" step. This web app still gates earning
  on manual KYC through `creatorGates()`, with "uploading + KYC pending" as a
  normal state, until it follows the mobile app after launch.
- **Maximum 5 items per account**, counted across products, content and services
  together. Hard cap, enforced server-side. No free/paid slot split, because
  every listing carries a price (brief B2: no free content).
  This is what the web and the backend do today
  (`MAX_ITEMS_PER_ACCOUNT = 5` in wawu-backend's
  `src/common/creator-allowance.ts`). Two rulings change it for the mobile
  app, and the web keeps the line above until it follows after launch:
  - **Upload limits follow the tick** (R-7, owner, 2 Oct 2026): free accounts
    get 5 uploads and 1 GB; with a tick, 25 uploads, 10 GB and more reach.
    Ruled for the mobile app. Today the backend enforces a flat 5-item cap
    and a flat 2 GB storage quota per account, with no tick tier
    (`STORAGE_BYTES_PER_ACCOUNT` in wawu-backend's
    `src/common/creator-allowance.ts`, checked before every upload is signed
    in its `src/storage/storage.service.ts`).
  - **Free content is allowed** (R-8, owner, 2 Oct 2026): a Paid/Free switch
    on uploads, and ₦0 events. Free pieces count toward the upload limit, and
    fans can still tip. Ruled for the mobile app. The web still refuses ₦0
    ("Set a price above ₦0 before publishing.", `src/lib/api/creator-content.ts`)
    and `scripts/check-copy.mjs` still bans the word "free" in copy.
- **There is no Shop** (R-2, owner, 1 Oct 2026). On the web it is closed
  (`SHOP_LIVE = false`); removing it from the backend is task OPS-08.
- **No Shop tab on profiles** (R-9, owner, 2 Oct 2026): creators don't sell
  physical products yet, and profile tabs are Content, Services and About.
  Ruled for the mobile app. The web's profile tabs are still Overview, plus
  Content, Services and Events when the profile has them (`profileTabsFor()`
  in `src/types/profile.ts`), and its 5-item cap still counts products,
  until it follows after launch.
- On this web app KYC is still manual review. Nigeria: BVN + NIN. Elsewhere:
  national-ID equivalent. A Naira wallet needs a Nigerian BVN; people without
  one get dollar and crypto accounts after launch (R-6, R-16).
- WAWUBasket / WAWUBeauty are external apps. Handoff only — never rebuild their
  commerce engine.
- No jobs, no gigs, no Opportunities section.
- **Events are back** (product-owner reversal, 22 Aug 2026), as a user-submitted,
  admin-moderated calendar.
- **Events now sell tickets** (build brief B2, 20 Sep 2026). This replaces the
  earlier "no ticketing, no pricing, no payment" line: B2 lists "events &
  tickets" as a listing type, the approved designs price event cards in ₦, and
  B3 makes hosting an event a VERIFIED-ONLY capability. A buyer cannot host at
  all; an unverified creator or professional cannot either. "Going" is still an
  interest signal and still never money, which is a separate thing from a ticket.

## Navigation
Bottom bar, 5 slots, the SAME for everyone:
`Home · Communities · Explore · Messages · Settings`
Search and notifications live in the header on every screen. The avatar in the
header opens Profile.

**Create is a floating action button**, bottom-right above the bar, shown to
creator accounts only. It is not a nav slot.

Two product-owner overrides are folded in here, both deliberate:
- Slot 3 no longer swaps by account type. It used to be Explore for users and
  Create for creators; Explore now stays for everyone on mobile and Create
  moved to the FAB (21 Aug 2026).
- Slot 5 is Settings, not Profile. Profile is a row inside Settings and is also
  reachable from the header avatar (21 Aug 2026).

## Code boundaries
- **No em-dashes (—) in anything a user reads.** Not in copy, labels, hints,
  empty states, error messages, notification text or seeded content. Write two
  sentences, a comma, a colon, or brackets instead. A bare `—` used as an
  "empty value" placeholder is a `-`. This is a product-owner instruction
  (1 Sep 2026), not a style preference. Code comments are exempt: nobody using
  the app reads them.
- **Tailwind classes, never `style={{}}`.** Tokens are CSS variables — read them
  through Tailwind: `className="bg-[var(--surface-card)]"`. The design-system
  bundle uses inline styles; it is a compiled reference, not the house style.
- Never hardcode a hex, spacing value, or radius. Tokens only.
- All API calls go through `src/lib/api/`. No `fetch()` inside components.
- Shared UI lives in `src/components/ui/` — import from the barrel. **Never fork
  a component.** If a screen needs a variant, add a prop.
- Mock data lives in `src/lib/api/mocks/`, never inline in a component. Tag every
  mock read `// SEAM: replace with GET /api/hub/...`.
- Creator gates come from `creatorGates()` in `src/lib/auth/gates.ts`. Never
  re-check `subscriptionPaid` / `kyc` inline.
- One branch per flow, not per dev. See `docs/05_CONVENTIONS.md`.
- If a task conflicts with `docs/01_SPEC.md`, the task wins — build it, then
  update the doc so it stops disagreeing with the code.

## The design-system readme is stale on product truths
`design/system/_ds/*/readme.md` was generated from the OLD repo. It says "never
design a DM", lists six post categories, and describes a Trust Score system.
**All of that is wrong.** See `docs/04_DESIGN_SYSTEM.md`. The components are fine;
the product narrative in that file is not.
