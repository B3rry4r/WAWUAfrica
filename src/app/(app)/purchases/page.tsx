"use client";

import { BackLink } from "@/components/ui";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListRow } from "@/components/ui/ListRow";
import { ContentCard } from "@/components/content/ContentCard";
import { getPurchases } from "@/lib/api/purchases";
import { getOtherApplications } from "@/lib/api/services";
import { getDmThreads } from "@/lib/api/dm";
import { formatNaira } from "@/lib/format";
import type { ContentPiece, ContentType } from "@/types/content";
import type { Purchase } from "@/types/purchase";
import type { ServiceApplication } from "@/types/services";
import type { DmThreadSummary } from "@/types/dm";

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
    <>
      {/* D5 desktop-only header — suppresses the global DesktopHeader (see
          hasOwnHeader) so this route shows exactly one header at xl. It is the
          SHARED bar now: the back control used to be a pill floating in the
          body 148px below the title it belongs to, which is the reported
          back-button/title misalignment. Back and title share this one row. */}
      <FlowHeader
        title="My purchases"
        sticky
        className="hidden dt:flex"
        right={
          <span className="text-[13.5px] text-text-muted">
            {items ? `${items.length} ${items.length === 1 ? "item" : "items"} · yours permanently` : ""}
          </span>
        }
      />
      {/* D5's tab row, driven by the same `filter` state as the mobile chips —
          the tabs carry this screen's real taxonomy rather than a decorative
          one nothing on the page can filter by. */}
      <div className="sticky top-[68px] z-20 hidden h-[54px] shrink-0 items-center gap-[26px] border-b border-hairline bg-page px-[26px] xl:flex">
        {FILTERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`relative flex h-full items-center text-[14.5px] transition-colors ${
              filter === t.id ? "font-semibold text-text-primary" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {t.label}
            {filter === t.id ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent" /> : null}
          </button>
        ))}
      </div>

    <div className="flex flex-col gap-4 px-4 pb-8 pt-2 xl:px-[26px] xl:pb-[26px] xl:pt-[22px]">
      <BackLink className="dt:hidden" />
      <div className="flex flex-col gap-1 xl:hidden">
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em]">My purchases</h1>
        <p className="m-0 text-[13px] text-text-muted">
          {items ? `${items.length} ${items.length === 1 ? "item" : "items"} · yours permanently, even if the creator takes it down` : " "}
        </p>
      </div>

      <div className="wawu-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 xl:hidden">
        {FILTERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`inline-flex h-[34px] shrink-0 items-center whitespace-nowrap rounded-button px-[14px] text-[13.5px] font-semibold transition-colors ${
              filter === t.id ? "bg-accent text-on-accent" : "border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
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
        <>
          <div className="flex flex-col overflow-hidden rounded-card border border-hairline bg-card xl:hidden">
            {filtered.map((p, i) => (
              <PurchaseRow key={p.id} purchase={p} last={i === filtered.length - 1} />
            ))}
          </div>

          <div className="hidden xl:grid xl:grid-cols-3 xl:items-start xl:gap-[22px]">
            {filtered.map((p) => (
              <PurchaseCard key={p.id} purchase={p} />
            ))}
            {filter === "all" ? <AlsoTracked /> : null}
          </div>
        </>
      )}
    </div>
    </>
  );
}

/**
 * Purchase only carries the flat summary shown in the mobile row (title,
 * creator name, type, price) — not the full ContentPiece the shared
 * ContentCard renders elsewhere. This fills the rest with safe, inert
 * defaults so the desktop grid (design D5) can reuse the one card component
 * instead of forking a second, purchases-only card.
 */
function purchaseToContentPiece(p: Purchase): ContentPiece {
  return {
    id: p.contentId,
    slug: p.contentId,
    contentType: p.contentType,
    title: p.title,
    description: "",
    category: "",
    accessType: p.price === 0 ? "free" : "paid",
    price: p.price,
    creator: {
      // A purchase row carries a display name only — no creator wawuId and no
      // verification level (see the wire shape in src/lib/api/purchases.ts).
      // ContentCard never links to the creator, so the id stays empty rather
      // than reusing the display name as one, and "basic" renders no badge at
      // all (VerificationBadge) rather than claiming a level we don't know.
      wawuId: "",
      fullName: p.creatorName,
      handle: p.creatorName,
      verificationLevel: "basic",
    },
    views: 0,
    commentCount: 0,
    likes: 0,
    saved: false,
    createdAt: p.purchasedAt,
    previewAssetUrl: "",
    fullAssetLocked: false,
    purchased: true,
  };
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const date = new Date(purchase.purchasedAt);
  const dateLabel = date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  return (
    <div className="flex flex-col gap-2.5">
      <ContentCard content={purchaseToContentPiece(purchase)} state="unlocked" ratio="16 / 9" />
      <span className="text-[12.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
        {purchase.price > 0 ? `${formatNaira(purchase.price)} · ` : ""}
        {dateLabel} · {purchase.creatorName}
      </span>
    </div>
  );
}

/**
 * Desktop-only "Also bought" panel (design D5): the creator-service
 * applications and paid questions a buyer is tracking, kept as rows — never
 * cards — because they're tracked processes, not content to reopen. There is
 * no purchases mobile design for this, so it's xl-only, not a mobile feature
 * moved to desktop. WAWUBasket/WAWUBeauty orders are deliberately left out:
 * those are handoff-only external apps (CLAUDE.md) with no order-tracking
 * data model here.
 */
function AlsoTracked() {
  const [applications, setApplications] = useState<ServiceApplication[] | null>(null);
  const [questions, setQuestions] = useState<DmThreadSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // "" never matches a real application id, so this returns every tracked
    // application — the same mock read the applications detail page uses for
    // its own "other applications" rail.
    getOtherApplications("")
      .then((res) => {
        if (!cancelled) setApplications(res);
      })
      .catch(() => {
        if (!cancelled) setApplications([]);
      });
    getDmThreads()
      .then((res) => {
        if (!cancelled) setQuestions(res.filter((t) => t.status === "responded"));
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (applications === null || questions === null) {
    return (
      <div className="hidden flex-col gap-3 rounded-card border border-hairline bg-card p-5 xl:col-span-3 xl:flex">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Also tracked, the verb matches the type</span>
        <div className="flex flex-col gap-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="row" className="h-[52px]" />
          ))}
        </div>
      </div>
    );
  }

  if (applications.length === 0 && questions.length === 0) return null;

  return (
    <div className="hidden flex-col gap-3 rounded-card border border-hairline bg-card p-5 xl:col-span-3 xl:flex">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Also tracked, the verb matches the type</span>
      <div className="flex flex-col">
        {applications.map((a) => (
          <ListRow
            key={a.id}
            title={a.title}
            subtitle={`${a.statusLabel} · reference ${a.reference}`}
            icon="Stamp"
            href={`/services/applications/${a.id}`}
          />
        ))}
        {questions.map((q) => (
          <ListRow
            key={q.id}
            title={`Question to ${q.creatorName}`}
            subtitle={`Answered · ${formatNaira(q.amount)}`}
            icon="MessageCircleQuestion"
            href={`/messages/${q.id}`}
          />
        ))}
      </div>
    </div>
  );
}

function PurchaseRow({ purchase, last }: { purchase: Purchase; last: boolean }) {
  const verb = TYPE_VERB[purchase.contentType];
  const date = new Date(purchase.purchasedAt);
  const dateLabel = date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  const state = purchase.price === 0 ? "No charge" : `Unlocked ${dateLabel}`;

  return (
    <Link href={`/content/${purchase.contentId}`} className={`flex items-center gap-3.5 px-4 py-4 hover:bg-state-hover active:bg-state-press ${last ? "" : "border-b border-hairline"}`}>
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
    <>
      <div className="flex flex-col gap-3 xl:hidden">
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
      <div className="hidden xl:grid xl:grid-cols-3 xl:gap-[22px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <Skeleton className="aspect-[16/9] w-full rounded-card" />
            <Skeleton className="h-3 w-[60%] rounded" />
          </div>
        ))}
      </div>
    </>
  );
}