"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommunityThread } from "@/hooks/useCommunityThread";
import { useSession } from "@/lib/auth/session-provider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCredits } from "@/lib/format";

/**
 * Desktop three-pane thread pane for a single room (design D14). Drives its
 * own fetch through useCommunityThread (the same hook the mobile
 * /communities/[id] page uses) rather than re-deriving the messaging logic,
 * so join-gating, the credit spend on send, and the loading/error/empty
 * states all match the mobile thread exactly.
 */
export function CommunityThreadDesktop({ id, onJoined }: { id: string; onJoined?: () => void }) {
  const router = useRouter();
  const { user } = useSession();
  const [text, setText] = useState("");
  const { community, messages, balance, errorKind, load, doJoin, joinError, send, sending, sendError } =
    useCommunityThread(id);

  const handleJoin = async () => {
    const ok = await doJoin();
    if (ok) onJoined?.();
  };

  if (errorKind === "not-found") {
    return (
      <div className="flex h-full items-center justify-center p-[26px]">
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
      <div className="flex h-full items-center justify-center p-[26px]">
        <ErrorState title="Couldn't load this community" body="Check your connection and try again." onRetry={load} />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex flex-col gap-3 p-[26px]">
        <Skeleton variant="row" className="h-[68px]" />
        <Skeleton variant="row" className="h-[80px]" />
        <Skeleton variant="row" className="h-[80px]" />
      </div>
    );
  }

  const handleSend = async () => {
    if (!text.trim()) return;
    const ok = await send(text);
    if (ok) setText("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-hairline px-[26px]">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl border border-hairline bg-elevated">
          <Icon name="Users" size={17} color="var(--accent)" strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold text-text-primary">{community.name}</span>
          <span className="truncate text-[12.5px] text-text-muted">
            {community.memberCount.toLocaleString("en-NG")} members · host {community.host.name}
          </span>
        </div>
        {community.kind === "private" && <StatusPill kind="neutral">Private</StatusPill>}
      </div>

      {!community.joined ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-7 text-center">
          <span className="mb-2 grid h-16 w-16 place-items-center rounded-full border border-[var(--border-accent)] bg-[var(--accent-tint)]">
            <Icon name={community.kind === "private" ? "Lock" : "Users"} size={26} color="var(--accent)" strokeWidth={1.9} />
          </span>
          <span className="text-[18px] font-bold text-text-primary">
            {community.kind === "private" ? "Private community" : "Join to read and post"}
          </span>
          <p className="m-0 max-w-[340px] text-[14px] leading-[1.5] text-text-secondary">
            {community.kind === "private"
              ? `${community.name} is a closed circle. Join to read and post — reading is free, sending costs one credit.`
              : `${community.name} is open to everyone. Join to read and post — reading is free, sending costs one credit.`}
          </p>
          <Button onClick={handleJoin} className="mt-3.5">
            Join community
          </Button>
          {joinError && <p className="m-0 text-[13px] text-[var(--danger)]">{joinError}</p>}
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-[26px]">
            {messages.length === 0 ? (
              <EmptyState icon="MessageCircle" title="No messages yet" caption="Be the first to say something here." />
            ) : (
              messages.map((m) => {
                const mine = m.sender.wawuId === user?.wawuId;
                return (
                  <div key={m.id} className={`flex flex-col gap-[5px] ${mine ? "items-end" : "items-start"}`}>
                    {mine ? (
                      <span className="text-[12.5px] text-text-muted">
                        You · {m.sentAt}
                        {m.costInCredits > 0 ? ` · ${formatCredits(m.costInCredits)} used` : ""}
                      </span>
                    ) : (
                      <span className="flex items-center gap-[7px] text-[12.5px] text-text-muted">
                        <Avatar initial={m.sender.name.charAt(0)} size={18} />
                        {m.sender.name} · {m.sentAt}
                      </span>
                    )}
                    <div
                      className={`max-w-[62%] rounded-[20px] border px-4 py-[14px] text-[14px] leading-[1.5] ${
                        mine
                          ? "rounded-br-[6px] border-transparent bg-accent text-[var(--text-on-accent)]"
                          : "rounded-bl-[6px] border-hairline bg-card text-text-primary"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-auto shrink-0 p-[18px]">
            {sendError && <p className="m-0 mb-2 text-[12.5px] text-[var(--danger)]">{sendError}</p>}
            {balance < 1 ? (
              <Button full icon="Ticket" onClick={() => router.push("/communities?topup=1")}>
                Top up credits to send a message
              </Button>
            ) : (
              <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Write a message · costs 1 credit"
                  className="h-10 flex-1 bg-transparent px-2 text-[14px] text-text-primary outline-none placeholder:text-text-muted"
                />
                <span className="shrink-0 text-[12.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
                  {formatCredits(balance)} left
                </span>
                <Button size="sm" iconRight="Send" onClick={handleSend} loading={sending} disabled={!text.trim()}>
                  Send
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
