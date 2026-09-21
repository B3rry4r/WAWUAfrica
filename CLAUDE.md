# WAWUAfrica Web

Next.js 14 (App Router), TypeScript, Tailwind. Consumer app for a Nigerian creator
content marketplace. Ground-up rebuild — it replaces the old post-feed app entirely.
The backend is also being rewritten against the existing database, so treat API
contracts in `docs/02_TECHNICAL_CONTEXT.md` as the target shape, not as live endpoints.

## Read before writing code
- `docs/00_PLATFORM_MAP.md` — what the app is, what was cut
- `docs/01_SPEC.md` — the monetization model as it stands today.
- `docs/02_TECHNICAL_CONTEXT.md` — data model and API contracts
- `docs/03_USER_FLOWS.md` — flows per persona
- `docs/05_CONVENTIONS.md` — how we write code here
- `design/screens/*.dc.html` — the approved mobile designs. Open them.
- `design/screens/desktop/*.dc.html` — the approved desktop designs (shell, all
  17 desktop screens, and the flow canvas). Open them.

## Current phase
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
line here, build it and update the line. The one line to raise before building
is the wallet note: who custodies creator money decides whether a CBN licence
is needed, so a change that puts WAWU in custody is worth checking rather than
assuming.
- Naira (₦) only. Never dollars.
- **Revenue split is a flat 85/15, on every stream, with no exceptions.**
  Never invent a rate. WAWU Credits were the last exception, at 90/10; the
  product owner moved them to 85/15 on 21 Sep 2026 ("Credits follow 85 15"),
  so there is now exactly ONE split in the product. This line used to say the
  opposite and to warn against collapsing the two rates; that warning is
  retired, not merely ignored. There is also no Pro tier to earn a better
  rate with (see the subscription note below).
- **Creators have a wallet; WAWU does not hold the money.** Each wallet is a
  Flutterwave *payout subaccount*: an account at Flutterwave MFB in the
  creator's own name, under Flutterwave's CBN banking licence. Flutterwave
  custodies it, WAWU only instructs. That distinction is the whole point, and
  it is what keeps the old concern answered rather than ignored: WAWU holding
  a cashable balance itself would be a CBN licensing trigger in Nigeria.
  Flutterwave's balance is authoritative; never sum one client-side or in the
  hub and show it as the balance. (Built 5 Sep 2026, replacing the earlier
  "no wallet today" note.)
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
- **ONE gate now, not two: manual KYC unlocks EARNING.** That gate is unchanged
  and was always independent of payment. "Uploading + KYC pending" is a normal
  state, not an edge case.
- **Maximum 5 items per account**, counted across products, content and services
  together. Hard cap, enforced server-side. No free/paid slot split, because
  every listing carries a price (brief B2: no free content).
- KYC is manual review. Nigeria: BVN + NIN. Elsewhere: national-ID equivalent.
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
