"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { messagingApi } from "@/lib/api/messaging";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { PLANS } from "@/types/subscription";
import type { MessagingState } from "@/types/messaging";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { formatNaira } from "@/lib/format";

/** "4:12 pm today" / "9:40 am tomorrow" / "14 Aug, 4:12 pm" from a real ISO deadline. */
function formatDeadline(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "soon";
  const time = at.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  const days = Math.round(
    (new Date(at.toDateString()).getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000,
  );
  if (days === 0) return `${time} today`;
  if (days === 1) return `${time} tomorrow`;
  return `${at.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}, ${time}`;
}

export function Inbox() {
  const { user } = useSession();
  const { creator } = useCreatorState();
  const gates = creatorGates(user ? { accountType: user.accountType, creator } : null);
  const [state, setState] = useState<MessagingState | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setState(null);
    messagingApi
      .getState()
      .then(setState)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (!state) {
    return (
      <div className="p-[16px] flex flex-col gap-[12px]">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={150} radius="var(--radius-card)" />
        ))}
      </div>
    );
  }

  const price = gates.dmPrice || 300;
  const keep = PLANS[gates.tier ?? "basic"].split;
  const dmEarn = Math.round((price * keep) / 100);
  const urgent = state.threads.filter((t) => !t.opened);
  const answered = state.threads.filter((t) => t.opened);

  return (
    <div>
      <header
        className="flex items-center gap-[12px] pt-[16px] px-[18px] pb-[14px] border-b border-b-[var(--border-hairline)]"
      >
        <span className="flex-1 text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Inbox
        </span>
        <Link
          href="/messages/settings"
          className="inline-flex items-center gap-[6px] h-[26px] py-0 px-[10px] rounded-[999px] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[11.5px] font-bold text-[var(--text-secondary)] no-underline [font-feature-settings:var(--font-feature-tabular)]"
        >
          {formatNaira(price)} each
        </Link>
      </header>

      <div className="py-[14px] px-[16px] flex flex-col gap-[12px]">
        {state.penalty !== "none" ? (
          <Link href="/messages/settings" className="no-underline">
            <div
              className={`flex items-center gap-[10px] py-[12px] px-[14px] rounded-[var(--radius-card)] border ${
                state.penalty === "warned"
                  ? "bg-[var(--warning-tint)] border-[rgba(255,183,3,0.32)]"
                  : "bg-[var(--danger-tint)] border-[rgba(255,92,92,0.32)]"
              }`}
            >
              <Icon
                name={state.penalty === "warned" ? "TriangleAlert" : "Lock"}
                size={17}
                strokeWidth={2.2}
                color={state.penalty === "warned" ? "var(--warning)" : "var(--danger)"}
              />
              <span className="flex-1 text-[12.5px] font-semibold text-[var(--text-primary)]">
                {state.penalty === "warned"
                  ? `${state.responseStats.rate}% unanswered, you are missing messages`
                  : state.penalty === "disabled7"
                    ? "Paid messages are off for 7 days"
                    : "Paid messages are off for 30 days"}
              </span>
            </div>
          </Link>
        ) : null}

        {urgent.map((t) => {
          const timeLeft = t.expiresAt ?? "";
          const critical = timeLeft.startsWith("1h");
          return (
            <div
              key={t.id}
              className={`flex flex-col gap-[12px] p-[15px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border ${
                critical ? "border-[rgba(255,92,92,0.32)]" : "border-[rgba(255,183,3,0.28)]"
              }`}
            >
              <div className="flex gap-[12px]">
                <Avatar initials={t.buyerInitials} size={40} />
                <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
                  <div className="flex items-center gap-[8px]">
                    <span className="flex-1 text-[14.5px] font-semibold text-[var(--text-primary)]">
                      {t.buyerName}
                    </span>
                    <span
                      className={`text-[15px] font-bold [font-feature-settings:var(--font-feature-tabular)] ${
                        critical ? "text-[var(--danger)]" : "text-[var(--warning)]"
                      }`}
                    >
                      {timeLeft}
                    </span>
                  </div>
                  <span className="text-[13.5px] leading-[1.45] text-[var(--text-primary)]">{t.preview}</span>
                </div>
              </div>
              <div className="flex items-center gap-[10px] pt-[12px] border-t border-t-[var(--border-hairline)]">
                <span
                  className={`flex-1 text-[12.5px] font-semibold ${
                    critical ? "text-[var(--danger)]" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {/* The real 24h deadline off the thread. This used to print
                      one of two hardcoded times regardless of the message. */}
                  {t.expiresAt ? `Respond by ${formatDeadline(t.expiresAt)}` : "Awaiting your reply"}
                </span>
                <span className="text-[12.5px] font-bold [font-feature-settings:var(--font-feature-tabular)]">
                  {formatNaira(dmEarn)} to earn
                </span>
              </div>
              {/* No reply composer on mobile yet — the only working reply
                  flow is the desktop three-pane inbox (see QuestionsDesktop's
                  doc comment: "mobile has no creator-side thread/reply
                  view"). A "Reply now" button here used to render with no
                  destination (routerTo was a literal no-op) — removed rather
                  than shipping a control that does nothing when tapped. */}
            </div>
          );
        })}

        {answered.map((t) => {
          const refunded = t.status === "refunded";
          return (
            <div
              key={t.id}
              className={`flex gap-[12px] p-[15px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] ${
                t.unread ? "opacity-100" : "opacity-70"
              }`}
            >
              <Avatar initials={t.buyerInitials} size={40} />
              <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
                <div className="flex items-center gap-[8px]">
                  <span className="flex-1 text-[14.5px] font-semibold text-[var(--text-primary)]">{t.buyerName}</span>
                  <StatusPill kind={refunded ? "info" : "success"} size="xs">
                    {refunded ? "Refunded" : "Answered"}
                  </StatusPill>
                </div>
                <span
                  className="text-[13px] text-[var(--text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {t.preview}
                </span>
                <span className="text-[12px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
                  {refunded
                    ? "Missed the window · earned nothing"
                    : `Earned ${formatNaira(dmEarn)}${t.repliedIn ? ` · replied in ${t.repliedIn}` : ""}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
