import { getCommunities, getCreditsState } from "@/lib/api/communities";
import { CreditsCard } from "@/components/communities/CreditsCard";
import { CommunityTabs } from "@/components/communities/CommunityTabs";
import { CommunitiesErrorRetry } from "@/components/communities/CommunitiesErrorRetry";
import { ThreePaneLayout } from "@/components/layout/ThreePaneLayout";
import { ROOMS_LIST_HEADER, RoomsDesktopList } from "@/components/communities/RoomsDesktopList";
import { EmptyState } from "@/components/ui/EmptyState";

interface CommunitiesPageProps {
  // Sidebar's foot-card "Top up" button (rendered on every (app) route) and
  // the in-thread "Top up credits" CTAs land here with ?topup=1 so the
  // purchase sheet is reachable even though CreditsCard — the only component
  // that opens it — normally only mounts on this page.
  searchParams?: { topup?: string };
}

export default async function CommunitiesPage({ searchParams }: CommunitiesPageProps) {
  let credits;
  let joined;
  let discover;
  try {
    [credits, joined, discover] = await Promise.all([getCreditsState(), getCommunities("joined"), getCommunities("discover")]);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <CommunitiesErrorRetry title={message ?? "We couldn't load communities."} />;
  }

  const topupRequested = searchParams?.topup === "1";

  return (
    <>
      {/* Mobile tabs + list, unchanged below xl: — the desktop three-pane
          view below replaces it at xl and up (design D14). */}
      <div className="flex flex-col gap-4 px-4 pb-24 pt-[14px] xl:hidden">
        <CreditsCard initialBalance={credits.creditBalance} defaultOpen={topupRequested} />
        <CommunityTabs joined={joined} discover={discover} />
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
