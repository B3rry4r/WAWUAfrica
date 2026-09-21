"use client";

import { VerificationBanner, KYC_STATUS_LABEL } from "@/components/dashboard/VerificationAsk";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";
import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import type { KycStatus } from "@/types/account";

/**
 * The creator's KYC (identity check) state, shown as its OWN block —
 * deliberately separate from the two paid ticks it sits next to.
 *
 * Why this exists: /profile/verification is the one screen in the app called
 * "Verification", and it read only the public badge. A creator who had just
 * submitted their ID, bank details and BVN/NIN through /kyc came here, saw an
 * unchanged screen, and concluded the submission had not gone through — it had.
 *
 * These are two independent systems and MUST NOT be collapsed (CLAUDE.md; the
 * Prisma comment on KycSubmission says the same thing):
 *   - KYC          → the earning gate. Manual review. Unlocks getting paid.
 *   - The ticks  → paid, public credentials. Change nothing about payouts.
 * So this panel names its own gate, states its own status, and points at its
 * own route (/kyc). It never touches the ticks and the ticks never touch it.
 *
 * Creator accounts only: a plain user has no CreatorState row, no KYC
 * submission, and nothing to say here. `resolved` gates the fork so somebody
 * who became a creator after sign-in isn't told, for one frame, that this
 * doesn't apply to them (see useCreatorState).
 *
 * Status wording and the call to action come from the shared VerificationBanner
 * — the one place the KYC ask is worded — so this screen cannot drift from the
 * dashboard, earnings and subscription surfaces. Approved is the one state that
 * banner has nothing to say about (it renders null), and it is exactly the state
 * this screen must confirm, so it is rendered here.
 */
/**
 * Tone only. The WORDS come from KYC_STATUS_LABEL in VerificationAsk, which the
 * dashboard, earnings, settings, profile and home rail all read — this panel
 * had its own copy of the table and already disagreed with it on one state
 * ("Needs changes" vs "Not approved"), which is how the same status ends up
 * described two ways on two screens.
 */
const STATUS_TONE: Record<KycStatus, "neutral" | "warning" | "success" | "danger"> = {
  not_started: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};
export function KycStatusPanel({ className = "" }: { className?: string }) {
  const { creator, resolved } = useCreatorState();
  const gates = creatorGates({ creator });

  if (!resolved) {
    return <Skeleton className={`h-[150px] w-full rounded-[var(--radius-card)] ${className}`} />;
  }

  if (!gates.isCreator) return null;

  const status = gates.kycStatus;
  const pillKind = STATUS_TONE[status];
  const pillLabel = KYC_STATUS_LABEL[status];

  return (
    <section className={`flex flex-col gap-[10px] ${className}`}>
      <span className="px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
        Getting paid
      </span>

      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-4">
        <div className="flex items-center gap-[10px]">
          <Icon name="Landmark" size={20} color="var(--accent)" strokeWidth={2} />
          <span className="min-w-0 flex-1 text-[15px] font-semibold text-text-primary">
            Identity check (KYC)
          </span>
          <StatusPill kind={pillKind}>{pillLabel}</StatusPill>
        </div>
        <p className="m-0 text-[13.5px] leading-[1.55] text-text-secondary">
          Your ID and bank details, reviewed by hand. This is the step that lets us pay out what you earn. It is
          not a tick. It never appears on your profile, and buying a tick below does nothing for it.
        </p>
      </div>

      {status === "approved" ? (
        <div className="flex items-start gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-elevated p-[14px]">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-success-tint">
            <Icon name="Check" size={16} color="var(--success)" strokeWidth={2.6} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
            <span className="text-[13.5px] leading-[1.5] text-text-secondary">
              Your identity check is approved. Earnings are paid to the bank account on your file.
            </span>
            <Button href="/kyc" size="sm" variant="secondary" iconRight="ArrowRight">
              View your details
            </Button>
          </div>
        </div>
      ) : (
        <VerificationBanner status={status} />
      )}

      {/*
        The rule off the bottom of this block is what visually separates the
        earning gate from the paid ticks below it. It belongs to this panel,
        not to the page: a plain user renders nothing here, and a divider
        floating under the page title with nothing above it looked like a bug.
      */}
      <div className="mt-2 h-px w-full bg-[var(--border-hairline)]" />
    </section>
  );
}
