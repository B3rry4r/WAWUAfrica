# Repair order — WAWU family, 2026-08-31

Ranked by **user-visible harm**, not by ease (law 5). Opening damage: **175
findings** across four repos, un-baselined. Of those, 173 are now baselined with
an owner and a reason; the two below are real defects that must not be baselined
away.

---

## Tier 1 — a promise nothing implements

> *A wrong number is an error. A guarantee nothing implements is a promise to a
> customer that nobody discovers is empty until it is relied on.* — LESSONS § V.2

### R1. "We will notify you" — nothing ever will  🔴 CONFIRMED

| | |
|---|---|
| **Where** | `WAWU-Web/src/components/kyc/KycFlow.tsx:709` |
| **Class** | POST-MORTEM **B** — declared by one role, written by nobody |
| **Owner** | next backend pass |

The KYC screen tells a creator they will be notified when their submission is
reviewed. Traced writer → store → reader:

- `NotificationKind` **declares** `'kyc_verified'` (`notification-event.ts:26`)
- The web client **renders** it (`notifications/page.tsx:199`)
- `KycSubmissionService.review()` writes the submission status and
  `CreatorState.kycStatus`, then returns — **it emits nothing**
- `grep "kind: 'kyc_verified'"` across the backend: **0 writers**

A creator submits KYC, is approved, and is never told. KYC is Gate 2 — the gate
on being paid — so the person waiting on it has the strongest possible reason to
expect the notification the screen promised.

**Fix:** emit `kyc_verified` from the review transition. Do **not** drain this by
editing the copy — the notification kind and its renderer both already exist;
only the write is missing.

**Same root cause, same fix location:** `'content_rejected'` also has **0
writers** while the client renders it. An admin rejects a creator's upload and
the creator is never told — they see a returned slot and no reason.

---

## Tier 2 — a read path serving fixture data on a live screen

### R2. Partner-service apply page renders a hardcoded fixture  🔴 CONFIRMED

| | |
|---|---|
| **Where** | `WAWU-Web/src/app/(app)/services/[id]/apply/page.tsx:5,28` |
| **Class** | POST-MORTEM **B** + LESSONS § V.1 |
| **Owner** | next frontend pass |

```ts
import { MOCK_SERVICES } from "@/lib/api/mocks/services";
const service = MOCK_SERVICES.find((s) => s.id === kind);
```

Imported **unconditionally** — not behind `isMockModeError`, not behind
`USE_MOCKS`, unlike every other read in `src/lib/api`. What it renders:

- `service.name` — the page heading
- `service.partner` — **a named third-party company**
- `service.blurb` — the description
- `service.eligibility[]` — **eligibility criteria shown to an applicant**
- *"{partner} reviews your request and onboards you directly"* — a claim about
  what a named third party does

`GET /partner-services` and `GET /partner-services/:id` **exist on the backend**
and are never called. The eligibility list is the sharp end: it tells someone
whether they qualify, from invented rules.

**Fix:** read the real endpoint. There is no web-side reader at all today —
`src/lib/api/lifestyle.ts` exports no partner-service getter.

---

## Tier 3 — misleading, not wrong

### R3. Live comment state typed as `MockComment`

`WAWU-Web/src/app/(app)/content/[id]/page.tsx:28,76,705`

Comments **are** fetched for real. The in-code comment says a prior version
initialised from a shared fixture and that it was fixed — **verified true**
(law 7: the claim was checked, not accepted). Only the exported *type* still
lives in `src/lib/api/mocks/mockComments.ts`, which trips the gate and misleads
the next reader.

**Fix:** move the interface to `src/types/`. No behaviour change.

---

## Not defects — verified, then baselined

- **62 `fake_data` in Hub-API** — DI-token Flutterwave doubles.
  `shouldUseMockFlutterwave()` **throws** on a production boot with no real key.
  Confirmed empirically: the live droplet refused to start until a real
  `FLWSECK` was present.
- **30 `deferrals` in Hub-API** — explanatory prose, not open items. Sampled 10.
  The one that read as a real defect — *"the 402 gate is never reached, so a host
  can never be locked out"* (`community-message.service.ts:359`) — was **read and
  verified correct**: that branch is entitled-send, and a host being unable to
  lock themselves out of their own room is the intent.
- **65 `wire_types`** — the gate shipped pointing at `src/data/**`, `src/api/**`.
  This family uses `src/common/types/**` and `src/lib/api/**`. **Config fixed
  rather than baselined** — 65 → 9. Baselining a misconfigured gate would have
  buried the real findings under noise.

## Gate limitation found

`fake_data`'s `allow_paths` is an **exact string match**, not a glob
(`checks/fake_data.py:38`, `if rel in allow`). It cannot express "every mock
adapter", so those findings had to be baselined rather than allow-listed. The
gate was **not** edited to silence them (harness rule).
