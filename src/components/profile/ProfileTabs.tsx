import Link from "next/link";
import type { ProfileTab } from "@/types/profile";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "community", label: "Community" },
  { id: "shop", label: "Shop" },
  { id: "about", label: "About" },
];

/** Profile tab bar. Active tab gets the accent underline. */
export function ProfileTabs({ wawuId, active }: { wawuId: string; active: ProfileTab }) {
  return (
    <div style={{ display: "flex", gap: 22, padding: "12px 18px 0", borderBottom: "1px solid var(--border-hairline)" }}>
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`/profile/${wawuId}?tab=${tab.id}`}
            style={{
              position: "relative",
              paddingBottom: 12,
              fontSize: 14,
              fontWeight: on ? 600 : 500,
              color: on ? "var(--text-primary)" : "var(--text-muted)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            {on && (
              <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, background: "var(--accent)" }} />
            )}
          </Link>
        );
      })}
    </div>
  );
}