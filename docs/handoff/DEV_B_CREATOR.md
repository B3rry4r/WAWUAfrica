# Dev B — Creator: rectification

**You are not starting over.** Your branch `peejay` is the most complete of the
three — every flow B1–B9 shipped, it builds, it typechecks, and it broke none of
the product rules. You also got the hardest thing right: your session mock
defaults to `subscriptionPaid: true, kyc: "pending"`, and your earnings dashboard
handles that state properly ("Finish verification to get paid"). That is the state
most new creators actually live in and the one most likely to be skipped. Your
`CreatorState` shape is now the shared one on `develop`.

One real bug and one convention fix below. The convention one is my fault — the
design-system bundle is written in inline styles and I never said not to copy it.

---

## What changed on `develop`

1. **Your `CreatorState` model won.** `SessionUser` in `src/types/auth.ts` now
   carries it:
   ```ts
   creator: {
     tier, subscriptionPaid, kyc, slotsUsed, slotsTotal, dmPrice, dmEnabled
   } | null
   ```
   Plus `verification: VerificationLevel` for the separate credibility ladder.

2. **`creatorGates()`** at `src/lib/auth/gates.ts` centralises what you were
   deriving per-component. It exposes `isCreator`, `canUpload`, `canEarn`,
   `awaitingKyc`, `kycStatus`, `tier`, `dmEnabled`, `dmPrice`, `slotsUsed`,
   `slotsTotal`, `slotsRemaining`.

3. **The UI kit is 24 components** in `src/components/ui/`. Your `Icon`,
   `ListRow`, `SectionHeader`, `StatBlock`, `StatusPill`, `ProfileHeader` were
   built independently by two other devs too — there is now one shared version.

4. **Tailwind is the house style**, not inline styles. See R2.

5. **`tsconfig.tsbuildinfo` is now gitignored.** It was committed on your branch;
   that is also what let us recover your work when the first push went wrong.

---

## Rectification tasks

### R1 — Rebase, rename, split
`peejay` doesn't say what it contains. Rebase onto develop and split by flow.

```bash
git fetch origin
git checkout peejay
git rebase origin/develop
```
Resolve conflicts in `src/components/ui/*` and `src/types/auth.ts` by **taking
develop's version** — your creator model is already in it. Keep your own code only
under `src/app/` and your feature component folders.

Then split into `feat/creator-onboarding`, `feat/creator-kyc`,
`feat/creator-publishing`, `feat/creator-dashboard`, `feat/creator-dm-inbox`,
`feat/creator-earnings`, `feat/creator-subscription`. Open each PR as it lands.

### R2 — Convert inline styles to Tailwind
Your branch has **711 `style={{}}` blocks and 1 `className`**. The design-system
bundle you were working from is compiled JS using inline styles — it is a *spec*,
not the house style. That was never made clear to you.

Convert. The tokens stay identical, only the mechanism changes:
```tsx
// from
<div style={{ padding: 14, borderRadius: "var(--radius-card)",
              background: "var(--surface-card)" }} />
// to
<div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] p-3.5" />
```
Work file by file, typechecking as you go. `src/components/ui/*` needs none of
this — those are already converted on develop; just delete your local copies and
import from `@/components/ui`.

### R3 — Adopt `creatorGates()`
Replace every inline read of `session.creator.subscriptionPaid` /
`session.creator.kyc` with the helper. Same behaviour, one place to change it:
```ts
import { creatorGates } from "@/lib/auth/gates";
const { canUpload, canEarn, awaitingKyc, slotsRemaining } = creatorGates(user);
```

### R4 — SEAM-tag the mocks
Your mocks in `src/lib/api/mocks/` are well structured — they just need grep-able
seams so the backend swap is mechanical:
```ts
// SEAM: replace with GET /api/hub/creator/earnings
// SEAM: replace with POST /api/hub/creator-subscription
// SEAM: replace with GET /api/hub/dm/inbox
```
One tag per read, naming the real endpoint from `docs/02_TECHNICAL_CONTEXT.md`.

### R5 — Keep the dev-only state switches, label them
`setAccountType`, `setCreatorTier`, `setKycStatus` are genuinely useful — they make
every gate combination reachable without a backend. Keep them, but mark the block:
```ts
/** DEV ONLY — remove when the session endpoint is live. */
```

---

## The states that must survive the refactor
Do not lose these while converting. They are the ones that took real thought:

- **Subscribed + KYC pending** — dashboard shows earnings, marked not-yet-payable,
  with "Complete verification" CTA. Your existing copy is good; keep it.
- **KYC rejected** — reason shown, resubmit path.
- **Upload slots exhausted** — Basic 3 / Pro 7, with an upgrade prompt.
- **First upload must be free** — enforced and explained, not just disabled.
- **DM penalty ladder** — warning 10–30%, off 7d at 30–50%, off 30d above 50%.
- **Subscription past-due and expired** — what still works, what stops.

---

## Prompt for your AI agent

> I'm rectifying the Creator workstream of the WAWUAfrica app. My branch `peejay`
> is already fully built and working — this is a rebase and refactor pass, NOT a
> rebuild. Do not regenerate any screen or flow.
>
> First read `CLAUDE.md`, `docs/01_SPEC.md`, `docs/04_DESIGN_SYSTEM.md` and
> `docs/05_CONVENTIONS.md` on the current `develop`.
>
> Context on what changed: my `CreatorState` model is now shared, living on
> `SessionUser` in `src/types/auth.ts`. `creatorGates()` in
> `src/lib/auth/gates.ts` is now the only place creator gates get derived. The UI
> kit has 24 shared components in `src/components/ui/`.
>
> Do these in order:
> 1. Delete my local copies of anything that now exists in `src/components/ui/`
>    (Icon, ListRow, SectionHeader, StatBlock, StatusPill, ProfileHeader, Button,
>    Input, Sheet, Badge, Avatar, PriceChip, ContentCard) and import from the
>    barrel `@/components/ui` instead.
> 2. Convert every `style={{...}}` in my feature components and pages to Tailwind
>    classes reading the same CSS-var tokens. Same visual result, same tokens —
>    only the mechanism changes. Typecheck after each file.
> 3. Replace inline reads of `session.creator.subscriptionPaid` and
>    `session.creator.kyc` with `creatorGates(user)`.
> 4. Tag every mock data read in `src/lib/api/` with
>    `// SEAM: replace with <METHOD> /api/hub/...` using the endpoints in
>    `docs/02_TECHNICAL_CONTEXT.md`.
> 5. Mark the dev-only session switches (`setAccountType`, `setCreatorTier`,
>    `setKycStatus`) with `/** DEV ONLY — remove when session endpoint is live. */`
>
> Critical: do NOT lose these states while refactoring — subscribed+KYC-pending
> earnings view, KYC rejected with resubmit, upload slots exhausted with upgrade
> prompt, first-upload-must-be-free, DM penalty ladder, subscription past-due and
> expired.
>
> No `style={{}}`, no hardcoded hex, no `any`, no `console.log`. Run
> `npm run typecheck` and `npx next build` before telling me you're done.

---

## Definition of done
- `npm run typecheck` and `npx next build` clean.
- Zero `style={{}}` in `src/`.
- No local duplicate of a `@/components/ui` component.
- Every gate read goes through `creatorGates()`.
- Every mock read carries a `SEAM:` tag.
- All six states listed above still work.
