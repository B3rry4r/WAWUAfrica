"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Skeleton, EmptyState, ErrorState, BackLink } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";
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

const toneIconClass: Record<NotificationTone, string> = {
  danger: "text-danger",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  neutral: "text-text-muted",
};

// Card border tone per design (WAWU Notifications Search.dc.html L50-144): each
// notification is its own bordered card, tinted by tone -- danger/accent/warning
// get a colored border, success/info/neutral stay hairline.
const toneBorderClass: Record<NotificationTone, string> = {
  danger: "border-danger/40",
  accent: "border-accent",
  success: "border-hairline",
  warning: "border-warning/40",
  info: "border-hairline",
  neutral: "border-hairline",
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

  return (
    <div className="flex min-h-screen flex-col bg-surface-page xl:mx-auto xl:w-full xl:max-w-[700px]">
      <div className="px-4 pt-3 xl:px-0"><BackLink /></div>
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-4 xl:sticky xl:top-0 xl:z-10 xl:h-[68px] xl:bg-page xl:px-6 xl:py-0">
        <span className="flex-1 text-[17px] font-semibold xl:text-[19px] xl:tracking-[-0.02em]">Notifications</span>
        {unread > 0 ? (
          <button type="button" onClick={onMarkAllRead} className="text-[13.5px] font-semibold text-accent hover:text-text-primary">
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
          <div className="flex flex-col gap-5 px-4 pb-8 pt-4 xl:hidden">
            {now.length ? (
              <NotificationGroup label="Now" items={now} />
            ) : null}
            {earlier.length ? <NotificationGroup label="Earlier" items={earlier} /> : null}
          </div>

          {/* Desktop (design D15): grouped by consequence — urgent action first, then money, then everything else. */}
          <div className="hidden flex-col gap-5 px-6 pb-10 pt-5 xl:flex">
            {needsNow.length ? <NotificationGroup label="Needs you now" items={needsNow} urgent /> : null}
            {money.length ? <NotificationGroup label="Money" items={money} /> : null}
            {laterDesktop.length ? <NotificationGroup label="Earlier" items={laterDesktop} /> : null}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationGroup({ label, items }: { label: string; items: AppNotification[]; urgent?: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-muted">{label}</span>
      <div className="flex flex-col gap-3">
        {items.map((n) => (
          <NotificationRow key={n.id} notification={n} />
        ))}
      </div>
    </section>
  );
}

// The action buttons are read-only decoration if they don't navigate anywhere
// (confirmed live: clicking "View earnings" on a real sale notification did
// nothing). The wire notification carries no thread/target id, so the button
// routes by `kind` to the screen that actually resolves it -- same pattern as
// the actionHref props used elsewhere in this app (communities ?topup=1 etc).
function actionHrefFor(n: AppNotification): string {
  switch (n.kind) {
    case "dm_deadline":
    case "dm_received":
    case "dm_refunded":
      return "/messages";
    case "sale":
    case "tip_received":
      return "/earnings";
    case "credits_low":
    case "trial_ending":
      return "/communities?topup=1";
    case "subscription_renewal":
      return "/subscription";
    case "content_published":
    case "content_rejected":
      return "/create/library";
    case "kyc_verified":
      return "/profile/verification";
    default:
      return "/notifications";
  }
}

function NotificationRow({ notification: n }: { notification: AppNotification }) {
  const router = useRouter();
  const time = new Date(n.createdAt);
  const timeLabel =
    time.toLocaleDateString("en-NG", { day: "numeric", month: "short" }) === new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short" })
      ? time.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })
      : time.toLocaleDateString("en-NG", { day: "numeric", month: "short" });

  return (
    <div
      className={`flex gap-3 rounded-card border ${toneBorderClass[n.tone]} bg-card px-4 py-3.5 ${
        n.read ? "" : "bg-accent-tint/40"
      }`}
    >
      <span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-hairline bg-tag ${toneIconClass[n.tone]}`}>
        <Icon name={toneIcon[n.tone]} size={17} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">{n.title}</span>
          {!n.read ? <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-accent" aria-label="Unread" /> : null}
        </span>
        {n.amount != null ? (
          <span className="text-[13px] font-semibold text-accent [font-feature-settings:var(--font-feature-tabular)]">
            {formatNaira(n.amount)}
          </span>
        ) : null}
        {n.creditsCount != null ? (
          <span className="text-[13px] font-semibold text-warning">{formatCredits(n.creditsCount)}</span>
        ) : null}
        <span className="text-[13px] leading-relaxed text-text-secondary">{n.body}</span>
        <span className="text-[11.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
          {timeLabel}
        </span>
        {n.actionLabel ? (
          <span className="mt-1">
            <button
              type="button"
              onClick={() => router.push(actionHrefFor(n))}
              className={`inline-flex h-[32px] items-center rounded-button px-3.5 text-[12.5px] font-semibold ${
                n.kind === "dm_deadline"
                  ? "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-press"
                  : "border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
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
