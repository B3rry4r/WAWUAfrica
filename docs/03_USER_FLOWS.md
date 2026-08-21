# WAWU Content/Creators — User Flows (locked)
**Companion to `01_SPEC.md` and `02_TECHNICAL_CONTEXT.md`.**
**Written for two audiences: Claude Design (screen-by-screen batches) and any backend agent building against the API contracts in doc 02. Every screen implied below maps to a contract in doc 02, Section 3.**

---

## A. Consumer flows

### A1. Discover → consume free content
1. Browse Home feed. Content cards appear inline with existing post types — price badge ("Free" or "₦X") and lock icon on paid, unpurchased pieces.
2. Tap a free piece → consumes in-app (video/course stream, audio/PDF/image/template download).
3. Engage: comment, share, save — existing mechanism, no new build.

### A2. Unlock paid content (PPV or download)
1. Tap a locked piece → preview only (truncated PDF, 30–60s audio clip, or gated to episode-level for video/course) + "Unlock for ₦X" CTA.
2. Tap Unlock → Flutterwave inline checkout (same UI pattern as CAC/NEPC today).
3. Payment succeeds → server verifies with Flutterwave → content unlocks in place, no reload.
4. Appears in **My Purchases** (Profile tab), permanent access from here on.

### A3. DM a creator
1. On a creator's profile, if DM is enabled: see DM price (₦X/message).
2. Tap to message → pay ₦X via Flutterwave → message sends.
3. Sees "awaiting response, 24 hours" state.
4. If creator responds in time → message thread continues normally.
5. If creator misses the 24-hour window → full refund, notified "your ₦X was refunded, creator did not respond in time."

### A4. Join a paid community (WAWU Credits)
1. New user gets 7 days of free community chat automatically.
2. After trial: sending a message in an open/general community requires credits. Reading stays free.
3. Balance is zero or trial expired → buy-credits prompt (Starter/Popular/Pro pack picker).
4. Buy pack → Flutterwave charge → credits added to balance (not cash, not withdrawable — see spec doc Section 3).
5. Send messages, balance decrements by 1 per message. Balance hits zero → prompted to buy more.

### A5. Tip a creator
1. On a creator's profile or under a piece of content, a Tip button.
2. Pick/enter an amount → Flutterwave charge → done. No unlock, no access change — pure support.

### A6. Buy a physical product
1. Tap a storefront item on a creator's profile → hands off to the existing external WAWUBasket or WAWUBeauty app flow. Not rebuilt inside this feature.

---

## B. Creator flows

### B1. Become eligible
1. No new signup step. Eligibility = existing trust tier (`certified_professional` or `trusted_partner`) — same gate the composer already uses today.
2. No entry fee to publish content, DM, or host a community at the standard 85/15 split.

### B2. Publish content (PPV or downloadable)
1. Create → Content (repurposed `Learn` slot). Pick type: video, course, audio, PDF, image, template.
2. Upload file(s). **If this is the creator's first-ever content upload, it must be free** — enforced server-side.
3. Set title, description, category, tags, price (if not the mandatory free first upload), accessType.
4. Submit → existing moderation path (automated + manual review, same as any post).
5. Approved → free content goes fully live; paid content shows preview-only until purchased.

### B3. Turn on DM
1. Profile settings → toggle DM on, set price (min ₦50, no ceiling — the creator sets it).
2. Incoming DMs land in a creator inbox: message, countdown timer, "respond by [time]."
3. Respond within 24 hours → earn 85% (or 90% if Pro-tier) of the message price.
4. Miss the window → user refunded, creator earns nothing on that message, and it counts against the rolling no-response rate (warning at 10–30%, 7-day auto-disable at 30–50%, 30-day auto-disable above 50%).

### B4. Host a community (Credits)
1. Basic-tier creators can host/moderate open communities; Pro-tier creators can additionally open private communities.
2. Every message sent by a user in the creator's community spends 1 credit → creator earns 90% of that credit's value.
3. Incentive is engagement-driven: more active community, more credit-spend, more creator earnings.

### B5. Subscribe to a Creator Tier (Basic or Pro)
1. From creator dashboard: tier comparison screen (Basic ₦5,999/yr vs Pro ₦18,999/yr, perks listed per spec doc Section 4).
2. Pick a tier → Flutterwave recurring-charge setup → annual billing begins.
3. Basic unlocks: 3 uploads, open-community hosting, 1 free course, business playbook, pension registration, purple badge.
4. Pro unlocks everything Basic does, plus: 7 uploads, private communities, gold badge, up to 3 free courses, priority support, 1 month free health insurance, Recommended Deals, and **the upgraded 90/10 split on every content/DM/tip/storefront sale** — this last one is the actual reason to upgrade.
5. Renewal is automatic yearly via the stored Flutterwave customer reference. On failure: retry, then `past_due`, then `expired` — perks and the 90/10 split revert to standard on expiry.

### B6. See earnings
1. Creator dashboard: total earnings (flat aggregate across all streams), recent sales list (title/buyer count/amount), EVG-lite score badge.
2. No withdrawal UI in this build — payout mechanism is a separate business/ops decision (spec doc Section 6).

---

## C. Admin flows (extend existing, don't rebuild)

- Content moderation → existing `admin/posts`/`admin/reported`, extended for the new content variant.
- DM disputes ("user says creator didn't respond") → existing moderation pattern, new queue type.
- Subscription status (active/past_due/expired per creator) → new list view inside existing admin shell, not a new admin app.
- Audit trail → existing pattern (ban/suspend already logs to it) extended to cover content approval/rejection and subscription changes.

---

## D. What this doc deliberately does not cover

- Exact screen layouts, spacing, or visual design — that's the Claude Design pass, working batch by batch from this flow list.
- Payout/withdrawal mechanics — not built this phase (spec doc Section 6).
- Live streaming flow — phased, see spec doc Section 6.

Use this doc's section headers (A1–A6, B1–B6) as the natural batching order for Claude Design screens: each is a self-contained flow that maps to one or a few screens.
