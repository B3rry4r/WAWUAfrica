"use client";

import { useState } from "react";
import Link from "next/link";
import type { Community } from "@/types/credits";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";

type Tab = "joined" | "discover";

/**
 * `joined`/`discover` and the join action itself are owned by the parent
 * (communities/page.tsx) rather than copied into local state here — the
 * page's desktop Rooms sidebar (RoomsDesktopList) reads the same `joined`
 * array, so a real join needs to land in one shared place to show up in
 * both the mobile tab list and the desktop sidebar without a second fetch.
 */
export function CommunityTabs({
  joined,
  discover,
  onJoin,
}: {
  joined: Community[];
  discover: Community[];
  onJoin: (id: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("joined");
  const [joinError, setJoinError] = useState<string | null>(null);

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

  const list = tab === "joined" ? joined : discover;

  return (
    <div className="flex flex-col gap-3">
      {joinError && <p className="m-0 text-[13px] text-[var(--danger)]">{joinError}</p>}
      <div className="flex gap-1 rounded-[var(--radius-input)] border border-hairline bg-tag p-1">
        {(["joined", "discover"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              "h-[38px] flex-1 cursor-pointer rounded-[var(--radius-input)] border-none text-[14px] font-semibold",
              tab === t
                ? "bg-card text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.24)]"
                : "bg-transparent text-text-muted",
            ].join(" ")}
          >
            {t === "joined" ? "Yours" : "Discover"}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={tab === "joined" ? "Ticket" : "Users"}
          title={tab === "joined" ? "You haven't joined any" : "Nothing new right now"}
          caption={
            tab === "joined"
              ? "Join a community, reading is free, sending costs one credit per message."
              : "Check back soon for more communities."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((c) =>
            c.joined ? (
              <Link
                key={c.id}
                href={`/communities/${c.id}`}
                className="flex cursor-pointer items-center gap-[13px] rounded-[var(--radius-input)] p-3 no-underline"
              >
                <CommunityRow c={c} />
              </Link>
            ) : (
              <button
                key={c.id}
                type="button"
                onClick={() => doJoin(c.id)}
                className="flex w-full cursor-pointer items-center gap-[13px] rounded-[var(--radius-input)] border-none bg-transparent p-3 text-left no-underline"
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

function CommunityRow({ c }: { c: Community }) {
  return (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-input)] border border-hairline bg-tag">
        <Icon name="Users" size={19} color="var(--accent)" strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="flex items-center gap-[7px] text-[15px] font-semibold tracking-[-0.01em] text-text-primary">
          {c.name}
          {c.joined && <Icon name="Check" size={14} color="var(--accent)" strokeWidth={2.6} />}
        </span>
        <span className="text-[12.5px] text-text-muted">
          {c.memberCount.toLocaleString("en-NG")} members{c.messagesToday ? ` · ${c.messagesToday} today` : ""}
        </span>
      </div>
      {c.kind === "private" && <StatusPill kind="neutral">Private</StatusPill>}
      {!c.joined && <span className="text-[13px] font-bold text-accent">Join</span>}
    </>
  );
}
