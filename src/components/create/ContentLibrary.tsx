"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { contentApi } from "@/lib/api/creator-content";
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
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState(false);

  // Routes a rejected item back into the publishing wizard, prefilled, so it
  // can actually be fixed and resubmitted instead of dead-ending here.
  const resubmit = useCallback(
    (item: ContentItem) => {
      router.push(`/create/new?type=${item.type}&resubmit=${item.id}`);
    },
    [router],
  );

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
          <span className="text-[12.5px] font-semibold text-[var(--text-muted)]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>
            {items ? items.length : "–"} of {slotsTotal} slots
          </span>
        }
      />

      <div className="flex gap-[8px] py-[12px] px-[16px] overflow-hidden border-b border-b-[var(--border-hairline)]">
        {(["all", "live", "review", "rejected"] as Filter[]).map((f) => {
          const count = f === "all" ? items?.length ?? 0 : items?.filter((i) => i.status === f).length ?? 0;
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="shrink-0 inline-flex items-center h-[32px] py-0 px-[14px] rounded-[999] text-[13px] cursor-pointer" style={{background: active ? "var(--accent)" : "var(--surface-tag)", border: active ? "none" : "1px solid var(--border-hairline)", color: active ? "var(--text-on-accent)" : "var(--text-secondary)", fontWeight: active ? 600 : 500, fontFamily: "var(--font-sans)"}}
            >
              {filterLabels[f]} {f === "all" ? count : `· ${count}`}
            </button>
          );
        })}
      </div>

      <div className="pt-[14px] px-[16px] pb-[32px] flex flex-col gap-[12px]">
        {error ? (
          <ErrorState onRetry={load} />
        ) : !items ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} height={100} radius="var(--radius-card)" />)
        ) : (
          filtered.map((item) => {
            // Rejected items are the only ones with somewhere to go right
            // now: back into the wizard to fix and resubmit. Live and
            // in-review items have no creator-facing detail/edit view yet —
            // follow-up needed before they can be made tappable too.
            const canResubmit = item.status === "rejected";
            return (
              <ContentCard
                key={item.id}
                item={item}
                onClick={canResubmit ? () => resubmit(item) : undefined}
                onFix={canResubmit ? () => resubmit(item) : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
