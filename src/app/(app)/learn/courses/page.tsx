import Link from "next/link";
import type { LearnCourse } from "@/types/learn";
import { getCourses } from "@/lib/api/learn";
import { formatNaira } from "@/lib/format";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function CoursesPage() {
  let courses: LearnCourse[];
  try {
    courses = await getCourses();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load courses."} />;
  }

  return (
    <div className="flex flex-col gap-3.5 p-[16px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          All courses
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/learn/courses/${c.id}`}
            className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px] no-underline"
          >
            <span className="grid h-[54px] w-[48px] shrink-0 place-items-center rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
              <Icon name="Play" size={18} color="var(--accent)" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                {c.category} · ★ {c.rating.toFixed(1)} · {c.students.toLocaleString("en-NG")} students
              </span>
              <span className="text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--text-primary)]">{c.title}</span>
              <span className="text-[12px] text-[var(--text-muted)]">
                {c.lessons} lessons · {c.minutes} min · {c.host.name}
              </span>
            </div>
            <span className={`text-[13px] font-bold [font-feature-settings:var(--font-feature-tabular)] ${c.price === 0 ? "text-[var(--success)]" : "text-[var(--text-primary)]"}`}>
              {c.price === 0 ? "Free" : formatNaira(c.price)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
