# WAWU Content/Creators — Technical Context
**Companion to `01_WAWU_Content_Creators_SPEC.md` — read that first.**
**Contracts and structure only — field lists, endpoint shapes, component reuse, build sequencing. No implementation code.**
**Supersedes all prior versions of this doc.**

Repo: `WAWUAfrica-New-main` (Next.js 14 / TypeScript, App Router). Match the style of the existing `WAWUAfrica_API_Contracts.md` / `WAWUAfrica_Master_Build_Brief.md` already in the repo root.

---

## 1. Systems in scope, at a glance

| System | New? | Payment mechanic |
|---|---|---|
| Content (PPV + downloads) | New, extends `Post` | One-time Flutterwave charge |
| Direct messaging | Entirely new | One-time Flutterwave charge per message + refund + SLA timer + penalty tracker |
| WAWU Credits | Entirely new | One-time Flutterwave charge for a prepaid pack; internal ledger of *credit balance*, never cash |
| Creator Subscription (Basic/Pro) | Entirely new | Flutterwave recurring charge, annual |
| Tips | Entirely new, trivial | One-time Flutterwave charge, no unlock logic |
| Storefront | Not built here | Routes to external WAWUBasket/WAWUBeauty |
| EVG-lite | New, simple | N/A — computed field |

---

## 2. Data model

### 2.1 Content (extends existing `Post`)

New `variant: "content"` on the existing Post concept (`src/lib/feed-data.ts`).

| Field | Type | Notes |
|---|---|---|
| `variant` | enum, add `"content"` | alongside existing `generic \| product \| opportunity \| event \| training` |
| `contentType` | `"video" \| "course" \| "audio" \| "pdf" \| "image" \| "template"` | |
| `deliveryMode` | `"stream" \| "download"`, derived from `contentType` | video/course → stream; audio/pdf/image/template → download |
| `accessType` | `"free" \| "paid"` | |
| `price` | integer (₦) | `0` when free |
| `previewAssetUrl` | signed URL | always safe to serve |
| `fullAssetUrl` | signed URL, **server-side gated** | only present in API response if free or purchased — see 3.2 |
| `fullAssetLocked` | boolean, derived | tells client to render lock/unlock UI without needing the real URL |
| `creatorFirstUploadFree` | boolean, backend-enforced | first upload from a given creator must be free |

### 2.2 Purchase (covers PPV, downloads, tips — the simple one-time streams)

| Field | Type |
|---|---|
| `id` | uuid |
| `contentId` | uuid, nullable (null for tips) |
| `type` | `"content" \| "tip"` |
| `buyerWawuId` | uuid |
| `creatorWawuId` | uuid |
| `amount` | integer, what was actually charged |
| `commissionRate` | decimal, snapshotted at time of purchase (0.15 standard, 0.10 for a Pro-tier creator) |
| `flutterwaveTxRef` / `flutterwaveTxId` | string |
| `status` | `"pending" \| "completed" \| "failed"` |
| `purchasedAt` | timestamp |

### 2.3 DirectMessage + DM thread state

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `creatorWawuId` | uuid | |
| `dmEnabled` | boolean | creator toggle |
| `dmPrice` | integer (min ₦50, no ceiling) | creator-set |
| `senderWawuId` | uuid | |
| `amount` | integer | snapshot of `dmPrice` at send time |
| `status` | `"awaiting_response" \| "responded" \| "refunded"` | |
| `sentAt` | timestamp | |
| `deadlineAt` | timestamp | `sentAt + 24h`, the single locked deadline |
| `respondedAt` | timestamp, nullable | |
| `flutterwaveTxRef` | string | |

**Creator no-response tracker** (rolling, per creator):
| Field | Type |
|---|---|
| `creatorWawuId` | uuid |
| `noResponseRatePct` | decimal, rolling window |
| `penaltyState` | `"none" \| "warned" \| "disabled_7d" \| "disabled_30d"` |
| `dmDisabledUntil` | timestamp, nullable |

Thresholds (Section 2 of the spec doc): <10% none, 10–30% warned, 30–50% disabled 7 days, >50% disabled 30 days.

### 2.4 WAWU Credits

| Field | Type | Notes |
|---|---|---|
| `userWawuId` | uuid | |
| `creditBalance` | integer | count of credits, **never a currency amount** |
| `trialEndsAt` | timestamp | 7 days from signup |

**CreditPurchase**
| Field | Type |
|---|---|
| `id` | uuid |
| `userWawuId` | uuid |
| `pack` | `"starter" \| "popular" \| "pro"` (₦500/50, ₦1,000/120, ₦2,000/300) |
| `creditsGranted` | integer |
| `flutterwaveTxRef` | string |

**CreditSpend** (one row per message sent in a general community)
| Field | Type |
|---|---|
| `userWawuId` | uuid |
| `communityId` | uuid |
| `creditsSpent` | integer, always 1 |
| `creatorWawuId` | uuid (community host, for the 90% share) |
| `spentAt` | timestamp |

**Hard constraint, repeated from spec doc because it's load-bearing for the build:** no endpoint, no admin action, no support-tool script ever converts `creditBalance` back into a Flutterwave payout or naira value. If a future task asks for one, stop and flag it — it breaks the thing that keeps Credits out of wallet/licensing territory.

### 2.5 Creator Subscription

| Field | Type | Notes |
|---|---|---|
| `creatorWawuId` | uuid | |
| `tier` | `"basic" \| "pro"` | |
| `status` | `"active" \| "past_due" \| "cancelled" \| "expired"` | |
| `commissionRateOverride` | decimal, nullable | `0.10` when tier is `pro` and active — read by Purchase creation logic (2.2) |
| `flutterwaveCustomerRef` | string | for recurring charge |
| `currentPeriodEnd` | timestamp | |
| `renewalAttempts` | integer | for retry logic on failure |

### 2.6 EVG-lite

| Field | Type |
|---|---|
| `creatorWawuId` | uuid |
| `evgScore` | integer, `views + purchases×weight + comments` |
| `evgPurchaseWeight` | config constant, not per-creator |

---

## 3. API contract shapes

Follow the existing `/api/hub/...` convention.

### 3.1 Publish content
```
POST /api/hub/content
Body: { contentType, title, description, category, tags, accessType, price, previewAsset, fullAsset }
Response: Post-shaped object, status "pending" until moderation clears (existing review path).
```
Validate server-side: reject paid on a creator's first submission (2.1 `creatorFirstUploadFree`). Reject if requester's trust tier isn't `certified_professional`/`trusted_partner`.

### 3.2 Get content
```
GET /api/hub/content/:id
Response: Post-shaped object.
  fullAssetUrl present only if free OR requester has a completed Purchase for this id. Short-lived signed URL.
  Else: fullAssetUrl omitted, fullAssetLocked: true.
```

### 3.3 Unlock content / send a tip
```
POST /api/hub/content/:id/unlock
POST /api/hub/tips  { creatorWawuId, amount }
Response: { flutterwaveConfig } — same shape as the existing FlutterwaveConfig type, reused as-is.

POST /api/hub/content/:id/unlock/verify
POST /api/hub/tips/verify
Body: { transaction_id, tx_ref }
Response: { data: { purchased: true, fullAssetUrl } } or { data: { tipped: true } }
```
Server re-verifies against Flutterwave's API before marking `Purchase.status = "completed"` — never trust the client callback alone.

### 3.4 Direct messaging
```
PATCH /api/hub/dm/settings  { dmEnabled, dmPrice }         — creator toggles/sets price
POST  /api/hub/dm/:creatorId/send  { text }                 — returns flutterwaveConfig, charges dmPrice
POST  /api/hub/dm/:messageId/send/verify  { transaction_id, tx_ref }
POST  /api/hub/dm/:messageId/respond  { text }               — creator response; triggers payout release
GET   /api/hub/dm/inbox                                      — creator's incoming DMs + countdown
```
A scheduled job (cron) sweeps `DirectMessage` rows past `deadlineAt` with `status: "awaiting_response"` → sets `status: "refunded"`, fires a Flutterwave refund, updates the creator's `noResponseRatePct` and `penaltyState`.

### 3.5 WAWU Credits
```
POST /api/hub/credits/purchase  { pack }
Response: { flutterwaveConfig }
POST /api/hub/credits/purchase/verify  { transaction_id, tx_ref }
Response: { data: { creditBalance } }

POST /api/hub/communities/:id/messages  { text }
Server checks creditBalance > 0 (or within 7-day trial) before accepting; decrements by 1 on send; 402-style rejection with "buy more credits" prompt if balance is 0 and trial has ended.
```

### 3.6 Creator Subscription
```
POST /api/hub/creator-subscription  { tier: "basic" | "pro" }
Response: { flutterwaveConfig }   — recurring charge setup, Flutterwave customer tokenization on their side
POST /api/hub/creator-subscription/verify  { transaction_id, tx_ref }

# Scheduled job, annual: attempts renewal charge via stored flutterwaveCustomerRef.
# Success → currentPeriodEnd += 1 year.
# Failure → renewalAttempts += 1, retry per a defined backoff; after N failures, status → "past_due" → "expired", commissionRateOverride cleared, tier perks revoked.
```

### 3.7 My Purchases / creator earnings (minimal)
```
GET /api/hub/content/purchases                — user's unlocked content + DM history
GET /api/hub/content/mine                      — creator's published content
GET /api/hub/content/mine/earnings              — { total, recentSales: [...] } across all streams, flat aggregate query, not a running ledger balance
```

---

## 4. Frontend — files to touch

| File | Change |
|---|---|
| `src/lib/posts.ts` | Re-enable/rename `Learn` → `Content`, add `contentType`/`accessType`/`price` to the create-sheet |
| `src/lib/feed-data.ts` | Add content fields to `Post` interface (2.1) |
| `src/lib/adapt.ts` | Map backend content/purchase/DM/credits fields to frontend shapes |
| `src/components/feed/MediaUploader.tsx` | Extend accepted mimetypes: audio, PDF, image-as-downloadable, template files |
| `src/app/(feed)/create/[category]/page.tsx` | Content type picker, price input, accessType toggle |
| `src/components/feed/FeedCard.tsx` / `PostCard.tsx` | Price badge + lock icon for `variant: "content"` |
| New: unlock modal | Sheet-pattern UI, calls unlock endpoint, opens Flutterwave, calls verify |
| New: DM inbox + thread UI | Creator-side countdown/response, user-side pay-to-send |
| New: Credits purchase + balance UI | Pack picker, balance indicator in community chat composer |
| New: Creator Subscription screen | Tier comparison (Basic/Pro), perks, upgrade CTA |
| `src/components/profile/ProfileTabs.tsx` | "Content" tab; My Purchases; DM settings (if own profile) |
| `src/components/profile/ProfileHeader.tsx` | EVG-lite badge; subscription tier badge (purple/gold) |
| `src/app/admin/reported`, `src/app/admin/posts` | Extend for content moderation |
| New (admin): DM disputes, subscription status list | Extend existing admin moderation patterns — don't build parallel admin screens |

**Nav placement — decide against the real nav (Home / Market / Create / Opportunities / More), not an assumed one:** Content likely surfaces inline in Home feed + its own Profile tab, per the original spec's UI direction. DM and Credits need a placement decision — likely under Profile or a new icon, not forced into the existing 5-slot bottom bar. Flag for the Claude Design pass rather than deciding here.

---

## 5. Build sequencing note

Not all 8 streams are equal weight. Rough order of build complexity, lightest first:

1. **Tips** — trivial, one Flutterwave charge, no unlock logic.
2. **PPV + Downloads** — the core content system (shared mechanic, Section 2.1–2.2).
3. **WAWU Credits** — prepaid balance + spend-tracking, moderate complexity.
4. **Creator Subscription** — recurring billing on top of existing Flutterwave relationship (ordinary backend work: a due-date table + a cron job + retry handling, not a new integration).
5. **Direct messaging** — the heaviest item: payment + SLA timer + auto-refund + penalty state machine, all wrapped around a messaging system that doesn't exist yet at all.

This ordering is a suggestion for sequencing risk, not a scope cut — all five are in the locked model (Section 1 of the spec doc).
