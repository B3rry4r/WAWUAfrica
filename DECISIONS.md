# DECISIONS

Why things are the way they are. Required by build brief A3: a screen or a
change with no recorded reason is not finished.

Each entry says what was chosen, what was rejected, and why, in terms of user
outcome or product truth. Where something was **not** decided, it is recorded
as an open question rather than resolved quietly in whichever direction was
easier that day.

---

## D1. The API contract is generated from the backend, not hand-written

**Chosen.** `wawu-backend/contract/openapi.json` is generated from the real
NestJS controllers and DTOs, and the web client's types are generated from it
into `src/types/api.generated.ts`.

**Rejected.** Hand-authoring response DTO classes on the backend (about 264 of
them, each restating what a service already returns) and continuing to
hand-maintain `src/types/*.ts`.

**Why.** The 24 files in `src/types/` were hand-written guesses at wire shapes.
That is precisely how a client ends up typed `{items}` against an endpoint
that returns a bare array, with every test passing because the test mocked the
client's own wrong type. Two sources of truth drift; one cannot.

**The part worth knowing.** `@nestjs/swagger` alone did not solve this. It reads
request bodies off DTO classes correctly (101 bodies, 172 param sets), but these
controllers declare no return type (`return this.service.list(...)`), and an
inferred type carries no runtime metadata, so every one of 264 operations
emitted a bare `{"type":"object"}` response. True, and useless. The shapes were
never missing, only invisible: the TypeScript checker resolves each handler to a
real named type. `scripts/enrich-contract.js` asks the checker and writes the
answer into the spec. 259 of 264 operations now carry a real response schema.

**Reported, not faked.** `GET /creator-subscription/billing-history` returned
`Record<string, unknown>[]` in the source. Genuinely untyped, not a generator
miss. It has since been removed with subscriptions (D2).

---

## D2. Subscriptions removed outright, including the referral system

**Chosen.** Full teardown. Dropped `CreatorSubscription`, the `CreatorTier` and
`SubscriptionStatus` enums, `CreatorState.tier`, `CreatorState.subscriptionPaid`,
and the whole `creator-subscription` module. Uploading is no longer gated on
payment.

**Authorised by** build brief B1: "There is no subscription tier. Registration,
profile creation and listing are free ... Remove all subscription UI. Do not
gate uploads behind payment."

**Why a single destructive migration was safe.** This was checked, not assumed.
`GET /admin/payments/receipts` on the live production API returns `total: 0`.
No charge has ever succeeded, so there is no subscriber, no billing history and
no money in flight. Had that come back non-zero, this would have been an
expand/contract pair (stop writing, deploy, verify, then drop) rather than one
migration.

**Consequences accepted deliberately:**

- **Commission is now a flat 15%**, creator keeps 85%. The 10% paid-tier rate
  went with the tier that sold it. This is not a new rate and nobody's terms
  changed under them: 85/15 is what a creator without a paid plan was already
  charged, and nobody was ever on 90/10. WAWU Credits remain 90/10 for everyone,
  which was always tier-independent and must not be collapsed into this.
- **Upload cap is a flat 5 per account** across products, content and services
  together (brief B2), replacing the 6/12/15 tier ladder. No free/paid split,
  because the same brief removes free content entirely.
- **Storage is a flat 2GB**, the floor every tier below Pro Max already had.
- **KYC is untouched.** It always gated *earning*, independently of payment.
  Only the payment gate was removed.

---

## D3. The referral system died with subscriptions. This is an open question.

**What happened.** `ReferralCode`, `ReferralRedemption` and `ReferralClaim` were
removed alongside subscriptions.

**Why this is a consequence, not a separate decision.** A referral code was a
percentage discount on ONE subscription plan: keyed to `CreatorTier`, priced
from the plan table, and rejected at redemption with "That code applies to the
___ plan." With no plan, there is no price for a percentage to apply to. The
feature had no target left, not merely no callers.

**OPEN QUESTION for the product owner.** Verification (₦4,999 creator / ₦9,999
professional) is now the primary paid action, and a discount code pointed at
*that* is the obvious successor. Re-pointing it means deciding what a code
applies to and what it costs, which is not a call to make inside a migration.
Nothing here guesses at it. Raise before the next paid-action build.

---

## D4. Taxonomy counts do not match the brief, and the data follows the brief

**Chosen.** Transcribe section C1 verbatim and export the real counts as derived
constants.

**Measured, independently of the code.** Parsing the brief itself gives 36
categories (15 creator, 21 professional), **557 specialization placements**,
**512 distinct job titles**, and **44 titles that appear in more than one
category**.

**The discrepancy.** The brief's own prose says "~530 specializations". Neither
reading is 530. The lists are authoritative over the summary sentence, so the
data matches the lists and both numbers are exported rather than a single
figure that would hide the ambiguity.

**Cross-listing is real, not duplication.** "Fashion Photographer" is genuinely
under both Photography and Fashion & Beauty; "Software Engineer" appears in
three categories spanning both roles. These are distinct placements with
distinct ids, not rows to deduplicate. A creator who is a fashion photographer
should be findable under either heading.

**Buyer holds no categories.** A buyer browses and buys; they have no identity
to declare. Modelled explicitly so it reads as a decision rather than an empty
list somebody forgot to fill.

**Ids are stable and slug-derived, never recomputed from labels.** Ids are
persisted and sent over the wire; rewording a display label must not silently
change a user's stored specialization.

---

## D5. The reference manifest is wrong in two places, and the images win

**Chosen.** Pair built screens against what the images actually depict, and
record the manifest's errors rather than following them.

**Finding 1 - two files are swapped.** Brief A4b lists
`target-mobile-set-2.jpg` as one of three six-screen composites and
`bug-edit-profile-broken-images.jpg` as bug evidence. They are the other way
around: `target-mobile-set-2.jpg` is a single capture of the Edit Profile screen
showing the broken-image bug, and `bug-edit-profile-broken-images.jpg` is the
missing composite.

**Why this mattered enough to stop for.** A4b says "Do not guess which image is
a target" and warns that rebuilding toward a `reject-` or `bug-` image
reproduces the exact thing the brief exists to replace. Followed literally, the
manifest would have had us building toward a screenshot of a defect we were
separately asked to fix.

**Finding 2 - the "desktop" targets are portrait mobile artboards.** All three
`target-*-desktop-*.jpg` files are 747-768px wide, portrait, and carry a mobile
bottom tab bar. They are not landscape desktop layouts. Brief A4 point 3 already
says the desktop references "do not translate directly to mobile" and must be
improved rather than copied; in fact the opposite problem applies, and the
desktop layout has to be derived rather than read off these.

**Finding 3 - a target contains something Part C deletes.**
`target-explore-desktop-tiles.jpg` includes a "People You May Like" section.
C4 explicitly says to remove that. The written instruction wins over the drawing,
per A4 point 2 (references are authoritative for structure, not for fact).

**Finding 4 - the target profile wears a badge for a tier that no longer
exists.** The profile screen in every mobile composite shows a purple **PRO**
badge on the avatar, and a "₦0 Total Earnings" stat. B1 removed tiers (D2), so
when C2 rebuilds the profile the PRO badge must NOT be built: it would advertise
a plan nobody can buy. Same rule as Finding 3 - the drawing is authoritative for
layout, Part B is authoritative for fact. The verification tick beside the name
is a different thing entirely and DOES get built (B1 makes it the primary
upsell); do not conflate the two marks.

**Finding 5 - the target events cards carry prices (₦25,000, ₦10,000).**
CLAUDE.md said events have "no ticketing, no pricing, no payment". Brief B2
lists "events & tickets" as a listing type and B3 makes hosting a verified-only
capability, so ticketing is back and the drawings agree with the brief. The
CLAUDE.md line is the stale one and is being updated, not the design.

---

## D5b. The two-tick verification change is BLOCKED on a third service. Not done.

**Status: not built. Deliberately.** Brief B1 replaces the verification model
with exactly two paid ticks (Creator, purple, ₦4,999/yr; Professional, green,
₦9,999/yr). The live backend has a five-value `VerificationTier` enum
(`basic`, `verified_user`, `verified_business`, `certified_professional`,
`trusted_partner`). Replacing one with the other was authorised.

**Why it stopped, with the evidence.** It was put to me that WAWU ID is only
an auth service and has nothing to do with verification ticks. That is not what
this codebase does. Three independent confirmations:

1. **The call site is live, not vestigial.** `verification-submission.service.ts`
   line 139 calls `elevateVerificationTier` on every approval, and
   `admin-professional-review.service.ts` line 231 does the same for
   professionals:
   ```
   PATCH {WAWU_ID}/internal/users/:userId/verification-tier   { tier }
           - src/common/auth/wawu-id.client.ts, elevateVerificationTier()
   ```

2. **This backend deliberately does not store the tick.** From that service's
   own header: "The badge *tier* itself is WAWU ID's own `verificationTier`
   claim - on approval this service calls WawuIdClient.elevateVerificationTier
   and never persists tier as this backend's source of truth." The approval
   path elevates at WAWU ID FIRST and only then writes the local row, with a
   comment explaining that the other order produces a permanent divergence
   between the two services with no way back.

3. **A live token proves it.** Signing in to `id.wawuafrica.com` returns an
   access token whose payload contains `"verificationTier": "basic"`, and
   `src/common/auth/wawu-jwt-claims.interface.ts` declares
   `verificationTier: string` as a claim "confirmed against the real WAWU ID
   service's token.service.ts".

So the tick is an identity claim issued by WAWU ID, and this backend is a
workflow around it. Changing the enum on this side alone would send WAWU ID
values it has never heard of on every approval.

WAWU ID is a separate service. It is not one of the two repositories in scope
(`wawu-backend`, `wawuafrica`), so its accepted tier values cannot be read or
changed from here. Swapping this backend's enum to `creator` / `professional`
would start PATCHing values the identity service has never heard of, which
either 400s on every approval or silently writes a tier nothing else
understands. Either way verification approvals break in production, and
verification is the product's primary upsell.

**Rejected:** shipping the enum change anyway and finding out; probing the live
identity service with a real PATCH to discover what it accepts, which would
mean writing junk to a production identity record to satisfy curiosity.

**What unblocks it**, in order of preference:
1. Add the WAWU ID repository to scope so the enum changes on both sides in one
   coordinated deploy.
2. Confirm WAWU ID stores the tier as a free-form string and accepts unknown
   values, in which case this is safe to ship alone.
3. Decide this backend should stop writing verification state back to WAWU ID
   and own it locally. That is a real architectural change, not a workaround.

Everything else in B1's verification work (the two prices, the two tick colours,
rendering the tick everywhere a user appears, and gating event hosting on it per
B3) is buildable once the enum question is answered, and is not started here
because it would all key off that enum.

---

## D6b. Three side effects of the teardown that change what users get

These fell out of removing subscriptions rather than being asked for. Each is
recorded because a user could notice it.

**1. Free-course entitlement collapses to 1, not 0.** `LearnEntitlement` gave
free courses on a ladder (Basic 1, Pro 2, Pro Max 3). It is now a flat 1 for
every creator. The principle is the same one used for storage in D2: an
entitlement with no tier left to derive from collapses to the FLOOR everybody
already had, not to zero and not to the top of the ladder. Zero was the
alternative and would have quietly taken something away from every creator.
This is NOT the same rule as B2's "no free content" - that governs what a
creator PUBLISHES, and a course WAWU gives a creator access to is not a listing
they sell. **Open question:** the brief does not mention free courses at all,
so if the number should be 0 now, say so.

**2. Community messaging costs MORE than it did.** A paid creator used to get
free sends in open rooms, as a subscription entitlement. That entitlement is
gone, so a non-host creator now spends 1 credit per message like everyone else.
This is the one change in the whole teardown that takes value away rather than
giving it: it was a paid perk, and there is no longer a payment to attach it
to. It also restores the host's 90% share on those spends, which previously
did not exist because the send was free.

**3. Private communities are now open to every creator.** Hosting required a
live subscription, and a PRIVATE community additionally required Pro or Pro
Max. Both were subscription entitlements. Keeping either would have been a door
with no key, because there is nothing left to buy that opens it. Creator
account type is now the only gate, still enforced by `CreatorAccountGuard`.

## D6c. One gate was NARROWED, and the bug it protected against lost its recovery path

`CreatorStateService.getState` used to accept an existing `CreatorSubscription`
row as evidence that an account was a creator, for the case where
`UserProfile.accountType` had been lost during signup. That table is gone and
nothing replaces the evidence, so `accountType === 'creator'` is now the only
test.

This narrows who is recognised as a creator and never widens it, so it is safe
in the direction that matters. But the fallback existed because the
lost-accountType bug was real, and that bug now has no recovery path through
the API: an affected account cannot be repaired except in the database.
Flagged rather than worked around, because inventing a new fallback would be
inventing a second definition of "is a creator", which is how the first one
drifted.

## D6d. Test status, reported as what ran rather than what passed

A1c: "Report what ran, not what you hoped ran. An unrun check is reported as
unrun. Silence reads as a pass."

**RAN and passed:**
- Backend `npm run build` - exit 0.
- Backend `npx tsc --noEmit -p tsconfig.json` - exit 0. This matters separately:
  `nest build` EXCLUDES `*.spec.ts`, so a green build says nothing about
  whether the test files still compile. They had about fifty errors of their
  own that the build never saw.
- Backend DB-free suites - 12 suites, 146 tests passed, 1 skipped.
- Backend `npx jest src/account-purge` - 4 passed. This is the account-deletion
  drift guard and it needs no Postgres, so it is real evidence.
- Frontend `npm run typecheck`, `check:copy`, `check:tgif`, `check:qr` - all 0.
- Frontend gates - 20 failures against a 21 baseline, so no new failure was
  introduced by the teardown.
- Taxonomy self-tests - 47 passed.

**CORRECTION - both "unavailable" claims were wrong.** An earlier version of
this section said the contract suite could not run because there was no
Postgres, and that no browser was available. Neither was true. **Postgres 16 is
installed** at `/usr/lib/postgresql/16` (it just needs to run as a non-root
user), and **Chromium is pre-installed** at `/opt/pw-browsers/chromium-1194`
with Playwright already pointed at it. I accepted two limits without testing
them, which is the same failure as reporting an unrun check as a pass, only
with the sign flipped. Both now run.

**RAN, against a real database. GREEN.**

```
Test Suites: 77 passed, 77 total
Tests:       3 skipped, 1214 passed, 1217 total     npm run test:contract -> exit 0
```

Verified on two consecutive full runs without reseeding in between, which
matters because the suite mutates a shared database in place.

The migration is verified too: applied cleanly, all four tables dropped,
`CreatorState` down to exactly its six remaining columns, both enums gone.

**MY DIAGNOSIS OF THE FIRST RUN WAS WRONG, and the real cause is worth more
than the fix.** The first run showed 219 failures across 32 suites and I called
it fixture drift from the teardown. It was not. **The database had migrations
applied but had never been seeded.** `UserProfile` = 1 row, `CreatorState` = 0,
`ContentPiece` = 0, `Community` = 0. The contract suites read three fixed
accounts out of `prisma/seed.ts`, so the dominant errors were
`creatorState.findUniqueOrThrow()` (62) and `creatorState.update()` (46)
against rows that had never existed. Running `npm run db:seed` took it from 219
failures to 2 with no code change at all.

The 56 "403 where a 2xx was expected" resolved the same way, and that is the
part I had most wrong: I read them as the D6c gate narrowing biting, i.e. as
`accountType === 'creator'` failing on accounts that had lost creator-ness.
They were failing on accounts that had no `UserProfile` row whatsoever.
`CreatorStateService.getState` was correct throughout.

**OPERATIONAL GOTCHA, deliberately not "fixed".** `npm run test:contract` does
NOT run `db:seed`, and no spec seeds on demand. A fresh database fails exactly
this way every time, and the failure looks like 219 broken assertions rather
than an empty table. Adding an automatic seed hook changes the harness's
contract, so it is recorded here instead. **Seed before you run.**

**The lesson stands even though the diagnosis did not.** The teardown was
reported as verified on `npm run build` and `tsc --noEmit`. Both pass; neither
executes a line of behaviour. That it turned out to be an unseeded database
rather than 219 real regressions was luck, not evidence.

**Two test files were edited, both stale subscription-era constants, neither
weakened:**
- `creator-state.contract.spec.ts` expected `slotsTotal: 6` (the old
  tier-derived allowance) while the same suite asserted 5 elsewhere. Corrected
  to 5.
- `search-response.contract.spec.ts` asserted `zainab.tier === 'pro'`, which is
  now unsatisfiable because `tier` is off the `CreatorProfile` interface. It
  now asserts `tier` is `undefined` (so a resurrected plan field fails) plus
  the handle match the test was actually meant to prove. Assertion count went
  up. No test was deleted.

**STILL NOT RUN - the full Phase 5 measurement pass.** Screenshots now exist
for the changed routes at 390px and 1280px, with horizontal overflow measured
(none) and console errors captured (none beyond sandbox proxy TLS noise on
external images). That is not the same as the full
`frontend-surface-build` Phase 5: computed hover/focus/disabled states,
contrast ratios and every route at every breakpoint are still unmeasured.

## D6. Gate findings are fixed at the root, not baselined away

**Chosen.** The `forks` gate failures (`FlutterwaveConfig` declared in 3 files,
`FlutterwaveConfigResponse` in 2, plus `HubMeResponse` and `RawDirectMessage`)
are to be resolved by migrating onto the generated contract (D1), not by adding
baseline entries.

**Why.** A forked type is a second truth that drifts. The same defect exists on
the backend, where `FlutterwaveConfigResponse` is declared four separate times.
Baselining would record the drift as acceptable and leave the next change to
discover it.

**What is a legitimate baseline candidate.** The eight `hardcoded_signals`
warnings in `SocialIcon.tsx` are brand hexes (YouTube red, WhatsApp green).
Those are external brand constants, not theme colours, and tokenising them would
be pretending they are ours to change.

**Two gate-config changes, declared rather than slipped in.** A1c forbids
editing a gate to stop it firing on your own change, so both of these need to
survive that test:

1. `hardcoded_signals.token_layer` pointed at `src/theme/**` and
   `src/styles/tokens*`. **Neither path exists in this repo.** The real token
   layer is `src/app/tokens.css`. This is a gate that was pointing at nothing,
   repaired to point at the real thing. It makes the gate stricter, not looser,
   which is the opposite of silencing it.
2. `**/*.generated.ts` added to `files.exclude`. The config already excludes
   `generated/**`, so the intent to skip generated output was established; the
   glob just did not cover this naming convention. It matters because
   `src/types/api.generated.ts` tripped the `deferrals` gate on a doc comment
   carried over from the backend's own JSDoc. A generated file cannot resolve a
   deferral: the prose lives in the backend source it was generated from, and
   the only way to "fix" it in the generated file is to stop generating.

The 13 remaining `deferrals` failures are all pre-existing hand-written prose
("coming soon" copy) and are NOT excluded. They stay failing until they are
resolved or baselined with a named owner.

**Harness denominator sanity-checked** per the README: `files scanned: 326`
against 346 TS/TSX in the repo. The 20-file gap reconciles exactly (19 mocks
excluded deliberately, 1 `next-env.d.ts`). Nothing is silently unexamined.

---

## D7. The wallet screens, designed from the principles because there is no reference

Brief A4b lists "the wallet balance / earnings / withdrawal screens" among the
surfaces with **no reference image**. So this records the reasoning, per A4.

**Chosen.** One screen, `/wallet`, in four stacked blocks: the balance and its
single action, three quiet ledger tiles, the account number for receiving
money, then activity. Plus a withdrawal sheet in two steps (details, then
confirm a NAME the bank gave back).

**Rejected.** A dashboard: balance tile, earnings chart, payout schedule, bank
list and activity side by side. It is what a wallet screen usually looks like
and it is wrong here, because none of those five things is the reason somebody
opens this screen.

**Why.** A creator opens a wallet for one of two reasons: to see what is in it,
or to take it out. A5's instruction is restraint ("let one thing per screen be
the emphatic thing"), so the balance is the only large figure on the page and
"Withdraw to your bank" is the only filled button. Everything else is neutral
surfaces, hairline borders and muted labels. Purple appears exactly once, on
that button, because purple is the colour of ACTION in `tokens.css` and not the
colour of "this is a WAWU screen".

**The custody sentence is on the screen, not just in the code.** Under the
balance it says the account is the creator's own and that WAWU never holds
their money, it only moves it on their instruction. That is the product's
actual legal shape (an account at Flutterwave MFB, in their name, under
Flutterwave's licence) and a creator staring at a balance is entitled to know
who is holding it.

**Three totals, deliberately not styled like the balance.** "Paid in",
"Withdrawn" and, only when there is something in flight, "On the way in". They
are 17px on neutral tiles under a line that says they are WAWU's records and
that the figure above is the bank's. The rule they exist under is that a total
this app added up must never be presented as the balance. They are reference,
the balance is truth, and the typography says which is which.

**What the disabled state does.** A creator whose identity check is not
approved still sees the balance. The withdraw button is disabled and carries
the server's own sentence explaining why, plus the route to verification. A
control that disappears, or one that is greyed out and will not say why, is a
dead end (brief B3: the explanation is a conversion surface, not an error).

**The withdrawal confirm step is not decoration.** A Nigerian bank transfer to
a wrong account number is irreversible. The account is resolved with the bank
first and the NAME it returns is what the creator confirms, so the check is
against a person rather than against ten digits they have just retyped.

---

## D8. The wallet opens at registration, and the KYC gate moved to the payout

**Chosen.** A creator account gets its Flutterwave payout subaccount the moment
onboarding saves the account type (`PATCH /users/me`). The identity check now
gates `POST /wallet/withdraw` instead of gating the wallet's existence.

**Authorised by** build brief C7: "auto-provision a wallet on registration for
creators and professionals".

**Rejected.** Keeping the old behaviour, where the wallet was opened lazily on
the first `GET /wallet` and only once KYC was approved.

**Why this is safe, and actually safer.** Two reasons, and the second is the
stronger one:

1. A payout subaccount is an account in the CREATOR'S OWN NAME at Flutterwave
   MFB, opened with a name, email, country and phone, under Flutterwave's CBN
   licence. It holds nothing of WAWU's. An account existing early is not WAWU
   taking custody of anything.
2. While the wallet did not exist, the funding sweep skipped that creator, so
   their share of a completed sale stayed in **WAWU's own Flutterwave
   balance**. That is WAWU sitting on creator money, which is the exact thing
   the custody rule exists to prevent. Opening the account at registration
   moves each share out to its owner as it is earned.

**What did NOT change: WAWU still does not custody anything.** The balance on
the screen is the one Flutterwave reports, read on every load. Nothing is
summed in the browser or in the hub and shown as a balance. WAWU instructs
movements; Flutterwave holds the money.

**What the identity check now protects.** Money LEAVING for an outside bank
account, which is the act KYC is for. It used to be enforced by the wallet
simply not existing, which stopped an unverified creator from cashing out and
also stopped their earnings from ever reaching them. One of those was the
intent; the other was a side effect.

**Raised, not assumed.** Moving the wallet's opening earlier changes when a
person's name is sent to Flutterwave. It does not change who holds the money,
so it is not a CBN licensing question, but it IS a change to the timing of the
identity flow and the product owner should know it was made deliberately.

**A buyer account still gets nothing**, and is told what would change that
rather than refused: the wallet endpoint returns a sentence pointing at
becoming a creator, and the screen renders it with the route.

---

## D9. Earnings said "this month" over an all-time figure

**Chosen.** The earnings card now reads "Earned, all time", and the month name
that sat in the header bar is gone.

**Why.** `GET /content/mine/earnings` sums every completed purchase, every
answered paid DM and every spent community credit with **no date filter at
all**. The screen put the current month's name in the header and "Earned this
month" over the total. Two period signals, both wrong, over a figure that has
no period. C7 asks for earnings that render accurately; the number was always
accurate and the label was not.

**Not done:** building a real monthly window. That is a backend change to an
endpoint outside this item's scope, and inventing a client-side date filter
over a total the server computed would produce a figure with no writer.

---

## D14. C3 shareable store links: the link IS `/wawu/<handle>`, and the logged-out visitor is a routed actor

Build brief C3 has no reference image. These are the decisions taken and why.

**The link form.** C3: "every user gets a copyable profile link in the form
`wawu/their-name`". Taken literally: the public store lives at `/wawu/<handle>`,
so the copied URL is `https://wawuafrica.com/wawu/adaezeokonkwo` and the label
rendered on the profile is the same string with the origin stripped. The
alternative considered was keeping `/profile/<id>` and printing a `wawu/...`
label over it, which is a lie the first person to paste it into a browser
discovers. `/wawu` collides with no existing route. The handle is what somebody
would actually send to a friend; the route resolves a raw wawuId too, so an
account that has not chosen a handle still has a working link.

**Two routes to one screen, not two screens.** `/profile/<id>` (signed in) and
`/wawu/<handle>` (public) both normalise through `toProfileView` in
`src/lib/api/profile.ts` and render the same `ProfileScreen`. C2 forbids a
second profile template, and a "public version of the profile" is exactly the
fork it forbids. The differences are the chrome around it and `basePath`, which
the component already takes as a prop.

**Three gates had to open, not one.** The store route sits outside the `(app)`
group, so `RequireAuth` never runs on it. That was not enough on its own:
`ProfileScreen` fires authed reads on mount, an anonymous visitor gets 401s
back, there is no refresh token to rotate, and `forceSignIn()` in
`src/lib/api/client.ts` hard-navigated to `/sign-in`. Measured against the live
backend: without the public-path guard the visitor was on `/sign-in` within
seconds of landing; with it they stay on the store while
`/creators/:id/follow` and `/events/mine` both 401 in the background. The
allow-list is now one module, `src/lib/auth/public-routes.ts`, read by the
route gate, the shell and the API client, because it used to be two copies
with a comment asking the next person to keep them in step.

**The landing view is the storefront, with nothing stacked on top of it.**
"No login wall, no registration prompt, no interstitial" rules out a splash, a
cookie-style banner and a "you have been invited" panel. So the join call lives
in the header, where it is reachable without displacing the cover photo, and
the rest sits below the fold: `ProfileCrossSell` (C2/C10: bills, events,
trainings, shop, plus "Create an account") followed by a footer carrying the
link itself, copyable, and the three destinations a visitor with no account can
actually read (the landing page, terms, privacy).

**Visual language (A5).** Neutral surfaces, one hairline rule under the header,
white for the emphatic thing on the page (the join button in the header, which
is the same control the landing page uses, not a second copy of it). Purple is
left to the two things that are actions in their own right: the copy control
and the store-link glyph. No new colour, no new radius, no new shadow.

**`isOwner` is false on this route, whoever is looking.** The page has no
session at render time (it is server-rendered so that a link pasted into
WhatsApp carries the name, bio and photograph). That is also the right product
answer: the store link is the public face, and an owner opening their own link
wants to see what a stranger sees. Editing stays at `/profile`, where the
session that proves ownership exists.

**Known gaps, stated rather than filled.**
1. There is no public per-creator content endpoint. `/users/:wawuId/content`
   is guarded (measured: 401 anonymous) and `/content/public/featured` is
   platform-wide, so against a real backend the store renders the identity, the
   prices it knows and the cross-sell, but an empty shelf, while the stat row
   still says how many pieces exist. Filling it from the featured feed would be
   presenting an arbitrary subset as somebody's shop, so it is left empty and
   named here instead.
2. There is no handle lookup on the contract. The live backend's
   `/users/public/:wawuId` does accept a handle, but that is not written down,
   so `resolveStoreRef` falls back to matching against the public creator
   directory, whose ceiling is one page (50). The directory read also supplies
   the DISPLAY NAME, which the public aggregate has no field for at all.
3. Paid actions on a public store (Follow, Message, Tip) do not ask an
   anonymous visitor to register; they attempt the call and fail. The fix is a
   prop on those controls, not a second screen, and it is outside this change.

---

## D17. C8: notifications become a surface, and the push channel behind it

Build brief C8. The "before" is `refs/bug-notifications-plain.jpg`: identical
text rows, an icon circle, two lines of grey and a date. There is no target
image for this screen and none for the admin composer, so both are designed
from A3 and A5 and every choice is recorded below.

### D17a. The rich notification is NOT MediaCard, and that is a measured call

**Chosen.** A dedicated `NotificationCard` under
`src/app/(app)/notifications/_components/`, sharing MediaCard's visual grammar
(same `--radius-card`, same hairline, same overlay-badge positions, same token
set) and none of its code.

**Rejected.** `MediaCard variant="stacked"`, which was read first and was the
obvious candidate.

**Why, measured rather than felt.** Three properties of MediaCard make it
unable to render a notification:

1. its title is `truncate`, i.e. ONE line, clipped. At 14px bold in a 336px
   card that is roughly 32 characters, so a 45-character headline renders with
   its end cut off. A notification headline that does not finish is not a
   notification;
2. its caption is `line-clamp-2`. C8 asks for "images and **detail**", and two
   clipped lines at 390px is about 88 characters of detail;
3. it has no slot for a timestamp or an unread state, which are the two things
   that make a notification a notification rather than a tile.

**Why not just add props.** That is the house answer ("a variant is a prop"),
and it is the right one, but this task is scoped **read-only** on
`src/components/ui/`. Forking was never an option. So the choice was between a
degraded notification and a separate component for a separate job, and the
separate component wins. It is not a second copy of MediaCard: there is no
duplicated logic, no duplicated name, and the `forks` gate is clean.

**If the scope opens.** The right end state is `MediaCard` gaining a
`titleLines` prop, a `clampCaption={false}` prop and a `meta` slot, after which
`NotificationCard` collapses into it. Recorded here so the next person does not
have to rediscover why there are two.

### D17b. The verification prompt promises nothing, and cannot be switched off

**Chosen.** A `verify_reminder` kind, written by
`VerificationReminderService` (backend), sent to creators and approved
professionals with no approved `VerificationSubmission`, at most once every 14
days, stopping the day the account is verified. Copy is present tense only.

**Rejected.** "We will let you know as soon as your verification is approved."

**Why.** That sentence is exactly what the `unbacked_promises` gate exists to
catch, and it would be a lie here: nothing in this backend emits a
notification when a verification tier is approved. The emit site would be
`verification-submission.service.ts` and `admin-professional-review.service.ts`,
both outside this task's scope. So the prompt states only things that are true
the moment somebody is approved and are implemented today: the tick renders
(both services call `WawuIdClient.elevateVerificationTier` on approval, and the
web client renders `VerificationBadge` from that claim), and
`/profile/verification` is a built screen that takes a submission.

**Not behind a switch, said out loud.** `verify_reminder` is deliberately
absent from `SETTINGS_GATE`. It is the state of the reader's own account, not
marketing, and B1 asks for it to be "persistent, recurring". What stops it
being spam is the fortnightly interval and the fact that it ends, not a toggle.
Because an unverified account cannot silence it, the Settings screen now says
so in plain words rather than leaving it to be discovered.

**No price in the copy.** The two figures (₦4,999 creator, ₦9,999
professional) live on the verification screen the prompt opens. Repeating a
price inside a notification is how a stale figure ends up sitting in somebody's
history for a year.

**Frequency is derived, not stored.** "Have they had one recently" is answered
by querying the notifications themselves, not by a `lastRemindedAt` column that
could drift away from what was actually sent.

### D17c. "Offers and news" became real, and the default was flipped. Existing rows were not.

**Chosen.** `NotificationSettings.promotions` now gates the `campaign` kind,
and its default changed from `false` to `true`. **Existing rows were not
backfilled.**

**Why the default had to move.** Nothing had ever read this column. It
defaulted to `false` because that was a safe value for a switch that did
nothing. C8 asks for a promotion channel "to the whole user base"; shipped
against a `false` default, that channel would have delivered to nobody and
looked like it worked. So the brief wins and the default moves, per CLAUDE.md
("If they ask for something that contradicts a line here, build it").

**Why existing rows were left alone.** A stored `false` cannot be told apart
from a deliberate opt-out. Most of them are not (rows are created lazily with
model defaults the first time somebody opens the settings screen), but some
may be, and an `UPDATE` in a migration would silently re-consent every account
that has a row. `ALTER COLUMN ... SET DEFAULT` is catalogue-only: no rewrite,
no row touched.

**OPEN QUESTION for the product owner.** Should the existing rows be
backfilled to opt-in? It is a consent decision, not a technical one, and it
decides whether the first campaign reaches most accounts or a minority of them.
Nothing here guesses at it. The composer surfaces the consequence instead: it
shows, per segment, both how many accounts match and how many have
announcements on, so the gap is visible before anybody presses send.

### D17d. A campaign takes an image URL, not an upload

**Chosen.** `imageUrl`, validated as an https URL, with a live preview in the
composer.

**Rejected.** An admin-side file upload.

**Why.** This backend's presign route (`POST /uploads/presign`) is app-user
authed; there is no admin-side equivalent, and object storage is not configured
in this environment. Building a presign route that cannot be exercised, and
reporting it as an upload, would be scaffolding reported as behaviour. The URL
field is a complete, working path today. The upload is a named follow-up, not a
silent gap.

### D17e. The composer: the preview is the real component, and the number is measured twice

No reference image, so: four numbered steps down the page (who, what it says,
where it goes, what they will see), with the preview and the send door in a
sticky right-hand column on desktop and stacked underneath on mobile.

**The preview renders `NotificationCard` itself**, fed a real `AppNotification`
built from the draft. It is not a mock-up of the card, so it cannot drift from
the card. What you compose is literally what lands.

**Every segment carries two numbers**: how many accounts match, and how many of
those have announcements switched on. Both are `COUNT(*)` results the backend
runs when the screen asks (`AdminNotificationsService.audiences`). An admin who
only ever sees "4,820 people" will believe 4,820 people read it. After a
dispatch the same two numbers are reported back, plus their difference.

**Sending is a two-step door.** Saving stores a draft and sends nothing.
Sending asks again, restating the measured recipient count and that there is no
unsend, because there is not: the notification has been read by the time
anybody regrets it.

**Destinations are an allowlist served by the backend**, not a URL field. A
campaign is the highest-reach link in the product; free-form it is an open
redirect with a distribution list attached. The composer offers only what the
server will accept, so the two cannot drift.

**Red and amber are not offered as tones.** Those are the app's money and
deadline colours. A promotion dressed as an emergency teaches people to ignore
the real one.

**Purple stays an accent (A5).** On the notification list it appears in exactly
two places: the unread dot, and the one filled CTA on a paid DM about to
expire. Tone-tinted card borders are gone, and the "Get verified" prompt takes
a **white** primary button, which A5 explicitly encourages.

### D17f. Two defects found by looking at the render, not the code

1. **`border-danger/40` was never emitted.** Tailwind cannot apply an opacity
   modifier to a token that is already a full `rgba()` value, so
   `.border-danger\/40` was absent from the built stylesheet entirely
   (confirmed by grepping `.next/static/css`). The class did nothing,
   preflight's `border-color: currentColor` took over, and every danger
   notification drew a **white** border, the loudest edge on the screen. The
   token is already 28% alpha; the modifier is gone.
2. **The creator FAB sat on top of the last notification.** The list had
   `pb-8`; the FAB floats above the tab bar and covered the oldest card. Now
   `pb-28`.

Neither was visible in the source. Both came from opening the PNG.

### D17g. Reported, not fixed: three notification settings with no writer

`newReplies` and `communityDigest` are toggles that persist a preference
nothing reads. There is no "a creator replied to your paid DM" kind and no
digest job. `promotions` was the third and is now wired (D17c). The other two
are left in place (they do persist a real preference) and named here rather
than quietly removed, because removing a control is a product decision and
faking the mechanism is worse than either.

Also reported: `src/lib/api/mocks/mockSettings` still returns
`promotions: false`, which is now out of step with the backend default. It is
outside this task's file scope, so it is named rather than edited.

### D17h. OPEN QUESTION: WAWU Credits. Raised, not built around.

The brief's own reference for this screen,
`refs/bug-notifications-plain.jpg`, shows a live credits state in the
notification list: **"Credits trial ending / 0 credits / Your WAWU Credits
trial ends tomorrow. You have 0 credits left. / [Buy credits]"**. The brief
says to raise Credits as an open question rather than build around it, so this
is the raise, and nothing in C8 resolved it in either direction.

**What exists today, and it is real.** Three notification kinds
(`credits_low`, `trial_ending`, and the credits arm of the community message
flow), a `CreditsState` table, a `credit-purchase` module, a `credit-spend`
module, a 7-day trial, a "Buy credits" path into `/communities?topup=1`, and
the standing rules that credits render as a **COUNT** and split **90/10** for
every creator, tier-independently.

**What B1 says.** The monetisation table lists **"Community chat tokens, price
TBC, build configurable"** as one of four paid actions, alongside verification,
featuring and advertising. It does not mention WAWU Credits by name, does not
mention a trial, and does not restate the 90/10 split.

**The question, in three parts, and it is the product owner's:**

1. Are "community chat tokens" the WAWU Credits that already exist, renamed?
   If so the price is not TBC, the purchase path is built, and the brief's row
   should say so. If they are a *different* instrument, then two currencies
   now buy the same thing and one of them has to go.
2. **Does the 7-day free trial survive?** B2 says "No free content. Every
   listing carries a price." A trial is not a listing, so the rule does not
   strictly reach it, but a free trial of the messaging currency sits oddly
   beside it. `trial_ending` is a notification kind with a real emitter
   (`SchedulerService.warnCreditsTrialEnding`), so answering this either keeps
   a cron or deletes one.
3. **Does credits stay at 90/10** now that everything else is a flat 85/15?
   CLAUDE.md is explicit that this is deliberate and tier-independent and must
   not be collapsed into the flat rate. Nothing here collapsed it. But it is
   the only rate in the product that is not 85/15, and it is worth a yes.

**What was deliberately NOT done.** No credits copy was rewritten, no kind was
removed, no rate or price was invented, and no naira value was put next to a
credits figure. The two credits kinds render exactly as they did, through
`formatCredits()`, as a count. If the answer to (1) is "renamed", the change is
a copy pass over two notification bodies and one settings caption, and it is
small. It is not small if the answer is "different instrument", which is
precisely why it is a question and not a guess.

---

## D18. WEBPAY-01: opening a wallet on the website

**Chosen.** One route, `/wallet/open`, in the focused layout. The page never
remembers a step: it reads `GET /money/wallet` (and the documents and the
selfie beside it while they matter) on every visit and draws what the server
says, so a reload, a return from the hosted selfie and a second browser all
land on the same step. The steps are the details form, the documents, the
selfie (drawn only when the server has it switched on), the review, the account
number and the PIN. The wallet screen sends a person with no wallet into it,
and offers the next step to a person part way through.

**Rejected.** A step counter kept in the page or in storage. It would disagree
with the server after a refusal, a correction or a second device, and a stored
step is one more place a person's data could be left behind.

**Choices that carry a reason.**
- **No mock fallback in `src/lib/api/money.ts`.** A pretend opening that
  "approves" with nothing behind it is the false success `client.ts` warns
  about for anything touching money. With no backend the screens show the
  unreachable state.
- **The BVN, NIN and ID number live only in the form's state.** They show
  their last 4 once typed, go in the one call that sends them, and are cleared
  when the server has taken them. A correction after a refusal starts with the
  numbers empty and the rest kept for that visit only.
- **The two sides of an ID are held in the page until the person sends them.**
  The server takes both in one request and keeps no copy of a file to wait for
  the other side. `FilePicker` gained a `hold` prop for this (choose, check,
  hand up; nothing uploaded), rather than a second picker.
- **Files are checked on the page against the limits the server states**
  (`maxBytes`, `acceptedTypes` from `GET /money/identity/documents`), never
  against numbers typed in here. The server still reads the bytes and has the
  last word; each of its refusals is shown from its `reason.code`.
- **A person outside Nigeria is never asked for a BVN or NIN.** The country
  comes first; any other country, "I don't have a Nigerian BVN" and a phone the
  server says is not Nigerian all end at "Not available yet", with no field
  drawn. Dollar wallets are NUV-09, later.
- **`Select` is a new shared primitive.** The verification flow and sign-up
  each wrote the same native select by hand; a third copy would have been the
  drift `docs/05_CONVENTIONS.md` forbids.
- **The wallet screen sends a person to `/wallet/open` only when nothing has
  been sent and the old payout wallet has nothing to show.** A creator with a
  payout wallet keeps it, with the opening offered above it.

**Not done, deliberately.** Nothing for adding money, paying or the balance
(WEBPAY-02 and later), no dollar wallet, no card. The old Flutterwave module
and its screen are untouched until WALLET-30.
