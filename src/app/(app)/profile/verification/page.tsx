"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { VerificationLevelEntry, VerificationSubmission } from "@/types/verification";
import { getVerificationLadder, getVerificationSubmissions } from "@/lib/api/verification";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { KycStatusPanel } from "@/components/profile/KycStatusPanel";
import { VerificationLadderList } from "@/components/profile/VerificationLadderList";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { VERIFY_TIER_LABELS } from "@/types/verification";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function VerificationPage() {
  const [ladder, setLadder] = useState<VerificationLevelEntry[] | null>(null);
  const [submissions, setSubmissions] = useState<VerificationSubmission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLadder(null);
    setSubmissions(null);
    Promise.all([getVerificationLadder(), getVerificationSubmissions()])
      .then(([l, s]) => {
        setLadder(l);
        setSubmissions(s);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "We couldn't load your verification.");
      });
  }, []);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="px-4 pt-4 xl:mx-auto xl:w-full xl:max-w-[700px] xl:px-0 xl:pt-8">
        <ErrorState title="We couldn't load your verification." body={error} onRetry={load} />
      </div>
    );
  }

  if (!ladder || !submissions) {
    return (
      <div className="flex flex-col gap-5 px-4 pb-24 pt-4 xl:mx-auto xl:w-full xl:max-w-[700px] xl:gap-6 xl:px-0 xl:pb-16 xl:pt-8">
        <Skeleton className="h-[26px] w-[140px] rounded" />
        <Skeleton className="h-[96px] w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-[74px] w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-[260px] w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  const current = ladder.find((l) => l.status === "yours");
  const next = ladder.find((l) => l.status === "next");
  const nextTier = next?.tier ?? "verified_business";

  return (
    <div className="flex flex-col gap-5 px-4 pb-24 pt-4 xl:mx-auto xl:w-full xl:max-w-[700px] xl:gap-6 xl:px-0 xl:pb-16 xl:pt-8">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary">
          Verification
        </span>
      </div>

      {/*
        Two separate things live on this screen and they are never merged
        (CLAUDE.md: "two independent gates"). KYC — the creator earning gate —
        comes first, because it is the one people submit and then come here
        looking for. Everything below the divider is the public badge ladder,
        which has no effect on payouts at all.

        Creator-only, and it renders nothing for a plain user.
      */}
      <KycStatusPanel />

      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-4">
        <div className="flex items-center gap-[10px]">
          <Icon name="ShieldCheck" size={20} color="var(--accent)" strokeWidth={2} />
          <span className="text-[15px] font-semibold text-text-primary">Public trust badges</span>
        </div>
        <p className="m-0 text-[13.5px] leading-[1.55] text-text-secondary">
          A badge is what buyers see next to your name. It is a separate application from the identity check above
          and has no effect on getting paid. Every badge is reviewed by a real person. We never charge for one, and
          we never send links you have to click to “verify” yourself. If someone does, it isn’t us.
        </p>
      </div>

      {current && (
        <div className="flex items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-elevated p-[14px]">
          <VerificationBadge tier={current.tier} size={34} />
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="text-[15.5px] font-semibold text-text-primary">
              {current.tier === "basic" ? "Basic profile" : VERIFY_TIER_LABELS[current.tier]}
            </span>
            <span className="text-[12.5px] text-text-secondary">
              {current.tier === "basic"
                ? "Apply for a badge to show buyers who you are"
                : "This badge was reviewed and awarded by hand"}
            </span>
          </div>
          <span className="text-[12px] font-semibold text-accent">Current</span>
        </div>
      )}

      <section className="flex flex-col gap-[10px]">
        <span className="px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
          The badge ladder
        </span>
        <VerificationLadderList ladder={ladder} nextTier={nextTier} />
        <p className="m-0 px-1 text-[11.5px] leading-[1.5] text-text-muted">
          Your badge, your paid plan and your identity check are three independent things. Submitting your ID for
          the identity check does not move you up this ladder, and a badge here does not release a payout.
        </p>
        <div className="flex gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-4">
          <Icon name="Info" size={17} color="var(--text-muted)" strokeWidth={2} className="mt-px shrink-0" />
          <span className="text-[12.5px] leading-[1.5] text-text-muted">
            A rejected level says which document failed and lets you resubmit. Nothing else on your account changes.
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-[10px]">
        <span className="px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
          Recent badge applications
        </span>
        {submissions.length === 0 && (
          <p className="m-0 rounded-[var(--radius-card)] border border-hairline bg-card p-4 text-[12.5px] leading-[1.5] text-text-muted">
            You haven&apos;t applied for a badge yet. Only badge applications are listed here. An identity check
            submitted for payouts is tracked separately and never appears in this list.
          </p>
        )}
        <div className="flex flex-col gap-[10px]">
          {submissions.map((s, idx) => {
            const t = VERIFY_TIER_LABELS[s.tier];
            return (
              <div
                key={`${s.tier}-${idx}`}
                className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-hairline bg-card p-[14px]"
              >
                <div className="flex items-center gap-[11px]">
                  <VerificationBadge tier={s.tier} size={28} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[14px] font-semibold text-text-primary">{t}</span>
                    <span className="text-[12px] text-text-muted">
                      Submitted {s.submittedAt}
                      {s.reviewedAt ? ` · Reviewed ${s.reviewedAt}` : ""}
                    </span>
                  </div>
                  {s.status === "in_review" && <StatusPill kind="warning">In review</StatusPill>}
                  {s.status === "approved" && <StatusPill kind="success">Approved</StatusPill>}
                  {s.status === "rejected" && <StatusPill kind="danger">Needs changes</StatusPill>}
                </div>
                {s.reason && (
                  <p className="m-0 rounded-[var(--radius-input)] bg-tag px-3 py-[10px] text-[12.5px] leading-[1.5] text-text-secondary">
                    {s.reason}
                  </p>
                )}
                {s.status === "rejected" && (
                  <Link href={`/profile/verification/${s.tier}`} className="no-underline">
                    <Button size="sm" variant="secondary" icon="RefreshCw" full>
                      Resubmit
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
