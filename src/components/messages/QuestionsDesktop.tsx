"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { messagingApi } from "@/lib/api/messaging";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import type { ThreadDetail } from "@/types/messaging";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorState, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { ThreePaneLayout } from "@/components/layout/ThreePaneLayout";
import { QuestionDetail } from "./QuestionDetail";
import { creatorSplitPercent, formatNaira } from "@/lib/format";

function statusRank(status: ThreadDetail["status"]): number {
  return status === "awaiting" ? 0 : status === "answered" ? 1 : 2;
}

/** Soonest deadline first (design D8's list sort); answered/refunded sink to the bottom. */
function sortThreads(threads: ThreadDetail[]): ThreadDetail[] {
  return [...threads].sort((a, b) => {
    const rankDiff = statusRank(a.status) - statusRank(b.status);
    if (rankDiff !== 0) return rankDiff;
    if (a.status === "awaiting") return (a.deadlineMinutes ?? Infinity) - (b.deadlineMinutes ?? Infinity);
    return 0;
  });
}

type CountdownTone = "danger" | "warning" | "muted";

function countdownTone(minutes?: number): CountdownTone {
  if (minutes === undefined) return "muted";
  if (minutes <= 120) return "danger";
  if (minutes <= 600) return "warning";
  return "muted";
}

const toneTextClass: Record<CountdownTone, string> = {
  danger: "text-danger",
  warning: "text-warning",
  muted: "text-text-muted",
};

/**
 * Desktop three-pane paid-questions inbox (design D8). Creator-side — mobile
 * has no equivalent thread/reply view, so this owns its own fetch, selection
 * state and reply composer rather than porting a mobile screen. Desktop-only
 * by way of ThreePaneLayout's built-in `hidden … xl:flex`; render this
 * unconditionally alongside the mobile <Inbox />.
 */
export function QuestionsDesktop() {
  const { creator } = useCreatorState();
  // accountType is deliberately not part of this — see creatorGates().
  const gates = creatorGates({ creator });
  const [threads, setThreads] = useState<ThreadDetail[] | null>(null);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    setThreads(null);
    messagingApi
      .getThreads()
      .then((data) => {
        setThreads(data);
        setSelectedId((current) => current ?? sortThreads(data)[0]?.id ?? null);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => (threads ? sortThreads(threads) : []), [threads]);
  const selected = sorted.find((t) => t.id === selectedId) ?? null;
  const keep = creatorSplitPercent();
  const earnFor = useCallback((price: number) => Math.round((price * keep) / 100), [keep]);

  const handleReply = useCallback(
    async (text: string) => {
      if (!selected) return;
      const updated = await messagingApi.replyToThread(selected.id, text);
      setThreads((prev) => (prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev));
    },
    [selected],
  );

  const listHeader = (
    <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-hairline px-5">
      <span className="text-[17px] font-semibold text-text-primary">Questions</span>
      <span className="ml-auto text-[12.5px] text-text-muted">Soonest deadline first</span>
    </div>
  );

  let list: ReactNode;
  let detail: ReactNode;

  if (error) {
    list = <ErrorState onRetry={load} />;
    detail = <ErrorState onRetry={load} />;
  } else if (!threads) {
    list = (
      <div className="flex flex-col gap-3 p-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={78} radius="var(--radius-card)" />
        ))}
      </div>
    );
    detail = (
      <div className="flex flex-col gap-3 p-[26px]">
        <Skeleton height={68} radius="var(--radius-card)" />
        <Skeleton height={140} radius="var(--radius-card)" />
      </div>
    );
  } else if (sorted.length === 0) {
    list = (
      <EmptyState
        icon="Inbox"
        title="No paid questions yet"
        description="Answered and pending questions will show up here."
      />
    );
    detail = (
      <EmptyState
        icon="MessageCircle"
        title="No paid questions yet"
        description="Once a buyer asks a paid question, it will show up here to answer."
      />
    );
  } else {
    list = (
      <div>
        {sorted.map((t) => {
          const tone = countdownTone(t.deadlineMinutes);
          const isSelected = t.id === selectedId;
          const deadlineText =
            t.status === "awaiting" ? `${t.deadlineLabel} left` : t.status === "answered" ? "Answered" : "Refunded";
          const deadlineClass =
            t.status === "answered" ? "text-success" : t.status === "refunded" ? "text-text-muted" : toneTextClass[tone];
          const priceText =
            t.status === "awaiting"
              ? `${formatNaira(t.price)} held`
              : t.status === "answered"
                ? `${formatNaira(earnFor(t.price))} earned`
                : "Refunded · earned nothing";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              aria-current={isSelected}
              className={`flex w-full gap-3 border-b border-hairline px-5 py-4 text-left transition-colors ${
                isSelected ? "bg-selected-tint" : "hover:bg-state-hover"
              } ${t.status !== "awaiting" ? "opacity-70" : ""}`}
            >
              <Avatar src={t.buyerAvatarUrl} initials={t.buyerInitials} size={44} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[14px] font-semibold text-text-primary">{t.buyerName}</span>
                  <span
                    className={`ml-auto shrink-0 text-[12px] font-bold [font-feature-settings:var(--font-feature-tabular)] ${deadlineClass}`}
                  >
                    {deadlineText}
                  </span>
                </div>
                <span className="block truncate text-[12.5px] text-text-secondary">{t.messages[0]?.text ?? ""}</span>
                <span className="text-[12px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
                  {priceText}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
    detail = selected ? (
      <QuestionDetail thread={selected} earn={earnFor(selected.price)} onReply={handleReply} />
    ) : (
      <EmptyState
        icon="MessageCircle"
        title="Select a question"
        description="Choose a paid question from the list to view the conversation."
      />
    );
  }

  return <ThreePaneLayout listWidth={360} listHeader={listHeader} list={list} detail={detail} />;
}
