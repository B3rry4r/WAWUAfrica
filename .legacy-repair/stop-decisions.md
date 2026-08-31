# Decisions for the owner — not acted on under this skill's authority

Law 10: repair has a floor. These are reported, with evidence, and left alone.

---

## D1. "We will email you to arrange the in-person consultation" — no mail transport exists

**Where:** `WAWU-Web/src/app/(app)/services/legal/page.tsx:337`
**Class:** LESSONS § V.2 — a guarantee nothing implements

The Hub API cannot send email. Not "the template is missing" — there is no
transport:

```
grep -rl "resend|nodemailer|sendMail|MailService" WAWU-Hub-API/src   ->  (nothing)
```

WAWU-ID has Resend wired (`RESEND_API_KEY`, `MailService`). The Hub API, which
owns legal consultations, has nothing. So a user books an in-person legal
consultation, is told they will be emailed, and **no code anywhere will email
them**. The only record is a row an operator has to think to look at.

**Three options, and this is the owner's call, not mine:**

1. **Give the Hub API a mail transport** and emit on the booking. Largest, and
   makes the promise true. WAWU-ID's Resend setup is the obvious model.
2. **Have the Hub API ask WAWU-ID to send it.** WAWU-ID already has the
   transport and the templates, and the two services already talk over an
   internal service key. Smallest change that makes the sentence true.
3. **Change the sentence** to what actually happens — "a consultant will
   contact you" — and make sure an operator is genuinely watching that queue.

**Not done here** because all three are product decisions about what WAWU
promises a paying customer, and the cheap one (edit the copy) is the one that
looks like a fix while removing the evidence that anything was wrong.

---

## D2. Not a stop-decision, but recorded: the dashboard is undeployed

`WAWUAfrica-Dashboard` scores lowest on damage (6 findings, 0.4/KLOC) and is
the only surface that can upload shop stock or work the dispatch queue. It is
not deployed anywhere. Its seam is therefore entirely unproven — Phase 4 could
not reach it. That is a gap in coverage, not a defect found.
