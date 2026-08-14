# Dev C — Social & Retained Sections

Hand this file to your AI agent at the start of every session, along with the repo.

---

## Your scope

Profiles, paid conversations, and the sections carried over from the old app.

| # | Flow | Design file in `design/screens/` |
|---|---|---|
| C1 | Creator profile (fan view) + Content/Community/Shop/About tabs | `WAWU Creator Profile.dc.html` |
| C2 | Own profile + edit | `WAWU Profiles Verification.dc.html` |
| C3 | Verification badge ladder (5 levels) | `WAWU Profiles Verification.dc.html` |
| C4 | Paid DM, fan side: pay → awaiting → responded → refunded | `WAWU Paid DM.dc.html` |
| C5 | Communities, credit packs, balance, spend | `WAWU Communities Credits.dc.html` |
| C6 | Explore hub | `WAWU Explore.dc.html` |
| C7 | Marketplace handoff (Basket/Beauty) + Tips | `WAWU Marketplace Tips.dc.html` |
| C8 | Learn — courses + playbooks + country guides | `WAWU Learn.dc.html` |
| C9 | Services catalogue + coming-soon states | `WAWU Services.dc.html` |
| C10 | CAC / NEPC apply flows + Mentors | `WAWU Service Apply Mentors.dc.html` |
| C11 | Settings (user vs creator variants), saved, delete account | `WAWU Settings States.dc.html` |

**Open the actual design files.** Self-contained HTML — open in a browser.

---

## Read before your first commit
1. `CLAUDE.md` (root) — product rules. Non-negotiable.
2. `docs/01_SPEC.md` — §1 monetization, §3 WAWU Credits. Tiebreaker for conflicts.
3. `docs/00_PLATFORM_MAP.md` §3 — the retained sections and how they're repositioned.
4. `docs/05_CONVENTIONS.md`

---

## Three things people constantly confuse — keep them distinct

| System | What it is | Where it lives |
|---|---|---|
| **Verification badges** | Profile credibility ladder: Basic → Verified User → Verified Business → Certified Professional → Trusted Partner. All manual review. | Your C3 |
| **Creator KYC** | Unlocks *receiving earnings*. BVN/NIN + ID + payout details. Manual. | Dev B |
| **Paid tier** | Basic/Pro subscription. Unlocks *uploading*. | Dev B |

They are three separate systems. A user can hold a verification badge without being a creator. A creator can be subscribed with KYC pending. Never collapse them.

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
```

`ContentCard` is shared with Dev A — you consume it on the creator profile Content tab. Need a variant? Add a prop, don't fork. Flag it in your PR.

You'll add `src/lib/api/profile.ts`, `dm.ts`, `credits.ts`, `services.ts`, `learn.ts`. Follow the shape of `content.ts` — mock fallback when `NEXT_PUBLIC_API_BASE_URL` is unset.

---

## Rules that bite in your area

**WAWU Credits — the one most likely to go wrong:**
- Render as a **count** ("48 credits") via `CreditCount` / `formatCredits()`. **Never** a naira value.
- Packs: Starter ₦500 = 50, Popular ₦1,000 = 120, Pro ₦2,000 = 300.
- Non-refundable, **non-cashable**. There is no "convert credits to cash" anywhere, ever. If a task asks for one, stop and raise it.
- 7-day free community chat trial from signup. Reading stays free; sending costs 1 credit.
- Creator earns 90% of credit spend in their community (higher than the standard 85% — deliberate, not a typo).

**Paid DM (fan side):**
- Creator sets price ₦50–₦500 per message.
- **24-hour response window — the only deadline.** No business-hours rule.
- Miss it → full refund, zero WAWU fee. Show the refunded state honestly.

**Marketplace:**
- Basket and Beauty are **external apps**. Handoff only. Never rebuild checkout, cart, or payment.
- Make the handoff obvious — the user is leaving WAWU.

**Services:**
- Live: CAC Registration, NEPC Registration, Mentors.
- Coming soon (real states, not fake): Health Insurance, Pension, Banking, Grants & Funding.
- **EasyBuy is removed.** Do not build it.
- The four coming-soon services *are* the Pro tier perks. Link Services ↔ tiers as one story.

**Learn:**
- Training + Knowledge Hub merged into one section. Courses, playbooks, country guides.
- Tier entitlement surfaces here: Basic = 1 free course, Pro = 3 free courses.

**Settings:**
- User and creator see different lists. A user has no DM settings, no tier, no earnings prefs.

---

## Definition of done, per screen
- Matches the design file at 390px.
- Loading, empty, error (with a way out), success — all four.
- Correct for both account types where the screen differs.
- No hardcoded hex, spacing, or currency string. No `any`, no `console.log`.
- `npm run typecheck` clean.

## Git
Branch `feat/social-<flow>` or `feat/sections-<flow>` → PR into `develop`.
PR body: which design file, which screens, which states covered.
