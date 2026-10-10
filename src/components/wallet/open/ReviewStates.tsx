"use client";

import type { ReactNode } from "react";
import { Button, Icon } from "@/components/ui";
import type { IconName } from "@/components/ui";
import type { WalletReview } from "@/lib/api/money";
import { StepFrame } from "./StepFrame";

type RowState = "done" | "now" | "later";

function ChecklistRow({ state, children }: { state: RowState; children: ReactNode }) {
  return (
    <li className="flex items-center gap-[12px]">
      <span
        className={[
          "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border",
          state === "done"
            ? "border-success bg-[var(--success-tint)]"
            : state === "now"
              ? "border-[var(--border-selected)] bg-[var(--selected-tint)]"
              : "border-hairline bg-[var(--surface-tag)]",
        ].join(" ")}
      >
        {state === "done" ? (
          <Icon name="Check" size={14} strokeWidth={3} color="var(--success)" />
        ) : state === "now" ? (
          <Icon name="Loader2" size={14} strokeWidth={2.6} color="var(--accent)" className="[animation:wawuSpin_900ms_linear_infinite]" />
        ) : null}
      </span>
      <span
        className={`text-[14px] ${state === "now" ? "font-semibold text-[var(--text-primary)]" : state === "done" ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}
      >
        {children}
      </span>
    </li>
  );
}

function Badge({ icon, tone }: { icon: IconName; tone: "warning" | "success" | "danger" | "neutral" }) {
  const t = {
    warning: ["border-warning", "bg-[var(--warning-tint)]", "var(--warning)"],
    success: ["border-success", "bg-[var(--success-tint)]", "var(--success)"],
    danger: ["border-danger", "bg-[var(--danger-tint)]", "var(--danger)"],
    neutral: ["border-[var(--border-decor)]", "bg-[var(--decor-tint)]", "var(--decor-icon)"],
  }[tone];
  return (
    <span className={`grid h-[88px] w-[88px] place-items-center rounded-full border ${t[0]} ${t[1]}`}>
      <Icon name={icon} size={36} strokeWidth={2.2} color={t[2]} />
    </span>
  );
}

export interface CheckingStepProps {
  selfieInUse: boolean;
  checking: boolean;
  onCheck: () => Promise<void>;
  onLeave: () => void;
}

/** "Checking your details": the opening is with the review. The page reads the wallet again by itself. */
export function CheckingStep({ selfieInUse, checking, onCheck, onLeave }: CheckingStepProps) {
  return (
    <StepFrame
      footer={
        <>
          <Button full size="lg" variant="secondary" icon="RefreshCw" loading={checking} onClick={() => void onCheck()}>
            Check again
          </Button>
          <Button full variant="ghost" onClick={onLeave}>
            Back to your wallet
          </Button>
        </>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-[18px] px-[12px] py-[20px] text-center">
        <Badge icon="Clock" tone="warning" />
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">Checking your details</h2>
        <p className="m-0 max-w-[34ch] text-[15px] leading-[1.55] text-[var(--text-secondary)]">
          This can take a little while. You can leave this page. We&apos;ll send you a notification when there is a decision.
        </p>
        <ul className="m-0 mt-[6px] flex w-full max-w-[420px] list-none flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[18px] text-left">
          <ChecklistRow state="done">Details sent</ChecklistRow>
          <ChecklistRow state="done">Documents sent</ChecklistRow>
          {selfieInUse ? <ChecklistRow state="done">Selfie done</ChecklistRow> : null}
          <ChecklistRow state="now">Review in progress</ChecklistRow>
          <ChecklistRow state="later">Your account number</ChecklistRow>
        </ul>
      </div>
    </StepFrame>
  );
}

export interface RejectedStepProps {
  review: WalletReview;
  onCorrect: () => void;
}

/** The review said no: the reason, what to fix, and the way to correct it and send again. */
export function RejectedStep({ review, onCorrect }: RejectedStepProps) {
  return (
    <StepFrame
      footer={
        <>
          {review.canResubmit ? (
            <Button full size="lg" iconRight="ArrowRight" onClick={onCorrect}>
              Correct and send again
            </Button>
          ) : null}
          <Button full variant="ghost" href="mailto:support@wawuafrica.com">
            Contact support
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-[18px] px-[12px] py-[20px] text-center">
        <Badge icon="CircleAlert" tone="danger" />
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">We couldn&apos;t verify your details</h2>
      </div>
      <div className="flex flex-col gap-[12px]">
        {review.reasons.length === 0 ? (
          <p className="m-0 rounded-[var(--radius-card)] border border-danger bg-[var(--danger-tint)] p-[16px] text-[14px] leading-[1.5]">
            Our review didn&apos;t record a reason. Check your details against your documents and send them again.
          </p>
        ) : (
          review.reasons.map((r) => (
            <section
              key={r.code}
              className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-danger bg-[var(--danger-tint)] px-[18px] py-[16px] text-left"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-danger">Reason</span>
              <span className="text-[14px] leading-[1.5] text-[var(--text-primary)]">{r.message}</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">What to fix</span>
              <span className="text-[14px] leading-[1.5] text-[var(--text-primary)]">{r.fix}</span>
            </section>
          ))
        )}
      </div>
      {review.canResubmit ? (
        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
          You&apos;ll check your details first, then send a new document if one is asked for.
        </p>
      ) : null}
    </StepFrame>
  );
}

export interface EndStepProps {
  icon: IconName;
  title: string;
  body: string;
  onLeave: () => void;
  leaveLabel?: string;
  support?: boolean;
}

/** A step with nothing more to do here: the account is on hold or stopped, or opening isn't available. */
export function EndStep({ icon, title, body, onLeave, leaveLabel = "Back to your wallet", support = false }: EndStepProps) {
  return (
    <StepFrame
      footer={
        <>
          <Button full size="lg" onClick={onLeave}>
            {leaveLabel}
          </Button>
          {support ? (
            <Button full variant="ghost" href="mailto:support@wawuafrica.com">
              Contact support
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-[18px] px-[12px] py-[30px] text-center">
        <Badge icon={icon} tone="neutral" />
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">{title}</h2>
        <p className="m-0 max-w-[36ch] text-[15px] leading-[1.55] text-[var(--text-secondary)]">{body}</p>
      </div>
    </StepFrame>
  );
}

export { Badge as StatusBadge, ChecklistRow };
