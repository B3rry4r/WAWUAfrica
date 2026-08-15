import type { LearnCourse, LearnEntitlement } from "@/types/learn";
import { Button } from "@/components/ui/Button";
import { EntitlementBanner } from "./EntitlementBanner";

/**
 * Desktop-only (design D12) persistent right rail: the free-course
 * entitlement, "visible against every card" instead of a top banner, plus a
 * continue-where-you-left-off card when an enrolled course has partial
 * progress. Shared by the Learn landing and /learn/courses so both stay
 * identical without forking the rail.
 */
export function LearnEntitlementRail({ entitlement, courses }: { entitlement: LearnEntitlement; courses: LearnCourse[] }) {
  const inProgressId = entitlement.enrolledCourseIds.find((id) => {
    const pct = entitlement.progressByCourseId[id];
    return pct !== undefined && pct > 0 && pct < 100;
  });
  const inProgressCourse = inProgressId ? courses.find((c) => c.id === inProgressId) : undefined;
  const inProgressPct = inProgressId ? entitlement.progressByCourseId[inProgressId] : undefined;

  return (
    <aside className="hidden xl:flex xl:w-[340px] xl:shrink-0 xl:flex-col xl:gap-4">
      <EntitlementBanner entitlement={entitlement} variant="full" />

      {inProgressCourse && inProgressPct !== undefined ? (
        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">In progress</span>
          <div className="flex flex-col gap-[9px]">
            <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{inProgressCourse.title}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-tag)]">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${inProgressPct}%` }} />
            </div>
            <span className="text-[12.5px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
              {inProgressPct}% complete
            </span>
          </div>
          <Button href={`/learn/courses/${inProgressCourse.id}`} full size="sm" iconRight="ArrowRight">
            Continue
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
