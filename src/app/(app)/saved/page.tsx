"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSavedItems } from "@/lib/api/settings";
import { ContentCard } from "@/components/content/ContentCard";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import type { SavedItem, SavedItemKind } from "@/types/settings";

const FILTERS: Array<{ id: SavedItemKind | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "content", label: "Content" },
  { id: "guide", label: "Guides" },
  { id: "product", label: "Products" },
];

export default function SavedPage() {
  const router = useRouter();
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SavedItemKind | "all">("all");

  const load = useCallback(() => {
    setItems(null);
    setError(null);
    getSavedItems()
      .then((res) => setItems(res))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "We couldn't load your saved items."));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(
    () => (filter === "all" ? (items ?? []) : (items ?? []).filter((i) => i.kind === filter)),
    [items, filter],
  );

  return (
    <div className="flex flex-col gap-3.5 p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:p-[30px_28px_64px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="flex-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Saved
        </span>
      </div>

      <div className="wawu-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`inline-flex h-[32px] shrink-0 items-center whitespace-nowrap rounded-full px-[14px] text-[13px] font-semibold transition-colors ${
              filter === f.id
                ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                : "border border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)] font-medium hover:bg-surface-hover active:bg-surface-press"
            }`}
          >
            {f.id === "all" && items ? `All ${items.length}` : f.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState title="We couldn't load your saved items." body={error} onRetry={load} />
      ) : !items ? (
        <GridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="Bookmark"
          title={items.length === 0 ? "Nothing saved yet" : "Nothing here yet"}
          caption={
            items.length === 0
              ? "Bookmark courses, guides and products and they'll line up here."
              : "Try another filter, or browse everything you've saved."
          }
          action={items.length === 0 ? "Explore content" : "Show all"}
          onAction={items.length === 0 ? () => router.push("/home") : () => setFilter("all")}
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-[18px]">
          {filtered.map((item) => (
            <ContentCard key={item.id} content={item.content} />
          ))}
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-[18px]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-4 w-[85%] rounded" />
          <Skeleton className="h-3 w-[55%] rounded" />
        </div>
      ))}
    </div>
  );
}
