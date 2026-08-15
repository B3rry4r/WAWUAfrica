"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ContentCard } from "@/components/content/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getFeed } from "@/lib/api/content";
import type { ContentPiece } from "@/types/content";

const TABS = [
  { id: "for-you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function HomeFeed() {
  const router = useRouter();
  const [items, setItems] = useState<ContentPiece[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("for-you");

  useEffect(() => {
    let active = true;
    getFeed()
      .then((res) => {
        if (active) setItems(res.items);
      })
      .catch(() => {
        if (active) setError("We could not load your feed right now.");
      });
    return () => {
      active = false;
    };
  }, []);

  const feed = useMemo(() => items ?? [], [items]);

  return (
    <div className="flex flex-col">
      <div className="flex gap-[26px] border-b border-hairline px-[18px]">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative pb-[12px] text-[14.5px] transition-colors ${
                active ? "font-semibold text-text-primary" : "font-medium text-text-muted"
              }`}
            >
              {t.label}
              {active ? (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-[2px] bg-accent" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
        {error ? (
          <EmptyState
            icon="WifiOff"
            title="Could not load your feed"
            caption={error}
            action="Try again"
            onAction={() => window.location.reload()}
          />
        ) : !items ? (
          <FeedSkeleton />
        ) : tab === "following" ? (
          <EmptyState
            icon="Users"
            title="Worth following"
            caption="Follow creators to see their work surface here."
            action="Browse creators"
            onAction={() => router.push("/search")}
          />
        ) : feed.length === 0 ? (
          <EmptyState
            icon="SearchX"
            title="Nothing here yet"
            caption="We have not curated anything in this format yet. Try another tab."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {feed.map((c) => (
              <ContentCard key={c.id} content={c} ratio="2 / 1" authorRow />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 overflow-hidden rounded-card border border-hairline bg-card">
          <div className="flex items-center gap-2.5 p-3 pb-2.5">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-[45%] rounded" />
          </div>
          <Skeleton className="aspect-[2/1] w-full rounded-none" />
          <div className="p-3">
            <Skeleton className="h-4 w-[92%] rounded" />
            <Skeleton className="mt-2 h-3 w-[40%] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}