import { getMentor } from "@/lib/api/mentors";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar, ErrorState, Icon, VerificationBadge } from "@/components/ui";
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
          <VerificationBadge tier="verified_user" size={17} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--accent-hover)]">
          {mentor.field}
        </span>
        <span className="text-[13px] text-[var(--text-muted)]">
          @{mentor.handle} · ★ {mentor.rating.toFixed(1)} · {mentor.sessions} sessions
        </span>
      </div>

      <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">{mentor.bio}</p>

      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[11px_14px]">
          <Icon name="CalendarDays" size={16} color="var(--accent)" />
          <span className="text-[13.5px] text-[var(--text-primary)]">
            Available {mentor.availability}
          </span>
        </div>
        <div className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[11px_14px]">
          <Icon name="Clock" size={16} color="var(--accent)" />
          <span className="text-[13.5px] text-[var(--text-primary)]">
            45-minute session · ₦{mentor.rate.toLocaleString("en-NG")}
          </span>
        </div>
        <div className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[11px_14px]">
          <Icon name="Languages" size={16} color="var(--accent)" />
          <span className="text-[13.5px] text-[var(--text-primary)]">{mentor.languages.join(" · ")}</span>
        </div>
      </div>

      <MentorBookButton mentor={{ id: mentor.id, name: mentor.name, rate: mentor.rate }} />
    </div>
  );
}
