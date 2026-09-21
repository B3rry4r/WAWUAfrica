import Link from "next/link";
import type { LearnCourse } from "@/types/learn";
import { Icon } from "@/components/ui";

/**
 * Learning & Growth (build brief C4, item 8).
 *
 * The reference names the courses it expects to find here -- music
 * production, filmmaking, content creation, music business -- so the rail
 * reads the real course catalogue rather than a written-out list: if a course
 * is in the catalogue it appears, and if the catalogue changes so does this.
 * Hard-coding those four titles would put four names on the screen that
 * nothing in the app can open.
 *
 * Server component: the course catalogue is a public read and the page that
 * renders this already awaits it, so there is nothing to fetch again on the
 * client.
 */
export function LearningRail({ courses }: { courses: readonly LearnCourse[] }) {
  return (
    <section className="flex flex-col gap-[12px]">
      <div className="flex items-end justify-between gap-3 px-[2px]">
        <div className="flex flex-col gap-[3px]">
          <h2 className="m-0 text-[17px] font-bold tracking-[-0.015em] text-[var(--text-primary)] dt:text-[20px]">
            Learning and growth
          </h2>
          <p className="m-0 text-[12.5px] text-[var(--text-muted)]">
            Courses you can finish and a playbook you can keep
          </p>
        </div>
        <Link
          href="/learn"
          className="shrink-0 text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
        >
          See all
        </Link>
      </div>

      <div className="-mx-[16px] px-[16px] xl:mx-0 xl:px-0">
        <div className="wawu-no-scrollbar flex gap-[12px] overflow-x-auto pb-[4px]">
          {courses.slice(0, 8).map((c) => (
            <Link
              key={c.id}
              href={`/learn/courses/${c.id}`}
              className="flex w-[228px] shrink-0 flex-col gap-[8px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline transition-colors hover:border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]"
            >
              <span className="grid h-[40px] w-[40px] place-items-center rounded-[12px] bg-[var(--accent-tint)]">
                <Icon name="GraduationCap" size={19} color="var(--accent)" strokeWidth={1.9} />
              </span>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)]">
                {c.category}
              </span>
              <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--text-primary)]">
                {c.title}
              </span>
              <span className="mt-auto text-[12.5px] text-[var(--text-secondary)]">
                {c.hours} {c.hours === 1 ? "hour" : "hours"}
                {c.certificate ? " · Certificate" : ""}
              </span>
            </Link>
          ))}

          <Link
            href="/learn"
            className="flex w-[228px] shrink-0 flex-col gap-[8px] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)] p-[14px] no-underline transition-colors hover:border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]"
          >
            <span className="grid h-[40px] w-[40px] place-items-center rounded-[12px] bg-[var(--surface-tag)]">
              <Icon name="BookOpen" size={19} color="var(--text-secondary)" strokeWidth={1.9} />
            </span>
            <span className="text-[14px] font-semibold leading-snug text-[var(--text-primary)]">
              Business Playbook
            </span>
            <span className="mt-auto text-[12.5px] text-[var(--text-secondary)]">
              Yours to download, any time
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
