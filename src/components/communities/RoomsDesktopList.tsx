import Link from "next/link";
import type { Community } from "@/types/credits";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

/** 68px "Rooms" header + the "1 credit per message" note (design D14). */
export const ROOMS_LIST_HEADER = (
  <div className="flex h-[68px] shrink-0 items-center border-b border-hairline px-5">
    <span className="text-[17px] font-semibold text-text-primary">Rooms</span>
    <span className="ml-auto text-[12.5px] text-text-muted">1 credit per message</span>
  </div>
);

/**
 * Desktop rooms list pane (design D14) — the joined communities a member can
 * read and reply to. Each row routes to /communities/:id, the same detail
 * route mobile already uses, so the split view stays deep-linkable and the
 * active room is whichever id the URL currently carries.
 */
export function RoomsDesktopList({ rooms, activeId }: { rooms: Community[]; activeId?: string }) {
  if (rooms.length === 0) {
    return (
      <EmptyState
        icon="Users"
        title="You haven't joined any"
        caption="Join a community from the app to see its room here, reading costs nothing, sending costs one credit."
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
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-hairline bg-elevated">
              <Icon name="Users" size={18} color="var(--accent)" strokeWidth={2} />
            </span>
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
