"use client";

import { useCallback, useEffect, useState } from "react";
import { getOwnProfile } from "@/lib/api/verification";
import type { OwnProfile } from "@/types/verification";
import { Avatar } from "@/components/ui/Avatar";
import { TierBadge } from "@/components/ui/TierBadge";
import { ListRow } from "@/components/ui/ListRow";
import { SoundSetting } from "@/components/layout/SoundToggle";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SettingsFooterActions } from "@/components/shared/SettingsFooterActions";
import { KYC_STATUS_LABEL } from "@/components/dashboard/VerificationAsk";
import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { ThreePaneLayout } from "@/components/layout/ThreePaneLayout";
import { NotificationsSettingsBody } from "./notifications/NotificationsSettingsBody";
import { DeleteAccountBody } from "./delete-account/DeleteAccountBody";
import { SettingsCategoryList, SettingsDetailShell, SETTINGS_LIST_HEADER } from "./SettingsDesktopShared";
import type { InternalSettingsKey } from "./SettingsDesktopShared";
import type { IconName } from "@/components/ui/Icon";

interface Row {
  title: string;
  subtitle?: string;
  icon: IconName;
  href: string;
  meta?: string;
}

interface Group {
  title: string;
  rows: Row[];
}

export default function SettingsPage() {
  // GET own-profile's accountType is a second stale-truth path beside the
  // session's (it knows nothing about whether a CreatorState row exists), so
  // the live gate is consulted too and creator wins in either: the Creator
  // group of rows must not vanish for somebody who is one.
  const { creator, resolved: creatorResolved } = useCreatorState();
  const gates = creatorGates({ creator });
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<InternalSettingsKey>("notifications");

  const load = useCallback(() => {
    let active = true;
    setError(undefined);
    setProfile(null);
    getOwnProfile()
      .then((p) => active && setProfile(p))
      .catch((e) => active && setError(e instanceof Error ? e.message : undefined));
    return () => {
      active = false;
    };
  }, []);

  useEffect(load, [load]);

  if (error) {
    return <ErrorState title="Couldn't load settings" body={error} onRetry={load} />;
  }

  const isCreator = gates.isCreator || profile?.accountType === "creator";
  const ready = profile !== null && creatorResolved;

  const groups: Group[] = profile
    ? [
        {
          title: "Account",
          rows: [
            { title: "Profile", subtitle: profile.handle ? `@${profile.handle}` : undefined, icon: "CircleUser", href: "/profile" },
            { title: "Edit profile", icon: "UserRound", href: "/profile/edit" },
            { title: "Verification", subtitle: "Badge and ladder", icon: "ShieldCheck", href: "/profile/verification" },
          ],
        },
        ...(isCreator
          ? [
              {
                title: "Creator",
                rows: [
                  // The KYC gate had no entry anywhere in Settings. The only
                  // row with "Verification" on it is the badge ladder above,
                  // which is a separate system — so a creator looking for
                  // their submitted ID and payout account found either
                  // nothing or the wrong screen.
                  {
                    title: "Identity verification",
                    subtitle: "ID and payout account, unlocks getting paid",
                    icon: "IdCard",
                    href: "/kyc",
                    meta: KYC_STATUS_LABEL[gates.kycStatus],
                  },
                  { title: "Subscription", subtitle: "Plan, billing and renewal", icon: "BadgeCheck", href: "/subscription" },
                  { title: "Paid messages", subtitle: "Reply within 24 hours", icon: "MessageCircle", href: "/messages/settings" },
                  { title: "Earnings", subtitle: "Payouts and history", icon: "HandCoins", href: "/earnings" },
                ],
              } satisfies Group,
            ]
          : []),
        {
          title: "App",
          rows: [
            { title: "Notifications", icon: "Bell", href: "/settings/notifications" },
            { title: "Privacy", icon: "Lock", href: "/privacy" },
            { title: "Saved", subtitle: "Your saved content", icon: "Bookmark", href: "/saved" },
            // In the App group, not Creator: anybody can buy a ticket. Gating
            // this behind a creator account would hide a stranger's ticket
            // from them while they stand at the door.
            { title: "My tickets", subtitle: "Event tickets and their QR codes", icon: "Ticket", href: "/tickets" },
            { title: "Shop orders", subtitle: "Equipment you bought, and delivery", icon: "Package", href: "/shop/orders" },
          ],
        },
        {
          title: "About",
          rows: [
            { title: "About WAWU", icon: "Info", href: "/about" },
          ],
        },
      ]
    : [];

  return (
    <>
      <div className="flex flex-col gap-[11px] p-[14px_16px_96px] xl:hidden">
        {/* Skeleton — never the non-creator branch — until the creator fork is
            actually knowable: this list is where the Creator group lives. */}
        {!ready || !profile ? (
          <>
            <div className="flex items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px_14px]">
              <Skeleton variant="circle" className="h-[52px] w-[52px]" />
              <Skeleton variant="row" className="h-9 flex-1" />
            </div>
            <Skeleton variant="row" className="h-[120px]" />
            <Skeleton variant="row" className="h-[120px]" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px_14px]">
              <Avatar initial={profile.name.charAt(0)} size={52} />
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-[17px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">{profile.name}</span>
                <span className="text-[12.5px] text-[var(--text-muted)]">{profile.email}</span>
              </div>
              <div className="flex flex-col items-end gap-[5px]">
                {/* Live tier first — profile.plan is a stale "basic" when
                    own-profile's accountType disagrees with creator state. */}
                {isCreator && <TierBadge tier={gates.tier ?? profile.plan} />}
                <span className="text-[11.5px] text-[var(--text-muted)]">
                  {isCreator ? "Creator" : "Member"} account
                </span>
              </div>
            </div>

            {groups.map((g) => (
              <section key={`${g.title}-${g.rows.length}`} className="flex flex-col gap-[8px]">
                <span className="px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  {g.title}
                </span>
                <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
                  {g.rows.map((r) => (
                    <ListRow key={r.title} title={r.title} subtitle={r.subtitle} icon={r.icon} href={r.href} />
                  ))}
                </div>
              </section>
            ))}

            {/*
              The music lives here now, not on a circle floating over every
              screen. It is a preference, it is set once, and Settings is
              where the other preferences are. Phone only: on desktop the
              button still sits out in the right-hand gutter, where there is
              nothing underneath it to cover.
            */}
            <section className="flex flex-col gap-[8px] xl:hidden">
              <span className="px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Sound
              </span>
              <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
                <SoundSetting />
              </div>
            </section>

            <SettingsFooterActions />
          </>
        )}
      </div>

      <ThreePaneLayout
        listWidth={320}
        listHeader={SETTINGS_LIST_HEADER}
        list={<SettingsCategoryList activeKey={selected} onSelectInternal={setSelected} />}
        detail={
          <SettingsDetailShell title={selected === "notifications" ? "Notifications" : "Delete account"}>
            {selected === "notifications" ? <NotificationsSettingsBody /> : <DeleteAccountBody variant="desktop" />}
          </SettingsDetailShell>
        }
      />
    </>
  );
}
