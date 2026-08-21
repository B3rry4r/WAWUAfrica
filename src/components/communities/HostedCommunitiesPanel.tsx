"use client";

import Link from "next/link";
import type { Community } from "@/types/credits";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";

/**
 * The creator-side view of the communities they host, and the create entry
 * point beside it.
 *
 * "Manage" here means what the backend can actually back: open the room, see
 * its real member count and today's real traffic, and start another. There is
 * deliberately no rename, no delete and no member-approval queue — the
 * Community module exposes none of those (registry-frozen: list, read,
 * membership, join, leave), and drawing controls that cannot do anything is
 * how the pricing cards ended up promising a feature with no entry point in
 * the first place.
 *
 * Used at both breakpoints from the dashboard; one component, a `dense` prop
 * for the desktop right rail.
 */
export function HostedCommunitiesPanel({
  communities,
  dense = false,
}: {
  /** null while the real read is still in flight — never render a fixture. */
  communities: Community[] | null;
  dense?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[12px] rounded-card border border-hairline bg-card p-[18px] xl:p-[20px]">
      <div className="flex items-baseline gap-[10px]">
        <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
          Communities you host
        </span>
        {communities && communities.length > 0 ? (
          <Link href="/communities" className="text-[12.5px] font-semibold text-accent no-underline">
            All
          </Link>
        ) : null}
      </div>

      {communities === null ? (
        <>
          <Skeleton variant="row" className="h-[52px]" />
          <Skeleton variant="row" className="h-[52px]" />
        </>
      ) : communities.length === 0 ? (
        <>
          <span className="text-[13px] leading-[1.5] text-text-secondary">
            You are not hosting one yet. Reading is free for members, sending costs them one credit, and you keep{" "}
            <span className="font-semibold text-text-primary">90%</span> of every credit spent — the best split on the
            platform, on both tiers.
          </span>
          <Button full={!dense} size={dense ? "sm" : "md"} icon="Plus" href="/communities/new">
            Start a community
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-[8px]">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={`/communities/${c.id}`}
                className="flex items-center gap-[11px] rounded-input border border-hairline bg-elevated px-[12px] py-[11px] no-underline transition-colors hover:bg-surface-hover active:bg-surface-press"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-tag">
                  <Icon name={c.kind === "private" ? "Lock" : "Users"} size={15} color="var(--accent)" strokeWidth={2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[1px]">
                  <span className="truncate text-[13.5px] font-semibold text-text-primary">{c.name}</span>
                  <span className="truncate text-[12px] text-text-muted">
                    {c.memberCount.toLocaleString("en-NG")} members
                    {c.messagesToday ? ` · ${c.messagesToday} messages today` : " · no messages today"}
                  </span>
                </span>
                {c.kind === "private" ? <StatusPill kind="neutral">Private</StatusPill> : null}
                <Icon name="ChevronRight" size={15} color="var(--text-muted)" strokeWidth={2.2} />
              </Link>
            ))}
          </div>
          <Button full={!dense} size="sm" variant="secondary" icon="Plus" href="/communities/new">
            Start another
          </Button>
        </>
      )}
    </div>
  );
}
