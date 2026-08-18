"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { contentApi } from "@/lib/api/creator-content";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { PLANS } from "@/types/subscription";
import type { ContentItem, ContentStatus } from "@/types/content";
import { CreatorUploadCard } from "@/components/ui/ContentCard";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { FlowHeader } from "@/components/layout/FlowHeader";

type Filter = "all" | ContentStatus;

const filterLabels: Record<Filter, string> = {
  all: "All",
  live: "Published",
  review: "In review",
  rejected: "Rejected",
};

/** Says what the chosen filter actually means, so an empty list isn't a mystery. */
const emptyDescriptions: Record<Filter, string> = {
  all: "Nothing uploaded yet. Anything you publish shows up here with its review status.",
  live: "Nothing published yet. Pieces appear here once review clears them.",
  review: "Nothing waiting on review. Uploads sit here until we've checked them.",
  rejected: "Nothing rejected. Anything sent back to fix would land here.",
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

  // Real slots total (Basic 3 / Pro 7, derived server-side from tier), never
  // the frozen mock — see src/lib/api/mocks/session.ts.
  const { creator } = useCreatorState();
  const slotsTotal = creator?.slotsTotal ?? PLANS.basic.slots;

  return (
    <div>
      <FlowHeader
        title="My content"
        right={
          <span className="text-[12.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
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
              className={`shrink-0 inline-flex items-center h-[32px] py-0 px-[14px] rounded-[999px] text-[13px] cursor-pointer font-[var(--font-sans)] ${
                active
                  ? "bg-[var(--accent)] border-none text-[var(--text-on-accent)] font-semibold"
                  : "bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-secondary)] font-medium"
              }`}
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
        ) : filtered.length === 0 ? (
          // Without this, picking a filter with no matches rendered a
          // completely blank screen with no way to tell why.
          <EmptyState
            icon={filter === "all" ? "Upload" : "Filter"}
            title="Nothing here yet"
            description={emptyDescriptions[filter]}
            action={
              filter === "all" ? (
                // The hub, not /create/new — that route needs a ?type= only the hub can pick.
                <Button size="md" variant="secondary" onClick={() => router.push("/create")}>
                  Upload something
                </Button>
              ) : (
                <Button size="md" variant="secondary" onClick={() => setFilter("all")}>
                  Show all
                </Button>
              )
            }
          />
        ) : (
          filtered.map((item) => {
            // Rejected items are the only ones with somewhere to go right
            // now: back into the wizard to fix and resubmit. Live and
            // in-review items have no creator-facing detail/edit view yet —
            // follow-up needed before they can be made tappable too.
            const canResubmit = item.status === "rejected";
            return (
              <CreatorUploadCard
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
