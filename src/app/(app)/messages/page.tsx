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
    return <ErrorState title={message ?? "We couldn't load your messages."} />;
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
    <div className="flex flex-col gap-2 p-[12px_14px_96px]">
      {threads.map((t) => (
        <Link
          key={t.id}
          href={`/messages/${t.id}`}
          className="flex items-center gap-3 rounded-[var(--radius-input)] p-[12px_10px] no-underline"
        >
          <div className="relative shrink-0">
            <Avatar initial={t.creatorName.charAt(0)} size={48} />
            {t.unread && (
              <span className="absolute bottom-[2px] right-[2px] h-[10px] w-[10px] rounded-full border-2 border-[var(--surface-page)] bg-[var(--accent)]" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span
              className={[
                "flex items-center gap-[6px] text-[15px] tracking-[-0.01em] text-[var(--text-primary)]",
                t.unread ? "font-bold" : "font-semibold",
              ].join(" ")}
            >
              {t.creatorName}
              <VerificationBadge tier="verified_user" size={14} />
              {t.status === "awaiting_response" && <StatusPill kind="warning">Awaiting</StatusPill>}
              {t.status === "refunded" && <StatusPill kind="danger">Refunded</StatusPill>}
            </span>
            <span
              className={[
                "truncate text-[13.5px]",
                t.unread ? "font-medium text-[var(--text-primary)]" : "font-normal text-[var(--text-secondary)]",
              ].join(" ")}
            >
              {t.snippet}
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-[5px]">
            <span
              className={[
                "text-[12px]",
                t.unread ? "font-bold text-[var(--accent)]" : "font-normal text-[var(--text-muted)]",
              ].join(" ")}
            >
              {t.lastAt}
            </span>
            <Icon name="ChevronRight" size={15} color="var(--text-muted)" />
          </div>
        </Link>
      ))}
    </div>
  );
}
