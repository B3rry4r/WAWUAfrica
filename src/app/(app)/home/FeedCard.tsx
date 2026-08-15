import type { Content } from "@/types/content";
import { ContentCard } from "@/components/content/ContentCard";

/**
 * Feed card row: creator line + the shared ContentCard. Consumes the lead's
 * ContentCard — never forks a second card.
 */
export function FeedCard({ content }: { content: Content }) {
  const state = content.accessType === "free" || !content.fullAssetLocked ? "free" : "locked";
  return (
    <article style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "var(--surface-tag)",
            border: "1px solid var(--border-hairline)",
            display: "grid",
            placeItems: "center",
            color: "var(--text-secondary)",
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {content.creator.name.charAt(0)}
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>{content.creator.name}</span>
          <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>· {new Date(content.publishedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</span>
        </div>
      </div>
      <ContentCard content={content} state={state} ratio="2 / 1" />
    </article>
  );
}