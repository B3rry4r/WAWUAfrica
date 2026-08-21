"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getMentor } from "@/lib/api/mentors";
import type { Mentor } from "@/types/mentors";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar, ErrorState, Icon, StatBlock, StatusPill, VerificationBadge } from "@/components/ui";
import { MentorBookButton } from "@/components/services/MentorBookButton";

export default function MentorDetailPage() {
  const params = useParams<{ id: string }>();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMentor(params.id)
      .then((m) => {
        if (!active) return;
        if (!m) setError(true);
        else setMentor(m);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.id]);

  if (error) {
    return (
      <div className="p-[16px] xl:p-[26px]">
        <ErrorState title="Mentor not found" body="This mentor may be on a break." />
      </div>
    );
  }

  if (loading || !mentor) {
    return (
      <div className="flex flex-col gap-[14px] p-[14px_16px_96px] xl:p-[26px]">
        <div className="h-[72px] w-[72px] rounded-full bg-[var(--surface-tag)]" />
        <div className="h-[120px] rounded-[var(--radius-card)] bg-[var(--surface-tag)]" />
      </div>
    );
  }

  const firstName = mentor.name.split(" ")[0];

  const identityBlock = (
    <div className="flex flex-col items-center gap-[10px] p-[10px_0] text-center xl:items-start xl:p-0 xl:text-left">
      <Avatar initial={mentor.name.charAt(0)} size={72} />
      <span className="flex items-center gap-[7px] text-[21px] font-bold text-[var(--text-primary)] xl:text-[26px]">
        {mentor.name}
        <VerificationBadge tier={mentor.verification} size={17} />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--accent-hover)]">
        {mentor.field}
      </span>
      <span className="text-[13px] text-[var(--text-muted)]">@{mentor.handle}</span>
      {!mentor.openForRequests ? (
        <StatusPill kind="neutral" size="sm">{`Full until ${mentor.fullUntil}`}</StatusPill>
      ) : null}
    </div>
  );

  const statsBlock = (
    <div className="flex gap-[12px]">
      <div className="flex-1 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
        <StatBlock value={`${mentor.yearsExperience} yrs`} label="Experience" align="start" size="sm" />
      </div>
      <div className="flex-1 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
        <StatBlock value={`${mentor.sessions}`} label="Sessions held" align="start" size="sm" />
      </div>
    </div>
  );

  const bio = <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">{mentor.bio}</p>;

  const topicsBlock = (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
        Ask {firstName} about
      </span>
      <div className="flex flex-wrap gap-[8px]">
        {mentor.topics.map((t) => (
          <span
            key={t}
            className="inline-flex h-[32px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[13px] text-[12.5px] font-semibold text-[var(--text-secondary)]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );

  const availabilityCard = (
    <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
        When {firstName} is free
      </span>
      <div className="flex items-center gap-[10px]">
        <Icon name="Calendar" size={15} color="var(--text-muted)" />
        <span className="text-[13.5px] text-[var(--text-secondary)]">{mentor.availability}</span>
      </div>
      <div className="flex items-center gap-[10px]">
        <Icon name="Clock" size={15} color="var(--text-muted)" />
        <span className="text-[13.5px] text-[var(--text-secondary)]">45 minutes, on a call</span>
      </div>
      <div className="flex items-center gap-[10px]">
        <Icon name="HandCoins" size={15} color="var(--text-muted)" />
        <span className="text-[13.5px] text-[var(--text-secondary)]">No charge, mentors volunteer their time</span>
      </div>
      <div className="flex items-center gap-[10px]">
        <Icon name="Languages" size={15} color="var(--text-muted)" />
        <span className="text-[13.5px] text-[var(--text-secondary)]">{mentor.languages.join(" · ")}</span>
      </div>
    </div>
  );

  const bookButton = (
    <MentorBookButton
      mentor={{
        id: mentor.id,
        name: mentor.name,
        topics: mentor.topics,
        openForRequests: mentor.openForRequests,
        fullUntil: mentor.fullUntil,
      }}
    />
  );

  return (
    <>
      <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:hidden">
        <div className="flex items-center gap-[10px]">
          <ProfileBackButton compact />
          <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Mentor
          </span>
        </div>

        {identityBlock}
        {statsBlock}
        {bio}
        {topicsBlock}
        {availabilityCard}
        {bookButton}
      </div>

      {/* 2-column split (design pattern from content/[id]): mentor info/stats/bio
          in the main column, the booking action fixed in the right rail. */}
      <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col">
        <div
          className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-4 border-b border-[var(--border-hairline)] bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur"
          style={{ backdropFilter: "var(--blur-chrome)" }}
        >
          <Link href="/services/mentors" className="flex items-center gap-[9px] text-[14px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary">
            <Icon name="ArrowLeft" size={18} />
            Mentors
          </Link>
          <span className="ml-[10px] text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{mentor.name}</span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_360px] items-start gap-[26px] overflow-y-auto p-[26px]">
          <div className="flex flex-col gap-[20px]">
            {identityBlock}
            {statsBlock}
            {bio}
            {topicsBlock}
          </div>

          <div className="flex flex-col gap-[16px]">
            {availabilityCard}
            {bookButton}
          </div>
        </div>
      </div>
    </>
  );
}
