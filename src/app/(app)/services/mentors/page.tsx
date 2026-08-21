"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getMentors } from "@/lib/api/mentors";
import type { Mentor } from "@/types/mentors";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar, EmptyState, ErrorState, Icon, StatusPill, VerificationBadge } from "@/components/ui";

export default function MentorsPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "All";

  const [allMentors, setAllMentors] = useState<Mentor[] | null>(null);
  const [mentors, setMentors] = useState<Mentor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    getMentors()
      .then(async (all) => {
        if (!active) return;
        setAllMentors(all);
        const scoped = category === "All" ? all : await getMentors(category);
        if (active) setMentors(scoped);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "We couldn't load mentors.");
      });
    return () => {
      active = false;
    };
  }, [category]);

  if (error) {
    return <ErrorState title="We couldn't load mentors." body={error} />;
  }

  if (!allMentors || !mentors) {
    return (
      <div className="flex flex-col gap-[10px] p-[14px_16px_96px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[86px] rounded-[var(--radius-card)] bg-[var(--surface-tag)]" />
        ))}
      </div>
    );
  }

  const categories = Array.from(new Set(allMentors.map((m) => m.category)));

  return (
    <>
      <div className="flex flex-col gap-[14px] p-[14px_16px_96px] xl:hidden">
        <div className="flex items-center gap-[10px]">
          <ProfileBackButton compact />
          <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Mentors
          </span>
        </div>

        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
          Free 45-minute sessions with creators who have already done what you&apos;re trying to do.
        </p>

        <CategoryChips category={category} allCount={allMentors.length} categories={categories} />

        {mentors.length === 0 ? (
          <EmptyState
            icon="Search"
            title="No mentors in this category yet"
            caption="Try another category, or browse everyone taking requests."
            action="Browse all mentors"
            actionHref="/services/mentors"
          />
        ) : (
          <div className="flex flex-col gap-[10px]">
            {mentors.map((m) => (
              <MentorRow key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>

      {/* Category chips carry over unchanged; the list reflows into a 3-column
          grid of mentor cards at xl instead of a single stacked column. */}
      <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col">
        <div
          className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-4 border-b border-[var(--border-hairline)] bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur"
          style={{ backdropFilter: "var(--blur-chrome)" }}
        >
          <Link href="/services" className="flex items-center gap-[9px] text-[14px] font-semibold text-[var(--text-secondary)] no-underline">
            <Icon name="ArrowLeft" size={18} color="var(--text-secondary)" />
            Services
          </Link>
          <span className="ml-[10px] text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Mentors</span>
          <span className="flex-1" />
          <span className="text-[13.5px] text-[var(--text-muted)]">45-minute sessions, on a call, at no charge</span>
        </div>

        <div className="flex flex-col gap-[20px] p-[26px]">
          <CategoryChips category={category} allCount={allMentors.length} categories={categories} />

          {mentors.length === 0 ? (
            <EmptyState
              icon="Search"
              title="No mentors in this category yet"
              caption="Try another category, or browse everyone taking requests."
              action="Browse all mentors"
              actionHref="/services/mentors"
            />
          ) : (
            <div className="grid grid-cols-3 gap-[16px]">
              {mentors.map((m) => (
                <MentorRow key={m.id} m={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CategoryChips({ category, allCount, categories }: { category: string; allCount: number; categories: string[] }) {
  return (
    <div className="flex gap-[8px] overflow-x-auto pb-[2px]">
      <Link
        href="/services/mentors"
        className={`shrink-0 rounded-full px-[14px] py-[7px] text-[13px] font-semibold no-underline ${
          category === "All"
            ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
            : "border border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)] font-medium"
        }`}
      >
        All {allCount}
      </Link>
      {categories.map((c) => (
        <Link
          key={c}
          href={`/services/mentors?category=${encodeURIComponent(c)}`}
          className={`shrink-0 rounded-full px-[14px] py-[7px] text-[13px] font-semibold no-underline ${
            category === c
              ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
              : "border border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)] font-medium"
          }`}
        >
          {c}
        </Link>
      ))}
    </div>
  );
}

function MentorRow({ m }: { m: Mentor }) {
  return (
    <Link
      href={`/services/mentors/${m.id}`}
      className={`flex items-start gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline xl:h-full xl:flex-col xl:gap-[12px] xl:p-[18px] ${
        m.openForRequests ? "" : "opacity-70"
      }`}
    >
      <Avatar initial={m.name.charAt(0)} size={52} />
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <span className="flex items-center gap-[7px] text-[15.5px] font-semibold text-[var(--text-primary)]">
          {m.name}
          <VerificationBadge tier={m.verification} size={16} />
        </span>
        <span className="text-[13px] leading-[1.45] text-[var(--text-secondary)]">{m.tagline}</span>
        <div className="flex flex-wrap gap-[6px]">
          {m.topics.slice(0, 2).map((t) => (
            <span
              key={t}
              className="inline-flex h-[24px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[9px] text-[11px] font-semibold text-[var(--text-secondary)]"
            >
              {t}
            </span>
          ))}
        </div>
        <div>
          <StatusPill kind={m.openForRequests ? "success" : "neutral"} size="sm">
            {m.openForRequests ? "Taking requests" : `Full until ${m.fullUntil}`}
          </StatusPill>
        </div>
      </div>
      <span className="mt-[4px] shrink-0 xl:hidden">
        <Icon name="ChevronRight" size={16} color="var(--text-muted)" />
      </span>
    </Link>
  );
}
