"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { messagingApi } from "@/lib/api/messaging";
import { currentSession } from "@/lib/api/mocks/session";
import { PLANS } from "@/types/subscription";
import type { MessagingState } from "@/types/messaging";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { formatNaira } from "@/lib/format";

export function Inbox() {
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

  const price = currentSession.creator?.dmPrice ?? 300;
  const keep = PLANS[currentSession.creator?.tier ?? "basic"].split;
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
          className="inline-flex items-center gap-[6px] h-[26px] py-0 px-[10px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[11.5px] font-bold text-[var(--text-secondary)] no-underline" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}
        >
          {formatNaira(price)} each
        </Link>
      </header>

      <div className="py-[14px] px-[16px] flex flex-col gap-[12px]">
        {state.penalty !== "none" ? (
          <Link href="/messages/settings" className="no-underline">
            <div
              className="flex items-center gap-[10px] py-[12px] px-[14px] rounded-[var(--radius-card)]" style={{background: state.penalty === "warned" ? "var(--warning-tint)" : "var(--danger-tint)", border: `1px solid ${state.penalty === "warned" ? "rgba(255,183,3,0.32)" : "rgba(255,92,92,0.32)"}`}}
            >
              <Icon
                name={state.penalty === "warned" ? "TriangleAlert" : "Lock"}
                size={17}
                strokeWidth={2.2}
                color={state.penalty === "warned" ? "var(--warning)" : "var(--danger)"}
              />
              <span className="flex-1 text-[12.5px] font-semibold text-[var(--text-primary)]">
                {state.penalty === "warned"
                  ? `${state.responseStats.rate}% unanswered — you are missing messages`
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
          const border = critical ? "rgba(255,92,92,0.32)" : "rgba(255,183,3,0.28)";
          return (
            <div
              key={t.id}
              className="flex flex-col gap-[12px] p-[15px] rounded-[var(--radius-card)] bg-[var(--surface-card)]" style={{border: `1px solid ${border}`}}
            >
              <div className="flex gap-[12px]">
                <Avatar initials={t.buyerInitials} size={40} />
                <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
                  <div className="flex items-center gap-[8px]">
                    <span className="flex-1 text-[14.5px] font-semibold text-[var(--text-primary)]">
                      {t.buyerName}
                    </span>
                    <span
                      className="text-[15px] font-bold" style={{color: critical ? "var(--danger)" : "var(--warning)", fontFeatureSettings: "var(--font-feature-tabular)"}}
                    >
                      {timeLeft}
                    </span>
                  </div>
                  <span className="text-[13.5px] leading-[1.45] text-[var(--text-primary)]">{t.preview}</span>
                </div>
              </div>
              <div className="flex items-center gap-[10px] pt-[12px] border-t border-t-[var(--border-hairline)]">
                <span className="flex-1 text-[12.5px] font-semibold" style={{color: critical ? "var(--danger)" : "var(--text-secondary)"}}>
                  Respond by {critical ? "4:12 pm today" : "1:40 am"}
                </span>
                <span className="text-[12.5px] font-bold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>
                  {formatNaira(dmEarn)} to earn
                </span>
              </div>
              <Button full className="h-[48px]" onClick={() => routerTo(t.id)}>
                Reply now
              </Button>
            </div>
          );
        })}

        {answered.map((t) => (
          <div
            key={t.id}
            className="flex gap-[12px] p-[15px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]" style={{opacity: t.unread ? 1 : 0.7}}
          >
            <Avatar initials={t.buyerInitials} size={40} />
            <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
              <div className="flex items-center gap-[8px]">
                <span className="flex-1 text-[14.5px] font-semibold text-[var(--text-primary)]">{t.buyerName}</span>
                <StatusPill kind="success" size="xs">
                  Answered
                </StatusPill>
              </div>
              <span
                className="text-[13px] text-[var(--text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {t.preview}
              </span>
              <span className="text-[12px] text-[var(--text-muted)]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>
                Earned {formatNaira(dmEarn)} · replied in 3h
              </span>
            </div>
          </div>
        ))}

        <div
          className="flex gap-[12px] p-[15px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] opacity-[0.7]"
        >
          <Avatar initials="C" size={40} />
          <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
            <div className="flex items-center gap-[8px]">
              <span className="flex-1 text-[14.5px] font-semibold text-[var(--text-primary)]">Chidi Umeh</span>
              <StatusPill kind="info" size="xs">
                Refunded
              </StatusPill>
            </div>
            <span
              className="text-[13px] text-[var(--text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Do you review business plans?
            </span>
            <span className="text-[12px] text-[var(--text-muted)]">Missed the window · earned nothing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function routerTo(id: string) {
  // Conversation view is a separate flow; nothing to navigate to yet.
  void id;
}
