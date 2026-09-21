"use client";

import { useEffect, useState } from "react";
import type { NotificationSettings } from "@/types/settings";
import { getNotificationSettings, saveNotificationSettings } from "@/lib/api/settings";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

type Row = { key: keyof NotificationSettings; label: string; caption: string };

// SEAM: grouping is presentation-only — it does not change which keys exist
// on NotificationSettings or what they control, per design/screens/WAWU
// Settings States.dc.html's "Money" / "Activity" subheadings.
const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "Money",
    rows: [
      { key: "dmReminders", label: "24-hour message reminders", caption: "Before a paid DM expires" },
      { key: "refunds", label: "Refunds", caption: "When a paid message is refunded" },
    ],
  },
  {
    title: "Activity",
    rows: [
      { key: "newReplies", label: "Replies to my messages", caption: "When a creator answers a paid DM" },
      { key: "newFollowers", label: "New followers", caption: "When someone follows you" },
      {
        key: "promotions",
        label: "Offers and news",
        // Build brief C8 made this switch real: it is now the opt-out for
        // admin-composed campaigns (kind `campaign`), honoured on every
        // dispatch in NotificationService.emitCampaign. The caption says what
        // it controls rather than describing a vague category, because a
        // switch whose effect you cannot predict is one nobody touches.
        caption: "Announcements and product news in your notifications",
      },
      { key: "communityDigest", label: "Community digest", caption: "Weekly highlights from communities you joined" },
    ],
  },
];

/**
 * The toggles + info line, with no page chrome. Shared by
 * settings/notifications/page.tsx (mobile view, wrapped there with a back
 * button) and settings/page.tsx's desktop split view, which renders this
 * straight into its detail pane when "Notifications" is selected. Lives in
 * its own file (not exported from page.tsx) because Next.js only allows a
 * page.tsx file to export a default component — no other named exports.
 */
export function NotificationsSettingsBody() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const load = () => {
    setSettings(null);
    setLoadError(false);
    getNotificationSettings()
      .then(setSettings)
      .catch(() => setLoadError(true));
  };

  useEffect(load, []);

  const toggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    const previous = settings;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaveError(false);
    saveNotificationSettings(next).catch(() => {
      // Real save failed — revert the optimistic flip so the switch never
      // shows a state that was never actually persisted.
      setSettings(previous);
      setSaveError(true);
    });
  };

  if (loadError) {
    return <ErrorState title="Couldn't load your notification settings" onRetry={load} />;
  }

  if (!settings) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[60px] rounded-[var(--radius-input)] bg-[var(--surface-tag)]" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-[18px]">
        {GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-[10px]">
            <span className="px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              {group.title}
            </span>
            <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
              {group.rows.map((r) => {
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
                      className={`relative h-[28px] w-[46px] shrink-0 cursor-pointer rounded-full border-none transition-[background] duration-[160ms] ${on ? "bg-[var(--accent)] hover:bg-accent-hover" : "bg-[var(--surface-tag)] hover:bg-surface-hover"}`}
                    >
                      <span
                        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[left] duration-[160ms] ease-[cubic-bezier(.32,.72,0,1)] ${on ? "left-[21px]" : "left-[3px]"}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-[6px]">
        <p className="m-0 flex items-start gap-[7px] px-[4px] text-[12px] leading-[1.45] text-[var(--text-muted)]">
          <Icon name="Info" size={14} color="var(--text-muted)" />
          Paid-message alerts never get switched off, refunds depend on them.
        </p>
        {/*
          Verification prompts are account state, not marketing, so they are
          not behind "Offers and news" and there is no switch for them. Said
          out loud here rather than left for somebody to discover: the prompt
          arrives at most once a fortnight and stops the day the account is
          verified. MECHANISM: VerificationReminderService (backend cron
          `remind-unverified-to-verify`).
        */}
        <p className="m-0 flex items-start gap-[7px] px-[4px] text-[12px] leading-[1.45] text-[var(--text-muted)]">
          <Icon name="BadgeCheck" size={14} color="var(--text-muted)" />
          If your account is not verified, you get a reminder about it at most once a fortnight. It stops
          as soon as you are verified.
        </p>
      </div>
      {saveError ? (
        <p className="m-0 flex items-center gap-[7px] px-[4px] text-[12px] text-[var(--danger)]">
          <Icon name="CircleAlert" size={14} color="var(--danger)" />
          That didn&apos;t save. Try again.
        </p>
      ) : null}
    </>
  );
}
