"use client";

import { useState } from "react";
import Link from "next/link";
import type { VerificationLevel } from "@/types/account";
import type { VerificationLevelEntry } from "@/types/verification";
import { VERIFY_TIER_LABELS } from "@/types/verification";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { VerificationApplyForm } from "./VerificationApplyForm";

/**
 * The ladder rows — all five levels, same list on every width (mobile
 * already shows all five; design D16 asks for the same on one desktop
 * panel, ~700px, nothing to drill into for that).
 *
 * The one real drill-down mobile has is the *apply form*: tapping "Start"
 * navigates to `/profile/verification/[tier]`. Desktop keeps that page
 * reachable directly, but per D16 the row itself expands the same
 * VerificationApplyForm in place instead of navigating. Both triggers are
 * in the DOM; only one is visible at a given width (`xl:hidden` /
 * `hidden xl:inline-flex`), so behaviour genuinely differs per breakpoint
 * without a client-side viewport check.
 *
 * Badge applications ONLY. Nothing in this list reads, reflects or advances
 * creator KYC — that is a separate system with its own block on the same
 * screen (KycStatusPanel). Never wire one into the other.
 */
export function VerificationLadderList({
  ladder,
  nextTier,
}: {
  ladder: VerificationLevelEntry[];
  nextTier: VerificationLevel;
}) {
  const [expandedTier, setExpandedTier] = useState<VerificationLevel | null>(null);

  return (
    <div className="flex flex-col rounded-[var(--radius-card)] border border-hairline bg-card p-1">
      {ladder.map((level) => {
        const t = VERIFY_TIER_LABELS[level.tier];
        const isYours = level.status === "yours";
        const expanded = expandedTier === level.tier;
        // A rung you have already applied for must never keep offering an
        // unqualified "Start" — that is what made a submitted application look
        // like nothing had been recorded. The ladder endpoint returns the
        // caller's own submission per rung; it is a BADGE application only,
        // never anything to do with KYC.
        const applied = level.submission;
        const inReview = applied?.status === "in_review";
        const rejected = applied?.status === "rejected";
        const isNext = level.status === "next" && !inReview;
        const isLocked = level.status === "locked" && !applied;
        return (
          <div key={level.tier} className="flex flex-col">
            <div
              className={[
                "flex items-center gap-[13px] rounded-[var(--radius-input)] p-3",
                isNext || inReview
                  ? "border border-[var(--border-selected)] bg-[var(--selected-tint)]"
                  : "border border-transparent bg-transparent",
                isLocked ? "opacity-[0.55]" : "",
              ].join(" ")}
            >
              {level.status === "done" ? (
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-accent">
                  <Icon name="Check" size={15} color="var(--text-on-accent)" strokeWidth={2.6} />
                </span>
              ) : isLocked ? (
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-hairline bg-tag">
                  <Icon name="Lock" size={14} color="var(--text-muted)" strokeWidth={2} />
                </span>
              ) : (
                <VerificationBadge tier={level.tier} size={34} />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-[14.5px] font-semibold text-text-primary">
                  {level.tier === "basic" ? "Basic" : t}
                </span>
                <span className="text-[12px] leading-[1.4] text-text-secondary">{level.copy}</span>
                {inReview && (
                  <span className="text-[11.5px] leading-[1.4] text-text-muted">
                    You applied{applied?.submittedAt ? ` on ${applied.submittedAt}` : ""}. Usually reviewed within
                    2–5 working days.
                  </span>
                )}
                {rejected && !isYours && (
                  <span className="text-[11.5px] leading-[1.4] text-text-muted">
                    {applied?.reason ?? "Your last application wasn't approved."}
                  </span>
                )}
              </div>
              {(isNext || (rejected && !isYours)) && (
                <>
                  <Link
                    href={`/profile/verification/${rejected ? level.tier : nextTier}`}
                    className="no-underline xl:hidden"
                  >
                    <Button size="sm">{rejected ? "Resubmit" : "Start"}</Button>
                  </Link>
                  <Button
                    size="sm"
                    className="hidden xl:inline-flex"
                    onClick={() => setExpandedTier(expanded ? null : level.tier)}
                  >
                    {expanded ? "Close" : rejected ? "Resubmit" : "Start"}
                  </Button>
                </>
              )}
              {inReview && <StatusPill kind="warning">In review</StatusPill>}
              {isYours && !inReview && <StatusPill kind="info">You&apos;re here</StatusPill>}
            </div>
            {expanded && (
              <div className="hidden rounded-[var(--radius-card)] border border-t-0 border-[var(--border-decor)] bg-[var(--surface-elevated)] p-5 xl:block">
                <VerificationApplyForm tier={level.tier} onDone={() => setExpandedTier(null)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
