# Dev B — Creator

Hand this file to your AI agent at the start of every session, along with the repo.

---

## Your scope

Everything behind the creator account type: becoming one, and the tools you get.

| # | Flow | Design file in `design/screens/` |
|---|---|---|
| B1 | Creator onboarding: value → tier select → payment → KYC | `WAWU Creator Onboarding.dc.html` |
| B2 | KYC states: pending / approved / rejected + resubmit | `WAWU Creator Onboarding.dc.html` |
| B3 | Two shells — what a user sees vs what a creator sees | `WAWU User vs Creator.dc.html` |
| B4 | Creator dashboard | `WAWU User vs Creator.dc.html` |
| B5 | Publishing: type picker → upload → preview asset → pricing | `WAWU Publishing.dc.html` |
| B6 | Upload-slot limits, first-upload-must-be-free rule | `WAWU Publishing.dc.html` |
| B7 | Creator DM inbox, countdown timers, penalty states | `WAWU Creator DM Earnings.dc.html` |
| B8 | Earnings dashboard + KYC-pending variant | `WAWU Creator DM Earnings.dc.html` |
| B9 | Subscription management, upgrade, past-due, expiry | `WAWU Subscription Management.dc.html` |

**Open the actual design files.** Self-contained HTML — open in a browser.

---

## Read before your first commit
1. `CLAUDE.md` (root) — product rules. Non-negotiable.
2. `docs/01_SPEC.md` — §1 locked monetization model, §4 tiers. Tiebreaker for conflicts.
3. `docs/05_CONVENTIONS.md`
4. `docs/02_TECHNICAL_CONTEXT.md` §2.3–2.5 — DM, credits, subscription data model.

---

## The model, stated plainly

Creator is an **account type**, not an earned trust level. Two gates, independent:

| Gate | Unlocks | Mechanism |
|---|---|---|
| Paid subscription (Basic ₦5,999/yr, Pro ₦18,999/yr) | Uploading + creator tools | Flutterwave recurring |
| Manual KYC approval | **Receiving earnings** | Human review, 1–3 days |

**`subscriptionActive && kycStatus === "pending"` is a normal state**, not an edge case. Most new creators sit there for days. They can upload, publish, and sell — they cannot be paid out. Earnings display, marked not-yet-payable, with a "complete verification" CTA. Build it deliberately.

Use `useCreatorGates()` from `src/lib/auth/session.tsx` — it returns `{ canUpload, canEarn, kycStatus }`. Do not re-derive these conditions inline.

---

## Already built — use, don't rebuild

```
src/components/ui/          Button Input NairaInput Badge TierBadge PriceChip
                            CreditCount Skeleton EmptyState ErrorState Sheet Avatar
src/components/layout/      AppShell AppHeader BottomNav
src/components/content/     ContentCard ContentCardSkeleton
src/lib/api/client.ts       request()
src/lib/auth/session.tsx    useSession useIsCreator useCreatorGates
src/lib/format.ts           formatNaira formatCredits
src/types/account.ts        AccountType CreatorTier KycStatus VerificationLevel
```

You'll add `src/lib/api/creator.ts`, `subscription.ts`, `dm.ts`. Follow the shape of `content.ts` — mock fallback when `NEXT_PUBLIC_API_BASE_URL` is unset.

---

## Rules that bite in your area

- **No wallet. No withdrawal button. No cash-out UI. Anywhere.** The earnings dashboard is a *record*, not a balance. Payout happens outside the app for now.
- **Splits:** 85/15 standard, 90/10 for Pro tier. Read the rate from the API/session — never hardcode, never compute a third rate.
- **KYC is manual data collection.** Nigeria: BVN **and** NIN, both required. Other countries: national-ID equivalent, driven by the country chosen at sign-up. Plus ID document upload and payout bank details.
- **No liveness, no Face ID, no automated verification.** If you see "Face-ID liveness" in any stale doc or the old repo, it is wrong. Ignore it.
- **A creator's first upload must be free** — enforce in the UI and expect the server to enforce it too.
- **Upload slots are tier-bound:** Basic 3 (1 free, 2 paid), Pro 7 (2 free, 5 paid). Show usage and the limit-reached state with an upgrade path.
- **DM response window is 24 hours.** One deadline, no business-hours rule. Miss it → full refund to the fan, zero WAWU fee, and it counts toward the penalty rate (warn 10–30%, off 7d at 30–50%, off 30d above 50%).
- **Verification badges are NOT your gate.** The profile credibility ladder (Dev C) is a separate system from creator KYC and from the paid tier. Keep all three distinct.

---

## Definition of done, per screen
- Matches the design file at 390px.
- Loading, empty, error (with a way out), success — all four.
- Correct behaviour across: no subscription / subscribed+KYC pending / subscribed+KYC approved / past-due.
- No hardcoded hex, spacing, or currency string. No `any`, no `console.log`.
- `npm run typecheck` clean.

## Git
Branch `feat/creator-<flow>` → PR into `develop`.
PR body: which design file, which screens, which states, which gate combinations tested.
