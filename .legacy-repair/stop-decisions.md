# Decisions for the owner — not acted on under this skill's authority

Law 10: repair has a floor. These are reported, with evidence, and left alone.

---

## D1. RESOLVED — this was never a stop-decision

I filed the unbacked email promise here as three options for the owner. That
was wrong, and the owner said so. Law 3 and Phase 3 both state plainly what to
do when nothing implements a claim: **omit it, keep the surrounding element,
file the gap.** stop-decisions.md is for deleting or rebuilding a whole
SURFACE, not for a sentence with no mechanism behind it.

Removed from five places, not the one the gate found:

| where | was |
|---|---|
| `services/legal/page.tsx` toast | promised an email to arrange the consultation |
| `services/legal/page.tsx` delivery notice | sent the customer to their inbox for the documents |
| `legal.service.ts` response message | the API served the same promise on the wire |
| `legal-catalogue.ts`, `availability.ts`, `legal.dto.ts` | comments asserting the same thing |

**And it turned up a real defect while looking.** `deliverableUrl` is written
when an operator marks a request delivered, returned by the API, and typed by
the web client — then rendered NOWHERE. The customer's finished legal document
was sitting on the response while the screen sent them to an inbox that would
never receive anything. Written by one role, read by none: POST-MORTEM class B.

The page now renders the document link. The copy states what actually happens
instead of promising a mechanism that does not exist, and the outcome is
better than the promise was.

**The gap stays filed:** the Hub API still has no mail transport. That is a
capability it lacks (repair-order.md R4) — not a decision blocking this pass.

## D2. Not a stop-decision, but recorded: the dashboard is undeployed

`WAWUAfrica-Dashboard` scores lowest on damage (6 findings, 0.4/KLOC) and is
the only surface that can upload shop stock or work the dispatch queue. It is
not deployed anywhere. Its seam is therefore entirely unproven — Phase 4 could
not reach it. That is a gap in coverage, not a defect found.
