import Link from "next/link";
import type { Community } from "@/types/credits";
import { CommunityImage } from "@/components/ui/CommunityImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

/**
 * 68px "Rooms" header + the "1 credit per message" note (design D14).
 *
 * `canHost` swaps the note for the create control — desktop had no way into
 * hosting at all, and the note is a restatement of what the composer already
 * says once you are inside a room.
 */
export function RoomsListHeader({ canHost = false }: { canHost?: boolean }) {
  return (
    <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-hairline px-5">
      <span className="text-[17px] font-semibold text-text-primary">Rooms</span>
      {canHost ? (
        <Link
          href="/communities/new"
          className="ml-auto inline-flex h-8 items-center gap-[6px] rounded-full border border-strong bg-elevated px-[11px] text-[12.5px] font-semibold text-text-primary no-underline transition-colors hover:bg-surface-hover active:bg-surface-press"
        >
          <Icon name="Plus" size={15} strokeWidth={2.4} color="var(--accent)" />
          New
        </Link>
      ) : (
        <span className="ml-auto text-[12.5px] text-text-muted">1 credit per message</span>
      )}
    </div>
  );
}

/**
 * Desktop rooms list pane (design D14) — the joined communities a member can
 * read and reply to. Each row routes to /communities/:id, the same detail
 * route mobile already uses, so the split view stays deep-linkable and the
 * active room is whichever id the URL currently carries.
 */
export function RoomsDesktopList({
  rooms,
  activeId,
  canHost = false,
}: {
  rooms: Community[];
  activeId?: string;
  /** Creator with an active subscription — the empty state gains a way to host one. */
  canHost?: boolean;
}) {
  if (rooms.length === 0) {
    return (
      <EmptyState
        icon="Users"
        title="You haven't joined any"
        caption={
          canHost
            ? "Join a community to see its room here, or host one of your own — you keep 90% of every credit spent in it."
            : "Join a community from the app to see its room here, reading costs nothing, sending costs one credit."
        }
        action={canHost ? "Start a community" : undefined}
        actionHref={canHost ? "/communities/new" : undefined}
      />
    );
  }

  return (
    <div>
      {rooms.map((c) => {
        const active = c.id === activeId;
        return (
          <Link
            key={c.id}
            href={`/communities/${c.id}`}
            className={`flex w-full gap-3 border-b border-hairline px-5 py-[15px] text-left no-underline transition-colors ${
              active ? "bg-selected-tint" : "hover:bg-state-hover"
            }`}
          >
            <CommunityImage
              src={c.imageUrl}
              iconSize={18}
              className="h-11 w-11 rounded-[14px] border border-hairline bg-elevated"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-[14px] font-semibold text-text-primary">{c.name}</span>
              <span className="truncate text-[12.5px] text-text-secondary">
                {c.description ?? `${c.memberCount.toLocaleString("en-NG")} members`}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
