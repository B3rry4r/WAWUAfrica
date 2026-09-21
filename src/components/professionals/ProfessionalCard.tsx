import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { VerificationTicks } from "@/components/ui/VerificationTicks";
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
export interface ProfessionalCardProps {
  pro: ProfessionalListing;
  /**
   * "card" (default) is the directory tile: avatar block, service tags, and
   * the terms of the paid message along the bottom.
   *
   * "row" is the compact form the approved Services design draws under "Top
   * Professionals" (refs/mobile/ref-services.png): one line per person with a
   * trailing action, three or four of them under a section heading rather
   * than a grid of full cards. A prop, not a second component - CLAUDE.md
   * forbids forking one, and the two forms have to keep saying the same
   * things about the same person.
   *
   * WHAT THE ROW CANNOT DRAW. The design puts a star rating and a review
   * count on each row. `ProfessionalListing` carries no rating and no review
   * count, and nothing on the contract produces one, so the row shows the
   * facts that do exist: whether they are verified, what the first message
   * costs, and how long they have to reply. Inventing 4.9 stars for somebody
   * would be exactly the fabrication this directory refuses elsewhere.
   */
  variant?: "card" | "row";
}

export function ProfessionalCard({ pro, variant = "card" }: ProfessionalCardProps) {
  if (variant === "row") {
    const reachable = pro.dmEnabled && pro.dmPrice !== null;
    return (
      <div className="flex items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[12px]">
        <Link
          href={`/professionals/${pro.id}`}
          className="flex min-w-0 flex-1 items-center gap-[12px] no-underline text-inherit"
        >
          <Avatar src={pro.avatarUrl} initial={pro.name.charAt(0)} size={48} />
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="flex items-center gap-[6px]">
              <span className="truncate text-[14.5px] font-semibold text-[var(--text-primary)]">
                {pro.name}
              </span>
              <VerificationTicks verification={pro.verification} size="sm" />
            </span>
            <span className="truncate text-[12.5px] text-[var(--text-secondary)]">
              {categoryName(pro.category)}
            </span>
            <span className="truncate text-[12px] text-[var(--text-muted)]">
              {reachable
                ? `${formatNaira(pro.dmPrice as number)} to message, replies within ${windowLabel(pro.dmResponseHours)}`
                : "Not taking messages right now"}
            </span>
          </span>
        </Link>
        {reachable ? (
          <Button href={`/professionals/${pro.id}`} size="sm" className="shrink-0">
            Message
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={`/professionals/${pro.id}`}
      className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] no-underline text-inherit transition-colors hover:border-strong hover:bg-surface-hover active:bg-surface-press"
    >
      <div className="flex items-start gap-[12px]">
        <Avatar src={pro.avatarUrl} initial={pro.name.charAt(0)} size={48} />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="flex items-center gap-[6px]">
            <span className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
              {pro.name}
            </span>
            <VerificationTicks verification={pro.verification} size="sm" />
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
