"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProfessionals } from "@/lib/api/professionals";
import { CATEGORIES } from "@/lib/categories";
import { formatNaira } from "@/lib/format";
import type { ProfessionalListing } from "@/types/professional";
import { Avatar, Icon, Skeleton, VerificationBadge } from "@/components/ui";

/**
 * Professional Services (build brief C4, item 7).
 *
 * A rail of real practitioners rather than the two text rows this section
 * used to be. The price is the DM price, which is what a buyer actually pays
 * to start: "they pay to send the first message" is the whole model, so the
 * figure belongs on the card and not two screens in.
 *
 * A professional with paid messaging switched off shows no figure at all.
 * There is no default price to fall back on and inventing one would be
 * quoting somebody else's rate for them.
 */
function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id.replace(/_/g, " ");
}

export function ProfessionalsRail() {
  const [pros, setPros] = useState<ProfessionalListing[] | null>(null);

  useEffect(() => {
    let alive = true;
    listProfessionals()
      .then((rows) => alive && setPros(rows.slice(0, 8)))
      // The section keeps its heading and its "See all" link. A directory
      // that will not preview is not a reason to hide the directory.
      .catch(() => alive && setPros([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="flex flex-col gap-[12px]">
      <div className="flex items-end justify-between gap-3 px-[2px]">
        <div className="flex flex-col gap-[3px]">
          <h2 className="m-0 text-[17px] font-bold tracking-[-0.015em] text-[var(--text-primary)] dt:text-[20px]">
            Professional services
          </h2>
          <p className="m-0 text-[12.5px] text-[var(--text-muted)]">
            Lawyers, accountants, doctors and more. Vetted before they are listed
          </p>
        </div>
        <Link
          href="/professionals"
          className="shrink-0 text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
        >
          See all
        </Link>
      </div>

      {!pros ? (
        <Skeleton variant="row" />
      ) : pros.length === 0 ? (
        <Link
          href="/professionals"
          className="flex items-center gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline hover:border-strong hover:bg-surface-hover"
        >
          <Icon name="BriefcaseBusiness" size={18} color="var(--accent)" strokeWidth={2} />
          <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">
            Browse the full directory
          </span>
          <Icon name="ChevronRight" size={16} color="var(--text-muted)" />
        </Link>
      ) : (
        <div className="-mx-[16px] px-[16px] xl:mx-0 xl:px-0">
          <div className="wawu-no-scrollbar flex gap-[12px] overflow-x-auto pb-[4px]">
            {pros.map((p) => (
              <Link
                key={p.id}
                href={`/professionals/${p.id}`}
                className="flex w-[200px] shrink-0 flex-col gap-[9px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline transition-colors hover:border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]"
              >
                <Avatar src={p.avatarUrl} initial={p.name.charAt(0)} size={46} />
                <span className="flex items-center gap-[6px]">
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--text-primary)]">
                    {p.handle ? `@${p.handle}` : p.name}
                  </span>
                  {p.verification ? <VerificationBadge tier={p.verification} size={14} /> : null}
                </span>
                <span className="truncate text-[12px] text-[var(--text-muted)]">
                  {categoryName(p.category)}
                </span>
                <span className="line-clamp-2 text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">
                  {p.headline}
                </span>
                {p.dmEnabled && p.dmPrice !== null ? (
                  <span className="mt-auto text-[12.5px] font-semibold text-[var(--accent)]">
                    {formatNaira(p.dmPrice)} to message
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
