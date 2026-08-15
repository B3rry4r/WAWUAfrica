"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
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
  alreadyEnrolled,
  onEnrolled,
}: {
  courseId: string;
  alreadyEnrolled: boolean;
  onEnrolled: (entitlement: LearnEntitlement) => void;
}) {
  const [pending, setPending] = useState(false);

  const go = async () => {
    if (pending) return;
    setPending(true);
    try {
      if (!alreadyEnrolled) {
        const entitlement = await enrolInCourse(courseId);
        onEnrolled(entitlement);
      }
    } finally {
      setPending(false);
      window.open(alisonHandoffUrl(courseId), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-[var(--border-hairline)] bg-[rgba(19,19,22,.86)] p-[14px_18px_calc(24px_+_env(safe-area-inset-bottom))] backdrop-blur-[20px]">
      <Button full size="lg" iconRight="ArrowUpRight" loading={pending} onClick={go}>
        {alreadyEnrolled ? `Continue on ${COURSE_HOST}` : `Enrol on ${COURSE_HOST}`}
      </Button>
      <span className="text-center text-[12px] leading-[1.45] text-[var(--text-muted)]">
        The course runs on {COURSE_HOST}. Your progress shows back here.
      </span>
    </div>
  );
}
