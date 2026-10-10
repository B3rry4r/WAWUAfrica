"use client";

import { useState } from "react";
import { Button, Callout, Icon } from "@/components/ui";
import { describeError } from "@/lib/api/errors";
import { reasonCodeOf, retryAfterOf, startLiveness } from "@/lib/api/money";
import type { IdentityLiveness } from "@/lib/api/money";
import { refusalWords } from "@/lib/wallet-opening";
import { StepFrame } from "./StepFrame";

export interface SelfieStepProps {
  liveness: IdentityLiveness;
  /** Read the selfie's result (and the wallet) again. */
  onRefresh: () => Promise<void>;
}

const WORDS: Record<string, { title: string; body: string; action: string }> = {
  not_started: {
    title: "One quick selfie",
    body: "You'll finish this on a secure page. When you're done, you'll come back here.",
    action: "Open the secure page",
  },
  pending: {
    title: "Finish your selfie",
    body: "You started it on a secure page. Finish it there, then come back here.",
    action: "Back to the secure page",
  },
  not_passed: {
    title: "That selfie wasn't approved",
    body: "Try again in good light, with your whole face in the picture and nothing covering it.",
    action: "Try the selfie again",
  },
  expired: {
    title: "The secure page timed out",
    body: "It only stays open for a short while. Start again, you'll come back here when it's done.",
    action: "Start again",
  },
};

/**
 * The selfie step, drawn only when the server has the hosted selfie switched
 * on. The check itself happens on the identity partner's secure page: this
 * step only says so ("You'll finish this on a secure page"), sends the person
 * there with a way back to this same address, and reads the result when they
 * return. Nothing about the picture, the face or a score is read here.
 */
export function SelfieStep({ liveness, onRefresh }: SelfieStepProps) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<{ title: string; body: string } | null>(null);
  const words = WORDS[liveness.state] ?? WORDS.not_started;
  const waiting = liveness.state === "pending" && liveness.url;

  const go = async () => {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    try {
      // A running session answers its own page again (nothing new is started), so this is safe on a return.
      if (waiting && liveness.url) {
        window.location.assign(liveness.url);
        return;
      }
      const started = await startLiveness(`${window.location.origin}/wallet/open`);
      if (started.url) {
        window.location.assign(started.url);
        return;
      }
      await onRefresh();
    } catch (e) {
      const code = reasonCodeOf(e);
      const said = refusalWords(code, retryAfterOf(e));
      if (code === "selfie_not_available" || code === "documents_closed") {
        await onRefresh();
      } else if (said) {
        setProblem(said);
      } else {
        const d = describeError(e);
        setProblem({ title: d.title, body: d.body });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepFrame
      stickyFooter
      footer={
        <>
          <Button full size="lg" iconRight="ExternalLink" loading={busy} onClick={() => void go()}>
            {words.action}
          </Button>
          {waiting ? (
            <Button full variant="ghost" disabled={busy} onClick={() => void onRefresh()}>
              I&apos;ve finished, check again
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[24px] font-bold tracking-[-0.025em]">Your selfie</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
          A last check that you are the person on your ID.
        </p>
      </div>

      <section className="flex flex-col items-center gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-[20px] py-[32px] text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name={liveness.state === "not_passed" ? "RotateCw" : "ScanFace"} size={30} color="var(--decor-icon)" strokeWidth={1.8} />
        </span>
        <h3 className="m-0 text-[18px] font-semibold">{words.title}</h3>
        <p className="m-0 max-w-[38ch] text-[14px] leading-[1.5] text-[var(--text-secondary)]">{words.body}</p>
      </section>

      {problem ? (
        <Callout tone="danger" title={problem.title} full>
          {problem.body}
        </Callout>
      ) : null}
    </StepFrame>
  );
}
