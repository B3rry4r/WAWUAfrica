"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { COURSE_HOST } from "@/types/learn";
import { alisonHandoffUrl, enrolInCourse } from "@/lib/api/learn";
import type { LearnEntitlement } from "@/types/learn";

/**
 * Sticky handoff CTA — this is the ONLY way a course is consumed. There is no
 * in-app player and no PPV unlock: clicking spends a free-course slot (if one
 * is available) against the entitlement, then opens the course on Alison.
 */
export function EnrolCourseCta({
  courseId,
  externalHostUrl,
  alreadyEnrolled,
  onEnrolled,
}: {
  courseId: string;
  /** The course's real handoff URL. Falls back to a guessed URL only if unavailable. */
  externalHostUrl?: string;
  alreadyEnrolled: boolean;
  onEnrolled: (entitlement: LearnEntitlement) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      if (!alreadyEnrolled) {
        const entitlement = await enrolInCourse(courseId);
        onEnrolled(entitlement);
      }
      window.open(externalHostUrl ?? alisonHandoffUrl(courseId), "_blank", "noopener,noreferrer");
    } catch (e) {
      // Enrolment failed — don't hand off to Alison as if it had succeeded.
      setError(e instanceof Error ? e.message : "That didn't go through. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-[var(--border-hairline)] bg-[rgba(19,19,22,.86)] p-[14px_18px_calc(24px_+_env(safe-area-inset-bottom))] backdrop-blur-[20px]">
      {error ? (
        <div className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-[rgba(255,90,90,0.32)] bg-[var(--danger-tint)] p-[12px_14px]">
          <Icon name="TriangleAlert" size={16} color="var(--danger)" />
          <span className="text-[13px] font-medium text-[var(--text-primary)]">{error}</span>
        </div>
      ) : null}
      <Button full size="lg" iconRight="ArrowUpRight" loading={pending} onClick={go}>
        {alreadyEnrolled ? `Continue on ${COURSE_HOST}` : `Enrol on ${COURSE_HOST}`}
      </Button>
      <span className="text-center text-[12px] leading-[1.45] text-[var(--text-muted)]">
        The course runs on {COURSE_HOST}. Your progress shows back here.
      </span>
    </div>
  );
}
