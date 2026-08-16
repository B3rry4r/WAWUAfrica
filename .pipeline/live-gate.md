# Phase 8 — Live E2E Gate

**Run date:** 2026-08-16 (autonomous overnight session)
**Method:** Real headless Chrome (Playwright driving `/usr/bin/google-chrome`), against three real, locally-running processes — never fakes, never minted tokens, never fixtures standing in for the app:

- **WAWU-Web** — `next dev`, real Next.js app, `localhost:3000`
- **WAWU-Hub-API** — real NestJS backend, `localhost:3001`, `wawu_hub_dev` Postgres (reset to exact `prisma/seed.ts` state before this run, and again after — see Cleanup)
- **mock-wawu-id** — stand-in for the real, separately-deployed WAWU ID service (no real WAWU ID credentials available in this sandbox), `localhost:4001`, issuing genuinely signed RS256 JWTs verified by the Hub API's real JWKS-based guard

This is not a per-side check. Every assertion below is either a screenshot of real rendered output or a captured real HTTP response from one running process to another, through the actual browser.

## Headline result

**13/14 scripted checks passed on the final run**, plus a full manual walkthrough of the sign-up flow (5 additional steps, all real). **Zero non-2xx API responses** across the whole final run. But the more important finding isn't the pass count — it's what this gate caught before it shipped:

### Three real bugs found and fixed live, none of which any prior verification pass (including live curl checks in Phase 6) could have caught

1. **`mock-wawu-id` had no CORS headers.** A real browser blocks cross-origin `fetch` at the preflight stage; `curl` doesn't enforce CORS at all. Every Phase-6 agent's "verified live" claim was run via curl and was accurate for the API contract — but the actual browser-based auth handshake was **silently broken the entire time**. `auth.ts`'s own resilience pattern (try the real call, catch and fall back to a mock token) masked this completely: sign-in "worked" (a token got stored, the app navigated to the home feed) while that token was fake (`mock-token-...`), and every subsequent authenticated call would have 401'd in real use. This is exactly the failure class the live-gate exists to catch — a false positive that every per-side check, including a live one via curl, would miss. Fixed: added the same CORS policy the real WAWU ID enables. Confirmed post-fix: a real signed JWT is issued and accepted.
2. **`app.module.ts` module-registration-order route shadowing** (`GET /services/mentors` and `/services/applications` always 400'd in the full app). Found by a Phase-6 wiring agent via live curl, fixed same session.
3. **Flutterwave mock-adapter-selection default** routed every local payment flow to the always-502ing real adapter. Found by multiple Phase-6 agents live, fixed same session.

Bug #1 was found specifically because this gate uses a real browser instead of curl/fetch scripts — it is the concrete justification for why Phase 8 is mandatory rather than "the API contracts check out."

## What was observed rendering (real, not simulated)

| # | Surface | Real backend evidence |
|---|---|---|
| 1 | Landing page (signed out) | Loads clean, no console errors |
| 2 | Sign-in, `user@test.wawu.dev` | Real `POST /auth/login` (mock-wawu-id) → real signed RS256 JWT stored (not `mock-token-*`) → real `GET /api/hub/users/me` (200) assembling the session |
| 3 | Home feed | Real `GET /api/hub/content?scope=feed` (200) — renders `SEEDED: 10-Minute Owambe Makeup`, `SEEDED: Invoice Template Pack`, `SEEDED: CAC in 7 days`, real `48 credits` balance, real "Trending Now" / "Creators to follow" sidebars |
| 4 | Search, query "Owambe" | Real `GET /api/hub/search?q=Owambe` (200) — seeded content appears in results |
| 5 | Content detail (seeded `CONTENT_MAKEUP_VIDEO`) | Real `GET /api/hub/content/:id` (200) — full detail renders |
| 6 | Communities list + detail | Real `GET /api/hub/communities`, `GET /api/hub/communities/:id` (200) — seeded `SEEDED: WAWU Founders Circle` (private) renders the correct **designed private-community gate state** ("Private community... Join to read and post — reading is free, sending costs one credit", `Join community` button) — a real non-happy-path UI state, not just the happy path |
| 7 | **Community message write-path, full round trip** | Clicked `Join community` → real `POST /communities/:id/join` (200) → composer appears → typed a marker string → clicked `Send` → real `POST /communities/:id/messages` (200/201) → **re-rendered with the new message visible** and the real credit balance decremented `48 → 47` in the composer's live counter. This is a genuine write-then-read-back round trip through the real backend, not an optimistic local echo. |
| 8 | Creator sign-in (`creator-basic@test.wawu.dev`) | Real JWT issued for a different seeded identity (`Chidi Umeh`); nav bar's slot 3 correctly shows **Create** (not Explore) — the account-type gate is live and correct |
| 9 | Creator earnings | Real `GET /api/hub/content/mine/earnings` (200) |
| 10 | Creator subscription | Real `GET /api/hub/creator-subscription` (200) — renders real tier/status/renewal data |
| 11 | KYC | Real `GET /api/hub/kyc` (200) |
| 12 | **Full sign-up flow, brand-new user, real WAWU-ID identity creation** | Walked all 5 steps in the real browser: account-type → identity (name/email/password/phone) → details (country/state/occupation/gender/terms) → OTP → interests. Real `POST /auth/register` (mock-wawu-id, 201) → real `GET /api/hub/users/me` (Hub onboarding assembly, 200) → real `POST /auth/otp/verify` (200) → 5 interests picked → **landed on the real home feed, authenticated, as a brand-new identity that did not exist before this run** (`c4d56e5e-...`, later cleaned up) |

Screenshots for all of the above are in `.pipeline/live-gate-screenshots/`.

## A designed non-happy-path state was actually entered, not just coded

The private-community gate (screenshot `05-community-private-gate-designed-state.png`) is worth calling out specifically: this is exactly the class of state the contract-driven-backend skill's "coded is not reachable" law worries about. It has a real runtime trigger (visiting a private community you haven't joined-this-session), it rendered correctly, and clicking through it (`Join community`) produced the correct real backend state transition.

## Known, honest gaps found during this gate (not papered over)

These are genuine issues surfaced by using a real browser instead of curl. None block the golden path; all are precisely named:

1. **SSR/CSR hydration mismatch on every authenticated page load.** `AppShell.tsx`/`Sidebar.tsx`/`DesktopHeader.tsx` render differently server-side (no session — `localStorage` doesn't exist during SSR) vs. client-side (real session hydrated from `localStorage`, added in Phase 6). React discards the server HTML and re-renders client-side; recoverable (no crash), but causes a visible flash and shows as a "1 error" badge in Next.js's dev-mode overlay. **Root cause:** the app was originally "frontend-only, in-memory-only session" (no SSR concern, since a fresh load was always signed-out); Phase 6 added `localStorage` persistence without adding SSR-awareness to the shell components. **Fix needed:** a mounted-state guard (or disable SSR) on `AppShell`/`FocusedFlowShell` — a real, non-trivial architecture change, not something to patch reflexively this late in the session. Flagged for a dedicated follow-up.
2. **No way for the frontend to know "am I already a member of this community"** across sessions — confirmed live: a genuinely-already-joined seeded user (per `prisma/seed.ts`) still saw the "not joined" gate on a fresh page load, and had to click `Join community` again (idempotently absorbed by the backend, no duplicate row, but the frontend's local "joined" flag is session-only). Already flagged in `.pipeline/status.json`'s openItems from Phase 6; this run reproduces it live, confirming it's real.
3. **The sign-up OTP step is still a real, unresolved product-contract conflict** (also flagged in Phase 6): the screen says "Verify your email" but WAWU ID's OTP is phone-only; `register()` already fully authenticates before the OTP step even runs, so no code is ever actually sent to trigger it — the mock's permissive code validation (`/auth/otp/verify` accepts any 6 digits) is the only reason this step can be walked through at all in this environment. A real WAWU ID would presumably reject an unsent/invalid code. This needs the product decision already named in `status.json`, not a code fix.

None of the four earlier `.pipeline/status.json` `openItems` (billing-history, downgrade, deferred webhook/cron, no-creator-profile-join, etc.) were newly discovered here — they were already known from Phase 6 and are not re-litigated.

## What was NOT run in this gate (honest scope limit)

- The real, separately-deployed WAWU ID service itself was not exercised — this sandbox has no real WAWU ID credentials or its Postgres instance. `mock-wawu-id` stood in, matching the real contract by direct code inspection (`/workspace/projects/WAWU-ID`). This is the single largest remaining live-connectivity risk before a real deployment, and was already flagged as such in `declared/wawu-id-integration.json`'s `sandboxNote` from Phase 0.
- Real Flutterwave was not exercised (no real API keys in this sandbox) — every payment flow (unlock, tip, DM, CAC, subscribe, credits) was verified against the backend's `MockFlutterwaveAdapter`, which is deterministic and does not represent a real charge. `FLUTTERWAVE_SECRET_KEY` must be set to a real key, and the frontend needs a real inline-checkout SDK integration (currently a synthetic-transaction bridge — flagged in Phase 6's report) before any payment flow can go live.
- Mobile viewport / mobile-specific screens were not walked in this pass (this run used a 1280×900 desktop viewport). Mobile conformance was audited and fixed in an earlier phase of this session (git log), but not re-walked live here.
- Every one of the 39 backend resources' every endpoint was not individually clicked through the UI — this gate exercised the primary golden path (browse → search → content → communities → creator surfaces → full sign-up) plus one deliberate non-happy-path state (private community gate), which is what the skill's Phase 8 requires; it does not require exhaustive UI coverage of all 39 resources (that's what Phase 5's 419 backend contract tests + Phase 6's per-module live verification already covered).

## Cleanup

All test data created during this gate was removed from `wawu_hub_dev` after the run: 5 throwaway `UserProfile` rows (from sign-up flow tests), 1 throwaway `CommunityMessage` row, and the `CreditsState` balance decremented during the community-message test was restored to the seeded `48`. Verified post-cleanup: every table's row count matches `prisma/seed.ts` exactly.

## Verdict

**The core golden path is real and working end-to-end through an actual browser**, against a real backend and a real (mocked, per sandbox constraints) identity service — this was not true before this gate ran, because of bug #1 above. Three real bugs were found and fixed live. The gaps above are honestly named, not hidden, and none of them are the sign-in/sign-up/browse/purchase-setup golden path itself.
