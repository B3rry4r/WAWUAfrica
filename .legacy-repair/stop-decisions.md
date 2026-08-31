# Decisions for the owner — not acted on under this skill's authority

Law 10: repair has a floor. These are reported, with evidence, and left alone.

---

## D1. RESOLVED — was not a stop-decision

I filed the unbacked "We will email you" promise here as three options for the
owner. That was wrong. Law 3 and Phase 3 both say plainly what to do when
nothing implements a claim: **omit it, keep the surrounding element, file the
gap.** stop-decisions.md is for deleting or rebuilding a whole SURFACE, not for
a sentence with no mechanism behind it.

The claim is removed from both sides — the web toast and the backend's own
response message, which carried the same false promise. The confirmation
element stays; the copy now states what actually happens (the request enters
the legal ops queue at GET /legal/ops/requests, which a consultant works).

The gap remains filed: the Hub API still has no mail transport. That is a
capability it lacks, recorded in repair-order.md R4 — not a decision blocking
this pass.

## D2. Not a stop-decision, but recorded: the dashboard is undeployed

`WAWUAfrica-Dashboard` scores lowest on damage (6 findings, 0.4/KLOC) and is
the only surface that can upload shop stock or work the dispatch queue. It is
not deployed anywhere. Its seam is therefore entirely unproven — Phase 4 could
not reach it. That is a gap in coverage, not a defect found.
