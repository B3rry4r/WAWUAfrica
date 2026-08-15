import Link from "next/link";
import type { CSSProperties } from "react";
import type { LearnCourse, LearnEntitlement, LearnGuide, Playbook } from "@/types/learn";
import { getCourses, getGuides, getLearnEntitlement, getPlaybook } from "@/lib/api/learn";
import { TierBadge } from "@/components/ui/TierBadge";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 2px" } as const;
const seeAll = { fontSize: 12.5, fontWeight: 600, color: "var(--accent)" } as const;

export default async function LearnPage() {
  let entitlement: LearnEntitlement;
  let courses: LearnCourse[];
  let playbook: Playbook;
  let guides: LearnGuide[];
  try {
    [entitlement, courses, playbook, guides] = await Promise.all([getLearnEntitlement(), getCourses(), getPlaybook(), getGuides()]);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load Learn."} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <EntitlementBanner entitlement={entitlement} />

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={eyebrow}>Start here</span>
        <Link href="/learn/playbook" style={{ textDecoration: "none", display: "block" }}>
          <div
            style={{
              display: "flex",
              gap: 14,
              padding: 16,
              borderRadius: "var(--radius-card)",
              background: "var(--surface-card)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 56,
                height: 72,
                flexShrink: 0,
                borderRadius: 10,
                background: "var(--accent)",
                color: "var(--text-on-accent)",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              WAWU
            </span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)", lineHeight: 1.3 }}>
                {playbook.title}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                {playbook.pages} pages · {playbook.format} · Free download
              </span>
              <div style={{ display: "flex" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 30,
                    padding: "0 12px",
                    borderRadius: "var(--radius-chip)",
                    background: "var(--accent-tint)",
                    border: "1px solid var(--border-accent)",
                    color: "var(--accent)",
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  <Icon name="Download" size={14} stroke={2.4} />
                  Free download
                </span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px" }}>
          <span style={{ flex: 1, ...eyebrow, padding: 0 }}>Courses</span>
          <Link href="/learn/courses" style={seeAll}>See all {entitlement.totalCourses}</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {courses.slice(0, 3).map((c) => (
            <CourseRow key={c.id} course={c} />
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px" }}>
          <span style={{ flex: 1, ...eyebrow, padding: 0 }}>Country guides</span>
          <Link href="/learn/guides" style={seeAll}>See all {guides.length}</Link>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 2px" }}>
          {guides.slice(0, 6).map((g) => (
            <Link
              key={g.id}
              href={`/learn/guides/${g.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                background: "var(--surface-tag)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Icon name="Globe" size={14} color="var(--text-muted)" stroke={2} />
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 13,
        borderRadius: "var(--radius-card)",
        background: "var(--surface-elevated)",
        border: "1px solid var(--border-accent)",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: 12,
          background: "var(--accent-tint)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <Icon name="GraduationCap" size={17} color="var(--accent)" stroke={2} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>
          {free} free course{free === 1 ? "" : "s"} available
          <TierBadge tier={entitlement.tier} size="sm" />
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
          {entitlement.tier === "basic"
            ? "Upgrade to Pro to unlock the full catalogue."
            : "Pro unlocks every course."}
        </span>
      </div>
      <Link href="/learn/courses" style={seeAll}>Browse</Link>
    </div>
  );
}

function CourseRow({ course }: { course: LearnCourse }) {
  return (
    <Link
      href={`/learn/courses/${course.id}`}
      style={{
        display: "flex",
        gap: 13,
        padding: 13,
        borderRadius: "var(--radius-card)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
        textDecoration: "none",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 48,
          height: 54,
          flexShrink: 0,
          borderRadius: 10,
          background: "var(--surface-tag)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        <Icon name="Play" size={18} color="var(--accent)" stroke={2} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          {course.category}
          <span style={{ color: "var(--accent)" }}>★ {course.rating.toFixed(1)}</span>
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
          {course.title}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {course.lessons} lessons · {course.minutes} min · {course.host.name}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {course.price === 0 ? (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--success)" }}>Free</span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
            ₦{course.price.toLocaleString("en-NG")}
          </span>
        )}
      </div>
    </Link>
  );
}