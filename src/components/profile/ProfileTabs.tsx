import Link from "next/link";
import type { ProfileTab } from "@/types/profile";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "shop", label: "Shop" },
  { id: "community", label: "Community" },
  { id: "about", label: "About" },
];

/**
 * Profile tab bar. Active tab gets the accent underline.
 *
 * `compact` mirrors the page's `isDeepTab` state: under the sticky
 * CompactHeader the strip sits directly below the header bar (design:
 * `padding:12px 18px 0`, no extra gap). Under the full-size FullHeader it
 * needs breathing room below the Message/Tip action row (design:
 * `padding:14px 18px 0;margin-top:14px` — 28px total). The extra gap is
 * mobile-only (`xl:mt-0`) — desktop uses DesktopIdentity, not FullHeader,
 * and has no approved spec for this gap yet.
 */
export function ProfileTabs({
  wawuId,
  active,
  compact = false,
}: {
  wawuId: string;
  active: ProfileTab;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "flex gap-[22px] border-b border-[var(--border-hairline)] p-[12px_18px_0]",
        compact ? "" : "mt-[14px] xl:mt-0",
      ].join(" ")}
    >
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`/profile/${wawuId}?tab=${tab.id}`}
            className={[
              "relative whitespace-nowrap pb-3 text-[14px] no-underline",
              // Unselected branch only: the active tab already sits at
              // text-primary and owns the accent underline, so it stays put
              // under the pointer rather than reacting.
              on
                ? "font-semibold text-[var(--text-primary)]"
                : "font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            ].join(" ")}
          >
            {tab.label}
            {on && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-[2px] bg-[var(--accent)]" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
