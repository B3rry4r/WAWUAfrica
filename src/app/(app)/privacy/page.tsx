"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Callout } from "@/components/ui/Callout";
import { PageColumn } from "@/components/layout/PageColumn";
import { ErrorState } from "@/components/ui/ErrorState";
import type { PrivacySettings } from "@/lib/api/settings";
import { getBlockedAccounts, getPrivacySettings, requestDataExport, savePrivacySettings } from "@/lib/api/settings";

type ToggleKey = keyof PrivacySettings;

const PROFILE_ROWS: { key: ToggleKey; label: string; onCaption?: string; offCaption?: string }[] = [
  { key: "showPurchases", label: "Show what I have bought", offCaption: "Off, nobody sees your purchases" },
  { key: "showSavedItems", label: "Show my saved items" },
  { key: "showFollowing", label: "Show who I follow" },
];

const COMMUNITY_ROWS: { key: ToggleKey; label: string; onCaption?: string; offCaption?: string }[] = [
  { key: "showInMemberLists", label: "Show me in member lists", onCaption: "Your messages are visible either way" },
];

type ExportState = "idle" | "confirm" | "loading" | "success" | "error";

export default function PrivacyPage() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [blockedCount, setBlockedCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [exportState, setExportState] = useState<ExportState>("idle");

  const load = useCallback(() => {
    setSettings(null);
    setError(false);
    Promise.all([getPrivacySettings(), getBlockedAccounts()])
      .then(([s, blocked]) => {
        setSettings(s);
        setBlockedCount(blocked.length);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  const toggle = (key: ToggleKey) => {
    if (!settings) return;
    const previous = settings;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaveError(false);
    savePrivacySettings(next).catch(() => {
      // Real save failed — revert the optimistic flip so the switch never
      // shows a state that was never actually persisted.
      setSettings(previous);
      setSaveError(true);
    });
  };

  const runExport = () => {
    setExportState("loading");
    requestDataExport()
      .then(() => setExportState("success"))
      .catch(() => setExportState("error"));
  };

  if (error) {
    return (
      <div className="flex flex-col gap-[14px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:p-[30px_28px_64px]">
        <div className="flex items-center gap-[10px]">
          <ProfileBackButton compact />
          <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Privacy</span>
        </div>
        <ErrorState title="Couldn't load your privacy settings" onRetry={load} />
      </div>
    );
  }

  if (!settings) {
    return (
      <PageColumn gap="gap-[14px]">
        <div className="flex items-center gap-[10px]">
          <ProfileBackButton compact />
          <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Privacy</span>
        </div>
        <div className="flex flex-col gap-[10px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[58px] rounded-[var(--radius-input)] bg-[var(--surface-tag)]" />
          ))}
        </div>
      </PageColumn>
    );
  }

  return (
    <PageColumn>
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Privacy</span>
      </div>

      <ToggleGroup label="Your profile" rows={PROFILE_ROWS} settings={settings} onToggle={toggle} />
      <ToggleGroup label="Communities" rows={COMMUNITY_ROWS} settings={settings} onToggle={toggle} />
      {saveError ? (
        <span className="flex items-center gap-[7px] px-[4px] text-[12px] text-[var(--danger)]">
          <Icon name="CircleAlert" size={14} color="var(--danger)" />
          That didn&apos;t save. Try again.
        </span>
      ) : null}

      <div className="flex flex-col gap-[10px]">
        <span className="px-[4px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
          Your data
        </span>
        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
          <Link
            href="/privacy/blocked"
            className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-state-hover"
          >
            <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-tag text-text-secondary">
              <Icon name="UserRoundX" size={18} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-text-primary">Blocked accounts</span>
            <span className="text-[13.5px] text-[var(--text-muted)]">{blockedCount ?? "-"}</span>
            <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
          </Link>
          <button
            type="button"
            onClick={() => setExportState("confirm")}
            className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-state-hover"
          >
            <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-tag text-text-secondary">
              <Icon name="Download" size={18} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-semibold text-text-primary">Download my data</span>
              <span className="mt-0.5 block truncate text-[12.5px] text-text-muted">Sent to your email</span>
            </span>
            <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
          </button>
          <Link
            href="/privacy/policy"
            className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-state-hover"
          >
            <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-tag text-text-secondary">
              <Icon name="FileText" size={18} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-text-primary">Privacy policy</span>
            <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
          </Link>
        </div>
      </div>

      <Callout icon="ShieldCheck">
        Your BVN and NIN are never shown on your profile and never given to another member. They&apos;re used only by
        our manual review team to verify your identity, there&apos;s no automated liveness or face-matching step.
      </Callout>

      {exportState !== "idle" ? (
        <Sheet
          title={exportState === "success" ? "Request received" : "Download my data"}
          caption={
            exportState === "success"
              ? undefined
              : "We'll put together a copy of your profile, purchases and messages and email it to you."
          }
          onClose={exportState === "loading" ? undefined : () => setExportState("idle")}
        >
          {exportState === "confirm" ? (
            <div className="flex flex-col gap-[14px]">
              <Button full size="lg" onClick={runExport}>
                Request my data
              </Button>
              <Button full size="lg" variant="secondary" onClick={() => setExportState("idle")}>
                Cancel
              </Button>
            </div>
          ) : exportState === "loading" ? (
            <div className="flex flex-col items-center gap-[10px] py-[10px] text-center">
              <span className="text-[13.5px] text-[var(--text-secondary)]">Sending your request…</span>
            </div>
          ) : exportState === "success" ? (
            <div className="flex flex-col gap-[16px]">
              <div className="flex flex-col items-center gap-[10px] py-[6px] text-center">
                <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[var(--surface-tag)]">
                  <Icon name="Check" size={22} color="var(--accent)" strokeWidth={2.4} />
                </span>
                <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
                  We&apos;ll email a copy of your data to your account email within 48 hours.
                </span>
              </div>
              <Button full size="lg" variant="secondary" onClick={() => setExportState("idle")}>
                Done
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-[14px]">
              <span className="text-[13.5px] text-[var(--text-secondary)]">
                That didn&apos;t go through. Try again.
              </span>
              <Button full size="lg" onClick={runExport}>
                Try again
              </Button>
            </div>
          )}
        </Sheet>
      ) : null}
    </PageColumn>
  );
}

function ToggleGroup({
  label,
  rows,
  settings,
  onToggle,
}: {
  label: string;
  rows: { key: ToggleKey; label: string; onCaption?: string; offCaption?: string }[];
  settings: PrivacySettings;
  onToggle: (key: ToggleKey) => void;
}) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="px-[4px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
        {label}
      </span>
      <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
        {rows.map((r) => {
          const on = settings[r.key];
          const caption = on ? r.onCaption : r.offCaption;
          return (
            <div key={r.key} className="flex items-center gap-[13px] rounded-[var(--radius-input)] px-[14px] py-[13px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{r.label}</span>
                {caption ? <span className="text-[12px] leading-[1.4] text-[var(--text-muted)]">{caption}</span> : null}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={r.label}
                onClick={() => onToggle(r.key)}
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
  );
}
