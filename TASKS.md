# WAWU — running task list

Kept on disk because it survives between messages. There is no todo tool in
this Claude Code build (TaskOutput/TaskStop are for background processes), so
this file is the list. Updated as observations come in.

## Done this round
- [x] Subscribed creator was shown "Become a creator" everywhere. Root cause:
      the live creator-state refresh was gated on the session's `accountType`,
      which is written once at sign-in and never revisited. Anyone who became a
      creator after signing up kept a session saying "user" forever, so the
      refresh never ran, creator state stayed null, and every gate offered
      signup to someone who had already paid. Now asks the server regardless
      and folds the answer back into the session.
- [x] Onboarding now refuses to show the signup flow to someone already
      subscribed (it used to fail only in the network tab with
      "Already subscribed — use /upgrade, /downgrade, or /retry-payment").
- [x] Verification was missing from the non-creator profile branch, so a plain
      account could not reach the ladder at all.
- [x] Verification was filed under "WAWU ID" in Settings. WAWU ID is the auth
      service; relabelled to "Verification".
- [x] DM price cap of NGN 50–500 removed, in the copy AND server-side. Floor of
      NGN 50 kept as an abuse guard. docs/01_SPEC.md and 02_TECHNICAL_CONTEXT.md
      updated to record the change and who asked for it.
- [x] Buttons dissolving into their container on hover. Every `hover:bg-tag*`
      in the app measured 1.05–1.14:1 against the surfaces those controls sit
      on — no visible change. All replaced with a white overlay that reads on
      any dark surface.
- [x] Deep screens still mobile-width on desktop: saved, terms, partners,
      marketplace/search, privacy, privacy/policy, privacy/blocked, about,
      services/cac, services/nepc.
- [x] Telemedicine ran as one long stacked column on desktop; plans and the
      enrolment form are side by side now, form sticky.
- [x] Profile added as a row in Settings; avatar in the mobile header links to
      the profile (desktop already had one).

## Done this round (continued)
- [x] Bottom nav and sidebar slot 5 swapped from Profile to Settings, on your
      instruction. This overrides the "Navigation (locked)" rule in CLAUDE.md,
      which should be updated to match. Profile is reached from the header
      avatar and from a row inside Settings.
- [x] Nav highlighting was exact-match, so opening anything inside a tab
      unlit it. Prefix-aware now (Home stays exact so it does not swallow
      every route).
- [x] Nine more screens were pinned to the 430px mobile column or had no width
      cap at all on desktop: KYC, subscription, paid messages, onboarding, the
      publishing wizard, create/new, earnings, create, profile/edit.
- [x] Telemedicine's two-column layout was splitting a single error message
      across both columns with an empty placeholder beside it. The grid only
      renders once there are plans.

## Done this round (continued)
- [x] Telemedicine rendered as one enormous full-width card. Cause: the grids
      used `auto-fit`, which COLLAPSES empty tracks, so a section holding one
      card stretched it across the whole row. Switched to `auto-fill`, which
      keeps the tracks. Verified the difference in an isolated render.
- [x] The coming-soon Telemedicine card's "Notify me" opened the full working
      enrolment flow, payment and all: /services/care is a static route and
      Next resolves it ahead of the dynamic /services/[id] detail page. The
      page now reads its own status from the catalogue and refuses when the
      service is not live, which also covers anyone with the URL.
- [x] "N/A" for a failed earnings read looked like a real figure of nothing;
      now "Unavailable". Same for the purchases count on the profile.

## Open — needs your decision
- [ ] "Jobs" and "Wallets" in the Access-to list: both cut by name in
      docs/01_SPEC.md (line 120; section 3 on Credits not being a wallet).
      Held out pending your call — say the word and both go in.
- [ ] CLAUDE.md still documents the old locked nav (slot 5 = Profile). Worth
      updating so the next person does not "fix" it back.

## Blocked on you (external)
- [ ] Flutterwave Bills: "Please enable IP Whitelisting". Needs enabling on the
      account plus a static egress IP. WAWUPay cannot complete a real bill.
- [ ] Prices for the simple legal services (CAC, tax registration, NDPR filing).
- [ ] WAWUGo / Travel and Music licensing partner APIs.
- [ ] The new backend still sends NO email (no mailer dependency). Purchases,
      KYC outcomes, legal deliverables and bill receipts notify nobody.

---

# OPEN — this round (your latest observations, all of them)

## P0 — the root cause behind most of it
- [x] **T1. Paying does not make you a creator on the server.**
      `creator-subscription.service.ts verify()` writes CreatorSubscription and
      CreatorState but never touches `UserProfile.accountType`. Every
      `CreatorAccountGuard` then 403s: that is the
      `{"statusCode":403,"message":"This endpoint is only available to creator
      accounts."}` you saw on Earnings, and the same on Subscription. Fix in
      verify(), in one transaction, plus a backfill for everyone who already
      paid.
- [x] **T2. "Become a creator" still shown to a creator.** `gates.ts` still
      ANDs `isCreator` with the session's `accountType`, which is frozen at
      sign-in. Live creator state loads, the flag stays false.
- [x] **T3. The flash.** Nothing waits for creator state to resolve, so the
      user-vs-creator fork renders the WRONG branch first. That is why you had
      to click "Become a creator" before the page corrected itself and said
      you were already one.

## P1 — verification UX
- [x] **T4. You are never asked to verify.** After payment you land on the
      dashboard. KYC has to be asked for at the end of payment, as an explicit
      step, not left to a pill.
- [x] **T5. The KYC pill is invisible.** You only "barely saw" it. It is also
      `xl:hidden`, so on desktop the notice is not rendered at all — the
      "Held, not payable yet / Released as soon as verification clears" card
      appears with no explanation and no way to act on it.
- [x] **T6. Held-earnings copy with no action.** The card that says earnings
      are held must carry the Verify button itself.

## P2 — errors
- [x] **T7. A 403 renders as "network error".** It is not a network error and
      the message the server sent is discarded.

## P3 — screens
- [x] **T8. Profile still lists "Become a creator"** (non-creator branch, made
      reachable by T2/T3).
- [x] **T9. Profile still has "Sign out"** after the reorder that made Settings
      the outer screen. Sign out belongs in Settings.
- [x] **T10. Create screen is still bad.**
- [x] **T11. ANSWERED — templates were always part of this.** They arrived in
      the very first commit (d0e9cc5) inside the 22 approved design files, not
      added later off-spec. `Template` is one of the six locked content types
      in docs/01_SPEC.md:105. "Invoices, sheets, forms" is the approved
      designer subtitle for that content type, verbatim from
      design/screens/WAWU Publishing.dc.html:102 — the same register as
      "Music, stems, podcast" for Audio. There is NO invoicing or billing
      system anywhere in the codebase. One item is weaker: the Learn-section
      "Templates & Resources" card is in the approved WAWU Learn.dc.html
      design but is not individually named in the docs. Your call whether it
      stays.

## P4 — colour
- [x] **T12. Colour balancing.** Not everything is meant to be purple. Rebalance
      at the token layer, and the white-mix surfaces you flagged.

## Carried over
- [x] **T13. Follow with no way through — Explore fixed.** The public creator
      profile route and its endpoint were both fine; two cards offered Follow
      without linking to it. Explore's creator grid card now links. HomeRightRail
      had the same hole, handed to the agent that owns it.
- [ ] **T14. A "new follower" notification is a dead click.** `new_follower`
      falls through to the default case and routes to /notifications — the page
      you are already on. The wire shape carries no actor id, so the backend
      Notification model needs one before it can link to the follower.
- [x] `/services/pay` and `/services/legal` now gate on catalogue status, via a
      shared `useServiceLive` hook + `ServiceComingSoon` instead of three
      copies of the same block. Also fixed a bug I had introduced in the care
      gate: the effect that loads the plans early-returned on `live` but had an
      empty dep array, so it ran once while `live` was still null and never
      again — Telemedicine would have loaded no plans at all once opened.
- [ ] CLAUDE.md still documents the old locked nav (slot 5 = Profile).
- [ ] **T13. You can follow a creator but not open their profile.** No public
      creator profile route reachable from the places that offer Follow.

## Templates — removed on your instruction ("hide or remove the template shit")
- [x] Learn's "Templates & Resources" pack removed (mock data + landing row).
      Safe: it was in the approved design but never named in the locked docs.
- [x] Sample template content swapped out of the mocks.
- [ ] Publish picker no longer offers Template — driven by a new
      `PUBLISHABLE_CONTENT_TYPES` constant. **FLAG: this diverges from the
      locked spec.** docs/01_SPEC.md:105 locks six content types and Template
      is one of them, so I have HIDDEN it rather than deleted it: the type
      stays in the union, existing template pieces still render, the DB shape
      is untouched, and it is one line to restore. docs/01_SPEC.md needs
      updating to record this, or the change reversed. Your call.
- [x] De-forked `Feedback.tsx`: it defined a SECOND ErrorState whose default
      description was "We could not load this right now. Check your connection
      and try again." That is the exact "network error" you saw on Earnings,
      where the real answer was the 403. It now re-exports the real component.
      Same for EmptyState. (Skeleton is still forked — it takes runtime pixel
      sizes vs the canonical named variants; merging is ~25 mechanical call
      sites, not worth bundling into a bug fix.)
- [x] Deleted a duplicate `ApiError` class in src/types/api.ts. Two classes
      with the same name means an `instanceof` check can silently fail.

## Stale-session holes closed (found while fixing T2/T3)
- [x] `session-provider` gained `clearCreatorState()`, called by the hook on a
      403/404. Reporting null from the hook was not enough: the stored session
      is read SYNCHRONOUSLY elsewhere (src/lib/api/learn.ts reads
      `creatorGates(sessionStorage.getUser())` with no await), so a stale
      `creator` object left in localStorage kept granting creator access after
      the server had already said no. Same class of bug as the stale
      `accountType`, pointing the other way.
- [ ] `getOwnProfile()` in src/lib/api/verification.ts only fetches
      /creator/state when `me.accountType === "creator"`, so when the server's
      own two records disagree, `plan`/`contentSlots`/`stats.published` come
      back defaulted. The visible symptoms are worked around; the proper fix is
      to always probe and derive accountType from the row.

## Still open after this round
- [ ] **Pro's second no-charge upload** — the server always allowed it
      (UPLOAD_ALLOWANCE_BY_TIER: Basic 1, Pro 2) but the wizard modelled it as
      a single "first upload" boolean, so every upload after the first was
      forced to carry a price. A Pro creator silently lost the second slot
      their plan includes. Fixed in the wizard; worth confirming the intent is
      what I assumed, i.e. "2 free" means two ₦0 pieces, not two prepaid slots.
- [ ] **The approved desktop design contains things the spec forbids.** D7's
      category chips are the OLD post taxonomy (Event, Opportunity, Research) —
      CLAUDE.md bans Events and Opportunities outright. The adjacent D6 frame
      draws a "Withdraw ₦148,500" WALLET control, and there is no wallet in
      this product, ever. Neither was implemented. D7 and the mobile frames
      also still quote 3/7 upload slots, i.e. pre-6/15. The designs need a pass.
- [ ] **docs/04_DESIGN_SYSTEM.md and WAWU COLORS.jpeg disagree on the primary.**
      The doc says accent is #9411C9 from "NEW WAWU LOGO.pdf" and that the
      colour sheet "was superseded"; the sheet says Deep WAWU Purple #290D43.
      I left #9411C9 as the action colour and used the sheet's hues for the
      roles purple should never have owned. If you want #290D43 as primary,
      say so — that is a rebrand, not a rebalance.
- [ ] **"Save draft" does not exist** — in design D7, no drafts endpoint.
- [ ] **Library cards do not open.** /content/[id] would be right against the
      real API, but the mock content ids do not line up with the library mock
      ids, so linking them today 404s in mock mode.
- [ ] **A "new follower" notification is a dead click** (T14) — the wire shape
      carries no actor id, so the backend Notification model needs one.
- [ ] **The backend sends no email at all.**
- [ ] Blocked on you: Flutterwave Bills IP whitelisting; prices for the simple
      legal services; WAWUGo / music-licensing partner APIs.
- [ ] CLAUDE.md still documents the old locked nav (slot 5 = Profile).

## "The buttons" — the actual cause, finally measured
The dissolving-hover bug WAS fixed (0 controls left using a container fill or
accent tint). I had been re-fixing that. The live problem was the opposite:
- [x] **103 of 114 `<button>` elements had NO hover state at all**, and there
      was **no `cursor: pointer` on `<button>` anywhere in the app** — Tailwind
      preflight does not set one and nothing here did. So on a hundred-odd
      controls the cursor stayed an arrow AND nothing changed colour. Pointing
      at them did literally nothing.
- [x] **88 of 106 `<Link>` elements had no hover either** — nav items, content
      cards, creator cards, list rows. Anchors are a bigger share of this app's
      clickable surface than buttons.
- [x] **Destructive links turned purple on hover.** tokens.css has a global
      `a:hover { color: var(--accent-hover) }`, and an element selector
      out-weighs a Tailwind class (0,1,1 vs 0,1,0). "Delete account" went
      brand-purple. Scoped so a classed anchor owns its own hover.
- [x] Global baseline added in globals.css: pointer cursor on anything
      pressable, `not-allowed` on disabled, colour transitions for buttons and
      anchors, `prefers-reduced-motion` respected. The hover COLOUR is
      deliberately per-control, not global — a blanket rule would fight every
      selected state and every control over a cover image.

## Other real bugs found on the way
- [x] **Uploads were 100% broken.** See the storage commit. Every upload in the
      product: KYC, content, CAC, NEPC.
- [x] **The MIME allowlist was advisory only.** The presigner silently drops
      `ContentType` — neither signed nor hoisted — so a caller could presign as
      image/jpeg, pass the allowlist, and PUT text/html. Exactly the stored-XSS
      the allowlist's own comment says it exists to prevent. Now the server
      names the object from the type it validated and read URLs force the type
      and disposition on the way out.
- [x] **Invalid HTML on two apply screens**: `<Link>` wrapping a `<Button>` is
      a `<button>` inside an `<a>`. /services/cac and /services/nepc.
- [x] **My earlier "free" sweep was line-based and wrong.** It missed every
      instance where the word sat on a different line from its tag — including
      a literal "Start now · Free" button. A JSX-aware sweep found 16 more.
