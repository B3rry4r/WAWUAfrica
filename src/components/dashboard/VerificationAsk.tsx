"use client";

import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { KycStatus } from "@/types/account";

/**
 * The one place the verification ask is worded and styled.
 *
 * Two gates, and they are INDEPENDENT (CLAUDE.md, docs/01_SPEC.md): the paid
 * subscription unlocks uploading, manual KYC unlocks getting paid. Nothing
 * here blocks anything — every surface that uses this stays fully usable while
 * verification is unstarted, in review or rejected. It is an ask, not a wall.
 *
 * Copy rule: never imply a review is under way for somebody who has never
 * submitted. "Held, not payable yet ... as soon as verification clears" was
 * being shown to creators who had never once been asked to verify, which read
 * as the product losing their money to a process they could not see.
 */
type Tone = "accent" | "warning" | "danger";

interface VerificationCopy {
  tone: Tone;
  icon: IconName;
  /** Banner headline. States the situation, not a vague "action needed". */
  headline: string;
  /** Banner body. Always names the two gates and which one this is. */
  body: string;
  /** Button label, same wherever the ask appears. */
  cta: string;
  /** Sits inside the earnings card, under "Held, not payable yet". */
  heldNote: string;
}

const COPY: Record<Exclude<KycStatus, "approved">, VerificationCopy> = {
  not_started: {
    tone: "accent",
    icon: "ShieldAlert",
    headline: "You have not started verification yet",
    body:
      "Your subscription unlocked uploading. Verification is a separate step, and it is the one that lets us pay you. Takes a few minutes, reviewed in 1 to 3 days.",
    cta: "Start verification",
    heldNote:
      "You have not started verification yet — it is what releases this to your bank account. Nothing you earn is lost while it sits here.",
  },
  pending: {
    tone: "warning",
    icon: "Clock",
    headline: "Verification is in review",
    body:
      "Usually 1 to 3 days. Keep uploading and selling — the only thing waiting is the payout, and everything you earn is held for you until it clears.",
    cta: "Check status",
    heldNote:
      "Your verification is in review, usually 1 to 3 days. This is released to your bank account as soon as it clears.",
  },
  rejected: {
    tone: "danger",
    icon: "TriangleAlert",
    headline: "Verification was not approved",
    body:
      "You can still upload and sell. Nothing you have earned is lost — send your ID again and we will look at it.",
    cta: "Resubmit verification",
    heldNote:
      "Your verification was not approved, so this cannot be paid out yet. Nothing is lost — send your ID again and we will look at it.",
  },
};

export function verificationCopy(status: KycStatus): VerificationCopy | null {
  return status === "approved" ? null : COPY[status];
}

const toneClass: Record<Tone, { panel: string; chip: string; iconColor: string }> = {
  accent: {
    panel: "bg-[var(--accent-tint-strong)] border-[var(--accent)]",
    chip: "bg-[var(--accent)]",
    iconColor: "var(--text-on-accent)",
  },
  warning: {
    panel: "bg-[var(--warning-tint)] border-[var(--warning)]",
    chip: "bg-[var(--warning)]",
    iconColor: "var(--text-on-light)",
  },
  danger: {
    panel: "bg-[var(--danger-tint)] border-[var(--danger)]",
    chip: "bg-[var(--danger)]",
    iconColor: "var(--text-on-accent)",
  },
};

/**
 * The loud version. A solid tinted panel with a full-strength border, a filled
 * icon chip and a real primary button — deliberately not the low-contrast
 * tinted strip this replaces, which creators reported not noticing at all.
 * Renders at EVERY breakpoint; never put it inside an `xl:hidden` container.
 */
export function VerificationBanner({ status, className = "" }: { status: KycStatus; className?: string }) {
  const copy = verificationCopy(status);
  if (!copy) return null;
  const tone = toneClass[copy.tone];
  return (
    <div
      className={`flex flex-col gap-[14px] rounded-[var(--radius-card)] border p-[16px] shadow-float xl:flex-row xl:items-center xl:gap-[18px] xl:p-[18px] ${tone.panel} ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-[12px] xl:items-center">
        <span className={`grid h-[40px] w-[40px] shrink-0 place-items-center rounded-[13px] ${tone.chip}`}>
          <Icon name={copy.icon} size={20} strokeWidth={2.4} color={tone.iconColor} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <span className="text-[15.5px] font-bold tracking-[-0.01em] leading-[1.25] text-[var(--text-primary)]">
            {copy.headline}
          </span>
          <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">{copy.body}</span>
        </div>
      </div>
      <Button href="/kyc" full iconRight="ArrowRight" className="shrink-0 xl:w-auto">
        {copy.cta}
      </Button>
    </div>
  );
}

/**
 * The quiet version, for inside an earnings card that already says "Held, not
 * payable yet". The card must carry the way out itself — pointing at a notice
 * somewhere else on the page is what made the held state feel like a dead end.
 */
export function HeldPayoutNote({ status, className = "" }: { status: KycStatus; className?: string }) {
  const copy = verificationCopy(status);
  if (!copy) return null;
  return (
    <div className={`flex flex-col items-start gap-[11px] border-t border-t-[var(--border-hairline)] pt-[13px] ${className}`}>
      <span className="text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">{copy.heldNote}</span>
      <Button href="/kyc" size="sm" variant="secondary" iconRight="ArrowRight">
        {copy.cta}
      </Button>
    </div>
  );
}
