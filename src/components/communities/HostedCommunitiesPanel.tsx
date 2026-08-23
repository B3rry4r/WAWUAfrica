"use client";

import Link from "next/link";
import type { Community } from "@/types/credits";
import { Button } from "@/components/ui/Button";
import { CommunityImage } from "@/components/ui/CommunityImage";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";

/**
 * The creator-side view of the communities they host, and the create entry
 * point beside it.
 *
 * "Manage" here means what the backend can actually back: open the room, see
 * its real member count and today's real traffic, review who is asking to get
 * into a private one, and start another.
 *
 * The approval queue used to be absent from this panel with a note saying no
 * endpoint existed for it — which was true, and was the whole bug: a private
 * community's join wrote a `pending` row nothing could ever approve, so the
 * room Pro charges extra for could be requested and never entered. The
 * endpoints exist now (`GET /communities/:id/requests` plus approve/decline),
 * so the queue is reachable from here, on private rooms only — an open one
 * admits instantly and has nothing to approve.
 *
 * Still deliberately absent: rename and delete. There IS a PATCH endpoint,
 * but no delete at all (the service explains why — a Community row cascades
 * onto the credit-spend ledger), and drawing controls that cannot do anything
 * is how the pricing cards ended up promising a feature with no entry point
 * in the first place.
 *
 * Used at both breakpoints from the dashboard; one component, a `dense` prop
 * for the desktop right rail.
 */
export function HostedCommunitiesPanel({
  communities,
  requestCounts,
  dense = false,
}: {
  /** null while the real read is still in flight — never render a fixture. */
  communities: Community[] | null;
  /**
   * Pending join requests per community id. Only private rooms can have any;
   * an absent or zero entry means nobody is waiting.
   */
  requestCounts?: Record<string, number>;
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
        // Empty state, laid out as a ROW once there is width for one. This panel
        // sits in the dashboard's wide column, so a stacked sentence over a
        // full-bleed button stretched into one enormous bar across the screen.
        // The prose is capped and the button takes its natural width instead.
        <div className="flex flex-col items-start gap-[12px] dt:flex-row dt:items-center dt:justify-between dt:gap-[20px]">
          <span className="max-w-[52ch] text-[13px] leading-[1.5] text-text-secondary">
            You are not hosting one yet. Members read at no charge, sending costs them one credit, and you keep{" "}
            <span className="font-semibold text-text-primary">90%</span> of every credit spent — the best split on the
            platform, on both tiers.
          </span>
          <Button
            full={dense}
            size={dense ? "sm" : "md"}
            icon="Plus"
            href="/communities/new"
            className="dt:shrink-0"
          >
            Start a community
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-[8px]">
            {communities.map((c) => {
              const waiting = c.kind === "private" ? (requestCounts?.[c.id] ?? 0) : 0;
              return (
                <div key={c.id} className="flex flex-col gap-[6px]">
                  <Link
                    href={`/communities/${c.id}`}
                    className="flex items-center gap-[11px] rounded-input border border-hairline bg-elevated px-[12px] py-[11px] no-underline transition-colors hover:bg-surface-hover active:bg-surface-press"
                  >
                    <CommunityImage
                      src={c.imageUrl}
                      icon={c.kind === "private" ? "Lock" : "Users"}
                      iconSize={15}
                      className="h-8 w-8 rounded-[10px] bg-tag"
                    />
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
                  {/* The approval queue, on private rooms only. A separate
                      link rather than a nested one — an anchor inside an
                      anchor is invalid markup. */}
                  {c.kind === "private" ? (
                    <Link
                      href={`/communities/${c.id}/requests`}
                      className="ml-[4px] flex items-center gap-[7px] self-start rounded-input px-[8px] py-[5px] text-[12px] font-semibold text-accent no-underline transition-colors hover:bg-surface-hover active:bg-surface-press"
                    >
                      <Icon name="UserPlus" size={13} strokeWidth={2.2} color="var(--accent)" />
                      {waiting > 0
                        ? `${waiting} ${waiting === 1 ? "person is" : "people are"} waiting to join`
                        : "Join requests"}
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
          <Button full={!dense} size="sm" variant="secondary" icon="Plus" href="/communities/new">
            Start another
          </Button>
        </>
      )}
    </div>
  );
}
