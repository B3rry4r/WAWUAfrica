"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton, EmptyState, ErrorState } from "@/components/ui";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { getNotifications, markAllRead, markRead } from "@/lib/api/notifications";
import type { AppNotification } from "@/types/notification";
import { NotificationCard } from "./_components/NotificationCard";
import { NotificationRow } from "./_components/NotificationRow";

/**
 * Notifications, rebuilt for build brief C8.
 *
 * ── WHAT IT WAS ──────────────────────────────────────────────────────────────
 * refs/bug-notifications-plain.jpg: identical text rows, an icon circle, two
 * lines of grey, a date. Nothing on it was worth opening, which is why it was
 * rejected.
 *
 * ── WHAT DECIDES A ROW'S SHAPE ───────────────────────────────────────────────
 * One rule, and it is a property of the data rather than a switch somebody
 * flips: a notification with a picture renders as a picture card, and one
 * without renders compact. That keeps a sale or a refund quick to scan, and
 * gives an announcement the room it was composed for. It also means the list
 * can never show an empty image frame, because the frame only exists when
 * there is an image.
 *
 * ── RESTRAINT (brief A5) ─────────────────────────────────────────────────────
 * Purple appears in exactly three places here: the unread dot, the single
 * filled CTA on a paid DM about to expire, and nothing else. Tone-tinted card
 * borders are gone (they put a purple edge on every sale and tip) and the
 * unread tint is an elevated surface instead of accent-tint. Red survives on
 * the one thing that is genuinely about to cost somebody money.
 *
 * ── EVERY STATE HAS AN EXIT ──────────────────────────────────────────────────
 * Loading, error (retry), empty (three real destinations) and loaded. Opening
 * any notification navigates somewhere that resolves it, and marks it read
 * through a real endpoint on the way.
 */
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

  // Desktop-only regroup by consequence (design D15): urgent action first, then
  // money, then everything else — independent of the time-based mobile grouping
  // above, which stays untouched.
  const needsNow = items?.filter((n) => n.kind === "dm_deadline") ?? [];
  const needsNowIds = new Set(needsNow.map((n) => n.id));
  // amount/creditsCount are nullable columns on the real Notification model
  // (prisma schema: `amount Int?`) — the wire response sends `null`, not a
  // missing key, so this must be a loose null check, not `!== undefined`.
  const money = items?.filter((n) => n.amount != null && !needsNowIds.has(n.id)) ?? [];
  const moneyIds = new Set(money.map((n) => n.id));
  const laterDesktop = items?.filter((n) => !needsNowIds.has(n.id) && !moneyIds.has(n.id)) ?? [];

  const onMarkAllRead = async () => {
    try {
      await markAllRead();
      setItems((prev) => (prev ? prev.map((n) => ({ ...n, read: true })) : prev));
    } catch {
      setError("Could not mark everything read right now.");
    }
  };

  /**
   * Opening a notification clears its own dot, through a real write.
   *
   * The optimistic flip is deliberate and safe in this one direction: the
   * click is navigating away, so there is no screen left to revert on, and
   * the worst case of a failed write is a dot that comes back on the next
   * load. That is the right failure for "read", and the opposite of the
   * optimistic writes on the settings screen, which do revert.
   */
  const onOpen = (id: string) => {
    setItems((prev) => (prev ? prev.map((n) => (n.id === id ? { ...n, read: true } : n)) : prev));
    void markRead(id).catch(() => {
      /* MECHANISM: NotificationService.markRead (POST /notifications/:id/read). A
         failed write leaves the dot lit on the next load, which is honest. */
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-page xl:mx-auto xl:w-full xl:max-w-[700px]">
      {/* One row, one bar. The back control used to sit in its own block above
          this one — measured 52px higher than the title's centre line and 23px
          out horizontally, which is the reported back-button/title
          misalignment. FlowHeader centres both on the same axis. */}
      <FlowHeader
        title="Notifications"
        sticky
        right={
          unread > 0 ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="shrink-0 text-[13.5px] font-semibold text-text-secondary hover:text-text-primary"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

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
            caption="Nothing to see yet. Follow creators, unlock content or join a community, we will ping you here when it matters."
          />
          <div className="mt-4 flex flex-col gap-2.5">
            <button type="button" onClick={() => router.push("/home")} className="rounded-button border border-hairline bg-tag px-5 py-3 text-[14px] font-semibold hover:bg-surface-hover active:bg-surface-press">
              Browse the feed
            </button>
            <button type="button" onClick={() => router.push("/explore")} className="rounded-button border border-hairline bg-tag px-5 py-3 text-[14px] font-semibold hover:bg-surface-hover active:bg-surface-press">
              Explore creators
            </button>
            <button type="button" onClick={() => router.push("/communities")} className="rounded-button border border-hairline bg-tag px-5 py-3 text-[14px] font-semibold hover:bg-surface-hover active:bg-surface-press">
              Find a community
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: grouped by time (Now / Earlier). */}
          {/* pb-28, not pb-8: the creator FAB floats bottom-right above the tab
              bar and was sitting on top of the last card in the list, so the
              oldest notification could not be read or tapped. */}
          <div className="flex flex-col gap-5 px-4 pb-28 pt-4 xl:hidden">
            {now.length ? <NotificationGroup label="Now" items={now} onOpen={onOpen} /> : null}
            {earlier.length ? <NotificationGroup label="Earlier" items={earlier} onOpen={onOpen} /> : null}
          </div>

          {/* Desktop (design D15): grouped by consequence — urgent action first, then money, then everything else. */}
          <div className="hidden flex-col gap-5 px-6 pb-10 pt-5 xl:flex">
            {needsNow.length ? <NotificationGroup label="Needs you now" items={needsNow} onOpen={onOpen} /> : null}
            {money.length ? <NotificationGroup label="Money" items={money} onOpen={onOpen} /> : null}
            {laterDesktop.length ? <NotificationGroup label="Earlier" items={laterDesktop} onOpen={onOpen} /> : null}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationGroup({
  label,
  items,
  onOpen,
}: {
  label: string;
  items: AppNotification[];
  onOpen: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-muted">{label}</span>
      <div className="flex flex-col gap-3">
        {items.map((n) =>
          n.imageUrl ? (
            <NotificationCard key={n.id} notification={n} onOpen={onOpen} />
          ) : (
            <NotificationRow key={n.id} notification={n} onOpen={onOpen} />
          ),
        )}
      </div>
    </section>
  );
}
