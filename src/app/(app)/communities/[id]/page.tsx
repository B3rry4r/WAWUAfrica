"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Community, CommunityMessage } from "@/types/credits";
import { getCommunity, getCommunityMessages, getCreditsState, joinCommunity, sendCommunityMessage } from "@/lib/api/communities";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/ErrorState";

const bubbleClass = {
  mine: "[border-radius:16px_16px_4px_16px]",
  other: "[border-radius:16px_16px_16px_4px]",
} as const;

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [balance, setBalance] = useState(0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  // "not-found": the community genuinely doesn't exist — retrying won't help, offer a way back instead.
  // "failed": the fetch itself errored — plausibly transient, offer a retry.
  const [errorKind, setErrorKind] = useState<"not-found" | "failed" | null>(null);

  const load = useCallback(() => {
    let active = true;
    setErrorKind(null);
    Promise.all([getCommunity(id), getCommunityMessages(id), getCreditsState()])
      .then(([c, msgs, credits]) => {
        if (!active) return;
        if (!c) {
          setErrorKind("not-found");
          return;
        }
        setCommunity(c);
        setMessages(msgs);
        setBalance(credits.creditBalance);
      })
      .catch(() => active && setErrorKind("failed"));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => load(), [load]);

  const doJoin = async () => {
    if (!community) return;
    await joinCommunity(community.id);
    setCommunity({ ...community, joined: true });
  };

  const send = async () => {
    if (!community || !text.trim() || sending || balance < 1) return;
    setSending(true);
    try {
      const msg = await sendCommunityMessage(community.id, text.trim());
      setMessages((m) => [...m, msg]);
      setText("");
      setBalance((b) => Math.max(0, b - 1));
    } finally {
      setSending(false);
    }
  };

  if (errorKind === "not-found") {
    return (
      <div className="p-4">
        <ErrorState
          title="Community not found"
          body="This community may have been removed."
          onRetry={() => router.push("/communities")}
          retryLabel="Back to communities"
        />
      </div>
    );
  }

  if (errorKind === "failed") {
    return (
      <div className="p-4">
        <ErrorState
          title="Couldn't load this community"
          body="Check your connection and try again."
          onRetry={load}
        />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="p-4">
        <ProfileBackButton compact />
        <div className="mt-4 flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[52px] rounded-[var(--radius-input)] bg-tag" />
          ))}
        </div>
      </div>
    );
  }

  const joined = community.joined;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-[11px] border-b border-hairline bg-elevated px-4 pb-[10px] pt-3">
        <ProfileBackButton compact />
        <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
          <span className="truncate text-[15.5px] font-bold tracking-[-0.01em] text-text-primary">
            {community.name}
          </span>
          <span className="text-[12px] text-text-muted">
            {community.memberCount.toLocaleString("en-NG")} members · host {community.host.name}
          </span>
        </div>
        {community.kind === "private" && <StatusPill kind="neutral">Private</StatusPill>}
      </header>

      {!joined ? (
        <div className="flex flex-1 flex-col items-center gap-2 px-7 pb-[60px] pt-[60px] text-center">
          <span className="mb-2 grid h-16 w-16 place-items-center rounded-full border border-[var(--border-accent)] bg-[var(--accent-tint)]">
            <Icon name="Lock" size={26} color="var(--accent)" strokeWidth={1.9} />
          </span>
          <span className="text-[18px] font-bold text-text-primary">Private community</span>
          <p className="m-0 max-w-[300px] text-[14px] leading-[1.5] text-text-secondary">
            {community.name} is a closed circle. Join to read and post — reading is free, sending costs one credit.
          </p>
          <Button onClick={doJoin} className="mt-3.5">
            Join community
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-[9px] border-b border-hairline bg-card px-4 py-[10px]">
            <Icon name="Ticket" size={15} color="var(--accent)" strokeWidth={2} />
            <span className="text-[12.5px] text-text-secondary">
              Reading is free · sending costs <b>{balance}</b> credit{balance === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-[10px] px-4 pb-3 pt-4">
            {messages.map((m) => {
              const mine = m.sender.wawuId === "wawu-me";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "flex max-w-[80%] flex-col gap-[3px] border p-[10px_13px]",
                      bubbleClass[mine ? "mine" : "other"],
                      mine ? "border-transparent bg-accent" : "border-hairline bg-card",
                    ].join(" ")}
                  >
                    {!mine && (
                      <span className="flex items-center gap-[6px] text-[12px] font-bold text-[var(--accent-hover)]">
                        <Avatar initial={m.sender.name.charAt(0)} size={18} />
                        {m.sender.name}
                      </span>
                    )}
                    <span className={`text-[14px] leading-[1.45] ${mine ? "text-[var(--text-on-accent)]" : "text-text-primary"} whitespace-pre-wrap`}>
                      {m.text}
                    </span>
                    <span className={`self-end text-[10.5px] ${mine ? "text-white/70" : "text-text-muted"}`}>
                      {m.sentAt}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="sticky bottom-0 border-t border-hairline bg-elevated px-4 pb-[calc(10px_+_env(safe-area-inset-bottom))] pt-[10px]">
            {balance < 1 ? (
              <Button full icon="Ticket" onClick={() => router.push("/communities")}>
                Top up credits
              </Button>
            ) : (
              <div className="flex items-end gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder={`Message ${community.name} (1 credit)`}
                  className="h-[46px] flex-1 rounded-[var(--radius-chip)] border border-hairline bg-input px-4 text-[14.5px] text-text-primary outline-none"
                />
                <button
                  type="button"
                  aria-label="Send"
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className={[
                    "grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full border-none",
                    text.trim() && !sending
                      ? "cursor-pointer bg-accent text-[var(--text-on-accent)]"
                      : "cursor-default bg-tag text-[var(--text-disabled)]",
                  ].join(" ")}
                >
                  <Icon
                    name={sending ? "Loader2" : "Send"}
                    size={17}
                    strokeWidth={2.2}
                    className={sending ? "[animation:wawuSpin_900ms_linear_infinite]" : ""}
                  />
                </button>
              </div>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
