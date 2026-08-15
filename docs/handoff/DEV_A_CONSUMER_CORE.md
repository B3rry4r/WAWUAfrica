# Dev A — Consumer Core: rectification

**You are not starting over.** Your work on `fix/ui-conformance-dev-a` is good —
it builds, it typechecks, it broke none of the product rules, and your Tailwind
approach is the one we standardised on. Two of the three problems below are mine,
not yours: the foundation you were handed was incomplete, and the brief told you
to put your whole scope on one branch.

---

## What changed on `develop`

1. **The UI kit went from 12 components to 24.** Everything you had to build
   yourself — `Icon`, `ListRow`, `SectionHeader`, `StatBlock`, `AccessBadge`,
   `ComingSoonPill` — is now in `src/components/ui/` and exported from the
   barrel. Your versions were used as the base, so these are near-identical to
   yours. New alongside them: `ProfileHeader`, `EngagementBar`, `HandoffPill`,
   `ErrorState`, `StatusPill`, `TierBadge`, `VerificationBadge`.

2. **`SessionUser` now carries creator state.** It gained two fields:
   ```ts
   verification: VerificationLevel;   // profile credibility ladder
   creator: CreatorState | null;      // tier, subscriptionPaid, kyc, slots, dmPrice
   ```
   Your `session-provider.tsx` and `session-storage.ts` survived as-is — only the
   user shape widened.

3. **`creatorGates()` exists** at `src/lib/auth/gates.ts`. Derive creator state
   from it instead of reading `user.creator.kyc` inline.

4. **Conventions changed:** one branch per *flow*, not per dev. Tailwind is now
   written down as house style (you were already doing it).

---

## Rectification tasks

### R1 — Rebase and split the branch
Your single branch holds 8 flows. Split it so PRs are reviewable and stop
colliding with B and C on shared files.

```bash
git fetch origin
git checkout fix/ui-conformance-dev-a
git rebase origin/develop
```
Resolve conflicts in `src/components/ui/*` by **taking develop's version** — it is
your code promoted to the shared kit. Keep your own version only under `src/app/`.

Then split into `feat/consumer-landing`, `feat/consumer-auth`,
`feat/consumer-feed`, `feat/consumer-content-unlock`,
`feat/consumer-search-notifications`. Open each PR as it is ready.

### R2 — Landing page must be a server component
`src/app/page.tsx` is `"use client"`, which makes the whole public marketing page
client-rendered. That is the top of the funnel and the SEO surface.

Split it: `page.tsx` stays a server component that reads auth state; move only the
genuinely interactive parts — `EarningsCalculator`, `FaqAccordion`, the creator
carousel — into their own `"use client"` leaves. Hero, stats, categories, "how you
earn", "more than content", testimonials and footer render on the server.

### R3 — Missing error states
Three screens ship loading and empty but no error state. Every screen needs all
four, and an error must offer a way out.

| Screen | Has | Needs |
|---|---|---|
| `(app)/purchases/page.tsx` | loading, empty | `ErrorState` + retry |
| `(app)/search/page.tsx` | loading, empty | `ErrorState` + retry |
| `(app)/notifications/page.tsx` | loading, empty | `ErrorState` + retry |

`ErrorState` from `@/components/ui` already renders icon, title, body and retry.

### R4 — Hand `/profile` to Dev C
`(app)/profile/page.tsx` is Dev C's scope. Delete it from your branch; C's version
supersedes it. Keep your header/nav links pointing at `/profile`.

### R5 — Adopt `creatorGates()`
```ts
import { creatorGates } from "@/lib/auth/gates";
const { isCreator, canUpload, awaitingKyc } = creatorGates(user);
```

### R6 — Mocks out of components
Any placeholder array inside a component moves to `src/lib/api/mocks/`, and every
read gets tagged `// SEAM: replace with GET /api/hub/content`. Grep-able seams are
how we swap to the real backend without hunting.

---

## Prompt for your AI agent

> I'm rectifying the Consumer Core workstream of the WAWUAfrica app. My branch
> `fix/ui-conformance-dev-a` is already built and working — this is a rebase and
> fix pass, NOT a rebuild. Do not regenerate screens that already work.
>
> First read `CLAUDE.md`, `docs/01_SPEC.md`, `docs/04_DESIGN_SYSTEM.md` and
> `docs/05_CONVENTIONS.md` on the current `develop`.
>
> The shared UI kit grew from 12 to 24 components in `src/components/ui/` —
> import from the barrel `@/components/ui` and delete any local duplicates I
> created. `SessionUser` in `src/types/auth.ts` gained `verification` and
> `creator` fields. `creatorGates()` in `src/lib/auth/gates.ts` is now the only
> place creator gates get derived.
>
> Do these in order:
> 1. Convert `src/app/page.tsx` from a client component to a server component.
>    Move only `EarningsCalculator`, `FaqAccordion` and the creator carousel into
>    `"use client"` leaves. Everything else renders on the server.
> 2. Add an `ErrorState` (from `@/components/ui`) with working retry to
>    `(app)/purchases/page.tsx`, `(app)/search/page.tsx`,
>    `(app)/notifications/page.tsx`.
> 3. Delete `(app)/profile/page.tsx` — another dev owns it.
> 4. Replace inline reads of `user.creator.*` and account-type checks with
>    `creatorGates(user)`.
> 5. Move hardcoded placeholder arrays out of components into
>    `src/lib/api/mocks/`, tagging each read
>    `// SEAM: replace with GET /api/hub/...` naming the real endpoint.
>
> Tailwind classes on CSS-var tokens throughout. No `style={{}}`, no hardcoded
> hex, no `any`, no `console.log`. Run `npm run typecheck` and `npx next build`
> before telling me you're done.

---

## Definition of done
- `npm run typecheck` and `npx next build` clean.
- Landing page renders server-side (view-source shows hero copy).
- All four states on every screen you own.
- No local duplicate of a `@/components/ui` component.
- Every mock read carries a `SEAM:` tag.
