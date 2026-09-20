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

**Why it stopped.** The resulting tier is not owned by this backend. It is
pushed to the external WAWU ID identity service:

```
PATCH {WAWU_ID}/internal/users/:userId/verification-tier   { tier }
        - src/common/auth/wawu-id.client.ts, elevateVerificationTier()
```

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
