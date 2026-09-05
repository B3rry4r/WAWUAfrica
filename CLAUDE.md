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
**Desktop is next.** The desktop designs are complete and approved — build from
`design/screens/desktop/*.dc.html`. Desktop implementation has not started yet;
this is greenfield work, not a fix pass. Follow the same account-type/gate rules
as mobile — desktop is a new shell around the same product, not a different one.

## Product notes

These are how the product currently works, so code matches itself — not rules to
quote back at the product owner. If they ask for something that contradicts a
line here, build it and update the line. The one line to raise before building
is the wallet note: who custodies creator money decides whether a CBN licence
is needed, so a change that puts WAWU in custody is worth checking rather than
assuming.
- Naira (₦) only. Never dollars.
- Revenue splits: 85/15 standard, 90/10 for Pro-tier creators. Never invent a rate.
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
- No DRM, no screenshot-blocking, no liveness/Face-ID. These do not exist in this product.
- **Creator is an ACCOUNT TYPE**, not a trust-tier badge or an earned level.
- Two independent gates: a paid subscription unlocks uploading; manual KYC unlocks
  earning. "Paid + uploading + KYC pending" is a normal state, not an edge case.
- KYC is manual review. Nigeria: BVN + NIN. Elsewhere: national-ID equivalent.
- WAWUBasket / WAWUBeauty are external apps. Handoff only — never rebuild their
  commerce engine.
- No jobs, no gigs, no Opportunities section.
- **Events are back** (product-owner reversal, 22 Aug 2026), as a user-submitted,
  admin-moderated calendar. Same shape as the old app: no ticketing, no pricing,
  no payment. "Going" is an interest signal, never money — as it always was.

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
