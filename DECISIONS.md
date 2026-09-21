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
