"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LearnCourse, LearnEntitlement, LearnGuide, Playbook } from "@/types/learn";
import { getCourseEntitlementState, getCourses, getGuides, getLearnEntitlement, getPlaybook } from "@/lib/api/learn";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListRow } from "@/components/ui/ListRow";
import { EntitlementBanner } from "@/components/learn/EntitlementBanner";
import { CourseRow } from "@/components/learn/CourseRow";
import { LearnEntitlementRail } from "@/components/learn/LearnEntitlementRail";

const eyebrow = "text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]";
const seeAll = "text-[12.5px] font-semibold text-[var(--accent)]";

interface LearnData {
  entitlement: LearnEntitlement;
  courses: LearnCourse[];
  playbook: Playbook;
  guides: LearnGuide[];
}

export default function LearnPage() {
  const [data, setData] = useState<LearnData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setData(null);
    setError(null);
    Promise.all([getLearnEntitlement(), getCourses(), getPlaybook(), getGuides()])
      .then(([entitlement, courses, playbook, guides]) => setData({ entitlement, courses, playbook, guides }))
      .catch(() => setError("We couldn't load Learn."));
  }, []);

  useEffect(load, [load]);

  if (error) return <ErrorState title={error} onRetry={load} />;
  if (!data) return <LandingSkeleton />;

  const { entitlement, courses, playbook, guides } = data;
  const countryGuideCount = guides.filter((g) => g.kind === "country").length;
  const article = guides.find((g) => g.kind === "article");
  const template = guides.find((g) => g.kind === "template");

  return (
    // Below xl: unchanged single-column mobile stack, banner on top. At xl
    // (design D12): the banner moves into a persistent right rail so it stays
    // visible against every card, and courses go 3-across instead of stacked.
    <div className="flex flex-col gap-5 p-[16px_16px_96px] xl:flex-row xl:items-start xl:gap-6 xl:p-[26px]">
      <div className="xl:hidden">
        <EntitlementBanner entitlement={entitlement} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5 xl:gap-6">
        <section className="flex flex-col gap-2.5">
          <span className={`px-[2px] ${eyebrow}`}>Start here</span>
          <Link href="/learn/playbook" className="no-underline block">
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-card)]">
              <div className="relative aspect-video w-full bg-[repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)]">
                <span className="absolute left-3 top-3 inline-flex h-[26px] items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(11,10,13,0.62)] px-2.5 text-[11.5px] font-bold text-white backdrop-blur-[10px]">
                  <Icon name="BookOpen" size={12} color="#fff" strokeWidth={2.2} />
                  Playbook
                </span>
              </div>
              <div className="flex flex-col gap-[9px] p-4">
                <span className="text-[18px] font-semibold leading-[1.25] tracking-[-0.015em] text-[var(--text-primary)]">
                  {playbook.title}
                </span>
                <span className="text-[13px] leading-[1.45] text-[var(--text-secondary)]">{playbook.description}</span>
                <div className="flex items-center gap-2.5 pt-2.5">
                  <span className="flex-1 text-[12.5px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
                    {playbook.pages} pages · {playbook.format}
                  </span>
                  <span className="inline-flex h-[38px] items-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] px-4 text-[13.5px] font-semibold text-[var(--text-on-accent)]">
                    <Icon name="Download" size={16} color="var(--text-on-accent)" strokeWidth={2.2} />
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
            <Link href="/learn/courses" className={seeAll}>See all {courses.length}</Link>
          </div>
          <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-3 xl:gap-4">
            {courses.slice(0, 3).map((c) => (
              <CourseRow key={c.id} course={c} state={getCourseEntitlementState(c.id, entitlement)} freeCoursesTotal={entitlement.freeCoursesTotal} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-2.5 px-[2px]">
            <span className={`flex-1 ${eyebrow}`}>Playbooks and guides</span>
            <Link href="/learn/guides" className={seeAll}>See all</Link>
          </div>
          <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-1">
            <ListRow
              title="Country guides"
              subtitle={`Trade rules by market · ${countryGuideCount} countries`}
              icon="Globe"
              href="/learn/guides"
            />
            {article ? (
              <ListRow title={article.title} subtitle={`Guide · ${article.readMinutes} min read`} icon="FileText" href={`/learn/guides/${article.id}`} />
            ) : null}
            {template ? (
              <ListRow title={template.title} subtitle={`Download · ${template.fileCount} files`} icon="LayoutTemplate" href={`/learn/guides/${template.id}`} />
            ) : null}
          </div>
        </section>
      </div>

      <LearnEntitlementRail entitlement={entitlement} courses={courses} />
    </div>
  );
}

function LandingSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-[16px_16px_96px]">
      <Skeleton variant="row" className="h-[64px]" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="aspect-video w-full rounded-[var(--radius-card)]" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton variant="row" className="h-[90px]" />
        <Skeleton variant="row" className="h-[90px]" />
        <Skeleton variant="row" className="h-[90px]" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3 w-40 rounded" />
        <Skeleton className="h-[200px] w-full rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}
