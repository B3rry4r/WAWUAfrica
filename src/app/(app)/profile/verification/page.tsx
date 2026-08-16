"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { VerificationLevelEntry, VerificationSubmission } from "@/types/verification";
import { getVerificationLadder, getVerificationSubmissions } from "@/lib/api/verification";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
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

      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-4">
        <div className="flex items-center gap-[10px]">
          <Icon name="ShieldCheck" size={20} color="var(--accent)" strokeWidth={2} />
          <span className="text-[15px] font-semibold text-text-primary">Manual verification</span>
        </div>
        <p className="m-0 text-[13.5px] leading-[1.55] text-text-secondary">
          Every badge on WAWU is reviewed by a real person. We never charge for verification, and we never send links
          you have to click to “verify” yourself. If someone does, it isn’t us.
        </p>
      </div>

      {current && (
        <div className="flex items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-elevated p-[14px]">
          <VerificationBadge tier={current.tier} size={34} />
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="text-[15.5px] font-semibold text-text-primary">
              {current.tier === "basic" ? "Basic profile" : VERIFY_TIER_LABELS[current.tier]}
            </span>
            <span className="text-[12.5px] text-text-secondary">
              {current.tier === "basic"
                ? "Verify to show buyers you're real"
                : "Reviewed and approved by hand"}
            </span>
          </div>
          <span className="text-[12px] font-semibold text-accent">Current</span>
        </div>
      )}

      <section className="flex flex-col gap-[10px]">
        <span className="px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
          The ladder
        </span>
        <VerificationLadderList ladder={ladder} nextTier={nextTier} />
        <p className="m-0 px-1 text-[11.5px] leading-[1.5] text-text-muted">
          Verification is separate from your paid plan and your KYC status — the three are independent.
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
          Recent
        </span>
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
