"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDmThread } from "@/lib/api/dm";
import type { DmThreadDetail } from "@/types/dm";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { DmThreadFooter } from "@/components/dm/DmThreadFooter";
import { formatNaira } from "@/lib/format";

/**
 * Server Component here always 401'd (no localStorage/session token exists
 * during SSR) and, after dm.ts's real-failure fix, that would surface as a
 * scary thrown error instead of the real thread. Client Component +
 * useEffect fetch, same pattern as content/[id]/page.tsx and
 * communities/[id]/page.tsx.
 */
export default function DmThreadPage() {
  const params = useParams<{ threadId: string }>();
  const threadId = String(params?.threadId ?? "");

  // undefined = still loading; null = fetch resolved with no thread (not found).
  const [thread, setThread] = useState<DmThreadDetail | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    setError(null);
    setThread(undefined);
    getDmThread(threadId)
      .then((t) => active && setThread(t))
      .catch((e) => active && setError(e instanceof Error ? e.message : "We couldn't load this conversation."));
    return () => {
      active = false;
    };
  }, [threadId]);

  useEffect(() => load(), [load]);

  if (error) {
    return (
      <div className="p-4">
        <ErrorState title="Couldn't load this conversation" body={error} onRetry={load} />
      </div>
    );
  }

  if (thread === undefined) {
    return (
      <div className="flex min-h-dvh flex-col gap-3 p-4">
        <Skeleton variant="row" className="h-[52px]" />
        <Skeleton variant="row" className="h-[68px]" />
        <Skeleton variant="row" className="h-[68px]" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="p-4">
        <ErrorState title="Conversation not found" body="This thread may have been archived." />
      </div>
    );
  }

  const { summary, messages, deadlineAt } = thread;
  const first = summary.creatorName.charAt(0);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-[11px] border-b border-[var(--border-hairline)] bg-[var(--surface-elevated)] p-[12px_16px_10px]">
        <ProfileBackButton compact />
        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
          <Avatar src={summary.creatorAvatarUrl} initial={first} size={34} />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            {/* No tick here. It used to render a hardcoded tick beside every
                name in every thread, which asserted a paid credential nobody
                had bought — DmThreadSummary carries no `verification` field at
                all (see src/lib/api/dm.ts, where even creatorName is a
                placeholder), so there was no data behind it. Draw ticks here
                once the thread wire shape carries the contract's
                `verification: VerificationState`. */}
            <span className="flex items-center gap-[6px] text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
              {summary.creatorName}
            </span>
            <span className="text-[12px] text-[var(--text-muted)]">
              Paid message · ₦{summary.amount.toLocaleString("en-NG")}
            </span>
          </div>
          {summary.status === "awaiting_response" && <StatusPill kind="warning">Awaiting reply</StatusPill>}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-[14px] p-[18px_16px_20px]">
        {(summary.status === "awaiting_response" || summary.status === "refunded") && (
          <div
            className={[
              "flex items-start gap-[9px] rounded-[var(--radius-input)] border p-[11px_13px]",
              summary.status === "refunded"
                ? "border-[rgba(255,92,92,0.3)] bg-[var(--danger-tint)]"
                : "border-[var(--border-info)] bg-[var(--info-tint)]",
            ].join(" ")}
          >
            <span className="mt-px shrink-0">
              <Icon
                name={summary.status === "refunded" ? "CircleAlert" : "Clock"}
                size={16}
                color={summary.status === "refunded" ? "var(--danger)" : "var(--info)"}
              />
            </span>
            <span className="text-[13px] leading-[1.5] text-[var(--text-primary)]">
              {summary.status === "refunded" ? (
                <>
                  <span className="block font-semibold text-[var(--text-primary)]">
                    Your {formatNaira(summary.amount)} was refunded
                  </span>
                  {summary.creatorName.split(" ")[0]} did not reply within 24 hours. Back on your card in 3 to 5
                  working days.
                </>
              ) : (
                <>
                  {summary.creatorName.split(" ")[0]} has until {deadlineAt} to reply. No reply by then → automatic refund.
                </>
              )}
            </span>
          </div>
        )}

        {messages.map((m) => {
          const mine = m.from === "me";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={[
                  "flex max-w-[78%] flex-col gap-[3px] border p-[10px_13px]",
                  mine
                    ? "rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px] rounded-br-[4px] border-transparent bg-[var(--accent)]"
                    : "rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[4px] rounded-br-[16px] border-[var(--border-hairline)] bg-[var(--surface-card)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "whitespace-pre-wrap text-[14.5px] leading-[1.45]",
                    mine ? "text-[var(--text-on-accent)]" : "text-[var(--text-primary)]",
                  ].join(" ")}
                >
                  {m.text}
                </span>
                <span
                  className={[
                    "self-end text-[10.5px]",
                    mine ? "text-[rgba(255,255,255,0.7)]" : "text-[var(--text-muted)]",
                  ].join(" ")}
                >
                  {m.at}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <DmThreadFooter
        threadId={summary.id}
        creator={{ wawuId: summary.creatorWawuId, name: summary.creatorName, handle: summary.creatorHandle, dmPrice: summary.amount }}
        status={summary.status}
      />
    </div>
  );
}
