"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Community } from "@/types/credits";
import { getCommunities, getCommunity } from "@/lib/api/communities";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";
import { ThreePaneLayout } from "@/components/layout/ThreePaneLayout";
import { RoomsListHeader, RoomsDesktopList } from "@/components/communities/RoomsDesktopList";
import { JoinRequestQueue } from "@/components/communities/JoinRequestQueue";

/**
 * The host's approval queue for one community.
 *
 * This route is the missing destination: a private community's join wrote a
 * `pending` row that nothing could ever approve, so the room Pro charges
 * extra for could be requested but never entered. Reachable from both
 * hosting surfaces — the Hosting tab on /communities and the
 * HostedCommunitiesPanel on the creator dashboard.
 *
 * Host-only is the SERVER's rule (`GET /communities/:id/requests` 403s
 * anyone else). The check here only decides what to draw: a non-host gets an
 * explanation and a way back instead of an empty list and a bare error.
 */
export default function CommunityRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const { user } = useSession();
  const { creator, resolved } = useCreatorState();
  const canHost = resolved && creatorGates({ creator }).canUpload;

  const [community, setCommunity] = useState<Community | null>(null);
  const [errorKind, setErrorKind] = useState<"not-found" | "failed" | null>(null);
  const [rooms, setRooms] = useState<Community[]>([]);

  const load = useCallback(() => {
    let active = true;
    setErrorKind(null);
    getCommunity(id)
      .then((c) => {
        if (!active) return;
        if (!c) {
          setErrorKind("not-found");
          return;
        }
        setCommunity(c);
      })
      .catch(() => active && setErrorKind("failed"));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => load(), [load]);

  // The desktop rooms rail, same as every other community screen.
  useEffect(() => {
    let active = true;
    getCommunities("joined")
      .then((r) => active && setRooms(r))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const isHost = Boolean(user?.wawuId && community && community.host.wawuId === user.wawuId);

  const body = () => {
    if (errorKind === "not-found") {
      return (
        <ErrorState
          title="Community not found"
          body="This community may have been removed."
          onRetry={() => router.push("/communities")}
          retryLabel="Back to communities"
        />
      );
    }
    if (errorKind === "failed") {
      return <ErrorState title="Couldn't load this community" body="Check your connection and try again." onRetry={load} />;
    }
    if (!community) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton variant="row" className="h-[64px]" />
          <Skeleton variant="row" className="h-[64px]" />
        </div>
      );
    }
    if (!isHost) {
      return (
        <ErrorState
          title="Only the host can review requests"
          body="You don't host this community, so there is nothing for you to approve here."
          onRetry={() => router.push(`/communities/${id}`)}
          retryLabel="Open the room"
        />
      );
    }
    return <JoinRequestQueue community={community} />;
  };

  const heading = (
    <div className="flex min-w-0 flex-1 flex-col gap-[1px]">
      <span className="truncate text-[15.5px] font-bold tracking-[-0.01em] text-text-primary">Join requests</span>
      <span className="truncate text-[12px] text-text-muted">{community?.name ?? "Loading…"}</span>
    </div>
  );

  return (
    <>
      <div className="flex min-h-dvh flex-col xl:hidden">
        <header className="sticky top-0 z-40 flex items-center gap-[11px] border-b border-hairline bg-elevated px-4 pb-[10px] pt-3">
          <ProfileBackButton compact />
          {heading}
          {community?.kind === "private" && <StatusPill kind="neutral">Private</StatusPill>}
        </header>
        <div className="flex flex-col gap-3 px-4 pb-24 pt-4">{body()}</div>
      </div>

      <ThreePaneLayout
        listWidth={340}
        listHeader={<RoomsListHeader canHost={canHost} />}
        list={<RoomsDesktopList rooms={rooms} activeId={id} canHost={canHost} />}
        detail={
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-hairline px-[26px]">
              {heading}
              {community?.kind === "private" && <StatusPill kind="neutral">Private</StatusPill>}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-[26px]">{body()}</div>
          </div>
        }
      />
    </>
  );
}
