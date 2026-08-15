"use client";

import { useCallback, useEffect, useState } from "react";
import type { LearnCourse, LearnEntitlement } from "@/types/learn";
import { getCourseEntitlementState, getCourses, getLearnEntitlement } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { EntitlementBanner } from "@/components/learn/EntitlementBanner";
import { CourseRow } from "@/components/learn/CourseRow";
import { LearnEntitlementRail } from "@/components/learn/LearnEntitlementRail";

export default function CoursesPage() {
  const [courses, setCourses] = useState<LearnCourse[] | null>(null);
  const [entitlement, setEntitlement] = useState<LearnEntitlement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setCourses(null);
    setEntitlement(null);
    setError(null);
    Promise.all([getCourses(), getLearnEntitlement()])
      .then(([c, e]) => {
        setCourses(c);
        setEntitlement(e);
      })
      .catch(() => setError("We couldn't load courses."));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="flex flex-col gap-3.5 p-[16px_16px_96px] xl:p-[26px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">All courses</span>
      </div>

      {error ? (
        <ErrorState title={error} onRetry={load} />
      ) : !courses || !entitlement ? (
        <ListSkeleton />
      ) : (
        // Below xl: unchanged single-column stack, full banner on top. At xl
        // (design D12): the banner moves into the persistent right rail and
        // courses go 3-across instead of stacked.
        <div className="flex flex-col gap-3.5 xl:flex-row xl:items-start xl:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            <div className="xl:hidden">
              <EntitlementBanner entitlement={entitlement} variant="full" />
            </div>
            <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-3 xl:gap-4">
              {courses.map((c) => (
                <CourseRow key={c.id} course={c} state={getCourseEntitlementState(c.id, entitlement)} freeCoursesTotal={entitlement.freeCoursesTotal} />
              ))}
            </div>
          </div>
          <LearnEntitlementRail entitlement={entitlement} courses={courses} />
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-[140px] w-full rounded-[var(--radius-card)]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="row" className="h-[92px]" />
      ))}
    </div>
  );
}
