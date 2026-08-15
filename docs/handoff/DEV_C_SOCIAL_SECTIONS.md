# Dev C — Social & Retained Sections: rectification

**You are not starting over.** Your branch `feat/dev-c-flows` covers the widest
surface of the three — 36 routes, profiles, DM, communities, Explore, Learn,
Services, settings — and it builds and typechecks clean. You also got the Credits
rule exactly right: rendered as a count, never a naira value, with the constraint
commented in `CreditsCard`. That was the rule most likely to be broken.

Two real gaps and one convention fix below. The convention one is my fault — the
design-system bundle is written in inline styles and I never said not to copy it.

---

## What changed on `develop`

1. **The UI kit is 24 components** in `src/components/ui/`. Your `HandoffPill` and
   `ProfileHeader` are in it, rewritten as Tailwind. Also there now: `Icon`,
   `ListRow`, `SectionHeader`, `StatBlock`, `StatusPill`, `EngagementBar`,
   `ErrorState`, `TierBadge`, `VerificationBadge`, `AccessBadge`,
   `ComingSoonPill`.

2. **`SessionUser` gained `verification` and `creator`** — see
   `src/types/auth.ts`. `creatorGates()` at `src/lib/auth/gates.ts` derives the
   creator state you need for the settings split and profile variants.

3. **Tailwind is the house style**, not inline styles. See R2.

4. **The design-system readme is stale** on product truths — it claims "never
   design a DM" and describes six post categories and a Trust Score. All wrong.
   `docs/04_DESIGN_SYSTEM.md` lists what not to port.

---

## Rectification tasks

### R1 — Rebase and split
```bash
git fetch origin
git checkout feat/dev-c-flows
git rebase origin/develop
```
Resolve conflicts in `src/components/ui/*` by **taking develop's version**. Keep
your own code under `src/app/` and your feature component folders.

Split into `feat/social-creator-profile`, `feat/social-own-profile-verification`,
`feat/social-paid-dm`, `feat/social-communities-credits`, `feat/sections-explore`,
`feat/sections-marketplace-tips`, `feat/sections-learn`,
`feat/sections-services`, `feat/sections-settings`.

### R2 — Convert inline styles to Tailwind
Your branch has **864 `style={{}}` blocks and 4 `className`**. Same tokens, new
mechanism:
```tsx
// from
<div style={{ padding: 14, borderRadius: "var(--radius-card)",
              background: "var(--surface-card)" }} />
// to
<div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] p-3.5" />
```
Delete your local `HandoffPill.tsx` and `ProfileHeader.tsx` — Tailwind versions
are on develop; import from `@/components/ui`.

### R3 — Marketplace and Tips were never built
C7 in your brief. Nothing exists at `/marketplace`, and the `ShopCard` in
`(app)/explore/page.tsx` is a plain `<div>` — it renders WAWUBasket and
WAWUBeauty and goes nowhere. That is a visible dead end on a screen users hit.

Build:

**Marketplace** — Basket and Beauty are **external apps**. We surface and hand
off; we never rebuild their checkout, cart or payment.
- `/marketplace` — landing, Basket and Beauty as two entry points
- `/marketplace/basket` — product grid, category filters
- `/marketplace/beauty` — product grid, category filters
- `/marketplace/product/[platform]/[id]` — images, ₦ price, description, and a
  clear handoff CTA using `HandoffPill` from `@/components/ui`. The purchase
  completes in the other app — make that unmistakable, never imply in-app checkout.
- `/marketplace/search`
- Loading, empty, error on each.
- Fix `ShopCard` in Explore to be a `<Link>` into `/marketplace/basket` and
  `/marketplace/beauty`.

**Tips** — one-time Flutterwave charge, no unlock logic, creator keeps 85%.
- Tip entry point on the creator profile and under a content piece
- Tip sheet: presets ₦500 / ₦1,000 / ₦2,000 / ₦5,000 plus a custom `NairaInput`,
  optional message, a "creator keeps 85%" line, pay CTA
- Payment states: processing, success, failed with retry

### R4 — Drop the scope creep
Delete `(app)/create/` and `(app)/home/` from your branch — `/create` is Dev B's,
`/home` is Dev A's. Keep links pointing at them.

### R5 — SEAM-tag the mocks
Every mock read gets a grep-able seam naming the real endpoint:
```ts
// SEAM: replace with GET /api/hub/communities
// SEAM: replace with POST /api/hub/credits/purchase
// SEAM: replace with GET /api/hub/services
```

---

## The three systems that must stay distinct
You are the only dev who touches all three. Never collapse them:

| System | What it is | Where |
|---|---|---|
| **Verification badges** | Basic → Verified User → Verified Business → Certified Professional → Trusted Partner. Manual review. | Your profile screens |
| **Creator KYC** | Unlocks *receiving earnings*. BVN/NIN + ID + payout details. Manual. | Dev B |
| **Paid tier** | Basic/Pro subscription. Unlocks *uploading*. | Dev B |

A user can hold a verification badge without being a creator. A creator can be
subscribed with KYC pending.

## Rules that bite hardest in your area
- **Credits are a count, never naira, never cashable.** You already got this
  right — keep it through the refactor. No "cash out credits", ever.
- **Marketplace is handoff only.** Never rebuild checkout.
- **DM: 24 hours is the only deadline.** No business-hours rule. Miss it → full
  refund, zero WAWU fee.
- **Settings differ by account type.** A user has no DM settings, no tier, no
  earnings preferences.

---

## Prompt for your AI agent

> I'm rectifying the Social & Sections workstream of the WAWUAfrica app. My branch
> `feat/dev-c-flows` is already built and working — this is a rebase, refactor and
> gap-fill pass. Do NOT regenerate screens that already work.
>
> First read `CLAUDE.md`, `docs/01_SPEC.md`, `docs/04_DESIGN_SYSTEM.md` and
> `docs/05_CONVENTIONS.md` on the current `develop`.
>
> Context: the shared UI kit now has 24 components in `src/components/ui/`,
> including Tailwind versions of `HandoffPill` and `ProfileHeader` that supersede
> my local ones. `SessionUser` gained `verification` and `creator` fields.
>
> Do these in order:
> 1. Delete my local copies of anything now in `src/components/ui/` and import
>    from the barrel `@/components/ui`.
> 2. Convert every `style={{...}}` in my pages and feature components to Tailwind
>    classes reading the same CSS-var tokens. Same visual result, same tokens.
>    Typecheck after each file.
> 3. Build the Marketplace section, which I never built: `/marketplace`,
>    `/marketplace/basket`, `/marketplace/beauty`,
>    `/marketplace/product/[platform]/[id]`, `/marketplace/search`. WAWUBasket and
>    WAWUBeauty are EXTERNAL apps — surface products and hand off using
>    `HandoffPill`. Never build checkout, cart or payment. Loading, empty and
>    error states on each.
> 4. Fix the dead end: `ShopCard` in `(app)/explore/page.tsx` is a `<div>`. Make
>    it a `<Link>` into `/marketplace/basket` and `/marketplace/beauty`.
> 5. Build Tips: entry points on creator profile and under content; a sheet with
>    presets ₦500/₦1,000/₦2,000/₦5,000 plus custom `NairaInput`, optional message,
>    "creator keeps 85%" line, pay CTA; processing, success and failed states.
> 6. Delete `(app)/create/` and `(app)/home/` — other devs own those routes.
> 7. Tag every mock read in `src/lib/api/` with
>    `// SEAM: replace with <METHOD> /api/hub/...` per `docs/02_TECHNICAL_CONTEXT.md`.
>
> Critical rules: WAWU Credits render as a COUNT via `formatCredits()`, never a
> naira value, and there is no cash-out anywhere. Marketplace is handoff only.
> DM has one deadline, 24 hours. Settings differ between user and creator accounts.
>
> No `style={{}}`, no hardcoded hex, no `any`, no `console.log`. Run
> `npm run typecheck` and `npx next build` before telling me you're done.

---

## Definition of done
- `npm run typecheck` and `npx next build` clean.
- Zero `style={{}}` in `src/`.
- Marketplace routes exist; Explore's ShopCard links into them.
- Tips flow complete with all payment states.
- No local duplicate of a `@/components/ui` component.
- Credits still render as a count everywhere. No cash-out anywhere.
- Every mock read carries a `SEAM:` tag.
