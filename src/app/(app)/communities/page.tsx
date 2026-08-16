"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCommunities, getCreditsState, joinCommunity } from "@/lib/api/communities";
import type { Community, CreditsState } from "@/types/credits";
import { CreditsCard } from "@/components/communities/CreditsCard";
import { CommunityTabs } from "@/components/communities/CommunityTabs";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ThreePaneLayout } from "@/components/layout/ThreePaneLayout";
import { ROOMS_LIST_HEADER, RoomsDesktopList } from "@/components/communities/RoomsDesktopList";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Server Component here always 401'd (no localStorage/session token exists
 * during SSR) and, after communities.ts's real-failure/Pattern-A fix,
 * that would surface as a scary thrown error instead of the real
 * joined/discover lists. Client Component + useEffect fetch, same pattern
 * as content/[id]/page.tsx and communities/[id]/page.tsx.
 */
export default function CommunitiesPage() {
  return (
    <Suspense>
      <CommunitiesPageContent />
    </Suspense>
  );
}

function CommunitiesPageContent() {
  // Sidebar's foot-card "Top up" button (rendered on every (app) route) and
  // the in-thread "Top up credits" CTAs land here with ?topup=1 so the
  // purchase sheet is reachable even though CreditsCard — the only component
  // that opens it — normally only mounts on this page.
  const searchParams = useSearchParams();
  const topupRequested = searchParams.get("topup") === "1";

  const [credits, setCredits] = useState<CreditsState | null>(null);
  const [joined, setJoined] = useState<Community[]>([]);
  const [discover, setDiscover] = useState<Community[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    setError(null);
    Promise.all([getCreditsState(), getCommunities("joined"), getCommunities("discover")])
      .then(([c, j, d]) => {
        if (!active) return;
        setCredits(c);
        setJoined(j);
        setDiscover(d);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "We couldn't load communities.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  // Owned here (not inside CommunityTabs) so a real join lands in the same
  // `joined` array the desktop Rooms sidebar (RoomsDesktopList) reads below
  // — otherwise a join made in the mobile "Discover" tab would never show
  // up in the sidebar until a full reload.
  const doJoin = useCallback(
    async (id: string) => {
      const community = discover.find((c) => c.id === id);
      if (!community) return;
      await joinCommunity(id);
      setDiscover((l) => l.filter((c) => c.id !== id));
      setJoined((l) => [...l, { ...community, joined: true }]);
    },
    [discover],
  );

  if (error) {
    return <ErrorState title={error} onRetry={load} />;
  }

  if (!credits) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-[14px]">
        <Skeleton variant="row" className="h-[76px]" />
        <Skeleton variant="row" className="h-[52px]" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="row" className="h-[68px]" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Mobile tabs + list, unchanged below xl: — the desktop three-pane
          view below replaces it at xl and up (design D14). */}
      <div className="flex flex-col gap-4 px-4 pb-24 pt-[14px] xl:hidden">
        <CreditsCard initialBalance={credits.creditBalance} defaultOpen={topupRequested} />
        <CommunityTabs joined={joined} discover={discover} onJoin={doJoin} />
      </div>

      {/* Sheet-only instance for xl: — the mobile CreditsCard above is
          unmounted (display:none) at this width, so it can't answer
          ?topup=1 there. This one renders no card widget of its own, only
          the purchase sheet, so it can open from the Sidebar button or the
          empty-state action below without duplicating the mobile balance UI. */}
      <div className="hidden xl:contents">
        <CreditsCard initialBalance={credits.creditBalance} showCard={false} defaultOpen={topupRequested} />
      </div>

      <ThreePaneLayout
        listWidth={340}
        listHeader={ROOMS_LIST_HEADER}
        list={<RoomsDesktopList rooms={joined} />}
        detail={
          <EmptyState
            icon="MessageCircle"
            title="Select a room"
            caption="Choose a community from the list to read and send messages, or top up your credits."
            action="Top up credits"
            actionHref="/communities?topup=1"
          />
        }
      />
    </>
  );
}
