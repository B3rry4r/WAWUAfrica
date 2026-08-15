"use client";

import { useState } from "react";
import Link from "next/link";
import type { Community } from "@/types/credits";
import { joinCommunity } from "@/lib/api/communities";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";

type Tab = "joined" | "discover";

export function CommunityTabs({ joined, discover }: { joined: Community[]; discover: Community[] }) {
  const [tab, setTab] = useState<Tab>("joined");
  const [joinedList, setJoinedList] = useState<Community[]>(joined);
  const [discoverList, setDiscoverList] = useState<Community[]>(discover);

  const doJoin = async (id: string) => {
    const community = discoverList.find((c) => c.id === id);
    if (!community) return;
    await joinCommunity(id);
    setDiscoverList((l) => l.filter((c) => c.id !== id));
    setJoinedList((l) => [...l, { ...community, joined: true }]);
  };

  const list = tab === "joined" ? joinedList : discoverList;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          borderRadius: "var(--radius-input)",
          background: "var(--surface-tag)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        {(["joined", "discover"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: "var(--radius-input)",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              background: tab === t ? "var(--surface-card)" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.24)" : "none",
            }}
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
              ? "Join a community — reading is free, sending costs one credit per message."
              : "Check back soon for more communities."
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((c) =>
            c.joined ? (
              <Link
                key={c.id}
                href={`/communities/${c.id}`}
                style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 12px", borderRadius: "var(--radius-input)", textDecoration: "none", cursor: "pointer" }}
              >
                <CommunityRow c={c} />
              </Link>
            ) : (
              <button
                key={c.id}
                type="button"
                onClick={() => doJoin(c.id)}
                style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 12px", borderRadius: "var(--radius-input)", textDecoration: "none", cursor: "pointer", background: "transparent", border: "none", width: "100%", textAlign: "left" }}
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
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 14,
          background: "var(--surface-tag)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        <Icon name="Users" size={19} color="var(--accent)" stroke={2} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {c.name}
          {c.joined && <Icon name="Check" size={14} color="var(--accent)" stroke={2.6} />}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          {c.memberCount.toLocaleString("en-NG")} members{c.messagesToday ? ` · ${c.messagesToday} today` : ""}
        </span>
      </div>
      {c.kind === "private" && (
        <StatusPill kind="neutral" style={{ padding: "3px 9px", fontSize: 11 }}>
          Private
        </StatusPill>
      )}
      {!c.joined && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Join</span>}
    </>
  );
}