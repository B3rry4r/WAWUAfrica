import Link from "next/link";
import { getMentors } from "@/lib/api/mentors";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar, ErrorState, Icon, VerificationBadge } from "@/components/ui";

export default async function MentorsPage() {
  let mentors;
  try {
    mentors = await getMentors();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title="We couldn't load mentors." body={message} />;
  }

  return (
    <div className="flex flex-col gap-[14px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Mentors
        </span>
      </div>

      <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
        45-minute sessions with creators who have already done what you&apos;re trying to do.
      </p>

      <div className="flex flex-col gap-[10px]">
        {mentors.map((m) => (
          <Link key={m.id} href={`/services/mentors/${m.id}`} className="flex gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline">
            <Avatar initial={m.name.charAt(0)} size={48} />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="flex items-center gap-[6px] text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                {m.name}
                <VerificationBadge tier="verified_user" size={14} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--accent-hover)]">
                {m.field}
              </span>
              <span className="text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">{m.tagline}</span>
              <span className="text-[12px] text-[var(--text-muted)]">
                ★ {m.rating.toFixed(1)} · {m.sessions} sessions · {m.availability}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end justify-between">
              <span className="text-[14px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
                ₦{m.rate.toLocaleString("en-NG")}
              </span>
              <Icon name="ChevronRight" size={16} color="var(--text-muted)" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
