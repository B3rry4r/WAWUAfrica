"use client";

import { useEffect, useState } from "react";
import type { NotificationSettings } from "@/types/settings";
import { getNotificationSettings, saveNotificationSettings } from "@/lib/api/settings";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

const ROWS: { key: keyof NotificationSettings; label: string; caption: string }[] = [
  { key: "newReplies", label: "Replies to my messages", caption: "When a creator answers a paid DM" },
  { key: "newFollowers", label: "New followers", caption: "When someone follows you" },
  { key: "dmReminders", label: "24-hour message reminders", caption: "Before a paid DM expires" },
  { key: "refunds", label: "Refunds", caption: "When a paid message is refunded" },
  { key: "promotions", label: "Offers and news", caption: "Occasional WAWU announcements" },
  { key: "communityDigest", label: "Community digest", caption: "Weekly highlights from communities you joined" },
];

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    let active = true;
    getNotificationSettings().then((s) => active && setSettings(s));
    return () => {
      active = false;
    };
  }, []);

  const toggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    void saveNotificationSettings(next);
  };

  if (!settings) {
    return (
      <div style={{ padding: 16 }}>
        <ProfileBackButton compact />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: 60, borderRadius: "var(--radius-input)", background: "var(--surface-tag)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Notifications
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
        {ROWS.map((r) => {
          const on = settings[r.key];
          return (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 14px", borderRadius: "var(--radius-input)" }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{r.label}</span>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.4 }}>{r.caption}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={r.label}
                onClick={() => toggle(r.key)}
                style={{
                  width: 46,
                  height: 28,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: on ? "var(--accent)" : "var(--surface-tag)",
                  borderColor: on ? "transparent" : "var(--border-hairline)",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background 160ms",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: on ? 21 : 3,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    transition: "left 160ms cubic-bezier(.32,.72,0,1)",
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>
      <p style={{ display: "flex", alignItems: "center", gap: 7, margin: 0, fontSize: 12, color: "var(--text-muted)", padding: "0 4px" }}>
        <Icon name="Info" size={14} color="var(--text-muted)" stroke={2} />
        Paid-message alerts never get switched off — refunds depend on them.
      </p>
    </div>
  );
}