# WAWUAfrica Web

Next.js 14 (App Router), TypeScript, Tailwind. Consumer app for a Nigerian creator
content marketplace. Ground-up rebuild — it replaces the old post-feed app entirely.
The backend is also being rewritten against the existing database, so treat API
contracts in `docs/02_TECHNICAL_CONTEXT.md` as the target shape, not as live endpoints.

## Read before writing code
- `docs/00_PLATFORM_MAP.md` — what the app is, what was cut
- `docs/01_SPEC.md` — locked monetization model. This is the tiebreaker doc.
- `docs/02_TECHNICAL_CONTEXT.md` — data model and API contracts
- `docs/03_USER_FLOWS.md` — flows per persona
- `docs/05_CONVENTIONS.md` — how we write code here
- `design/screens/*.dc.html` — the approved mobile designs. Open them.

## Current phase
**Mobile only.** Desktop designs are still in progress; `design/_wip/` is not ready
for implementation. Do not build desktop layouts or the flow canvas yet.

## Non-negotiable product rules
- Naira (₦) only. Never dollars.
- Revenue splits: 85/15 standard, 90/10 for Pro-tier creators. Never invent a rate.
- **No wallet.** No cash balance, no withdrawal UI, no "cash out". Ever.
- **WAWU Credits render as a COUNT** ("48 credits"), never a naira value, never cashable.
- No DRM, no screenshot-blocking, no liveness/Face-ID. These do not exist in this product.
- **Creator is an ACCOUNT TYPE**, not a trust-tier badge or an earned level.
- Two independent gates: a paid subscription unlocks uploading; manual KYC unlocks
  earning. "Paid + uploading + KYC pending" is a normal state, not an edge case.
- KYC is manual review. Nigeria: BVN + NIN. Elsewhere: national-ID equivalent.
- WAWUBasket / WAWUBeauty are external apps. Handoff only — never rebuild their
  commerce engine.
- No jobs, no gigs, no event tickets, no Opportunities section, no Events section.

## Navigation (locked)
Bottom bar, 5 slots. Slot 3 swaps by account type:
`Home · Communities · [Explore | Create] · Messages · Profile`
- User account → slot 3 is **Explore**
- Creator account → slot 3 is **Create**
Search and notifications live in the header on every screen.

## Code boundaries
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
- If a task conflicts with `docs/01_SPEC.md`, the spec wins — stop and flag it.

## The design-system readme is stale on product truths
`design/system/_ds/*/readme.md` was generated from the OLD repo. It says "never
design a DM", lists six post categories, and describes a Trust Score system.
**All of that is wrong.** See `docs/04_DESIGN_SYSTEM.md`. The components are fine;
the product narrative in that file is not.
