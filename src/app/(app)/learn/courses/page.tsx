import Link from "next/link";
import type { LearnCourse } from "@/types/learn";
import { getCourses } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function CoursesPage() {
  let courses: LearnCourse[];
  try {
    courses = await getCourses();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load courses."} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          All courses
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/learn/courses/${c.id}`}
            style={{ display: "flex", gap: 13, padding: 13, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textDecoration: "none" }}
          >
            <span style={{ display: "grid", placeItems: "center", width: 48, height: 54, flexShrink: 0, borderRadius: 10, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
              <Icon name="Play" size={18} color="var(--accent)" stroke={2} />
            </span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                {c.category} · ★ {c.rating.toFixed(1)} · {c.students.toLocaleString("en-NG")} students
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{c.title}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {c.lessons} lessons · {c.minutes} min · {c.host.name}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: c.price === 0 ? "var(--success)" : "var(--text-primary)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
              {c.price === 0 ? "Free" : `₦${c.price.toLocaleString("en-NG")}`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}