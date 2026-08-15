import { getCommunities, getCreditsState } from "@/lib/api/communities";
import { CreditsCard } from "@/components/communities/CreditsCard";
import { CommunityTabs } from "@/components/communities/CommunityTabs";
import { CommunitiesErrorRetry } from "@/components/communities/CommunitiesErrorRetry";
import { ThreePaneLayout } from "@/components/layout/ThreePaneLayout";
import { ROOMS_LIST_HEADER, RoomsDesktopList } from "@/components/communities/RoomsDesktopList";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CommunitiesPage() {
  let credits;
  let joined;
  let discover;
  try {
    [credits, joined, discover] = await Promise.all([getCreditsState(), getCommunities("joined"), getCommunities("discover")]);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <CommunitiesErrorRetry title={message ?? "We couldn't load communities."} />;
  }

  return (
    <>
      {/* Mobile tabs + list, unchanged below xl: — the desktop three-pane
          view below replaces it at xl and up (design D14). */}
      <div className="flex flex-col gap-4 px-4 pb-24 pt-[14px] xl:hidden">
        <CreditsCard initialBalance={credits.creditBalance} />
        <CommunityTabs joined={joined} discover={discover} />
      </div>

      <ThreePaneLayout
        listWidth={340}
        listHeader={ROOMS_LIST_HEADER}
        list={<RoomsDesktopList rooms={joined} />}
        detail={
          <EmptyState
            icon="MessageCircle"
            title="Select a room"
            caption="Choose a community from the list to read and send messages."
          />
        }
      />
    </>
  );
}
