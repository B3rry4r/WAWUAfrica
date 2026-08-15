import Link from "next/link";
import { getMentors } from "@/lib/api/mentors";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar, EmptyState, ErrorState, Icon, StatusPill, VerificationBadge } from "@/components/ui";

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "All" } = await searchParams;

  let allMentors;
  let mentors;
  try {
    allMentors = await getMentors();
    mentors = category === "All" ? allMentors : await getMentors(category);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title="We couldn't load mentors." body={message} />;
  }

  const categories = Array.from(new Set(allMentors.map((m) => m.category)));

  return (
    <div className="flex flex-col gap-[14px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Mentors
        </span>
      </div>

      <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
        Free 45-minute sessions with creators who have already done what you&apos;re trying to do.
      </p>

      <div className="flex gap-[8px] overflow-x-auto pb-[2px]">
        <Link
          href="/services/mentors"
          className={`shrink-0 rounded-full px-[14px] py-[7px] text-[13px] font-semibold no-underline ${
            category === "All"
              ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
              : "border border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)] font-medium"
          }`}
        >
          All {allMentors.length}
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
            <Link
              key={m.id}
              href={`/services/mentors/${m.id}`}
              className={`flex items-start gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline ${
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
              <span className="mt-[4px] shrink-0">
                <Icon name="ChevronRight" size={16} color="var(--text-muted)" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
