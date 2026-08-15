import Link from "next/link";
import type { ProfileTab } from "@/types/profile";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "shop", label: "Shop" },
  { id: "community", label: "Community" },
  { id: "about", label: "About" },
];

/** Profile tab bar. Active tab gets the accent underline. */
export function ProfileTabs({ wawuId, active }: { wawuId: string; active: ProfileTab }) {
  return (
    <div className="flex gap-[22px] border-b border-[var(--border-hairline)] p-[12px_18px_0]">
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`/profile/${wawuId}?tab=${tab.id}`}
            className={[
              "relative whitespace-nowrap pb-3 text-[14px] no-underline",
              on ? "font-semibold text-[var(--text-primary)]" : "font-medium text-[var(--text-muted)]",
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
