import type { CourseEntitlementState, LearnEntitlement } from "@/types/learn";
import { Icon } from "@/components/ui/Icon";

/** The course-detail entitlement card — design panel 2: "Covered by your tier", not a price. */
export function CourseEntitlementPanel({ state, entitlement }: { state: CourseEntitlementState; entitlement: LearnEntitlement }) {
  if (state.status === "enrolled") {
    return (
      <Panel icon="Check" iconTone="success" title="Enrolled" subtitle="This used one of your included courses.">
        <span className="border-t border-[var(--border-hairline)] pt-3 text-[12.5px] leading-[1.45] text-[var(--text-muted)]">
          Pick it back up any time. Alison keeps your place.
        </span>
      </Panel>
    );
  }

  if (state.status === "available") {
    return (
      <Panel icon="GraduationCap" iconTone="accent" title="Covered by your tier" subtitle={`This uses your ${entitlement.freeCoursesTotal === 1 ? "1 included course" : "next included course"}`}>
        <span className="border-t border-[var(--border-hairline)] pt-3 text-[12.5px] leading-[1.45] text-[var(--text-muted)]">
          Pro carries three. Basic carries one. Spend it on something you will finish.
        </span>
      </Panel>
    );
  }

  return (
    <Panel icon="Info" iconTone="muted" title="No courses left" subtitle="You&rsquo;ve used your included courses for this cycle.">
      <span className="border-t border-[var(--border-hairline)] pt-3 text-[12.5px] leading-[1.45] text-[var(--text-muted)]">
        Upgrade to Pro for more included courses, or enrol directly. WAWU just won&rsquo;t track this one as covered.
      </span>
    </Panel>
  );
}

function Panel({
  icon,
  iconTone,
  title,
  subtitle,
  children,
}: {
  icon: "Check" | "GraduationCap" | "Info";
  iconTone: "success" | "accent" | "muted";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const iconWrap =
    iconTone === "success"
      ? "border-[var(--border-success)] bg-[var(--success-tint)]"
      : iconTone === "accent"
        ? "border-[var(--border-selected)] bg-[var(--selected-tint)]"
        : "border-[var(--border-hairline)] bg-[var(--surface-tag)]";
  const iconColor = iconTone === "success" ? "var(--success)" : iconTone === "accent" ? "var(--accent)" : "var(--text-muted)";

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-center gap-[11px]">
        <span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border ${iconWrap}`}>
          <Icon name={icon} size={17} color={iconColor} strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{title}</span>
          <span className="text-[12.5px] text-[var(--text-secondary)]">{subtitle}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
