import Link from "next/link";
import type { DmThreadSummary } from "@/types/dm";
import { getDmThreads } from "@/lib/api/dm";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export default async function MessagesPage() {
  let threads: DmThreadSummary[];
  try {
    threads = await getDmThreads();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load your messages."} />;
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        icon="MessageCircle"
        title="No conversations yet"
        caption="Message a creator you like — paid messages are read directly by them."
        action="Find creators"
        actionHref="/explore/creators"
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px 96px" }}>
      {threads.map((t) => (
        <Link
          key={t.id}
          href={`/messages/${t.id}`}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 10px", borderRadius: "var(--radius-input)", textDecoration: "none" }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar initial={t.creatorName.charAt(0)} size={48} />
            {t.unread && (
              <span style={{ position: "absolute", bottom: 2, right: 2, width: 10, height: 10, borderRadius: 999, background: "var(--accent)", border: "2px solid var(--surface-page)" }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: t.unread ? 700 : 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {t.creatorName}
              <VerificationBadge size={14} />
              {t.status === "awaiting_response" && <StatusPill kind="warning" style={{ padding: "2px 8px", fontSize: 10.5 }}>Awaiting</StatusPill>}
              {t.status === "refunded" && <StatusPill kind="error" style={{ padding: "2px 8px", fontSize: 10.5 }}>Refunded</StatusPill>}
            </span>
            <span
              style={{
                fontSize: 13.5,
                color: t.unread ? "var(--text-primary)" : "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: t.unread ? 500 : 400,
              }}
            >
              {t.snippet}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: t.unread ? "var(--accent)" : "var(--text-muted)", fontWeight: t.unread ? 700 : 400 }}>
              {t.lastAt}
            </span>
            <Icon name="ChevronRight" size={15} color="var(--text-muted)" stroke={2} />
          </div>
        </Link>
      ))}
    </div>
  );
}