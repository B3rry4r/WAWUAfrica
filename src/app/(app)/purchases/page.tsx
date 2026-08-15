"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getPurchases } from "@/lib/api/purchases";
import { formatNaira } from "@/lib/format";
import type { ContentType } from "@/types/content";
import type { Purchase } from "@/types/purchase";

const FILTERS: Array<{ id: ContentType | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "video", label: "Video" },
  { id: "course", label: "Course" },
  { id: "audio", label: "Audio" },
  { id: "pdf", label: "Books" },
  { id: "template", label: "Templates" },
  { id: "image", label: "Art" },
];

const TYPE_VERB: Record<ContentType, string> = {
  video: "Stream",
  course: "Continue",
  audio: "Listen",
  pdf: "Read",
  image: "View",
  template: "Use",
};

export default function MyPurchasesPage() {
  const [items, setItems] = useState<Purchase[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContentType | "all">("all");

  const load = useCallback(() => {
    setItems(null);
    setError(null);
    getPurchases()
      .then((res) => setItems(res.items))
      .catch(() => setError("We could not load your purchases right now."));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(() => (filter === "all" ? (items ?? []) : (items ?? []).filter((p) => p.contentType === filter)), [items, filter]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-2">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em]">My purchases</h1>
        <p className="m-0 text-[13px] text-text-muted">
          {items ? `${items.length} ${items.length === 1 ? "item" : "items"} · yours permanently, even if the creator takes it down` : " "}
        </p>
      </div>

      <div className="wawu-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
        {FILTERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`inline-flex h-[34px] shrink-0 items-center whitespace-nowrap rounded-button px-[14px] text-[13.5px] font-semibold transition-colors ${
              filter === t.id ? "bg-accent text-on-accent" : "border border-hairline bg-tag text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState title="Could not load your purchases" body={error} onRetry={load} />
      ) : !items ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="PackageOpen"
          title="Nothing here yet"
          caption="When you unlock a piece it lands here, permanently. Go find something worth it."
          action="Explore content"
          onAction={() => (window.location.href = "/")}
        />
      ) : (
        <div className="flex flex-col overflow-hidden rounded-card border border-hairline bg-card">
          {filtered.map((p, i) => (
            <PurchaseRow key={p.id} purchase={p} last={i === filtered.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function PurchaseRow({ purchase, last }: { purchase: Purchase; last: boolean }) {
  const verb = TYPE_VERB[purchase.contentType];
  const date = new Date(purchase.purchasedAt);
  const dateLabel = date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  const state = purchase.price === 0 ? "Free" : `Unlocked ${dateLabel}`;

  return (
    <Link href={`/content/${purchase.contentId}`} className={`flex items-center gap-3.5 px-4 py-4 ${last ? "" : "border-b border-hairline"}`}>
      <span
        className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-card border border-hairline bg-[repeating-linear-gradient(135deg,var(--surface-tag)_0_10px,var(--surface-card)_10px_20px)] text-text-secondary"
      >
        <Icon name={typeIcon(purchase.contentType)} size={22} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-semibold text-text-primary">{purchase.title}</span>
        <span className="truncate text-[12.5px] text-text-muted">
          {purchase.creatorName} · {state}
          {purchase.price > 0 ? ` · ${formatNaira(purchase.price)}` : ""}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-accent">
        {verb}
        {purchase.contentType === "video" ? null : <Icon name="ArrowRight" size={14} color="var(--accent)" />}
      </span>
    </Link>
  );
}

function typeIcon(type: ContentType): IconName {
  const icons: Record<ContentType, IconName> = {
    video: "Play",
    course: "GraduationCap",
    audio: "Headphones",
    pdf: "FileText",
    image: "Image",
    template: "LayoutTemplate",
  };
  return icons[type];
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5">
          <Skeleton className="h-[64px] w-[64px] rounded-card" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-[60%] rounded" />
            <Skeleton className="h-3 w-[45%] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}