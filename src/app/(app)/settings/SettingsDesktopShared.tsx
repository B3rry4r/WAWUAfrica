"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session-provider";
import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import type { IconName } from "@/components/ui/Icon";

/**
 * Desktop settings category list + detail shell (design D17). Lives outside
 * page.tsx because Next.js only allows a page.tsx file to export a default
 * component — no other named exports — and this is shared by three routes:
 * settings/page.tsx (the list, driving in-place category state) and
 * settings/notifications + settings/delete-account (which render the same
 * list so the split view still looks right when either route is visited
 * directly at xl width).
 */

/**
 * The two categories this batch gives an in-place desktop detail view (their
 * content lives in ./notifications/NotificationsSettingsBody and
 * ./delete-account/DeleteAccountBody). Selecting either from the settings
 * root swaps the right pane via local state instead of navigating. Every
 * other row is a plain route the list links to like any other page.
 */
export type InternalSettingsKey = "notifications" | "delete-account";

interface CategoryRow {
  key: string;
  label: string;
  icon: IconName;
  href: string;
  /** Handled in-place by this batch instead of a real navigation. */
  internal?: InternalSettingsKey;
  /** Handled by calling signOut() instead of a real navigation. */
  action?: "sign-out";
  danger?: boolean;
}

// "Creating" only exists for creator accounts (design D17) — Notifications is
// kept out of it and shown under "Account" instead, since notification
// preferences apply to every account type, not just creators (mobile's own
// settings groups already put it under "App", available to everyone). D17's
// own caption only calls out "no paid questions, no payouts"
// for a user account — it never says a user loses notification settings, so
// this reads as the design's grouping shorthand rather than a product rule.
const CREATING_ROWS: CategoryRow[] = [
  // The earning gate (KycSubmission, /kyc). Distinct from the "Verification"
  // row under Account below, which is the two paid ticks — same word,
  // different system. Desktop listed only the ticks, so a creator had no
  // route to their own KYC submission from settings at all.
  { key: "identity", label: "Identity verification", icon: "IdCard", href: "/kyc" },
  { key: "paid-questions", label: "Paid questions", icon: "MessageCircleQuestion", href: "/messages/settings" },
  { key: "payouts", label: "Payouts", icon: "Banknote", href: "/earnings" },
  // There was a "Subscription" row here, pointing at /subscription. Both are
  // gone: nothing is subscribed to, so the row had no screen to open.
];

const ACCOUNT_ROWS: CategoryRow[] = [
  { key: "notifications", label: "Notifications", icon: "Bell", href: "/settings/notifications", internal: "notifications" },
  { key: "verification", label: "Verification ticks", icon: "ShieldCheck", href: "/profile/verification" },
  { key: "privacy", label: "Privacy", icon: "Lock", href: "/privacy" },
  { key: "saved", label: "Saved", icon: "Bookmark", href: "/saved" },
  { key: "about", label: "About and partners", icon: "Info", href: "/about" },
  { key: "sign-out", label: "Sign out", icon: "LogOut", href: "#", action: "sign-out", danger: true },
  { key: "delete-account", label: "Delete account", icon: "Trash2", href: "/settings/delete-account", internal: "delete-account", danger: true },
];

function categoryRowClass(active: boolean, danger?: boolean) {
  if (danger) {
    return "mt-auto flex h-[44px] shrink-0 items-center gap-3 rounded-xl px-3 text-[14px] font-medium text-[var(--danger)] hover:bg-state-hover active:bg-state-press";
  }
  return [
    "flex h-[44px] shrink-0 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
    active
      ? "border border-[var(--border-accent)] bg-[var(--accent-tint)] font-semibold text-[var(--text-primary)]"
      : "border border-transparent font-medium text-[var(--text-secondary)] hover:bg-state-hover",
  ].join(" ");
}

/** Desktop settings category list (design D17, rendered at 320px by ThreePaneLayout). */
export function SettingsCategoryList({
  activeKey,
  onSelectInternal,
}: {
  activeKey: string;
  onSelectInternal: (key: InternalSettingsKey) => void;
}) {
  const router = useRouter();
  const { signOut } = useSession();
  // Live creator state, not the session's sign-in-time accountType — that is
  // written once at sign-in and never revisited, so the entire "Creating"
  // group (identity, paid questions, payouts) stayed hidden from anyone
  // who became a creator after signing in.
  const { creator, resolved } = useCreatorState();
  const isCreator = creatorGates({ creator }).isCreator;

  const renderRow = (row: CategoryRow) => {
    const active = row.key === activeKey;
    const iconColor = row.danger ? "var(--danger)" : active ? "var(--accent)" : "var(--text-secondary)";
    if (row.action === "sign-out") {
      return (
        <button
          key={row.key}
          type="button"
          onClick={() => {
            signOut();
            router.push("/sign-in");
          }}
          className={categoryRowClass(active, row.danger)}
        >
          <Icon name={row.icon} size={18} strokeWidth={2.2} color={iconColor} />
          {row.label}
        </button>
      );
    }
    if (row.internal) {
      return (
        <button key={row.key} type="button" onClick={() => onSelectInternal(row.internal!)} className={categoryRowClass(active, row.danger)}>
          <Icon name={row.icon} size={18} strokeWidth={2.2} color={iconColor} />
          {row.label}
        </button>
      );
    }
    return (
      <Link key={row.key} href={row.href} className={categoryRowClass(active, row.danger)}>
        <Icon name={row.icon} size={18} strokeWidth={2.2} color={iconColor} />
        {row.label}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col gap-1 p-[14px]">
      {!resolved ? (
        // Placeholder, not the plain-user list: dropping the Creating group in
        // a beat later is the flash this whole fix exists to remove.
        <>
          <Skeleton className="mx-3 mb-1 mt-2 h-[11px] w-[64px] rounded" />
          {CREATING_ROWS.map((row) => (
            <Skeleton key={row.key} variant="row" className="h-[44px] rounded-xl" />
          ))}
        </>
      ) : isCreator ? (
        <>
          <span className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Creating</span>
          {CREATING_ROWS.map(renderRow)}
        </>
      ) : null}
      <span className="px-3 pb-1 pt-3.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Account</span>
      {ACCOUNT_ROWS.map(renderRow)}
    </div>
  );
}

/** The "Settings" 68px header above the category list (design D17). */
export const SETTINGS_LIST_HEADER = (
  <div className="flex h-[68px] shrink-0 items-center border-b border-[var(--border-hairline)] px-5">
    <span className="text-[17px] font-semibold text-[var(--text-primary)]">Settings</span>
  </div>
);

/** 68px title bar + body padding for the desktop detail pane (design D17). */
export function SettingsDetailShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 flex h-[68px] shrink-0 items-center border-b border-[var(--border-hairline)] bg-[var(--surface-page)] px-[26px]">
        <span className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{title}</span>
      </div>
      <div className="flex flex-col gap-4 p-[26px]">{children}</div>
    </div>
  );
}
