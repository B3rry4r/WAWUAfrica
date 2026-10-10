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

## E. Event registration link (`/join`, R-48, no account)

A person at a WAWU event scans a QR code or taps a shared link. The page is branded Who Made This (owner, 10 Oct 2026): the Who Made This logo, "PRE-REGISTRATION / WAITLIST", "WHO MADE THIS?", the 50% OFF offer line, "LAUNCHING OCTOBER 17, 2026" and "Register now. Create. Monetize. Grow." (the owner's words, exactly; the logo files sit at the root of `public/` so site mode serves them). They fill in name, phone, email (state and what they make are optional), tick the consent line and pay the event fee (the price comes from the API, never the page) in the Flutterwave window. They land on "YOUR WHO MADE THIS? LAUNCH ACCESS CODE" with the code large (the short reference: the first 8 characters of the random part of the full reference, upper-cased, in two groups of 4, for example "4733 1BA7"), a "Copy code" button (clipboard write, "Copied" once the browser accepts it, the text selected instead if it refuses), and the owner's words about keeping it safe and the standard fee of ₦10,000 without it (the owner's own figure, written as given). No sign-in, password or code to enter here; the sign-up page is not part of this flow.

- Routes: `/join` (the page) and `/join/paid` (where a payment that left the page returns to; it finishes the server check from the reference in the address). Both sit outside the app shell and the auth layout.
- Calls: `src/lib/api/waitlist.ts` (`GET /waitlist/offers/current`, `POST /waitlist/registrations`, `POST /waitlist/registrations/verify`, `GET /waitlist/registrations/:reference`).
- Refusals, each in plain words: already registered (before any payment), offer closed, no offer open, payment cancelled ("You have not been charged"), payment not confirmed yet ("Checking your payment" with a retry of the check, never a second charge once a transaction id exists), network failure. A busy answer (429) while the offer loads reads "Busy right now. Trying again..." and retries by itself after 2, 4 and 8 seconds before it hands the retry to the person.
- **The one rule for money.** "You have not been charged" is said only when Flutterwave reported cancelled (or failed), no transaction id exists anywhere (the address, the callback, the stored record) and the status route (`GET /waitlist/registrations/:reference`) answers not paid. Every other case, from the callback or from `/join/paid`, ends in "Checking your payment" until the server says paid: with a transaction id the server verifies it whatever status word came with it, and without one the status route is asked. "Checking your payment" asks the status route by itself every 15 seconds for 5 minutes (which is how the webhook and the server's 5-minute re-check show up), "Check again" asks at once, and after 5 minutes it adds "Still checking. If money left your account, email support@wawuafrica.com with your reference XXXX XXXX." The stored reference is not cleared while the outcome is unknown. Never the form and never Pay again from these states.
- A registration the server holds as `failed` is a second payment by someone already registered, kept for a refund: the page says "You're already registered. This extra payment will be refunded. Email support@wawuafrica.com with your reference XXXX XXXX." (also when verify answers `already_registered`). Verify refusals `payment_mismatch`, `transaction_already_used` and `not_found` each get plain words and the same support line; every reason code of the four routes has a case in `refusalOf`, and a new code stops the build until it has one.
- The fee comes from the register answer (`amountKobo`): if it differs from the fee the button showed, no window opens, the button is updated and the page says "The fee is now ₦X. Tap Pay to continue." One tap makes one registration call and opens one window (a ref guard, not only state). The Flutterwave window is titled "WHO MADE THIS?" with the description "Pre-registration" and the Who Made This logo. If its script has not loaded after 15 seconds the page says "The payment window did not load. Check your connection and try again." with a retry that reuses the same reference.
- Forms: fields are 16px text on phones (no zoom on focus); the phone field is named, every field error is tied to its field (`aria-invalid`, `aria-describedby`), a short alert says how many fields need fixing, and an invalid submit moves focus to the first invalid field. A pasted "+234..." or "234..." number is accepted. The first paint is static HTML (logo, eyebrow, heading, form skeleton), not a blank page.
- There is no offer card. The page is the logo, the "Event registration" eyebrow, the "Register for WAWU" heading and the form; the price (from the API) is on the pay button and nowhere else. The page never names the offer, says what the fee includes, how long the plan lasts or when it starts, or when registration closes.
- **Site mode (owner, 10 Oct 2026): production exposes only this link.** `src/middleware.ts` with `src/lib/site-mode.ts`. `SITE_MODE=join-only` or `full`; unset, it is `join-only` when `VERCEL_ENV=production` and `full` everywhere else (previews, local runs, walks). In join-only the open paths are exactly: `/join`, `/join/paid` (any query string), `/privacy/policy` (the consent line's link; it redirects to `/terms`, the one document that holds the privacy provisions, so `/terms` is open too), `/_next/static/*`, `/_next/image`, `/robots.txt`, and files at the site root with an image, icon or font extension (`.png .jpg .jpeg .gif .webp .avif .svg .ico .woff .woff2 .ttf .otf`: the logo, the link-preview image, favicon, icon, apple-icon). Every other path, pages and any `/api/*` alike, answers a 307 to `/join`. Setting `SITE_MODE=full` reopens the whole site with no code change. No auth or sign-up file is touched; they are only unreachable.
- Kept in the browser: the reference and, once Flutterwave returns one, the transaction id (sessionStorage). Never a name, phone or email. The full reference is what is stored, sent and put in the `/join/paid` address; only the registered screen shortens it, and the full reference starts with the short form so support can match it in the admin export.

---

## D. What this doc deliberately does not cover

- Exact screen layouts, spacing, or visual design — that's the Claude Design pass, working batch by batch from this flow list.
- Payout/withdrawal mechanics — not built this phase (spec doc Section 6).
- Live streaming flow — phased, see spec doc Section 6.

Use this doc's section headers (A1–A6, B1–B6) as the natural batching order for Claude Design screens: each is a self-contained flow that maps to one or a few screens.
