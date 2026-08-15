import { getCourse } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { CourseUnlockBar } from "@/components/learn/CourseUnlockBar";

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = await getCourse(params.id);

  if (!course) {
    return (
      <div style={{ padding: 16 }}>
        <ErrorState title="Course not found" caption="This course may have been removed." />
      </div>
    );
  }

  const lessons = Array.from({ length: course.lessons }, (_, i) => `Lesson ${i + 1}`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Course
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          {course.category} · {course.lessons} lessons · {course.minutes} min
        </span>
        <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, color: "var(--text-primary)" }}>
          {course.title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "var(--text-secondary)" }}>
          {course.host.name}
          <span style={{ color: "var(--accent)" }}>★ {course.rating.toFixed(1)}</span>
          <span style={{ color: "var(--text-muted)" }}>· {course.students.toLocaleString("en-NG")} students</span>
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{course.overview}</p>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>What you’ll learn</span>
        {course.whatYouLearn.map((w) => (
          <div key={w} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
            <Icon name="Check" size={15} color="var(--accent)" stroke={2.6} style={{ marginTop: 1 }} />
            <span style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--text-primary)" }}>{w}</span>
          </div>
        ))}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Lessons</span>
        <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
          {lessons.map((l, i) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderRadius: "var(--radius-input)" }}>
              <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, flexShrink: 0, borderRadius: 999, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{l}</span>
              <Icon name="Lock" size={14} color="var(--text-muted)" stroke={2} />
            </div>
          ))}
        </div>
      </section>

      <CourseUnlockBar title={course.title} price={course.price} />
    </div>
  );
}