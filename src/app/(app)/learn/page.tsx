import Link from "next/link";
import type { LearnCourse, LearnEntitlement, LearnGuide, Playbook } from "@/types/learn";
import { getCourses, getGuides, getLearnEntitlement, getPlaybook } from "@/lib/api/learn";
import { formatNaira } from "@/lib/format";
import { TierBadge } from "@/components/ui/TierBadge";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

const eyebrow = "text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]";
const seeAll = "text-[12.5px] font-semibold text-[var(--accent)]";

export default async function LearnPage() {
  let entitlement: LearnEntitlement;
  let courses: LearnCourse[];
  let playbook: Playbook;
  let guides: LearnGuide[];
  try {
    [entitlement, courses, playbook, guides] = await Promise.all([getLearnEntitlement(), getCourses(), getPlaybook(), getGuides()]);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load Learn."} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <EntitlementBanner entitlement={entitlement} />

      <section className="flex flex-col gap-2.5">
        <span className={`px-[2px] ${eyebrow}`}>Start here</span>
        <Link href="/learn/playbook" className="no-underline block">
          <div className="flex gap-3.5 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-4">
            <span className="grid h-[72px] w-[56px] shrink-0 place-items-center rounded-[10px] bg-[var(--accent)] text-[12px] font-extrabold uppercase tracking-[0.02em] text-[var(--text-on-accent)]">
              WAWU
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <span className="text-[16px] font-bold leading-[1.3] tracking-[-0.01em] text-[var(--text-primary)]">
                {playbook.title}
              </span>
              <span className="text-[12.5px] text-[var(--text-muted)]">
                {playbook.pages} pages · {playbook.format} · Free download
              </span>
              <div className="flex">
                <span className="inline-flex h-[30px] items-center gap-1.5 rounded-[var(--radius-chip)] border border-[var(--border-accent)] bg-[var(--accent-tint)] px-3 text-[12.5px] font-bold text-[var(--accent)]">
                  <Icon name="Download" size={14} strokeWidth={2.4} />
                  Free download
                </span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      <section className="flex flex-col gap-[11px]">
        <div className="flex items-center gap-2.5 px-[2px]">
          <span className={`flex-1 ${eyebrow}`}>Courses</span>
          <Link href="/learn/courses" className={seeAll}>See all {entitlement.totalCourses}</Link>
        </div>
        <div className="flex flex-col gap-2.5">
          {courses.slice(0, 3).map((c) => (
            <CourseRow key={c.id} course={c} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-[11px]">
        <div className="flex items-center gap-2.5 px-[2px]">
          <span className={`flex-1 ${eyebrow}`}>Country guides</span>
          <Link href="/learn/guides" className={seeAll}>See all {guides.length}</Link>
        </div>
        <div className="flex flex-wrap gap-2 px-[2px]">
          {guides.slice(0, 6).map((g) => (
            <Link
              key={g.id}
              href={`/learn/guides/${g.id}`}
              className="inline-flex h-[34px] items-center gap-[7px] rounded-[999px] border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-3.5 text-[13px] font-semibold text-[var(--text-secondary)] no-underline"
            >
              <Icon name="Globe" size={14} color="var(--text-muted)" />
              {g.country}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function EntitlementBanner({ entitlement }: { entitlement: LearnEntitlement }) {
  const free = entitlement.freeCourses;
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-elevated)] p-[13px]">
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
        <Icon name="GraduationCap" size={17} color="var(--accent)" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-[14.5px] font-semibold text-[var(--text-primary)]">
          {free} free course{free === 1 ? "" : "s"} available
          <TierBadge tier={entitlement.tier} />
        </span>
        <span className="text-[12.5px] text-[var(--text-secondary)]">
          {entitlement.tier === "basic"
            ? "Upgrade to Pro to unlock the full catalogue."
            : "Pro unlocks every course."}
        </span>
      </div>
      <Link href="/learn/courses" className={seeAll}>Browse</Link>
    </div>
  );
}

function CourseRow({ course }: { course: LearnCourse }) {
  return (
    <Link
      href={`/learn/courses/${course.id}`}
      className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px] no-underline"
    >
      <span className="grid h-[54px] w-[48px] shrink-0 place-items-center rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
        <Icon name="Play" size={18} color="var(--accent)" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--text-muted)]">
          {course.category}
          <span className="text-[var(--accent)]">★ {course.rating.toFixed(1)}</span>
        </span>
        <span className="text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--text-primary)]">
          {course.title}
        </span>
        <span className="text-[12px] text-[var(--text-muted)]">
          {course.lessons} lessons · {course.minutes} min · {course.host.name}
        </span>
      </div>
      <div className="flex items-start">
        {course.price === 0 ? (
          <span className="text-[12.5px] font-bold text-[var(--success)]">Free</span>
        ) : (
          <span className="text-[13px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
            {formatNaira(course.price)}
          </span>
        )}
      </div>
    </Link>
  );
}
