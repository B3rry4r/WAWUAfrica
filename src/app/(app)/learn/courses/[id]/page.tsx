import { getCourse } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { CourseUnlockBar } from "@/components/learn/CourseUnlockBar";

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = await getCourse(params.id);

  if (!course) {
    return (
      <div className="p-4">
        <ErrorState title="Course not found" body="This course may have been removed." />
      </div>
    );
  }

  const lessons = Array.from({ length: course.lessons }, (_, i) => `Lesson ${i + 1}`);

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Course
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--text-muted)]">
          {course.category} · {course.lessons} lessons · {course.minutes} min
        </span>
        <span className="text-[24px] font-extrabold leading-[1.2] tracking-[-0.025em] text-[var(--text-primary)]">
          {course.title}
        </span>
        <span className="flex items-center gap-[7px] text-[13.5px] text-[var(--text-secondary)]">
          {course.host.name}
          <span className="text-[var(--accent)]">★ {course.rating.toFixed(1)}</span>
          <span className="text-[var(--text-muted)]">· {course.students.toLocaleString("en-NG")} students</span>
        </span>
      </div>

      <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">{course.overview}</p>

      <section className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">What you’ll learn</span>
        {course.whatYouLearn.map((w) => (
          <div key={w} className="flex items-start gap-2.5 rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[11px_14px]">
            <span className="mt-px">
              <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.6} />
            </span>
            <span className="text-[13.5px] leading-[1.45] text-[var(--text-primary)]">{w}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Lessons</span>
        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-1">
          {lessons.map((l, i) => (
            <div key={l} className="flex items-center gap-3 rounded-[var(--radius-input)] p-3">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[999px] border border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[12.5px] font-bold text-[var(--text-secondary)]">
                {i + 1}
              </span>
              <span className="flex-1 text-[14px] font-medium text-[var(--text-primary)]">{l}</span>
              <Icon name="Lock" size={14} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      </section>

      <CourseUnlockBar title={course.title} price={course.price} />
    </div>
  );
}
