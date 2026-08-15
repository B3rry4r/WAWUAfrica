"use client";

import { useEffect, useState } from "react";
import type { NotificationSettings } from "@/types/settings";
import { getNotificationSettings, saveNotificationSettings } from "@/lib/api/settings";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";

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
      <div className="p-4">
        <ProfileBackButton compact />
        <div className="mt-4 flex flex-col gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[60px] rounded-[var(--radius-input)] bg-[var(--surface-tag)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[14px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Notifications
        </span>
      </div>
      <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
        {ROWS.map((r) => {
          const on = settings[r.key];
          return (
            <div key={r.key} className="flex items-center gap-[13px] rounded-[var(--radius-input)] px-[14px] py-[13px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">{r.label}</span>
                <span className="text-[12.5px] leading-[1.4] text-[var(--text-muted)]">{r.caption}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={r.label}
                onClick={() => toggle(r.key)}
                className={`relative h-[28px] w-[46px] shrink-0 cursor-pointer rounded-full border-none transition-[background] duration-[160ms] ${on ? "bg-[var(--accent)]" : "bg-[var(--surface-tag)]"}`}
              >
                <span
                  className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[left] duration-[160ms] ease-[cubic-bezier(.32,.72,0,1)] ${on ? "left-[21px]" : "left-[3px]"}`}
                />
              </button>
            </div>
          );
        })}
      </div>
      <p className="m-0 flex items-center gap-[7px] px-[4px] text-[12px] text-[var(--text-muted)]">
        <Icon name="Info" size={14} color="var(--text-muted)" />
        Paid-message alerts never get switched off — refunds depend on them.
      </p>
    </div>
  );
}
