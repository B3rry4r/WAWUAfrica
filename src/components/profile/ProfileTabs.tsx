import Link from "next/link";
import { PROFILE_TAB_LABEL, type ProfileTab } from "@/types/profile";

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
  basePath,
  active,
  tabs,
  compact = false,
}: {
  /**
   * Where the tab links point. The owner's profile lives at /profile and
   * everybody else's at /profile/:wawuId, and the tab bar has to work on
   * both: hard-coding /profile/:wawuId sent the owner to their own public
   * URL and lost the Edit controls.
   */
  basePath: string;
  active: ProfileTab;
  /** Only the tabs this profile has anything for. See profileTabsFor(). */
  tabs: ProfileTab[];
  compact?: boolean;
}) {
  // One tab is not a tab bar: a buyer's profile has Overview and nothing
  // else, and a lone underlined word reads as a control that failed to load.
  if (tabs.length < 2) return null;
  return (
    <div
      className={[
        "wawu-no-scrollbar flex gap-[22px] overflow-x-auto border-b border-[var(--border-hairline)] p-[12px_18px_0]",
        compact ? "" : "mt-[14px] xl:mt-0",
      ].join(" ")}
    >
      {tabs.map((tab) => {
        const on = tab === active;
        return (
          <Link
            key={tab}
            href={`${basePath}?tab=${tab}`}
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
            {PROFILE_TAB_LABEL[tab]}
            {on && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-[2px] bg-[var(--accent)]" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
