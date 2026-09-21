# WAWU Content/Creators — Product Spec (current)
**For: any AI coding agent (Claude Code, Codex, Claude Design, etc.) working on this feature.**
**This is the source of truth. Supersedes all prior drafts, PDFs, and earlier versions of this doc. If a task conflicts with this doc, this doc wins.**

---

## 0. Core philosophy

"Free to discover. Pay to connect. Pay for value." Users browse and consume free content with no payment. They pay for direct access to creators (DM), community engagement (Credits), and specific pieces of value (content unlocks, tips, subscriptions to a creator's tier). Creators control their own pricing and availability.

Built on top of the existing WAWU feed/post/profile system — reusing existing trust tiers, existing upload infra, and existing Flutterwave payment infra. Not a new app, not a new IA.

---

## 1. current monetization model

Every number below is current. Do not substitute numbers from any other document.

| # | Stream | Mechanic | Split | Notes |
|---|---|---|---|---|
| 1 | **PPV** — video, course, live stream | One-time price (₦100–₦5,000, currency adjusts by region), pay once, permanent library access | Creator 85% / WAWU 15% | Live stream is flagged phase-2 (Section 6) — pre-recorded video covers PPV-video for now |
| 2 | **Downloadable content** — audio, PDF/book, image/art, template, course material | One-time price, pay once, permanent download | Creator 85% / WAWU 15% | Same mechanic as PPV, different delivery (download vs stream) |
| 3 | **Direct messaging (DM)** | Creator sets per-message price (min ₦50, no ceiling — cap removed on the product owner's instruction, 2026-08-21), toggles DM on/off, user pays per message | Creator 85% / WAWU 15% on response. **Zero WAWU fee on refund.** | 24-hour response window (current, see Section 2). Auto-refund on miss. Escalating penalty for non-responders. |
| 4 | **WAWU Credits** — general/open community messaging | Prepaid credit packs (₦500/50, ₦1,000/120, ₦2,000/300), 1 credit = 1 message. No free trial (removed 21 Sep 2026) | Creator 85% / WAWU 15% | Not a wallet — see Section 3 for the hard constraints that keep it that way |
| 5 | **Tips & donations** | Voluntary amount, no content gate | Creator 85% / WAWU 15% | Simplest item — a Flutterwave charge with no unlock logic |
| 6 | **Storefront sales** | Physical products (merch, food, fashion, beauty, art) | Creator 85% / WAWU 15% | **Routes through the existing external WAWUBasket / WAWUBeauty apps.** Not rebuilt here. |
| 7 | **Creator Subscription — Basic**, ₦5,999/year | Creator pays WAWU for tier access | WAWU 100% / creator 0% on the tier fee itself | See Section 4 for perks and dependency flags |
| 8 | **Creator Subscription — Pro**, ₦18,999/year | Creator pays WAWU for tier access | WAWU 100% / creator 0% on the tier fee; **but Pro-tier creators get 90/10 instead of 85/15 on streams 1, 2, 3, 5, 6 above** | The upgraded split is the actual incentive to pay for Pro. See Section 4. |

**Event tickets: BUILT** (product-owner decision, 29 Aug 2026). This line
previously read "cut entirely — not building event/ticketing infrastructure",
which was true from the original scoping call until that reversal.

Organisers set ticket tiers (Regular, VIP, VVIP, Early Bird, Group, Free) with
a price, a quantity and a sales window; buyers pay through the same
Flutterwave charge-then-verify path as every other paid surface and receive a
QR ticket; the organiser scans at the door and sees live sold / checked-in /
remaining counts. Any subscriber can sell.

WAWU's cut is the platform's existing split — 15% standard, 10% on a paid
tier — snapshotted per order. No new rate was invented for events.

Cancelling refunds every buyer through Flutterwave. That is a real refund
call, not a status change; see the paid-DM refund work for why that
distinction is written down rather than assumed.

Still not built, and deliberately: there is no wallet. Organiser payouts work
like creator earnings, because a cashable balance is a CBN licensing trigger.

---

## 2. Direct messaging — current mechanics

- **Response window: 24 hours from receipt.** This is the only deadline. ("10 AM–5 PM WAT" from an earlier draft is *not* a second deadline — at most it's advertised "creators are typically active these hours" messaging, not enforced.)
- Creator responds within 24 hours → payment releases to creator (85/15 split).
- Creator does not respond within 24 hours → full refund to user, **WAWU takes no fee on the refunded message.**
- Creator inbox shows incoming DMs with a countdown timer and a "respond by [time]" warning.
- Penalty system, tracked as a rolling no-response rate per creator:
  - Under 10% → no penalty.
  - 10–30% → warning notification.
  - 30–50% → DM auto-disabled for 7 days.
  - Over 50% → DM auto-disabled for 30 days.
- User can query/dispute if a creator doesn't respond (feeds into the existing admin moderation/dispute flow — don't build a second dispute system).

---

## 3. WAWU Credits — why this is not a wallet

Credits are a **prepaid, single-purpose unit** — the same category as airtime or a data bundle. Buy a fixed pack, spend it on one specific action (messages in open/general communities), it's gone. This is different in kind from a wallet, which holds a cash balance a user can draw down for *anything* or cash back out.

Three rules keep Credits out of wallet/licensing territory. They are worth
keeping for that reason, not because the doc says so:

1. **Non-refundable once purchased.** No partial cash-back on unused credits.
2. **Non-cashable / non-withdrawable.** There is no "convert credits back to naira" action anywhere in the product. Ever.
3. **Single-purpose.** Credits spend only on general-community messages. They are not a general-purpose balance usable for PPV, downloads, DMs, tips, or anything else.

If any future request asks to add a "cash out my credits" feature, or to let credits pay for something else, stop — that's the wallet problem re-appearing under a different name.

- No free trial. Removed 21 Sep 2026 on the product owner's instruction ("no 7 day silly trials"); this section previously opened with a 7-day allowance from signup.
- Must hold credits to send messages in general/open communities. Reading remains free; sending costs 1 credit per message.
- Creator share is 85%, the same as every other stream. It was 90% until 21 Sep 2026, described here as "deliberately a better split"; the product owner collapsed it into the flat rate, so credits are no longer an exception to anything.

---

## 4. Creator Subscription tiers — Basic / Pro

Both tiers are billed **yearly**, charged via Flutterwave recurring (Section 6 — this is ordinary backend work on top of infra that already exists, not a separate integration project).

**Basic — ₦5,999/year:**
- 6 content uploads (1 at no charge, 5 priced) — raised from 3 on the product
  owner's instruction, 21 Aug 2026. Enforced server-side by
  `UPLOAD_ALLOWANCE_BY_TIER` in the Hub API, which is the single source of truth.
- Unlimited messages in open communities; cannot open/host private communities
- 1 free selected course (from WAWU's own training content, not user-generated)
- Free business playbook (static resource)
- Personal pension registration
- Purple badge

**Pro — ₦18,999/year:**
- 15 content uploads (2 at no charge, 13 priced) — raised from 7 on the product
  owner's instruction, 21 Aug 2026. Same source of truth as Basic above.
- Can open/host private communities
- Gold badge
- Up to 3 free courses of the creator's choice
- Priority admin support
- 1 month free health insurance
- Personal pension registration
- Recommended Deals
- **90/10 revenue split on streams 1, 2, 3, 5, 6** instead of the standard 85/15 — this is the actual value prop of paying for Pro

**Two items here are partnership dependencies, not build tasks — flag, don't silently build a fake version of either:**
- **Pension registration** and **1-month health insurance** require an actual signed partnership with a licensed pension fund administrator and an insurer respectively. No amount of engineering time produces that. If these partnerships exist or are already in motion, this is an integration; if not, this line item cannot ship regardless of the sprint timeline. Confirm status before scoping build time against it.
- Course access ("1 free selected course" / "3 free courses of choice") assumes a training/course catalog exists to grant access to — confirm this maps to the existing `/training` section of the app rather than being a new content library.

---

## 5. Content types

| Type | Delivery | Examples |
|---|---|---|
| Video | Stream (PPV) | Pre-recorded lessons, talks |
| Course | Stream (PPV) or bundled downloadable materials | Multi-lesson structured content |
| Audio | Download | Songs, audiobooks, podcasts |
| PDF / book | Download | E-books, guides |
| Image / art | Download | Art works, design pieces |
| Template | Download | Business/design templates |

One-time price, one-time payment, permanent access post-purchase — identical mechanic across all types (Section 1, streams 1–2). The only real difference is stream vs. download at the asset-serving layer (see technical doc).

**First upload from a new creator must be free** — a product rule carried over from the original creative brief, enforce server-side, not just as a form suggestion.

---

## 6. Previously descoped — informational, not a blocker

This section used to be a "do not build" list and was treated as one. It is not
a gate any more: the product owner decides scope, and a request to build
something here is an instruction, not a conflict to escalate.

Two items carry a real-world reason worth knowing before you build them, which
is different from being forbidden:

- **A cash balance / wallet / withdrawal UI.** Holding customer funds as a
  cashable balance is a licensing trigger in Nigeria (CBN e-money / PSSP
  territory). Worth a deliberate decision and probably legal advice — not
  something to add incidentally to another feature.
- **AML/CFT reporting dashboards.** That obligation attaches to licensed
  entities holding customer funds; it follows from the decision above rather
  than standing on its own.

Everything else once listed here — blockchain, DRM claims, jobs and gigs, event
tickets, live streaming, a fuller EVG — was a scoping call at the time. Build
any of it when asked. DRM and screenshot-blocking are the one genuine
impossibility: they cannot be enforced on the web, so do not write UI copy
promising them.

## 7. What's already in the codebase — reuse, don't rebuild

Confirmed in `WAWUAfrica-New-main`:

- **Trust tiers** (`src/lib/trust.ts`): `basic → verified_user → verified_business → certified_professional → trusted_partner`. `certified_professional`/`trusted_partner` already gate the composer — this is the creator gate for content, DM, and community hosting.
- **Flutterwave inline checkout** (`src/lib/flutterwave.ts`): live today for CAC/NEPC one-time payments. Every one-time stream (PPV, downloads, DM, tips, Credits) reuses this exact call pattern. Recurring billing (Creator Subscriptions) uses Flutterwave's recurring-charge capability on top of the same underlying gateway relationship — no new PCI scope, WAWU never touches raw card data either way.
- **Post/category system** (`src/lib/posts.ts`, `src/lib/feed-data.ts`): `Learn` category exists, disabled — the slot to repurpose into `Content`.
- **MediaUploader** (`src/components/feed/MediaUploader.tsx`): image/video only today — needs extending for audio/PDF/image-as-downloadable/template mimetypes.
- **Admin moderation + audit trail**: already exists (`admin/reported`, `admin/posts`, ban/suspend actions logged, `trust_audit`/`moderation_log` export types referenced in the API contracts doc). Extend this for content moderation, DM disputes, and subscription status — don't build parallel systems.
- **Actual bottom nav** (confirmed, corrects an earlier assumption): **Home / Market / Create / Opportunities / More.** There is no live "Wallet" screen — the More drawer has a "Wallet"-icon item that actually links to `/services`. Content, DM, Credits, and Creator Subscription all need their own placement decided against this real nav, not the Feed/Discover/Work/Shop/Wallet layout an earlier draft assumed.
- **No existing messaging, credits, or subscription infrastructure of any kind.** DM, Credits, and Creator Subscriptions are all net-new builds, confirmed by direct repo search.
- **Naming collision to avoid:** the app already has a live `Opportunities` nav tab (jobs/grants/funding — unrelated to this feature). Don't reuse "Opportunities" as a label for content discovery.

---

## 8. Passes.com — what's actually true about it (for UI mirroring)

Real Passes.com (researched directly, not from your boss's docs): 90/10 creator split + $0.30 flat fee per transaction, plus a **separate** $29/month platform fee charged to creators. Fans pay creators directly for creator-set subscription tiers, PPV, paid DMs, livestreams, calls, tips, and merch — **there is no platform-wide consumer subscription on real Passes.** WAWU's current model (Section 1) is structurally closer to how Passes' fan-to-creator mechanic actually works than earlier drafts were, minus Passes' own $29/mo creator SaaS fee and $0.30 surcharge — intentionally simpler.
