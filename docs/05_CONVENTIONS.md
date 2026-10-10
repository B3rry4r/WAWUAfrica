# Conventions

## Stack
Next.js 14 App Router · TypeScript (strict) · Tailwind · design tokens as CSS vars.

## Folders
```
src/
  app/                    routes only — thin, compose from components
    (marketing)/          landing, public pages
    (auth)/               sign in, sign up, OTP, reset
    (app)/                authenticated shell — bottom nav lives here
  components/
    ui/                   primitives: Button, Sheet, Input, Badge, Skeleton…
    layout/               shell, bottom nav, header
    content/              ContentCard, players, paywall, unlock
    creator/              dashboard, publishing, DM inbox, earnings
    shared/               cross-domain composites
  lib/
    api/                  one file per domain: content.ts, dm.ts, credits.ts…
    format.ts             naira, dates, counts
    auth/                 session, account type
  hooks/
  types/                  shared types mirroring docs/02
```

## Naming
- Components `PascalCase.tsx`, one component per file, named export.
- Hooks `useThing.ts`. Utilities `camelCase.ts`.
- Route folders lowercase-kebab.
- Types live in `src/types/` when shared, colocated when not.

## Server vs client
Default to server components. Add `"use client"` only for state, effects, or
event handlers. Data fetching belongs in server components or route handlers,
never in a `useEffect` on mount.

## Styling
- Tokens only: `var(--surface-card)`, `var(--text-secondary)`, etc.
- Tailwind for layout and spacing; tokens for colour, radius, elevation.
- No inline hex. No magic pixel values — use the spacing scale.

## Icons
`<Icon name="Check" />` draws from `src/components/ui/icon-set.generated.ts`: the lucide icons whose names appear as string literals anywhere in `src/`, imported one by one, so a page carries those and not the whole library (about 144 kB gzipped). After you add an icon name, run `npm run build:icons`; `npm run check:icons` fails when the file is out of date. A name that only exists at run time (an id from the backend) is not in the set; `Icon` hands it to `LateIcon`, which loads the full library after the page has rendered, so it appears a moment late and never breaks hydration.

## Money
- All amounts are integers in Naira. Never floats.
- Format through `formatNaira()` in `lib/format.ts`. Never string-concatenate ₦.
- Credits format through `formatCredits()` — always a count, never currency.

## API layer
- Every call goes through `src/lib/api/<domain>.ts`.
- Each returns typed data or throws a typed error. No raw `fetch` in components.
- Backend is being rewritten — code against the contracts in `docs/02`, and put
  anything not yet available behind a clearly-named mock in `src/lib/api/mocks/`.

## States — required, not optional
Every screen ships with: loading (skeleton), empty, error (with a way out), and
success. A PR missing any of these will be sent back.

## Git — one branch per FLOW, not per dev
- Branch: `feat/<area>-<flow>`, e.g. `feat/content-unlock`, `feat/creator-kyc`.
- **One flow per branch, one branch per PR.** Do not accumulate your whole scope
  on a single branch — that guarantees conflicts on shared files.
- Open the PR as soon as the flow is done. Rebase on `develop` daily.
- PR body must list: which design file, which screens, which states covered.
- `main` is protected and only receives releases.

## Styling — Tailwind, never inline
Colour, radius, spacing and elevation come from CSS-variable tokens. Use them
through Tailwind classes:
```tsx
// yes
<div className="rounded-[var(--radius-card)] bg-[var(--surface-card)] p-4" />
// no
<div style={{ borderRadius: "var(--radius-card)" }} />
```
The design-system bundle uses inline styles — it is a compiled reference, not the
house style. Port to Tailwind. See `docs/04_DESIGN_SYSTEM.md`.

## Definition of done
- Matches the design file at 390px.
- All four states implemented.
- No hardcoded colours, spacing, or currency strings.
- No `any`. No console logs.
- Works with account-type switching (user vs creator) where relevant.
