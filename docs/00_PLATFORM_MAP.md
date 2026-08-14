# WAWU Consumer App — Platform Map (locked)
**Read this before the spec, technical, or flows docs. This defines the SHAPE of the app being redesigned. The other docs detail the new content/creator layer that sits at its center.**

This is a **full consumer-app redesign**, not a feature addition. Content/creator becomes the primary surface; every other existing section stays, gets restyled to the new design system, and gets repositioned around it.

**Scope: consumer app only.** Admin, Partner Dashboard, Insights portal, and the SAF portal are explicitly out of this pass — they keep their current UI and are not redesigned here. Admin will need new queues eventually (content moderation, DM disputes, subscriptions) but that's a later pass.

---

## 1. What dies

| Removed | Notes |
|---|---|
| **The existing post feed** | Posts across `Learn / Sell / Opportunity / Event / Question / Research` categories, with votes. Content replaces this entirely as Home. The `CATEGORIES` system, `CreateSheet` post-composer, and post-variant `FeedCard` are all superseded. |
| **EasyBuy** | Removed from Services. Routes `/services/easybuy` and `/services/easybuy/apply` retired. |
| **Opportunities** | Grants/funding listings and apply flow. Routes `/opportunities`, `/opportunities/[id]`, `/opportunities/[id]/apply` retired. Frees up the bottom-nav slot and removes the naming collision entirely. |
| **Events** | Listings, RSVP, recaps. Routes `/events`, `/events/[id]` retired. |

**Survives the feed removal:** the comment/conversation thread component (`/conversation/[slug]`). It re-parents from posts to content pieces — content still needs comment, share, save, and rate per the original brief.

---

## 2. What's new — the core

The content/creator layer. Full detail in `01_SPEC.md`; summary of surfaces:

- **Content feed** (Home) — video, course, audio, PDF/book, image/art, template. Free and paid.
- **Content detail** — free / locked-preview / unlocked states.
- **Creator profile** — content grid, tier badge, EVG score, DM entry, tips, storefront.
- **Paid DM** — per-message pricing, 24-hour response window, auto-refund, penalty system.
- **Communities + WAWU Credits** — prepaid message units, 7-day trial.
- **Tips**.
- **Creator Subscriptions** — Basic ₦5,999/yr, Pro ₦18,999/yr.
- **My Purchases**, **Creator earnings dashboard**.

---

## 3. What stays — restyled and repositioned

These are existing, working sections. They are **not** rebuilt; they get the new design system and a new home in the IA.

### 3.1 Marketplace — Basket & Beauty
- Routes: `/marketplace`, `/marketplace/basket`, `/marketplace/beauty`, `/marketplace/product/[platform]/[id]`, `/marketplace/search`
- These pass through to the **external WAWUBasket and WAWUBeauty apps**. Don't rebuild the commerce engine.
- **Repositioning:** embedded into the new structure rather than standing alone. A creator's storefront on their profile surfaces Basket/Beauty products; discovery also lives in the main IA.

### 3.2 Services
- Live today: **CAC Registration** (full apply flow), **NEPC Registration** (full apply flow), **Mentors** (browse, detail, request flow)
- Coming soon: **Health Insurance**, **Pension**, **Banking**, **Grants & Funding** (`COMING_SOON_SERVICE_IDS`)
- **EasyBuy: removed.**
- **Critical connection:** the coming-soon services are precisely the Creator Subscription tier perks. Pension registration and 1-month health insurance aren't external partnerships to source — they're WAWU's own planned service layer, bundled into the Pro tier. Design Services and the tier screens as one connected story, not two unrelated features.

### 3.3 Learn — Training + Knowledge Hub, merged
Training and Knowledge Hub become **one section**. They were always the same job — structured learning and reference material — split across two destinations.

- Existing routes to consolidate: `/training`, `/training/enroll`, `/knowledge`, `/knowledge/[id]`, `/knowledge/countries`, `/knowledge/countries/[name]`
- **Courses** (from Training): partner-delivered, featured card, enroll handoff. Powers the tier perks — Basic = 1 free selected course, Pro = up to 3 free courses of choice. The tier screen links into this catalog rather than describing an abstract benefit.
- **Playbooks & guides** (from Knowledge Hub): the **Business Playbook** (a real static downloadable — this is the "Free business playbook" tier perk), country guides, featured reference content.
- **Naming caution:** the retired post-feed system had a `Learn` category. That's gone — this section is the only thing carrying that name now, no collision.

### 3.4 Profile & account
- `/profile`, `/profile/[wawuId]`, `/profile/edit`, `/profile/verify`
- **Two account types: User and Creator.** Creator is an account type chosen at signup or upgraded into later — not a trust-tier badge. Gated by a paid yearly subscription (Basic ₦5,999 / Pro ₦18,999) for uploading, and by manual KYC for receiving earnings. The two gates are independent: paid-but-KYC-pending is a real, common state.
- **KYC is manual.** Collect data, human reviews. Nigeria: BVN + NIN. Elsewhere: national-ID equivalent. Plus ID document upload and payout bank details. There is **no liveness check and no Face ID** — a stale "Face-ID liveness check" string in `src/lib/profile-data.ts` is display copy with nothing behind it and should be ignored/removed.
- **Account verification badges** (Basic → Verified User → Verified Business → Certified Professional → Trusted Partner) are a **separate** credibility ladder shown on profiles. All manual review. They are not the creator gate.
- **Auth is WAWU ID**, a separate identity service issuing the session token and owning core profile fields. Integrate, don't rebuild.
- Sign-up already collects: full name, email, password (min 8), phone, country, region/state, occupation, gender (optional), terms.
- Profile gains: Content tab, My Purchases, DM settings, subscription status, earnings.

### 3.5 Supporting
- `/notifications` — gains content/DM/credits/subscription notification types
- `/search` — currently tabs `all / posts / people / opportunities`; **`posts` becomes `content`**, **`opportunities` is removed**, and communities needs a tab. Likely lands as `all / content / creators / communities`.
- `/settings`, `/settings/delete-account`
- `/partners`, `/about`, `/privacy`

---

## 4. Navigation — must be rethought, not patched

**Current bottom nav (5 slots):** Home · Market · Create · Opportunities · More

**Current More drawer (9 items):** Profile, Training, Services, Knowledge Hub, Events, Saved, Settings, About, Become a Partner

The cuts help a lot here. Opportunities vacates a bottom-nav slot outright; Events leaves the drawer; Training + Knowledge collapse from two drawer items into one.

**Surfaces the nav now has to carry:**
- Primary: Content feed (Home), Create, Creator profile / own profile
- New: Messages (DM), Communities, My Purchases
- Retained: Marketplace (Basket/Beauty), Services, Learn
- Account: Settings, Saved, Partners, About

Still more than 5 slots, but now it's a tractable IA problem rather than an overflowing drawer. The design pass should propose 2–3 structures against this list — including where DM and Communities live, since those are high-frequency and shouldn't be buried — rather than silently picking one.

---

## 5. Section inventory — one-line reference

| Section | Status | Notes |
|---|---|---|
| Post feed | **REMOVED** | Replaced by content feed |
| EasyBuy | **REMOVED** | |
| Opportunities | **REMOVED** | Grants/funding listings + apply |
| Events | **REMOVED** | Listings/RSVP/recaps |
| Content / creators | **NEW** | The core |
| Paid DM | **NEW** | |
| Communities + Credits | **NEW** | |
| Tips | **NEW** | |
| Creator Subscriptions | **NEW** | Bundles Services + Learn |
| Marketplace (Basket/Beauty) | Stays, embedded | External apps, don't rebuild |
| Services (CAC, NEPC, Mentors) | Stays, restyled | |
| Services (Insurance, Pension, Banking, Grants) | Stays, coming soon | = Pro tier perks |
| Learn (Training + Knowledge, merged) | Stays, merged + restyled | Courses = tier perk; Business Playbook = tier perk |
| Profile / verify / edit | Stays, extended | Trust tier = creator gate |
| Conversation threads | Stays, re-parented | Posts → content. Carries comment/share/save/rate. |
| Notifications / Search / Settings | Stays, extended | |
| Partners / About / Privacy | Stays, restyled | |
| Admin / Partner Dashboard / Insights / SAF | **OUT OF SCOPE** | Not redesigned this pass |
