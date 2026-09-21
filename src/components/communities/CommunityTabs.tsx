"use client";

import { useState } from "react";
import Link from "next/link";
import type { Community } from "@/types/credits";
import { Icon } from "@/components/ui/Icon";
import { CommunityImage } from "@/components/ui/CommunityImage";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";

type Tab = "joined" | "discover" | "hosting";

const TAB_LABEL: Record<Tab, string> = {
  joined: "Yours",
  discover: "Discover",
  hosting: "Hosting",
};

/**
 * `joined`/`discover`/`hosting` and the join action itself are owned by the
 * parent (communities/page.tsx) rather than copied into local state here —
 * the page's desktop Rooms sidebar (RoomsDesktopList) reads the same `joined`
 * array, so a real join needs to land in one shared place to show up in
 * both the mobile tab list and the desktop sidebar without a second fetch.
 *
 * `hosting` is the creator-side view of the same rows, filtered by
 * `hostWawuId` (see getHostedCommunities). The tab only exists for accounts
 * that can actually host, so a fan never sees a third tab that can only ever
 * be empty for them.
 */
export function CommunityTabs({
  joined,
  discover,
  hosting,
  requestCounts,
  canHost = false,
  onJoin,
}: {
  joined: Community[];
  discover: Community[];
  /** Communities this account hosts. Omit for accounts that cannot host. */
  hosting?: Community[];
  /**
   * Pending join requests per hosted community id. Only private communities
   * can have any — an open room admits instantly — so an absent or zero
   * entry simply means there is nothing waiting.
   */
  requestCounts?: Record<string, number>;
  /** Creator with an active subscription — enables the Hosting tab and the create CTA. */
  canHost?: boolean;
  onJoin: (id: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("joined");
  const [joinError, setJoinError] = useState<string | null>(null);
  const tabs: Tab[] = canHost ? ["joined", "discover", "hosting"] : ["joined", "discover"];

  const doJoin = async (id: string) => {
    setJoinError(null);
    try {
      await onJoin(id);
    } catch (e) {
      // A real backend rejection (e.g. a stale/nonexistent community id)
      // must show up as a real failure, not a fake move to "Yours".
      setJoinError(e instanceof Error ? e.message : "Couldn't join this community. Try again.");
    }
  };

  const hostedList = hosting ?? [];
  const list = tab === "joined" ? joined : tab === "discover" ? discover : hostedList;

  return (
    <div className="flex flex-col gap-3">
      {joinError && <p className="m-0 text-[13px] text-[var(--danger)]">{joinError}</p>}
      <div className="flex gap-1 rounded-[var(--radius-input)] border border-hairline bg-tag p-1">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              "h-[38px] flex-1 cursor-pointer rounded-[var(--radius-input)] border-none text-[14px] font-semibold",
              tab === t
                ? "bg-card text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.24)]"
                : "bg-transparent text-text-muted hover:bg-state-hover active:bg-state-press",
            ].join(" ")}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {/* The entry point that did not exist. It sits above the list on every
          tab, not buried inside the empty state, so a creator who already
          hosts one can start another without emptying the list first. */}
      {canHost ? (
        <Link
          href="/communities/new"
          className="flex items-center gap-[11px] rounded-[var(--radius-input)] border border-dashed border-strong px-3 py-[13px] no-underline transition-colors hover:bg-state-hover active:bg-state-press"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-tint">
            <Icon name="Plus" size={18} color="var(--accent)" strokeWidth={2.4} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="text-[14.5px] font-semibold text-text-primary">Start a community</span>
            <span className="text-[12.5px] text-text-muted">You keep 85% of every credit spent in it</span>
          </span>
          <Icon name="ChevronRight" size={17} color="var(--text-muted)" strokeWidth={2.2} />
        </Link>
      ) : null}

      {list.length === 0 ? (
        <EmptyState
          icon={tab === "joined" ? "Ticket" : tab === "hosting" ? "Crown" : "Users"}
          title={
            tab === "joined"
              ? "You haven't joined any"
              : tab === "hosting"
                ? "You are not hosting one yet"
                : "Nothing new right now"
          }
          caption={
            tab === "joined"
              ? "Join a community, reading costs nothing, sending costs one credit per message."
              : tab === "hosting"
                ? "Hosting comes with your creator account. Members pay one credit a message and you keep 85% of it."
                : "Check back soon for more communities."
          }
          action={tab === "hosting" ? "Start a community" : undefined}
          actionHref={tab === "hosting" ? "/communities/new" : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((c) =>
            // A community you host is always openable, whether or not this
            // session has recorded a join for it — offering yourself a "Join"
            // button on your own room is the bug that would otherwise show up
            // on every reload (see communities.ts's sessionJoinedIds note).
            // `c.pending` opens the room too — not to read it, but to reach
            // the "waiting for the host" screen. Re-firing a join for someone
            // who has already asked is the dead end, not a retry.
            c.joined || c.pending || tab === "hosting" ? (
              <div key={c.id} className="flex flex-col">
                <Link
                  href={`/communities/${c.id}`}
                  className="flex cursor-pointer items-center gap-[13px] rounded-[var(--radius-input)] p-3 no-underline transition-colors hover:bg-state-hover active:bg-state-press"
                >
                  <CommunityRow c={c} hosted={tab === "hosting"} />
                </Link>
                {/* The way into the approval queue. Sits OUTSIDE the row link
                    (nesting one link inside another is invalid) and only on a
                    private room you host, because an open one admits people
                    instantly and has nothing to approve. */}
                {tab === "hosting" && c.kind === "private" ? (
                  <Link
                    href={`/communities/${c.id}/requests`}
                    className="mx-3 mb-1 flex items-center gap-[7px] rounded-[var(--radius-input)] px-[9px] py-[7px] text-[12.5px] font-semibold text-accent no-underline transition-colors hover:bg-state-hover active:bg-state-press"
                  >
                    <Icon name="UserPlus" size={14} strokeWidth={2.2} color="var(--accent)" />
                    {pendingLabel(requestCounts?.[c.id])}
                  </Link>
                ) : null}
              </div>
            ) : (
              <button
                key={c.id}
                type="button"
                onClick={() => doJoin(c.id)}
                className="flex w-full cursor-pointer items-center gap-[13px] rounded-[var(--radius-input)] border-none bg-transparent p-3 text-left no-underline hover:bg-state-hover active:bg-state-press"
              >
                <CommunityRow c={c} />
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function CommunityRow({ c, hosted = false }: { c: Community; hosted?: boolean }) {
  return (
    <>
      <CommunityImage
        src={c.imageUrl}
        icon={hosted ? "Crown" : "Users"}
        className="h-11 w-11 rounded-[var(--radius-input)] border border-hairline bg-tag"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="flex items-center gap-[7px] text-[15px] font-semibold tracking-[-0.01em] text-text-primary">
          {c.name}
          {!hosted && c.joined && <Icon name="Check" size={14} color="var(--accent)" strokeWidth={2.6} />}
        </span>
        <span className="text-[12.5px] text-text-muted">
          {c.memberCount.toLocaleString("en-NG")} members{c.messagesToday ? ` · ${c.messagesToday} today` : ""}
        </span>
      </div>
      {c.kind === "private" && <StatusPill kind="neutral">Private</StatusPill>}
      {hosted ? (
        <span className="text-[12.5px] font-bold text-text-muted">You host</span>
      ) : c.pending ? (
        // Asked, not answered. The row used to keep offering "Join" to
        // someone who had already pressed it, so asking looked like nothing
        // happening — see CommunityJoinGate.
        <span className="text-[12.5px] font-bold text-text-muted">Requested</span>
      ) : !c.joined ? (
        <span className="text-[13px] font-bold text-accent">{c.kind === "private" ? "Ask" : "Join"}</span>
      ) : null}
    </>
  );
}

/** "3 waiting" / "1 waiting", or the plain label when nothing is queued. */
function pendingLabel(count?: number): string {
  if (!count) return "Join requests";
  return `${count} ${count === 1 ? "person is" : "people are"} waiting`;
}
