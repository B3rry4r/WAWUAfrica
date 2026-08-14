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

## Git
- Branch: `feat/<area>-<short-desc>`, e.g. `feat/content-unlock-sheet`.
- Small PRs into `develop`. One flow per PR where possible.
- PR body must list: which design file, which screens, which states covered.
- `main` is protected and only receives releases.

## Definition of done
- Matches the design file at 390px.
- All four states implemented.
- No hardcoded colours, spacing, or currency strings.
- No `any`. No console logs.
- Works with account-type switching (user vs creator) where relevant.
