# Frontend Assignments — 3 devs

**Phase: mobile only (390px).** Desktop designs are in progress. Do not build desktop
layouts. `design/_wip/` is off limits.

**Before anyone starts**, the shared foundation must be merged (owned by lead):
design tokens as code, `src/components/ui/` primitives, the app shell + locked bottom
nav, session/account-type handling, the API client layer, and `ContentCard`.
Everything below depends on those.

Each dev owns whole flows end to end — routes, components, states, wiring. Not layers.

---

## ev A — Consumer core
The main loop a normal user lives in.

| Flow | Design file |
|---|---|
| Landing page | `WAWU Landing Page` |
| Auth: sign up (user/creator split), OTP, sign in, reset | `WAWU Auth` |
| Home feed + filter tabs + all six content-type cards | `WAWU Home Feed` |
| Content detail: free / locked-preview / unlocked | `WAWU Content Detail` |
| Unlock sheet + payment states | `WAWU Content Detail` |
| My Purchases | `WAWU Content Detail` |
| Search + results tabs | `WAWU Notifications Search` |
| Notifications (all 12 types) | `WAWU Notifications Search` |

**Watch:** the content card is shared — consume the lead's version, don't fork it.
Unlock must never reveal a full asset URL client-side before purchase.

---

## Dev B — Creator
Everything behind the creator account type.

| Flow | Design file |
|---|---|
| Creator onboarding: value → tier → payment → KYC | `WAWU Creator Onboarding` |
| KYC states: pending / approved / rejected + resubmit | `WAWU Creator Onboarding` |
| Two shells: user vs creator app | `WAWU User vs Creator` |
| Creator dashboard | `WAWU User vs Creator` |
| Publishing: type picker → upload → preview asset → pricing | `WAWU Publishing` |
| Upload-slot limits + first-upload-must-be-free rule | `WAWU Publishing` |
| Creator DM inbox, timers, penalty states | `WAWU Creator DM Earnings` |
| Earnings dashboard (+ KYC-pending variant) | `WAWU Creator DM Earnings` |
| Subscription management, upgrade, past-due, expiry | `WAWU Subscription Management` |

**Watch:** "paid + uploading + KYC pending" is the state most new creators sit in —
build it properly. No withdrawal UI anywhere.

---

## Dev C — Social + retained sections
Profiles, conversations, and the sections carried over from the old app.

| Flow | Design file |
|---|---|
| Creator profile (fan view) + all four tabs | `WAWU Creator Profile` |
| Own profile + edit | `WAWU Profiles Verification` |
| Verification badge ladder (separate from creator KYC) | `WAWU Profiles Verification` |
| Paid DM, fan side: pay → await → responded → refunded | `WAWU Paid DM` |
| Communities + credit packs + balance + spend | `WAWU Communities Credits` |
| Explore hub | `WAWU Explore` |
| Marketplace handoff (Basket/Beauty) + Tips | `WAWU Marketplace Tips` |
| Learn (courses + playbooks + guides) | `WAWU Learn` |
| Services catalogue + coming-soon states | `WAWU Services` |
| CAC / NEPC apply flows + Mentors | `WAWU Service Apply Mentors` |
| Settings (user vs creator variants), saved, delete account | `WAWU Settings States` |

**Watch:** credits are a count, never naira, never cashable. Marketplace is handoff
only — never rebuild checkout. Verification badges ≠ creator KYC ≠ paid tier; keep
the three distinct.

---

## Shared rules
- Read `CLAUDE.md` and `docs/01_SPEC.md` before your first commit.
- Open the actual `.dc.html` design file for your flow. Don't work from the table above alone.
- Four states per screen: loading, empty, error, success.
- Anything the backend doesn't expose yet goes behind a named mock in
  `src/lib/api/mocks/` — never a hardcoded array inside a component.
- Conflicts with the spec: stop and raise, don't improvise.
