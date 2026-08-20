import Link from "next/link";
import type { CourseEntitlementState, LearnCourse } from "@/types/learn";
import { COURSE_HOST } from "@/types/learn";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

/**
 * Course list item — thumbnail, "Alison · N hours", and the entitlement
 * state. No price, ever. Below xl this is always the mobile row (thumbnail
 * left, text right); at xl, when its parent lays courses out 3-across
 * (design D12), the same markup reflows into a card — thumbnail on top,
 * full width — via responsive classes only, no layout prop needed.
 */
export function CourseRow({ course, state, freeCoursesTotal }: { course: LearnCourse; state: CourseEntitlementState; freeCoursesTotal: number }) {
  return (
    <Link
      href={`/learn/courses/${course.id}`}
      className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline xl:flex-col xl:gap-[11px] xl:p-0"
    >
      <div className="h-16 w-16 shrink-0 rounded-[12px] border border-[var(--border-hairline)] bg-[repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)] xl:aspect-video xl:h-auto xl:w-full xl:rounded-[var(--radius-media)]" />
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="text-[14.5px] font-semibold leading-[1.3] text-[var(--text-primary)]">{course.title}</span>
        <span className="text-[12.5px] text-[var(--text-muted)]">
          {COURSE_HOST} · {course.hours} hours
        </span>
        <CourseStateIndicator state={state} freeCoursesTotal={freeCoursesTotal} />
      </div>
    </Link>
  );
}

function CourseStateIndicator({ state, freeCoursesTotal }: { state: CourseEntitlementState; freeCoursesTotal: number }) {
  if (state.status === "enrolled" && state.progressPct !== null && state.progressPct > 0 && state.progressPct < 100) {
    return (
      <div className="flex items-center gap-[9px]">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--surface-tag)]">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${state.progressPct}%` }} />
        </div>
        <span className="text-[11.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
          {state.progressPct}%
        </span>
      </div>
    );
  }
  if (state.status === "enrolled") {
    return (
      <div className="flex">
        <StatusPill kind="success">Enrolled</StatusPill>
      </div>
    );
  }
  if (state.status === "available") {
    return (
      <div className="flex">
        <StatusPill kind="info">{freeCoursesTotal === 1 ? "Use your included course" : "Use an included course"}</StatusPill>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
      <Icon name="ArrowUpRight" size={12} />
      Enrol on {COURSE_HOST}
    </div>
  );
}
