"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { LearnCourse, LearnEntitlement } from "@/types/learn";
import { COURSE_HOST } from "@/types/learn";
import { getCourse, getCourseEntitlementState, getLearnEntitlement } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { CourseEntitlementPanel } from "@/components/learn/CourseEntitlementPanel";
import { EnrolCourseCta } from "@/components/learn/EnrolCourseCta";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const [course, setCourse] = useState<LearnCourse | null | undefined>(undefined);
  const [entitlement, setEntitlement] = useState<LearnEntitlement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setCourse(undefined);
    setEntitlement(null);
    setError(null);
    Promise.all([getCourse(params.id), getLearnEntitlement()])
      .then(([c, e]) => {
        setCourse(c);
        setEntitlement(e);
      })
      .catch(() => setError("We couldn't load this course."));
  }, [params.id]);

  useEffect(load, [load]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center gap-2.5 p-[14px_16px]">
        <ProfileBackButton compact />
        <span className="text-[15px] font-semibold text-[var(--text-primary)]">Course</span>
      </div>

      {error ? (
        <div className="px-4">
          <ErrorState title={error} onRetry={load} />
        </div>
      ) : course === undefined || !entitlement ? (
        <DetailSkeleton />
      ) : course === null ? (
        <div className="px-4">
          <ErrorState title="Course not found" body="This course may have been removed." onRetry={load} />
        </div>
      ) : (
        <CourseDetail course={course} entitlement={entitlement} onEnrolled={setEntitlement} />
      )}
    </div>
  );
}

function CourseDetail({
  course,
  entitlement,
  onEnrolled,
}: {
  course: LearnCourse;
  entitlement: LearnEntitlement;
  onEnrolled: (e: LearnEntitlement) => void;
}) {
  const state = getCourseEntitlementState(course.id, entitlement);
  const alreadyEnrolled = state.status === "enrolled";

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative aspect-video w-full bg-[repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)]" />

      <div className="flex flex-1 flex-col gap-4 p-[18px_18px_20px]">
        <div className="flex flex-col gap-[9px]">
          <div className="flex">
            <HandoffPill app={COURSE_HOST} />
          </div>
          <h1 className="m-0 text-[22px] font-semibold leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)]">{course.title}</h1>
          <span className="text-[13px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
            {COURSE_HOST} · {course.hours} hours{course.certificate ? " · certificate on completion" : ""}
          </span>
        </div>

        <CourseEntitlementPanel state={state} entitlement={entitlement} />

        <p className="m-0 text-[14.5px] leading-[1.55] text-[var(--text-secondary)]">{course.overview}</p>

        <div className="flex flex-col gap-2.5 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">What it covers</span>
          {course.whatItCovers.map((w) => (
            <span key={w} className="flex items-center gap-[9px] text-[13.5px] text-[var(--text-secondary)]">
              <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
              {w}
            </span>
          ))}
        </div>
      </div>

      <EnrolCourseCta courseId={course.id} alreadyEnrolled={alreadyEnrolled} onEnrolled={onEnrolled} />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-[0_18px_20px]">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-[22px] w-[80%] rounded" />
        <Skeleton className="h-[14px] w-[55%] rounded" />
      </div>
      <Skeleton className="h-[120px] w-full rounded-[var(--radius-card)]" />
      <Skeleton className="h-[14px] w-full rounded" />
      <Skeleton className="h-[14px] w-[85%] rounded" />
      <Skeleton className="h-[160px] w-full rounded-[var(--radius-card)]" />
    </div>
  );
}
