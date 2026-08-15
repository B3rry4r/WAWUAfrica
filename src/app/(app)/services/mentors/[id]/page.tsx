import { getMentor } from "@/lib/api/mentors";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar, ErrorState, Icon, StatBlock, StatusPill, VerificationBadge } from "@/components/ui";
import { MentorBookButton } from "@/components/services/MentorBookButton";

export default async function MentorDetailPage({ params }: { params: { id: string } }) {
  const mentor = await getMentor(params.id);

  if (!mentor) {
    return (
      <div className="p-[16px]">
        <ErrorState title="Mentor not found" body="This mentor may be on a break." />
      </div>
    );
  }

  const firstName = mentor.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Mentor
        </span>
      </div>

      <div className="flex flex-col items-center gap-[10px] p-[10px_0] text-center">
        <Avatar initial={mentor.name.charAt(0)} size={72} />
        <span className="flex items-center gap-[7px] text-[21px] font-bold text-[var(--text-primary)]">
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

      <div className="flex gap-[12px]">
        <div className="flex-1 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
          <StatBlock value={`${mentor.yearsExperience} yrs`} label="Experience" align="start" size="sm" />
        </div>
        <div className="flex-1 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
          <StatBlock value={`${mentor.sessions}`} label="Sessions held" align="start" size="sm" />
        </div>
      </div>

      <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">{mentor.bio}</p>

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
          <span className="text-[13.5px] text-[var(--text-secondary)]">Free — mentors volunteer their time</span>
        </div>
        <div className="flex items-center gap-[10px]">
          <Icon name="Languages" size={15} color="var(--text-muted)" />
          <span className="text-[13.5px] text-[var(--text-secondary)]">{mentor.languages.join(" · ")}</span>
        </div>
      </div>

      <MentorBookButton
        mentor={{
          id: mentor.id,
          name: mentor.name,
          topics: mentor.topics,
          openForRequests: mentor.openForRequests,
          fullUntil: mentor.fullUntil,
        }}
      />
    </div>
  );
}
