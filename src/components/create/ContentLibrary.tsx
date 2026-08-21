"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { contentApi } from "@/lib/api/creator-content";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { PLANS } from "@/types/subscription";
import type { ContentItem, ContentStatus } from "@/types/content";
import { CreatorUploadCard } from "@/components/ui/ContentCard";
import { BackLink, Button, EmptyState, ErrorState, Skeleton } from "@/components/ui";

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

/**
 * `/create/library` — the creator's own content list (design "WAWU
 * Publishing", frame 9).
 *
 * Desktop was a stretched mobile view: one column of full-bleed rows, so a
 * card that is 340px wide on a phone became ~1000px wide on a laptop with the
 * same 56px thumbnail glued to the left of it. It is now a width-capped page
 * with an auto-fit card grid and the slot meter promoted out of the header
 * micro-text, so it reflows sensibly at 1024, 1280, 1440 and wider.
 */
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

  // Real slots total (Basic 6 / Pro 15, derived server-side from tier), never
  // the frozen mock — see src/lib/api/mocks/session.ts.
  const { creator } = useCreatorState();
  const slotsTotal = creator?.slotsTotal ?? PLANS.basic.slots;
  // A rejected piece does not hold a slot (the wizard's own copy promises
  // "if it is rejected the slot comes back"), so counting every row —
  // which the header used to do — overstated how full the library was.
  const slotsUsed = items ? items.filter((i) => i.status !== "rejected").length : 0;
  const slotsPct = slotsTotal > 0 ? Math.min(100, (slotsUsed / slotsTotal) * 100) : 0;

  return (
    <div className="flex flex-col">
      {/*
        A title row, not a FlowHeader.

        This was the only route under `(app)` that rendered a FlowHeader while
        NOT being listed in AppHeader.OWN_HEADER_ROUTES, so the global header
        (search + bell on mobile, DesktopHeader at dt) sat directly on top of
        a second header bar — two stacked chrome rows on every width. The back
        control still has to exist (this is a sub-screen of the Create tab and
        desktop has no bottom bar), so it moves into the page as a BackLink,
        which is what every other `(app)` sub-screen uses.
      */}
      <div className="dt:mx-auto dt:w-full dt:max-w-[1120px] dt:px-[26px] dt:py-[26px]">
        <div className="flex flex-col gap-[10px] px-[16px] pt-[16px] dt:px-0 dt:pt-0">
          <BackLink label="Back to Create" />
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-text-primary dt:text-[28px]">
            My content
          </h1>
        </div>

        <div className="flex flex-col gap-[14px] dt:flex-row dt:items-start dt:justify-between dt:gap-[26px]">
          <div className="flex gap-[8px] overflow-x-auto border-b border-b-hairline px-[16px] py-[12px] dt:order-2 dt:border-0 dt:p-0">
            {(["all", "live", "review", "rejected"] as Filter[]).map((f) => {
              const count = f === "all" ? items?.length ?? 0 : items?.filter((i) => i.status === f).length ?? 0;
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`inline-flex h-[32px] shrink-0 cursor-pointer items-center rounded-full px-[14px] font-[var(--font-sans)] text-[13px] ${
                    active
                      ? "border-none bg-accent font-semibold text-on-accent"
                      : "border border-hairline bg-tag font-medium text-text-secondary hover:border-strong hover:bg-surface-hover active:bg-surface-press"
                  }`}
                >
                  {filterLabels[f]} {f === "all" ? count : `· ${count}`}
                </button>
              );
            })}
          </div>

          {/* Slot state, which used to be 12.5px grey text jammed into the
              header's right slot. It is the one number that decides whether
              this creator can upload again, so it gets a real block. */}
          <div className="mx-[16px] flex flex-col gap-[8px] rounded-card border border-hairline bg-card p-[14px] dt:order-1 dt:mx-0 dt:w-[280px] dt:shrink-0">
            <div className="flex items-baseline gap-[10px]">
              <span className="flex-1 text-[13px] text-text-secondary">Upload slots</span>
              <span className="text-[15px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
                {items ? slotsUsed : "–"} of {slotsTotal}
              </span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-tag">
              <div
                className={`h-full rounded-full ${slotsUsed >= slotsTotal ? "bg-warning" : "bg-accent"}`}
                style={{ width: `${slotsPct}%` }}
              />
            </div>
            <span className="text-[12px] leading-[1.45] text-text-muted">
              Rejected pieces do not hold a slot. Taking a live piece down opens its slot again.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-[12px] px-[16px] pb-[32px] pt-[14px] dt:px-0 dt:pb-0 dt:pt-[20px]">
          {error ? (
            <ErrorState onRetry={load} />
          ) : !items ? (
            <div className="grid gap-[12px] dt:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} variant="row" className="h-[100px] rounded-card" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            // Without this, picking a filter with no matches rendered a
            // completely blank screen with no way to tell why.
            <EmptyState
              icon={filter === "all" ? "Upload" : "Filter"}
              title="Nothing here yet"
              caption={emptyDescriptions[filter]}
              {...(filter === "all"
                ? { action: "Upload something", actionHref: "/create" }
                : { action: "Show all", onAction: () => setFilter("all") })}
            />
          ) : (
            <div className="grid gap-[12px] dt:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
              {filtered.map((item) => {
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
              })}
            </div>
          )}

          {items && filtered.length > 0 ? (
            <div className="pt-[6px] dt:max-w-[280px]">
              <Button
                full
                variant="secondary"
                icon="Plus"
                href={slotsUsed >= slotsTotal ? "/subscription" : "/create"}
              >
                {slotsUsed >= slotsTotal ? "All slots in use — see plans" : "Upload something new"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
