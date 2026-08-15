import { getCommunities, getCreditsState } from "@/lib/api/communities";
import { CreditsCard } from "@/components/communities/CreditsCard";
import { CommunityTabs } from "@/components/communities/CommunityTabs";
import { ErrorState } from "@/components/ui/ErrorState";

export default async function CommunitiesPage() {
  let credits;
  let joined;
  let discover;
  try {
    [credits, joined, discover] = await Promise.all([getCreditsState(), getCommunities("joined"), getCommunities("discover")]);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load communities."} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "14px 16px 96px" }}>
      <CreditsCard initialBalance={credits.creditBalance} />
      <CommunityTabs joined={joined} discover={discover} />
    </div>
  );
}