"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Community } from "@/types/credits";
import { getCommunities } from "@/lib/api/communities";
import { useCommunityThread } from "@/hooks/useCommunityThread";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/ErrorState";
import { ThreePaneLayout } from "@/components/layout/ThreePaneLayout";
import { RoomsListHeader, RoomsDesktopList } from "@/components/communities/RoomsDesktopList";
import { CommunityComposer } from "@/components/communities/CommunityComposer";
import { CommunityJoinGate } from "@/components/communities/CommunityJoinGate";
import { CommunityRoomImage } from "@/components/communities/CommunityRoomImage";
import { CommunityThreadDesktop } from "@/components/communities/CommunityThreadDesktop";

const bubbleClass = {
  mine: "[border-radius:16px_16px_4px_16px]",
  other: "[border-radius:16px_16px_16px_4px]",
} as const;

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const { user } = useSession();
  // Live creator state, not the sign-in snapshot — the Rooms pane's "New"
  // control is behind the same subscription gate as /communities/new itself.
  const { creator, resolved } = useCreatorState();
  const canHost = resolved && creatorGates({ creator }).canUpload;
  const { community, messages, balance, errorKind, load, doJoin, joinError, send, sending, sendError, applyImage } =
    useCommunityThread(id);
  const [imageError, setImageError] = useState<string | null>(null);

  // Rooms list for the xl: three-pane view (design D14) — only needed above
  // the xl breakpoint, but fetched unconditionally like Inbox/QuestionsDesktop
  // each own their fetch for the mobile/desktop split (see messages/page.tsx).
  const [joinedRooms, setJoinedRooms] = useState<Community[]>([]);
  const refreshJoinedRooms = useCallback(() => {
    let active = true;
    getCommunities("joined")
      .then((rooms) => active && setJoinedRooms(rooms))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => refreshJoinedRooms(), [refreshJoinedRooms]);

  // Refresh the sidebar's real joined-communities list after a real join —
  // toCommunity() derives `joined` from session-tracked ids (see
  // lib/api/communities.ts), so a successful join here needs a refetch to
  // show up in the Rooms list, mobile Join button included.
  //
  // ...but only for a real "joined". A private community answers with
  // "pending" — a request the host still has to approve — and listing that
  // room as one of yours would put a thread you cannot read into the list.
  const handleJoin = async () => {
    if ((await doJoin()) === "joined") refreshJoinedRooms();
  };

  if (errorKind === "not-found") {
    return (
      <>
        <div className="p-4 xl:hidden">
          <ErrorState
            title="Community not found"
            body="This community may have been removed."
            onRetry={() => router.push("/communities")}
            retryLabel="Back to communities"
          />
        </div>
        <ThreePaneLayout
          listWidth={340}
          listHeader={<RoomsListHeader canHost={canHost} />}
          list={<RoomsDesktopList rooms={joinedRooms} activeId={id} canHost={canHost} />}
          detail={<CommunityThreadDesktop id={id} onJoined={refreshJoinedRooms} />}
        />
      </>
    );
  }

  if (errorKind === "failed") {
    return (
      <>
        <div className="p-4 xl:hidden">
          <ErrorState
            title="Couldn't load this community"
            body="Check your connection and try again."
            onRetry={load}
          />
        </div>
        <ThreePaneLayout
          listWidth={340}
          listHeader={<RoomsListHeader canHost={canHost} />}
          list={<RoomsDesktopList rooms={joinedRooms} activeId={id} canHost={canHost} />}
          detail={<CommunityThreadDesktop id={id} onJoined={refreshJoinedRooms} />}
        />
      </>
    );
  }

  if (!community) {
    return (
      <>
        <div className="p-4 xl:hidden">
          <ProfileBackButton compact />
          <div className="mt-4 flex flex-col gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[52px] rounded-[var(--radius-input)] bg-tag" />
            ))}
          </div>
        </div>
        <ThreePaneLayout
          listWidth={340}
          listHeader={<RoomsListHeader canHost={canHost} />}
          list={<RoomsDesktopList rooms={joinedRooms} activeId={id} canHost={canHost} />}
          detail={<CommunityThreadDesktop id={id} onJoined={refreshJoinedRooms} />}
        />
      </>
    );
  }

  const joined = community.joined;
  // The server enforces host-only editing (PATCH /communities/:id); this only
  // decides whether the control is worth drawing.
  const isHost = Boolean(user?.wawuId && community.host.wawuId === user.wawuId);

  return (
    <>
    <div className="flex min-h-dvh flex-col xl:hidden">
      <header className="sticky top-0 z-40 flex items-center gap-[11px] border-b border-hairline bg-elevated px-4 pb-[10px] pt-3">
        <ProfileBackButton compact />
        <CommunityRoomImage
          communityId={community.id}
          src={community.imageUrl}
          icon={community.kind === "private" ? "Lock" : "Users"}
          iconSize={17}
          className="h-[38px] w-[38px] rounded-xl border border-hairline bg-tag"
          canEdit={isHost}
          onChanged={applyImage}
          onError={setImageError}
        />
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

      {imageError ? <p className="m-0 px-4 pt-[10px] text-[12.5px] text-[var(--danger)]">{imageError}</p> : null}

      {!joined ? (
        // Three states, one component (shared with the desktop thread): join,
        // ask-to-join, and — the one that was missing — "you asked, the host
        // hasn't answered". A private community's join is a REQUEST; showing
        // its requester the same button again was the whole dead end.
        <CommunityJoinGate community={community} onJoin={handleJoin} joinError={joinError} />
      ) : (
        <>
          <div className="flex items-center gap-[9px] border-b border-hairline bg-card px-4 py-[10px]">
            <Icon name="Ticket" size={15} color="var(--accent)" strokeWidth={2} />
            <span className="text-[12.5px] text-text-secondary">
              Reading costs nothing · sending costs <b>1</b> credit
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-[22px] px-4 pb-[18px] pt-[18px]">
            {messages.map((m) => {
              const mine = m.sender.wawuId === user?.wawuId;
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
                        <Avatar src={m.sender.avatarUrl} initial={m.sender.name.charAt(0)} size={18} />
                        {m.sender.name}
                      </span>
                    )}
                    {/* A photo IS the message when there is no text — the
                        bubble renders whichever halves this message has. */}
                    {m.imageUrl ? (
                      <img
                        src={m.imageUrl}
                        alt=""
                        className="max-h-[280px] w-full rounded-[var(--radius-media)] object-cover"
                      />
                    ) : null}
                    {m.text ? (
                      <span className={`text-[14px] leading-[1.45] ${mine ? "text-[var(--text-on-accent)]" : "text-text-primary"} whitespace-pre-wrap`}>
                        {m.text}
                      </span>
                    ) : null}
                    <span className={`self-end text-[10.5px] ${mine ? "text-white/70" : "text-text-muted"}`}>
                      {m.sentAt}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <CommunityComposer
            variant="mobile"
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

    <ThreePaneLayout
      listWidth={340}
      listHeader={<RoomsListHeader canHost={canHost} />}
      list={<RoomsDesktopList rooms={joinedRooms} activeId={id} canHost={canHost} />}
      detail={<CommunityThreadDesktop id={id} onJoined={refreshJoinedRooms} />}
    />
    </>
  );
}
