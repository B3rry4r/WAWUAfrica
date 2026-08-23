import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { formatNaira } from "@/lib/format";
import { CATEGORIES } from "@/lib/categories";
import type { ProfessionalListing } from "@/types/professional";

function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id.replace(/_/g, " ");
}

/** "24 hours" / "3 days" — never a bare hour count once past a day. */
function windowLabel(hours: number): string {
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  if (hours % 168 === 0) {
    const weeks = hours / 168;
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * One professional in the directory.
 *
 * The price and the reply window are ON the card rather than behind a tap,
 * because they are the terms of the only transaction this screen leads to.
 * Someone comparing four lawyers is comparing what it costs to ask them a
 * question and how long they have to answer — making that a second click
 * turns a decision into four.
 */
export function ProfessionalCard({ pro }: { pro: ProfessionalListing }) {
  return (
    <Link
      href={`/professionals/${pro.id}`}
      className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] no-underline text-inherit transition-colors hover:border-strong hover:bg-surface-hover active:bg-surface-press"
    >
      <div className="flex items-start gap-[12px]">
        <Avatar initial={pro.name.charAt(0)} size={48} />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="flex items-center gap-[6px]">
            <span className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
              {pro.name}
            </span>
            <VerificationBadge tier={pro.verification} size={15} />
          </span>
          <span className="truncate text-[13px] text-[var(--text-secondary)]">
            {pro.headline}
          </span>
          <span className="text-[12px] text-[var(--text-muted)]">
            {categoryName(pro.category)}
          </span>
        </div>
      </div>

      {pro.services.length > 0 ? (
        <div className="flex flex-wrap gap-[6px]">
          {pro.services.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)] px-[9px] py-[3px] text-[11.5px] text-[var(--text-secondary)]"
            >
              {s}
            </span>
          ))}
          {pro.services.length > 3 ? (
            <span className="px-[4px] py-[3px] text-[11.5px] text-[var(--text-muted)]">
              +{pro.services.length - 3} more
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-[8px] border-t border-[var(--border-hairline)] pt-[10px]">
        {/*
          A professional who never switched paid messages on cannot be
          reached. Saying so is the honest version — the alternative is a
          "Message" button that dead-ends, or worse, reading as free.
        */}
        {pro.dmEnabled && pro.dmPrice !== null ? (
          <>
            <Icon name="MessageCircle" size={15} color="var(--accent)" strokeWidth={2} />
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">
              {formatNaira(pro.dmPrice)}
            </span>
            <span className="text-[12.5px] text-[var(--text-muted)]">
              · replies within {windowLabel(pro.dmResponseHours)}
            </span>
          </>
        ) : (
          <>
            <Icon name="MessageCircleOff" size={15} color="var(--text-muted)" strokeWidth={2} />
            <span className="text-[12.5px] text-[var(--text-muted)]">
              Not taking messages right now
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
