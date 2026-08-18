# Open tasks — running list

Kept on disk so nothing is lost between messages. Updated as work lands.

## Done and deployed
- [x] Stickers made visible (20% mobile / 28% desktop, 4 on mobile)
- [x] Quick Services section on landing, right after the hero
- [x] "Financial Services" renamed to "Lifestyle Services"
- [x] 25-category taxonomy, one source of truth, validated server-side
- [x] Every category has a create point (mobile + desktop wizard)
- [x] Ranking algorithm (engagement decayed by age; trending/recent/top)
- [x] WAWUPay backend + screen (Flutterwave Bills)
- [x] WAWUCare backend + screen (WellaHealth)
- [x] WAWU Legal backend + screen (2 paths, consultation fees, contract signing)

## Done, pending deploy
- [x] Simple legal services with no price -> "agreed after review" state
- [x] Document intake for legal services that require documents
- [x] Landing separated from app: `/` is always landing, app home is `/home`
- [x] Landing header offers "Open app" when signed in
- [x] In-app access points: services page, Explore rows, desktop sidebar
- [x] Legacy services ported: EasyBuy, Pension, Banking, Grants (plain names,
      real partners: CredPal, ARM Pension, WEMA Bank) + shared apply form
- [x] Uploads bucket CORS (was completely unset; broke every browser upload)
- [x] KYC "not started" no longer reported as "in review"
- [x] Subscription: pre-checkout review screen removed, pay opens checkout directly
- [x] "Confirming your payment" now waits for a real charge instead of showing
      before the modal opens
- [x] Creator onboarding no longer caps content prices ("You set the price")

## Done, pending deploy (continued)
- [x] Loading state on checkout entry points; Flutterwave script preloaded when
      app chrome mounts so Pay opens the modal immediately
- [x] Accessible sign-out: desktop sidebar + profile screen (was Settings only)
- [x] Trademarked (R) logo installed everywhere: wawu-logo-white/dark,
      wawu-icon-white/dark, plus SVGs
- [x] Branded email header regenerated with the new mark (public/email-header.png)
- [x] WAWU-ID email header repointed off the legacy production.wawuafrica.com
      domain (code default + EMAIL_HEADER_URL in production)

## Blocked: Railway will not deploy
- [ ] Four consecutive deploys of wawu-web and wawu-api sat in INITIALIZING for
      7+ minutes and then FAILED, with no build logs produced at all. Builds are
      not being picked up. Everything above is committed locally and typechecks
      and lints clean, but is NOT live yet.

## Needs a decision from you
- [ ] The new backend (wawu-api) sends NO email at all: no mailer dependency
      exists. Purchases, KYC outcomes, legal deliverables and bill receipts
      currently notify nobody. WAWU-ID sends auth mail only (Resend).
- [ ] DM price cap of NGN 50-500 is enforced server-side and written into
      docs/01_SPEC.md line 23 and docs/02_TECHNICAL_CONTEXT.md. Your boss says
      creators set their own rates. Removing it contradicts the locked spec, so
      flagging rather than silently changing. Confirm and I lift the ceiling.

## Blocked on you (external)
- [ ] Flutterwave Bills API: "Please enable IP Whitelisting". Needs enabling on
      the Flutterwave account plus a static egress IP. WAWUPay cannot complete a
      real bill until then.
- [ ] Prices for the simple legal services (CAC, tax registration, NDPR filing,
      business name reservation). Null today, so they route through "we quote it".
- [ ] WAWUGo (flights) and music licensing: awaiting partner APIs.
