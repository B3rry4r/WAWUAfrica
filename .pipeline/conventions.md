# Conventions — WAWU Hub API (new backend)

Frozen after framework-decision.json. Every build/wiring agent receives this file plus the
relevant product-truths.json entries as read-only context.

## Stack

NestJS 10 + TypeScript strict, Prisma + PostgreSQL, class-validator/class-transformer DTOs,
Jest + supertest contract tests. Repo: `/workspace/projects/WAWU-Hub-API` (new, separate from
the frontend repo `/workspace/projects/WAWU-Web` and from the legacy `/workspace/projects/WAWUAfrica-API`).

## Auth model — WAWU ID is an external identity provider, never rebuilt

- WAWU ID (`/workspace/projects/WAWU-ID`) is a real, separately-deployed service. This backend
  is a pure **resource server**: it verifies WAWU-ID-issued access tokens, it never issues its
  own login/signup/OTP/refresh tokens and never stores a password.
- Token: RS256 JWT. Verify locally against WAWU ID's `GET /.well-known/jwks.json` using
  `jwks-rsa` + `jsonwebtoken`, JWKS response cached 24h (matches the legacy Laravel middleware's
  proven pattern — no per-request network call to WAWU ID).
- Claims trusted from the token (do not re-derive locally): `sub` (WAWU user id, our foreign
  key for every WawuUserRef), `email`, `phone`, `firstName`, `lastName`, `country`,
  `verificationTier`, `trustScore`, `status`, `platformRefs.wawuafricaAppUserId`.
- `Authorization: Bearer <accessToken>` on every authenticated request. Access-token TTL (15min)
  and refresh (30 days, single-use rotation) are entirely WAWU ID's/the frontend's concern — this
  backend never handles refresh.
- **This backend does NOT have a `User` table for core identity.** Every resource that needs
  "the user" stores only `wawuUserId: string` (the JWT `sub`) as a foreign key, never a
  duplicated name/email/phone. WAWUAfrica-specific profile extensions (creator state, KYC,
  subscription, verification-badge *display* cache if needed) live in this backend's own tables,
  keyed by `wawuUserId`.
- **Verification badges (the credibility ladder: Basic → Verified User → Verified Business →
  Certified Professional → Trusted Partner) map directly onto WAWU ID's own `verificationTier`
  field — they are NOT a WAWUAfrica-owned resource.** When this backend's manual review approves
  a verification-badge submission, it calls back into WAWU ID's internal API
  (`PATCH /internal/users/:userId/verification-tier`, header `X-Service-Key: <INTERNAL_SERVICE_KEY>`)
  to elevate the tier — it does not store the badge level as its own source of truth (it may
  cache the JWT claim for display, but the tier's canonical owner is WAWU ID). This backend DOES
  own the submission/review workflow itself (uploaded documents, reviewer notes, rejection
  reasons, resubmission) — only the resulting *tier value* is written back to WAWU ID.
- **Creator KYC (BVN/NIN + ID document + payout bank details, gates earning) is fully owned by
  this backend**, NOT WAWU ID. It is a completely separate system from verification tier — never
  collapse the two (CLAUDE.md non-negotiable).
- Internal service-to-service calls to WAWU ID: header `X-Service-Key`, env
  `WAWU_ID_INTERNAL_SERVICE_KEY`. The credential is not available in this sandbox — build the
  integration for real, but for local/CI testing point it at a local WAWU-ID-shaped mock (see
  "Local test environment" below). This is a documented, honest gap: this backend's own logic
  is fully testable locally; live connectivity to the *real* production WAWU ID service is not
  verifiable without real credentials, and Phase 8's live-gate report must say so plainly rather
  than imply it.

## Roles & permissions

Two account types carried in this backend's own tables (not on the JWT): `user` | `creator`.
Creator sub-state (not a "role", a set of independent gates — see product-truths.json entitlement
entries):
- `subscriptionPaid: boolean` (Basic/Pro, paid annually via Flutterwave) → gates `canUpload`.
- `kycStatus: pending|approved|rejected` → gates `canEarn` (receive payouts). A creator can be
  `subscriptionPaid=true, kycStatus=pending` simultaneously — this is the single most common
  state and must never be treated as an edge case.
- Guard idiom: `@UseGuards(WawuAuthGuard)` for "any authenticated user", plus resource-specific
  guards (`@UseGuards(CreatorUploadGuard)`, `@UseGuards(CreatorEarnGuard)`) that read the two
  gates above from this backend's own CreatorState table — never from the JWT, never from
  verification tier.

## Error envelope

Every response: `{ "statusCode": number, "message": string, "data": T | null }`.
Paginated list responses: `{ "statusCode": 200, "message": "OK", "data": T[], "pagination": { "currentPage": number, "nextPage": number | null, "perPage": number, "total": number } }`.
Produced by one global `AllExceptionsFilter` in `src/common/filters/` — no controller/service
hand-rolls an error shape. Validation failures (class-validator) map to `statusCode: 400` with
`message` = the first validation error, `data: null`.

Reasoning: matches the sibling WAWU-ID / legacy-WAWUAfrica-API convention (sibling evidence,
supersede S-3) — a client already built against one WAWU service doesn't need a second shape.

## Pagination

Offset-based. Query params `page` (1-indexed, default 1), `perPage` (default 20, max 100).
Response wrapper as above. No cursor pagination anywhere in this build — no screen's mock data
implies infinite-scroll-by-cursor; offset is sufficient and matches the sibling convention.

## Naming & layout (NestJS profile)

`src/<resource>/` per resource: `<resource>.module.ts`, `<resource>.controller.ts`,
`<resource>.service.ts`, `dto/`, `tests/<resource>.contract.spec.ts`. Shared:
`src/common/` (guards, decorators, filters, the WAWU-ID JWT strategy, shared DTOs) — owned only
by the schema/pre-step agent, never by a resource build agent. Routes: kebab-case, plural nouns,
matching the `/api/hub/...` prefix already established in the frontend's SEAM comments and
docs/02_TECHNICAL_CONTEXT.md (e.g. `/api/hub/content`, `/api/hub/dm/inbox`) — global prefix `api/hub`
set once in `main.ts`.

## ORM / database

Prisma + PostgreSQL 16 (local dev instance running in this sandbox: `postgresql://postgres:postgres@localhost:5432/wawu_hub_dev`,
test DB `wawu_hub_test`). Schema at `prisma/schema.prisma`, one shared migration history — the
Phase 4 schema agent owns this file exclusively; build agents only ever run
`npx prisma migrate dev` to pick up schema changes, never hand-edit the schema.

## Validation

`class-validator` + `class-transformer` DTOs. Global `ValidationPipe({ whitelist: true,
forbidNonWhitelisted: true, transform: true })` in `main.ts` — rejects any payload carrying a
field not in the DTO automatically; agents never hand-roll payload checks in a service method.

## File uploads

Content assets (video/audio/pdf/image/template), KYC documents (ID scans), and verification
submission documents all need file upload. Convention: presigned-URL pattern (client requests a
presigned PUT URL from this backend, uploads directly to storage, then confirms with this
backend) rather than proxying file bytes through NestJS — matches `previewAssetUrl`/
`fullAssetUrl` already being "signed URL" per docs/02_TECHNICAL_CONTEXT.md §2.1. Storage
provider: **not yet decided** — for local/dev, use local-disk storage behind the same
presigned-URL interface (a `StorageService` interface with a `LocalDiskStorageAdapter`) so
swapping to S3/Cloudinary/etc later is a single adapter swap, never a contract change. This is a
declared open decision, not a blocker — record in env-manifest.json.

## Websockets / realtime / push

No screen's fragment implies realtime (DM inbox, communities chat, notifications are all
poll-on-navigation / refresh-on-focus per the frontend's SEAM comments — no websocket client
exists anywhere in the frontend). Decision: **no websockets in this build.** If a future need
arises (e.g. live DM countdown ticking without refresh), it's a client-side setInterval against
the same REST read, not a new backend surface — record as an explicit non-decision, not a gap.

## Identity & format canon

- **Money**: integer Naira (whole ₦, not kobo — docs/02_TECHNICAL_CONTEXT.md §2.1/2.2 explicitly
  types `price`/`amount` as plain `integer (₦)`, and the frontend's `formatNaira()` throughout
  operates on whole-naira integers with zero kobo/float handling anywhere in the codebase. This
  deliberately does NOT follow the generic skill default of kobo-minor-units — the entire
  existing product, spec, and frontend are already built and tested against whole-naira
  integers, and introducing kobo would be a supersede with no product justification. Server
  validates all money fields as positive integers, never floats, never client-suppliable for
  anything that has a canonical price (e.g. subscription tier price is looked up server-side by
  tier name, never accepted from the client).
- **Credits**: integer count, NEVER a currency amount, NEVER convertible back to Naira by any
  code path (product-truths.json invariant, repeated because it's load-bearing).
- **Phone**: E.164 (`+234...`), normalized server-side on every write; tolerant matching against
  legacy local-format input (`080...`) for identity lookups where relevant — mirrors WAWU ID's
  own phone-is-an-identity treatment.
- **Email**: lowercase-normalized on ingest.
- **Timestamps**: ISO-8601 UTC everywhere, both wire format and DB storage (`timestamptz` in
  Postgres).
- **IDs**: UUID v4 (Prisma `@default(uuid())`) for every resource this backend owns.
  `wawuUserId` fields store WAWU ID's own `sub` claim value verbatim (a UUID from WAWU ID's own
  system) — never regenerated, never re-keyed.
- **Revenue split rate**: decimal, snapshotted onto the Purchase/DM/Tip/CreditSpend row at the
  moment of the transaction (0.15 standard / 0.10 Pro-tier creator / 0.10 flat for Community
  Credits regardless of tier per product-truths.json) — never recomputed later from the
  creator's *current* tier, so a creator's historical earnings are never retroactively changed
  by a later tier change.

## Runtime contract

- **Connectivity source**: none — this is a standard server-rendered/client-fetch web app, not
  offline-first. No local persistence exists in the frontend (confirmed in Phase 1 Detect). No
  offline UI states need backend support beyond standard error responses on network failure.
- **Sync/refresh triggers**: N/A (no local store to populate) — every screen fetches on
  navigation/mount, matching `repository-direct` wiring throughout.
- **Required UI states**: loading (skeleton) / empty / error-with-retry / success on every data
  surface — this backend's job is to make each state reachable with real conditions: empty =
  a genuine empty array response (not a 404), error = real 4xx/5xx with the error envelope,
  never a silently-swallowed exception returning 200 with empty data.
- **Scheduled/background jobs** (NestJS `@nestjs/schedule`, cron): (1) DM deadline sweep —
  every N minutes, find `DirectMessage` rows past `deadlineAt` with
  `status: "awaiting_response"`, flip to `refunded`, fire a real Flutterwave refund call, update
  the creator's rolling no-response-rate and penalty state. (2) Subscription renewal — daily,
  attempt Flutterwave recurring charge via the stored payment-plan reference for subscriptions
  reaching `currentPeriodEnd`; on failure increment `renewalAttempts` with backoff, after N
  failures flip `past_due` → `expired` and clear `commissionRateOverride`.

## Third-party integrations

### Flutterwave (payments)
- **Pattern**: client-charge + server-verify, NOT hosted-checkout-redirect (matches
  docs/02_TECHNICAL_CONTEXT.md's `{ flutterwaveConfig }` → client charges inline → `.../verify`
  endpoint pattern already documented for every payment flow in this product). Server generates
  a `tx_ref` and returns `{ tx_ref, amount, currency: "NGN", publicKey }` — amount is ALWAYS
  looked up server-side from the canonical price for that action, never accepted from the
  client. Client charges via Flutterwave's inline JS SDK. Client then calls this backend's
  `.../verify` endpoint with `{ transaction_id, tx_ref }`; backend calls Flutterwave's
  `GET /v3/transactions/:id/verify`, cross-checks `status === "successful"`,
  `amount >= expectedAmount`, `currency === "NGN"`, and `tx_ref` matches before marking anything
  `completed`. Never trust a client-echoed success.
- **Webhook** (new — no prior art in the legacy codebase, confirmed gap): a single
  `POST /api/hub/webhooks/flutterwave` endpoint, verifying the `verif-hash` header against
  `FLUTTERWAVE_SECRET_HASH` before processing. Purpose: (a) a reliability backstop for the
  client-verify flow (in case the client never calls `.../verify`, e.g. app closed
  mid-transaction), and (b) the ONLY way to learn a recurring subscription-renewal charge
  succeeded (Flutterwave's Payment Plan API auto-charges server-side with no client involved).
  Declared resource, `declared/flutterwave-payments.json`.
- **Refund**: new — no prior art. `POST /v3/transactions/:id/refund` per Flutterwave's
  documented API, called by the DM-deadline-sweep cron job.
- **Recurring billing**: Flutterwave Payment Plans API — `createPlan()` once per tier
  (Basic/Pro), pass `payment_plan` id in the initial charge payload, Flutterwave's own
  infrastructure auto-charges annually. This backend reacts via the webhook, it does not poll or
  initiate the renewal charge itself.
- **Env vars**: `FLUTTERWAVE_PUBLIC_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_SECRET_HASH`
  (webhook `verif-hash` comparison value, set in the Flutterwave dashboard). For local
  dev/testing: Flutterwave test-mode keys, or a `FlutterwaveClient` interface with a
  `MockFlutterwaveAdapter` for contract tests (per the skill's "external calls behind an
  interface so contract tests can stub them" rule) — real test-mode keys are not available in
  this sandbox, so Phase 5 build agents MUST build against the interface/mock, and Phase 8's
  live-gate report must state plainly that real Flutterwave test-mode connectivity was not
  exercised.

### WAWU ID (auth + verification-tier + trust score)
See "Auth model" above. Declared resource `declared/wawu-id-integration.json`.

## Local test environment (for this overnight build specifically)

Real credentials for WAWU ID's `INTERNAL_SERVICE_KEY` and Flutterwave test-mode keys are not
available in this sandbox. To make Phase 7/8 genuinely exercise this backend's own logic (not
fake it), the pre-step / schema agent must also stand up:
1. A minimal local **mock WAWU ID** service (a tiny Express or Nest app, or even a static
   JWKS file + a script that mints RS256 JWTs signed with a locally-generated keypair,
   shaped exactly like real WAWU ID tokens) — used by Phase 8's live-gate to perform a REAL
   HTTP auth handshake (mock login endpoint → real JWT → real JWKS verification by this
   backend) rather than a minted/injected token. This satisfies the live-gate's "no minted
   tokens" rule in spirit: the token is real, signed, and verified over HTTP via JWKS — only
   the ISSUER is a local stand-in for the real WAWU ID, which is explicitly documented as a
   known limitation, not hidden.
2. A **mock Flutterwave adapter** behind the `FlutterwaveClient` interface, used in both
   contract tests and the live-gate run, simulating successful/failed charges and refunds
   deterministically. Real Flutterwave connectivity is explicitly out of scope for this
   overnight run and must be stated as such in `live-gate.md`.

This is a documented, honest constraint — not a shortcut taken silently.
