# Phase 6 — Release-artifact check: NOT RUN

**Reason.** Everything in this audit ran against `next dev` on port 3418 (development
server, hot-reload, unminified, `NODE_ENV=development`), pointed at a local NestJS
backend whose Flutterwave adapter is the mock. No `next build && next start`
artifact was produced or exercised, and no production deployment was driven through
a browser.

That is a real gap, not a formality. Law 13 exists because a capability present in
debug and absent from release shipped twice in the project this skill comes from.
Two specific things this build has that a release build would not:

1. `PaidMessagesSettings` renders a dev-tools row only when `NODE_ENV !== "production"`.
   That row is present in every capture of `/messages/settings` in this pass and would
   be absent from a release build. Nothing else in the captures was checked for the
   same conditional.
2. The local backend boots `FlutterwaveWalletMock` and `MockFlutterwaveAdapter`
   because `FLUTTERWAVE_SECRET_KEY` is empty. `shouldUseMockFlutterwave()` is written
   to THROW rather than return true in production, so a production deploy cannot boot
   into that state — but that guard itself was not exercised here.

## What WAS checked against live production, and what it proved

Not a release *artifact*, but a real remote seam (law 12):

- `POST https://id.wawuafrica.com/auth/login` with the supplied test account returned
  200 and a real RS256 token for `sub a87a0d90-9153-47a1-bc13-071baaf56735`,
  `firstName "QA"`, `lastName "Creator"`, phone `+2348090000001`. A mock cannot invent
  a specific real account's own identifier.
- `GET https://api.wawuafrica.com/api/hub/creator/state` with that token returned
  `{"tier":"basic","subscriptionPaid":false,"kycStatus":"not_started","slotsTotal":6}`.
  **`slotsTotal: 6` for a Basic creator** is a live production value that contradicts
  the type comment in `src/types/auth.ts` ("Basic 3, Pro 7") and both flow docs. See finding F03.
- `GET https://api.wawuafrica.com/api/hub/wallet` returned a real gated refusal:
  `"Your identity check has to be approved before a wallet can be opened."` The
  wallet's KYC gate is real server behaviour, not client dressing.
- `GET https://api.wawuafrica.com/api/hub/services` returned Bills Payment with
  `status: "live"`, `turnaround: "Instant"` on production **today**, while the shipped
  client hard-blocks that same service. See finding F04.

## What a release check still needs

- `next build` then `next start`, repeat one signed-in unlock path against it.
- Diff what the two builds declare: env-gated branches (`NODE_ENV`), CSP/headers from
  `next.config.js`, and any `NEXT_PUBLIC_*` that resolves differently at build time
  than at dev time. `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` is empty in `.env.local`, and
  which value a production build bakes in was not established here.
