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

## Open — needs your decision
- [ ] Bottom nav: you want Settings in the bar and Profile inside it. CLAUDE.md
      marks the 5-slot nav as LOCKED (Home · Communities · Explore/Create ·
      Messages · Profile). Flagging rather than silently changing a locked
      rule. Say go and I swap slot 5 to Settings.
- [ ] "Jobs" and "Wallets" in the Access-to list: both cut by name in
      docs/01_SPEC.md (line 120; section 3 on Credits not being a wallet).
      Held out pending your call.

## Blocked on you (external)
- [ ] Flutterwave Bills: "Please enable IP Whitelisting". Needs enabling on the
      account plus a static egress IP. WAWUPay cannot complete a real bill.
- [ ] Prices for the simple legal services (CAC, tax registration, NDPR filing).
- [ ] WAWUGo / Travel and Music licensing partner APIs.
- [ ] The new backend still sends NO email (no mailer dependency). Purchases,
      KYC outcomes, legal deliverables and bill receipts notify nobody.
