import type { Content, FeedTab } from "@/types/content";
import { getFeed } from "@/lib/api/content";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FeedCard } from "./FeedCard";
import { FeedTabs } from "./FeedTabs";

const VALID_TABS: FeedTab[] = ["for_you", "following", "trending"];

export default async function HomePage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab: FeedTab = VALID_TABS.includes(searchParams.tab as FeedTab) ? (searchParams.tab as FeedTab) : "for_you";

  let items: Content[];
  try {
    items = await getFeed({ tab });
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return (
      <>
        <FeedTabs active={tab} />
        <ErrorState caption={message ?? "We couldn't load your feed."} style={{ paddingTop: 24 }} />
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <FeedTabs active={tab} />
      {items.length === 0 ? (
        <EmptyState
          icon="Compass"
          title="Nothing here yet"
          caption="New drops from creators you follow will show up here."
          action="Browse Explore"
          style={{ paddingTop: 24 }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {items.map((content) => (
            <FeedCard key={content.id} content={content} />
          ))}
        </div>
      )}
    </div>
  );
}