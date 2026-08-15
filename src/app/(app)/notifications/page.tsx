"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusPill } from "@/components/ui/StatusPill";
import { getNotifications, markAllRead } from "@/lib/api/notifications";
import { formatNaira, formatCredits } from "@/lib/format";
import type { AppNotification, NotificationTone } from "@/types/notification";

const toneIcon: Record<NotificationTone, IconName> = {
  danger: "AlertCircle",
  accent: "TrendingUp",
  success: "CheckCircle2",
  warning: "AlertTriangle",
  info: "Info",
  neutral: "Bell",
};

const toneIconColor: Record<NotificationTone, string> = {
  danger: "var(--danger)",
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  neutral: "var(--text-muted)",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setItems(null);
    setError(null);
    getNotifications()
      .then((res) => setItems(res.items))
      .catch(() => setError("We could not load your notifications right now."));
  }, []);

  useEffect(load, [load]);

  const now = items?.filter((n) => Date.now() - new Date(n.createdAt).getTime() < 24 * 60 * 60 * 1000) ?? [];
  const earlier = items?.filter((n) => Date.now() - new Date(n.createdAt).getTime() >= 24 * 60 * 60 * 1000) ?? [];
  const unread = items?.filter((n) => !n.read).length ?? 0;

  const onMarkAllRead = async () => {
    try {
      await markAllRead();
      setItems((prev) => (prev ? prev.map((n) => ({ ...n, read: true })) : prev));
    } catch {
      setError("Could not mark everything read right now.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-4">
        <span className="flex-1 text-[17px] font-semibold">Notifications</span>
        {unread > 0 ? (
          <button type="button" onClick={onMarkAllRead} className="text-[13.5px] font-semibold text-accent">
            Mark all read
          </button>
        ) : null}
      </div>

      {error ? (
        <ErrorState title="Could not load notifications" body={error} onRetry={load} />
      ) : !items ? (
        <div className="flex flex-col gap-4 px-4 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-[38px] w-[38px] rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-[70%] rounded" />
                <Skeleton className="h-3 w-[52%] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <EmptyState
            icon="BellOff"
            title="While you wait"
            caption="Nothing to see yet. Follow creators, unlock content or join a community — we will ping you here when it matters."
          />
          <div className="mt-4 flex flex-col gap-2.5">
            <button type="button" onClick={() => router.push("/")} className="rounded-button border border-hairline bg-tag px-5 py-3 text-[14px] font-semibold">
              Browse the feed
            </button>
            <button type="button" onClick={() => router.push("/explore")} className="rounded-button border border-hairline bg-tag px-5 py-3 text-[14px] font-semibold">
              Explore creators
            </button>
            <button type="button" onClick={() => router.push("/communities")} className="rounded-button border border-hairline bg-tag px-5 py-3 text-[14px] font-semibold">
              Find a community
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-4 pb-8 pt-4">
          {now.length ? (
            <NotificationGroup label="Now" items={now} />
          ) : null}
          {earlier.length ? <NotificationGroup label="Earlier" items={earlier} /> : null}
        </div>
      )}
    </div>
  );
}

function NotificationGroup({ label, items }: { label: string; items: AppNotification[] }) {
  return (
    <section className="flex flex-col gap-2">
      <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-muted">{label}</span>
      <div className="flex flex-col overflow-hidden rounded-card border border-hairline bg-card">
        {items.map((n, i) => (
          <NotificationRow key={n.id} notification={n} last={i === items.length - 1} />
        ))}
      </div>
    </section>
  );
}

function NotificationRow({ notification: n, last }: { notification: AppNotification; last: boolean }) {
  const time = new Date(n.createdAt);
  const timeLabel =
    time.toLocaleDateString("en-NG", { day: "numeric", month: "short" }) === new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short" })
      ? time.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })
      : time.toLocaleDateString("en-NG", { day: "numeric", month: "short" });

  return (
    <div className={`flex gap-3 px-4 py-3.5 ${last ? "" : "border-b border-hairline"} ${n.read ? "" : "bg-accent-tint/40"}`}>
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-hairline bg-tag" style={{ color: toneIconColor[n.tone] }}>
        <Icon name={toneIcon[n.tone]} size={17} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">{n.title}</span>
          {!n.read ? <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-accent" aria-label="Unread" /> : null}
        </span>
        {n.amount !== undefined ? (
          <span className="text-[13px] font-semibold text-accent" style={{ fontFeatureSettings: "var(--font-feature-tabular)" }}>
            {formatNaira(n.amount)}
          </span>
        ) : null}
        {n.creditsCount !== undefined ? (
          <span className="text-[13px] font-semibold text-warning">{formatCredits(n.creditsCount)}</span>
        ) : null}
        <span className="text-[13px] leading-relaxed text-text-secondary">{n.body}</span>
        <span className="text-[11.5px] text-text-muted" style={{ fontFeatureSettings: "var(--font-feature-tabular)" }}>
          {timeLabel}
        </span>
        {n.actionLabel ? (
          <span className="mt-1">
            <button
              type="button"
              className={`inline-flex h-[32px] items-center rounded-button px-3.5 text-[12.5px] font-semibold ${
                n.kind === "dm_deadline" ? "bg-accent text-on-accent" : "border border-hairline bg-tag text-text-secondary"
              }`}
            >
              {n.actionLabel}
            </button>
          </span>
        ) : null}
      </span>
    </div>
  );
}