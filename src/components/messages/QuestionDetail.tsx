"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatNaira } from "@/lib/format";
import type { ThreadDetail } from "@/types/messaging";

interface QuestionDetailProps {
  thread: ThreadDetail;
  /** What sending an answer earns, already split-adjusted for the creator's tier. */
  earn: number;
  onReply: (text: string) => Promise<void>;
}

/**
 * Desktop-only creator-side thread view for the paid questions inbox
 * (design D8) — countdown pill in its own header band, message bubbles, and
 * a composer that releases the held payment on send. Mobile has no
 * equivalent screen; this is new UI built from messaging.ts's ThreadDetail
 * shape, not a port of an existing mobile screen.
 */
export function QuestionDetail({ thread, earn, onReply }: QuestionDetailProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(false);
    try {
      await onReply(trimmed);
      setText("");
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-hairline px-[26px]">
        <Avatar src={thread.buyerAvatarUrl} initials={thread.buyerInitials} size={38} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-text-primary">{thread.buyerName}</span>
          <span className="text-[12.5px] text-text-muted">
            Asked {thread.askedAgo}
            {thread.location ? ` · ${thread.location}` : ""}
          </span>
        </div>
        <div className="ml-auto">
          {thread.status === "awaiting" ? (
            <span className="flex items-center gap-[9px] rounded-full border border-hairline bg-danger-tint px-[14px] py-2">
              <Icon name="Clock" size={15} color="var(--danger)" />
              <span className="text-[13px] font-semibold text-danger [font-feature-settings:var(--font-feature-tabular)]">
                {thread.deadlineLabel} left · {formatNaira(thread.price)} refunds automatically
              </span>
            </span>
          ) : thread.status === "answered" ? (
            <StatusPill kind="success">Answered</StatusPill>
          ) : (
            <StatusPill kind="info">Refunded</StatusPill>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-[26px]">
        {thread.messages.map((m) => (
          <div key={m.id} className={`flex flex-col gap-2 ${m.from === "creator" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[70%] rounded-[20px] border border-hairline px-[18px] py-4 ${
                m.from === "creator" ? "rounded-br-[6px] bg-accent-tint" : "rounded-bl-[6px] bg-card"
              }`}
            >
              <span className="text-[14.5px] leading-[1.55] text-text-primary">{m.text}</span>
            </div>
            {m.attachmentName ? (
              <div className="flex items-center gap-[10px] rounded-input border border-hairline bg-elevated px-4 py-3">
                <Icon name="Paperclip" size={16} color="var(--text-muted)" />
                <span className="text-[13px] text-text-secondary">{m.attachmentName}</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {thread.status === "awaiting" ? (
        <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-hairline p-[18px]">
          <span className="text-[14.5px] text-text-muted">Write your answer, one reply releases the payment</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer…"
            className="h-[96px] resize-none rounded-input border border-hairline bg-page px-4 py-3 text-[14px] text-text-primary outline-none placeholder:text-text-disabled focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {error ? <span className="text-[12.5px] text-danger">Could not send your answer. Try again.</span> : null}
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hairline bg-input">
              <Icon name="Paperclip" size={17} color="var(--text-secondary)" />
            </span>
            <span className="text-[12.5px] text-text-muted">Answering also lifts your response rate</span>
            <span className="flex-1" />
            <Button size="md" iconRight="Send" onClick={handleSend} loading={sending} disabled={!text.trim()}>
              Send answer · earn {formatNaira(earn)}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-auto shrink-0 border-t border-hairline p-[18px]">
          <span className="text-[13px] text-text-muted">
            {thread.status === "answered"
              ? "You already answered this question, the payment has been released."
              : "This question was refunded, the buyer's payment was returned automatically."}
          </span>
        </div>
      )}
    </div>
  );
}
