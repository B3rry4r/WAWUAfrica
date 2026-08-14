# Dev A — Consumer Core

Hand this file to your AI agent at the start of every session, along with the repo.

---

## Your scope

The loop a normal (non-creator) user lives in: arrive, sign up, browse, unlock, come back.

| # | Flow | Design file in `design/screens/` |
|---|---|---|
| A1 | Landing page (logged out) | `WAWU Landing Page.dc.html` |
| A2 | Auth: sign up (user/creator split), OTP, sign in, forgot/reset | `WAWU Auth.dc.html` |
| A3 | Home feed, filter tabs, all six content-type cards | `WAWU Home Feed.dc.html` |
| A4 | Content detail: free / locked-preview / unlocked | `WAWU Content Detail.dc.html` |
| A5 | Unlock sheet + payment processing/success/failure | `WAWU Content Detail.dc.html` |
| A6 | My Purchases | `WAWU Content Detail.dc.html` |
| A7 | Search + result tabs (All / Content / Creators / Communities) | `WAWU Notifications Search.dc.html` |
| A8 | Notifications — all 12 types | `WAWU Notifications Search.dc.html` |

**Open the actual design files.** They are self-contained HTML — open in a browser. The table above is an index, not a spec.

---

## Read before your first commit
1. `CLAUDE.md` (root) — product rules. Non-negotiable.
2. `docs/01_SPEC.md` — the locked monetization model. Tiebreaker for any conflict.
3. `docs/05_CONVENTIONS.md` — folders, naming, states, git.
4. `docs/02_TECHNICAL_CONTEXT.md` §3 — API contract shapes for content and purchases.

---

## Already built — use, don't rebuild

```
src/components/ui/          Button Input NairaInput Badge TierBadge PriceChip
                            CreditCount Skeleton EmptyState ErrorState Sheet Avatar
src/components/layout/      AppShell AppHeader BottomNav
src/components/content/     ContentCard ContentCardSkeleton
src/lib/api/client.ts       request() — the only place fetch() lives
src/lib/api/content.ts      getFeed getContent startUnlock verifyUnlock getPurchases
src/lib/auth/session.tsx    useSession useIsCreator useCreatorGates
src/lib/format.ts           formatNaira formatCredits
src/types/                  content.ts account.ts api.ts
```

`ContentCard` is shared with Dev C. If you need a variant, add a prop — do not fork it. Flag the change in your PR so C knows.

---

## Rules that bite in your area

- **Never resolve access on the client.** `fullAssetUrl` is present only when the server decides the viewer is entitled. Rendering a player off a locked item is a security bug, not a UI bug.
- **Preview ≠ full asset.** A locked item shows `previewAssetUrl` only. Do not fetch the full asset "and hide it".
- **Naira only.** Format through `formatNaira()`. Never concatenate ₦ by hand, never use floats.
- **Never invent a price.** Prices come from the API. The 85/15 transparency line on the unlock sheet is copy, not a computed rate you make up.
- **Sign-up routes by account type:** user → feed, creator → creator onboarding (Dev B's surface). You build the fork; B builds what's past it.
- **No ID upload, no document capture, no liveness anywhere in auth.** That is creator onboarding, not sign-up.

---

## Definition of done, per screen
- Matches the design file at 390px.
- Loading (skeleton), empty, error (with a way out), success — all four.
- No hardcoded hex, spacing value, or currency string.
- No `any`, no `console.log`.
- `npm run typecheck` clean.

## Git
Branch `feat/consumer-<flow>` → PR into `develop`.
PR body: which design file, which screens, which states covered.
