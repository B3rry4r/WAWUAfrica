"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommunityThread } from "@/hooks/useCommunityThread";
import { useSession } from "@/lib/auth/session-provider";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCredits } from "@/lib/format";
import { CommunityComposer } from "./CommunityComposer";
import { CommunityJoinGate } from "./CommunityJoinGate";
import { CommunityRoomImage } from "./CommunityRoomImage";

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
  const [imageError, setImageError] = useState<string | null>(null);
  const { community, messages, balance, errorKind, load, doJoin, joinError, send, sending, sendError, applyImage } =
    useCommunityThread(id);

  // "pending" is not a join: a private community files a request the host
  // must approve, and the rooms list must not gain a thread this account
  // still cannot read.
  const handleJoin = async () => {
    if ((await doJoin()) === "joined") onJoined?.();
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

  // Only the host may change the room's picture — the server enforces it
  // (PATCH /communities/:id is host-only); this just avoids drawing a control
  // that would always be refused.
  const isHost = Boolean(user?.wawuId && community.host.wawuId === user.wawuId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-hairline px-[26px]">
        <CommunityRoomImage
          communityId={community.id}
          src={community.imageUrl}
          icon={community.kind === "private" ? "Lock" : "Users"}
          iconSize={17}
          className="h-[38px] w-[38px] rounded-xl border border-hairline bg-elevated"
          canEdit={isHost}
          onChanged={applyImage}
          onError={setImageError}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold text-text-primary">{community.name}</span>
          <span className="truncate text-[12.5px] text-text-muted">
            {community.memberCount.toLocaleString("en-NG")} members · host {community.host.name}
          </span>
        </div>
        {community.kind === "private" && <StatusPill kind="neutral">Private</StatusPill>}
      </div>

      {imageError ? <p className="m-0 px-[26px] pt-[10px] text-[12.5px] text-[var(--danger)]">{imageError}</p> : null}

      {!community.joined ? (
        // Same gate component as the mobile room screen — including the
        // "waiting for the host" state a private community's requester sits
        // in, which neither surface had a way to show.
        <CommunityJoinGate community={community} onJoin={handleJoin} joinError={joinError} />
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
                      className={`flex max-w-[62%] flex-col gap-[10px] rounded-[20px] border px-4 py-[14px] text-[14px] leading-[1.5] ${
                        mine
                          ? "rounded-br-[6px] border-transparent bg-accent text-[var(--text-on-accent)]"
                          : "rounded-bl-[6px] border-hairline bg-card text-text-primary"
                      }`}
                    >
                      {/* A photo IS the message when there is no text — the
                          bubble renders whichever halves this message has. */}
                      {m.imageUrl ? (
                        <img
                          src={m.imageUrl}
                          alt=""
                          className="max-h-[320px] w-full rounded-[var(--radius-media)] object-cover"
                        />
                      ) : null}
                      {m.text ? <span className="whitespace-pre-wrap">{m.text}</span> : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <CommunityComposer
            variant="desktop"
            communityName={community.name}
            balance={balance}
            sending={sending}
            sendError={sendError}
            onSend={send}
            onTopUp={() => router.push("/communities?topup=1")}
          />
        </>
      )}
    </div>
  );
}
