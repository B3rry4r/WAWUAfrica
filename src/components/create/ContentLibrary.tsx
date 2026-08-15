"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { contentApi } from "@/lib/api/content";
import { currentSession } from "@/lib/api/mocks/session";
import type { ContentItem, ContentStatus } from "@/types/content";
import { ContentCard } from "@/components/ui/ContentCard";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { FlowHeader } from "@/components/layout/FlowHeader";

type Filter = "all" | ContentStatus;

const filterLabels: Record<Filter, string> = {
  all: "All",
  live: "Published",
  review: "In review",
  rejected: "Rejected",
};

export function ContentLibrary() {
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setItems(null);
    contentApi
      .getLibrary()
      .then(setItems)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === "all") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const slotsTotal = currentSession.creator?.slotsTotal ?? 7;

  return (
    <div>
      <FlowHeader
        title="My content"
        right={
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
            {items ? items.length : "–"} of {slotsTotal} slots
          </span>
        }
      />

      <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflow: "hidden", borderBottom: "1px solid var(--border-hairline)" }}>
        {(["all", "live", "review", "rejected"] as Filter[]).map((f) => {
          const count = f === "all" ? items?.length ?? 0 : items?.filter((i) => i.status === f).length ?? 0;
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                height: 32,
                padding: "0 14px",
                borderRadius: 999,
                background: active ? "var(--accent)" : "var(--surface-tag)",
                border: active ? "none" : "1px solid var(--border-hairline)",
                color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
              }}
            >
              {filterLabels[f]} {f === "all" ? count : `· ${count}`}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "14px 16px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        {error ? (
          <ErrorState onRetry={load} />
        ) : !items ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} height={100} radius="var(--radius-card)" />)
        ) : (
          filtered.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onFix={item.status === "rejected" ? () => undefined : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
