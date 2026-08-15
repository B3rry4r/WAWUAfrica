import Link from "next/link";
import type { FeedTab } from "@/types/content";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "for_you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
];

export function FeedTabs({ active }: { active: FeedTab }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 26,
        padding: "2px 2px 0",
        borderBottom: "1px solid var(--border-hairline)",
        overflowX: "auto",
      }}
      className="wawu-no-scrollbar"
    >
      {TABS.map((tab) => {
        const on = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.id === "for_you" ? "/home" : `/home?tab=${tab.id}`}
            style={{
              position: "relative",
              paddingBottom: 12,
              fontSize: 14.5,
              fontWeight: on ? 600 : 500,
              color: on ? "var(--text-primary)" : "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            {on && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, background: "var(--accent)" }} />}
          </Link>
        );
      })}
    </div>
  );
}