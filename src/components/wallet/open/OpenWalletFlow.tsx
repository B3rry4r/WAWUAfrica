"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState, Skeleton } from "@/components/ui";
import { FlowHeader } from "@/components/layout/FlowHeader";
import {
  getIdentityDocuments,
  getLiveness,
  getMoneyWallet,
} from "@/lib/api/money";
import type { IdentityDocuments, IdentityLiveness, MoneyWallet } from "@/lib/api/money";
import {
  EMPTY_DETAILS,
  railIndexOf,
  railSteps,
  selfieNeeded,
  stageOf,
} from "@/lib/wallet-opening";
import type { DetailsForm } from "@/lib/wallet-opening";
import { AccountCard, AccountReadyStep, OnItsWayStep } from "./AccountStep";
import { DetailsStep } from "./DetailsStep";
import { DocumentsStep } from "./DocumentsStep";
import { PinStep } from "./PinStep";
import { CheckingStep, EndStep, RejectedStep } from "./ReviewStates";
import { SelfieStep } from "./SelfieStep";
import { StepFrame } from "./StepFrame";
import { StepRail } from "./StepRail";
import { Button } from "@/components/ui";

/** How often the page reads the wallet again while the review or the account number is pending. */
const POLL_MS = 8000;

/**
 * Open your wallet, on the website: the details, the documents, the selfie
 * when the server has it switched on, the review, the account number and the
 * transaction PIN.
 *
 * The step is never remembered here. It is read from the server every time
 * (`GET /money/wallet`, with the documents and the selfie beside it while they
 * matter), so a reload, a return from the hosted selfie page and a second
 * browser all land on the same step. The only things this component holds
 * are the two choices the server can't know: that the person pressed "correct
 * and send again", and that they pressed "Set my PIN".
 */
export function OpenWalletFlow() {
  const router = useRouter();
  const [wallet, setWallet] = useState<MoneyWallet | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<IdentityDocuments | null>(null);
  const [docsError, setDocsError] = useState<unknown>(null);
  const [liveness, setLiveness] = useState<IdentityLiveness | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [settingPin, setSettingPin] = useState(false);
  /** Entries kept for a correction in this visit. Never a number: the form clears those when the server takes them. */
  const [kept, setKept] = useState<DetailsForm>(EMPTY_DETAILS);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const w = await getMoneyWallet();
      if (!alive.current) return;
      setWallet(w);
      setLoadError(null);
      const stage = stageOf(w);
      // The documents and the selfie only exist once something was sent. One after the other, on purpose:
      // reading the selfie records its result, and reading the documents is what sends the opening for
      // review once both are in, so the documents are read after the selfie, never beside it.
      if (w.openingFlow === "review" && w.review && (stage === "documents" || stage === "checking")) {
        const l = await getLiveness().then(
          (value) => ({ value }),
          () => ({ value: null }),
        );
        if (!alive.current) return;
        setLiveness(l.value);
        if (stage === "documents") {
          try {
            const d = await getIdentityDocuments();
            if (!alive.current) return;
            setDocs(d);
            setDocsError(null);
            // The read may have sent the opening for review: take the wallet's word for where that leaves them.
            if (d.submitted) {
              const w2 = await getMoneyWallet();
              if (!alive.current) return;
              setWallet(w2);
            }
          } catch (e) {
            if (!alive.current) return;
            setDocsError(e);
          }
        }
      }
    } catch (e) {
      if (!alive.current) return;
      // A silent re-read that fails keeps what is on screen; only a first read is a failed load.
      if (!silent) setLoadError(e);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      if (alive.current) setRefreshing(false);
    }
  }, [load]);

  const base = wallet ? stageOf(wallet) : null;
  const stage = correcting && base === "rejected" ? "details" : settingPin && base === "account" ? "pin" : base;

  const selfieInUse = liveness?.enabled === true && liveness.state !== "not_in_use";
  const waiting = docs?.waitingFor ?? [];
  const docsPending = waiting.includes("identity") || waiting.includes("proof_of_address");
  const onSelfie = base === "documents" && selfieInUse && !docsPending && selfieNeeded(docs, liveness);

  // The page reads again by itself while a decision, the account number, a confirming upload or a selfie is pending.
  const confirming = docs?.documents.some((d) => d.state === "confirming") ?? false;
  const selfiePending = onSelfie && liveness?.state === "pending";
  const poll = base === "checking" || base === "approved" || (base === "documents" && (confirming || selfiePending));
  useEffect(() => {
    if (!poll) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [poll, load]);

  // A move to a new stage by the server starts that stage clean.
  useEffect(() => {
    if (base !== "rejected") setCorrecting(false);
    if (base !== "account") setSettingPin(false);
  }, [base]);

  // A new step starts at its top: the long details form leaves the page scrolled to its foot, and the
  // next step would otherwise open half way down. On a phone the page scrolls; from `xl` up the content
  // sits in the shell's own scroll area, so every scrolled ancestor is returned to the top.
  const root = useRef<HTMLDivElement>(null);
  const stepKey = `${stage ?? ""}:${onSelfie ? "selfie" : ""}`;
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0 });
    for (let el = root.current?.parentElement ?? null; el; el = el.parentElement) {
      if (el.scrollTop > 0) el.scrollTop = 0;
    }
  }, [stepKey]);

  // Leaving: the wallet screen is where an opening that is under way is picked up again. A person who has
  // sent nothing and can't open a wallet here (outside Nigeria, no Nigerian BVN) is sent to Home instead,
  // because the wallet screen would send them straight back into this page.
  const leave = useCallback(() => router.push("/wallet"), [router]);
  const leaveToHome = useCallback(() => router.push("/home"), [router]);
  // The back arrow goes where the person came from; with no history (a link opened directly) it goes to the
  // same place "leave" does.
  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else if (base === "details") leaveToHome();
    else leave();
  }, [router, base, leave, leaveToHome]);
  const steps = useMemo(() => railSteps(selfieInUse), [selfieInUse]);

  const showRail = stage !== null && !["unavailable", "stopped", "frozen", "done"].includes(stage);
  const title = stage === "done" ? "Your wallet" : "Open your wallet";

  const header = (
    <FlowHeader
      title={title}
      onBack={correcting ? () => setCorrecting(false) : settingPin ? () => setSettingPin(false) : goBack}
    />
  );

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className="flex flex-1 flex-col gap-[14px] px-[20px] pt-[20px] xl:px-0">
        <Skeleton className="!h-[26px] !w-[60%]" />
        <Skeleton className="!h-[52px]" />
        <Skeleton className="!h-[52px]" />
        <Skeleton className="!h-[90px]" />
      </div>
    );
  } else if (loadError || !wallet || !stage) {
    body = <ErrorState error={loadError} title="We couldn't load your wallet" onRetry={() => void load()} />;
  } else {
    switch (stage) {
      case "unavailable":
        body = (
          <EndStep
            icon="Wallet"
            title="Not available right now"
            body="You can't open a wallet from this page at the moment. Please try again later."
            onLeave={leave}
          />
        );
        break;
      case "details":
        body = (
          <DetailsStep
            key={correcting ? "correct" : "first"}
            initial={kept}
            reasons={correcting ? (wallet.review?.reasons ?? null) : null}
            onSent={(w, k) => {
              setKept(k);
              setCorrecting(false);
              setWallet(w);
              setDocs(null);
              void load(true);
            }}
            onLeave={leaveToHome}
          />
        );
        break;
      case "documents":
        if (docsError && !docs) {
          body = <ErrorState error={docsError} title="We couldn't load your documents" onRetry={() => void load()} />;
        } else if (!docs) {
          body = (
            <div className="flex flex-1 flex-col gap-[14px] px-[20px] pt-[20px] xl:px-0">
              <Skeleton className="!h-[26px] !w-[60%]" />
              <Skeleton className="!h-[180px]" />
              <Skeleton className="!h-[140px]" />
            </div>
          );
        } else if (onSelfie && liveness) {
          body = <SelfieStep liveness={liveness} onRefresh={refresh} />;
        } else {
          body = <DocumentsStep docs={docs} onDocs={setDocs} onRefresh={refresh} />;
        }
        break;
      case "checking":
        body = <CheckingStep selfieInUse={selfieInUse} checking={refreshing} onCheck={refresh} onLeave={leave} />;
        break;
      case "rejected":
        body = wallet.review ? <RejectedStep review={wallet.review} onCorrect={() => setCorrecting(true)} /> : null;
        break;
      case "stopped":
        body = (
          <EndStep
            icon="ShieldAlert"
            title="We can't open your wallet"
            body="Your request was stopped during review. Contact support and we'll help you from here."
            onLeave={leave}
            support
          />
        );
        break;
      case "approved":
        body = <OnItsWayStep checking={refreshing} onCheck={refresh} onLeave={leave} />;
        break;
      case "account":
        body = wallet.account ? (
          <AccountReadyStep account={wallet.account} onSetPin={() => setSettingPin(true)} />
        ) : (
          <OnItsWayStep checking={refreshing} onCheck={refresh} onLeave={leave} />
        );
        break;
      case "pin":
        body = (
          <PinStep
            onSet={() => {
              setSettingPin(false);
              void load(true);
            }}
          />
        );
        break;
      case "done":
        body = (
          <StepFrame
            footer={
              <Button full size="lg" href="/wallet">
                Go to your wallet
              </Button>
            }
          >
            <div className="flex flex-col items-center gap-[14px] px-[12px] py-[10px] text-center">
              <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">Your wallet is open</h2>
              <p className="m-0 max-w-[36ch] text-[15px] leading-[1.55] text-[var(--text-secondary)]">
                Your PIN is set. You can add money and pay from it.
              </p>
            </div>
            {wallet.account ? <AccountCard account={wallet.account} /> : null}
          </StepFrame>
        );
        break;
      case "frozen":
        body = (
          <EndStep
            icon="Snowflake"
            title="Your wallet is on hold"
            body="We've put your wallet on hold. Contact support and we'll help you from here."
            onLeave={leave}
            support
          />
        );
        break;
    }
  }

  return (
    <div ref={root} className="mx-auto flex min-h-[100dvh] w-full max-w-[var(--mobile-column)] flex-col xl:min-h-0 xl:max-w-[760px]">
      {header}
      {showRail ? <StepRail steps={steps} current={railIndexOf(stage === "pin" ? "account" : stage, onSelfie, selfieInUse)} /> : null}
      {body}
    </div>
  );
}
