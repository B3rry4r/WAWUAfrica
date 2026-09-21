import Link from "next/link";
import { Icon } from "@/components/ui";
import type { ProfileExperience } from "@/types/profile";

/**
 * The roles on a profile, as the approved design draws them.
 *
 * ── THE SHAPE ──────────────────────────────────────────────────────────────
 *
 * A rail with a dot per role rather than a stack of cards. Every row here is
 * the same KIND of thing and they are in order, which a rail says and a set
 * of separate cards does not: cards imply each item stands alone, and these
 * read as one history. It is also the treatment that survives a one-role
 * profile, where four bordered cards would be three empty ones and a card.
 *
 * ── WHAT IS NOT HERE ───────────────────────────────────────────────────────
 *
 * No company logos. There is no logo anywhere in this product's data and
 * fetching one per row from a third party would put every creator's employer
 * list through someone else's server.
 *
 * No computed durations ("2 yrs 3 mos"). The stored precision is a month, and
 * a duration printed from two months is exact only by coincidence: somebody
 * who started in late March and left in early April did not work there for a
 * month. The two dates are shown and the reader can do the arithmetic they
 * actually want.
 */

/** "2023-03" to "Mar 2023". */
function monthLabel(month: string): string {
  const [year, mon] = month.split("-");
  const index = Number(mon) - 1;
  const NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  // A month outside 1-12 should be impossible: the API validates the format
  // and this only ever renders what the API sent. If one arrives anyway, the
  // year alone is still true, which beats printing "undefined 2023".
  return NAMES[index] ? `${NAMES[index]} ${year}` : year;
}

/**
 * The date line for one role.
 *
 * "Present" rather than a blank or a dash: a role with no end date is one
 * somebody holds NOW, and that is the most important thing on the row.
 */
function dateRange(role: ProfileExperience): string {
  const start = monthLabel(role.startedOn);
  if (!role.endedOn) return `${start} to Present`;
  return `${start} to ${monthLabel(role.endedOn)}`;
}

export interface ExperienceSectionProps {
  experience: ProfileExperience[];
  /** The owner gets the add and edit affordances. Nobody else does. */
  isOwner: boolean;
}

export function ExperienceSection({ experience, isOwner }: ExperienceSectionProps) {
  // A visitor looking at a profile with no roles sees no section at all,
  // rather than an empty heading. The owner sees it, because an empty state
  // they can act on is how the list ever gets filled.
  if (experience.length === 0 && !isOwner) return null;

  return (
    <section className="flex flex-col gap-[14px] rounded-card border border-hairline bg-card p-[16px] xl:p-[18px]">
      <div className="flex items-center justify-between gap-[10px]">
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-text-primary xl:text-[16px]">
          Experience
        </h2>
        {isOwner ? (
          <Link
            href="/profile/edit#experience"
            className="inline-flex items-center gap-[5px] text-[12.5px] font-semibold text-accent no-underline hover:text-text-primary"
          >
            <Icon name="Plus" size={14} strokeWidth={2.4} />
            Add
          </Link>
        ) : null}
      </div>

      {experience.length === 0 ? (
        <p className="m-0 text-[13px] leading-[1.5] text-text-muted">
          Nothing added yet. The roles you have held tell people why your work
          is worth paying for.
        </p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
          {experience.map((role, i) => (
            <li key={role.id} className="relative flex gap-[12px]">
              {/* The rail. The dot marks the row and the line joins it to the
                  next one, so the last row draws no line: a rail running past
                  the final item implies something below it. */}
              <div className="flex shrink-0 flex-col items-center pt-[4px]">
                <span
                  className={[
                    "h-[9px] w-[9px] shrink-0 rounded-full",
                    // The role held now is the one to find at a glance.
                    role.current ? "bg-accent" : "bg-[var(--border-strong)]",
                  ].join(" ")}
                />
                {i < experience.length - 1 ? (
                  <span className="mt-[4px] w-px flex-1 bg-[var(--border-hairline)]" />
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-[2px] pb-[2px]">
                <span className="text-[14px] font-semibold leading-[1.3] text-text-primary">
                  {role.title}
                </span>
                <span className="text-[13px] leading-[1.35] text-text-secondary">
                  {/* Location is optional and plenty of roles have no one
                      place, so the separator only appears when there is
                      something on both sides of it. */}
                  {role.location ? `${role.company} · ${role.location}` : role.company}
                </span>
                <span className="text-[12px] leading-[1.35] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
                  {dateRange(role)}
                </span>
                {role.description ? (
                  <p className="m-0 mt-[5px] max-w-[62ch] text-[12.5px] leading-[1.5] text-text-secondary [text-wrap:pretty]">
                    {role.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
