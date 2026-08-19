"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/session-provider";
import { creatorGates } from "@/lib/auth/gates";
import { getOwnProfile } from "@/lib/api/verification";
import { fetchUnreadDmCount } from "@/lib/api/dm";
import { formatCredits, formatNaira } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { TierBadge } from "@/components/ui/TierBadge";
import { StatBlock } from "@/components/ui/StatBlock";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

/**
 * The same 5 slots as BottomNav (mobile), same order. Unlike mobile, slot 3
 * ("Explore") does NOT swap for creators on desktop — design D1 · Shell draws
 * an identical 5-row base for both account types. Creators get an ADDITIONAL
 * Create button + Dashboard row below a divider instead (see below). Do not
 * reintroduce the mobile swap here — that's a different, and wrong, pattern
 * for this screen.
 */
const BASE_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: "House" },
  { href: "/communities", label: "Communities", icon: "Users" },
  { href: "/explore", label: "Explore", icon: "Compass" },
  { href: "/messages", label: "Messages", icon: "MessageCircle" },
  { href: "/profile", label: "Profile", icon: "CircleUser" },
];

function navRowClass(active: boolean) {
  return [
    "flex h-[46px] items-center gap-[13px] rounded-2xl border px-[14px] text-[14.5px] transition-colors",
    active
      ? "border-accent bg-accent-tint font-semibold text-text-primary"
      : "border-transparent font-medium text-text-secondary hover:bg-tag/60",
  ].join(" ");
}

/**
 * Desktop left rail (design D1 · Shell, 244px, xl breakpoint). Ports
 * BottomNav's route/active-state/account-type logic to a persistent sidebar
 * instead of a 5-slot bottom bar. Hidden below xl — AppShell keeps BottomNav
 * there unchanged.
 */
export function Sidebar() {
  const { user, accountType, signOut } = useSession();
  const pathname = usePathname();
  const gates = creatorGates(user);
  const isCreator = accountType === "creator";

  // The foot card needs numbers (credits count / earnings this month) that
  // aren't on the client session object, so this reads the same profile SEAM
  // the mobile Profile screen already reads (getOwnProfile). AppShell has to
  // stay a client component (the whole session is an in-memory mock — there's
  // no server auth to fetch against yet), so this mirrors CreditsCard's
  // existing client-side fetch pattern rather than the usual server-component
  // fetch described in docs/05_CONVENTIONS.md.
  const [profile, setProfile] = useState<{ credits: number; earningsThisMonth: number } | null>(null);
  const [profileFailed, setProfileFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOwnProfile()
      .then((p) => {
        if (!cancelled) setProfile({ credits: p.credits, earningsThisMonth: p.earningsThisMonth ?? 0 });
      })
      .catch(() => {
        if (!cancelled) setProfileFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [unread, setUnread] = useState(0);
  useEffect(() => {
    // /api/hub/dm/inbox is creator-only (CreatorAccountGuard) — a plain
    // user has no paid-questions inbox to badge a count against.
    if (!isCreator) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    fetchUnreadDmCount()
      .then((n) => {
        if (!cancelled) setUnread(n);
      })
      .catch(() => {
        /* badge just stays 0 — not worth a full error state for a count pill */
      });
    return () => {
      cancelled = true;
    };
  }, [isCreator]);

  const dashboardActive = pathname === "/creator";

  const servicesActive = pathname.startsWith('/services');

  return (
    <aside className="hidden w-[244px] shrink-0 flex-col gap-[6px] overflow-y-auto border-r border-hairline bg-page px-[14px] py-[22px] xl:flex xl:h-screen">
      <img src="/wawu-logo-white.png" alt="WAWU" className="mx-[10px] mb-5 mt-[2px] h-6 w-auto object-contain" />

      {BASE_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={navRowClass(active)}>
            <Icon
              name={item.icon}
              size={20}
              color={active ? "var(--accent)" : "var(--text-secondary)"}
              strokeWidth={active ? 2.4 : 2}
            />
            {item.label}
            {item.href === "/messages" && unread > 0 ? (
              <span className="ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-accent px-[6px] text-[11px] font-bold text-on-accent">
                {unread}
              </span>
            ) : null}
          </Link>
        );
      })}

      {/*
        Services is not one of the five locked bottom-bar slots, so on mobile
        it is reached through Explore. Desktop has the room, and leaving
        the services buried one level inside Explore was the
        reason nobody could find them.
      */}
      <Link href="/services" className={navRowClass(servicesActive)}>
        <Icon
          name="Briefcase"
          size={20}
          color={servicesActive ? "var(--accent)" : "var(--text-secondary)"}
          strokeWidth={servicesActive ? 2.4 : 2}
        />
        Services
      </Link>

      {isCreator ? (
        <>
          <div className="mt-4 h-px bg-hairline" />
          <Link
            href="/create"
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-button bg-accent text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
          >
            <Icon name="Plus" size={18} strokeWidth={2.2} color="currentColor" />
            Create
          </Link>
          <Link href="/creator" className={`${navRowClass(dashboardActive)} mt-[6px]`}>
            <Icon
              name="ChartNoAxesColumn"
              size={20}
              color={dashboardActive ? "var(--accent)" : "var(--text-secondary)"}
              strokeWidth={dashboardActive ? 2.4 : 2}
            />
            Dashboard
          </Link>
        </>
      ) : null}

      <div className="mt-auto flex flex-col gap-[10px] rounded-card border border-hairline bg-card p-4">
        {isCreator ? (
          <>
            <div className="flex items-center gap-[10px]">
              <TierBadge tier={gates.tier ?? "basic"} />
              <span className="flex-1 text-[12px] text-text-muted">
                {gates.slotsUsed} of {gates.slotsTotal} slots
              </span>
            </div>
            {profile ? (
              <StatBlock value={formatNaira(profile.earningsThisMonth)} label="Earned this month" align="start" size="sm" />
            ) : profileFailed ? (
              <span className="text-[12px] text-text-muted">Earnings unavailable</span>
            ) : (
              <Skeleton variant="row" className="h-9" />
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-[10px]">
              <Icon name="Ticket" size={16} color="var(--accent)" strokeWidth={2.2} />
              {profile ? (
                <span className="flex-1 text-[13.5px] font-semibold text-text-primary">{formatCredits(profile.credits)}</span>
              ) : profileFailed ? (
                <span className="flex-1 text-[13.5px] text-text-muted">Credits unavailable</span>
              ) : (
                <Skeleton variant="row" className="h-4 flex-1" />
              )}
            </div>
            <Button href="/communities?topup=1" size="sm" variant="secondary" full>
              Top up
            </Button>
            <span className="text-[12px] leading-[1.45] text-text-secondary">1 credit sends 1 community message</span>
          </>
        )}
      </div>

      {/*
        Signing out used to exist only at the bottom of Settings, which is two
        navigations deep. It is a thing people look for by eye, so it belongs
        somewhere permanently visible.
      */}
      <button
        type="button"
        onClick={signOut}
        className="mt-[10px] flex h-11 w-full items-center gap-3 rounded-[12px] px-[13px] text-[14px] font-medium text-text-secondary transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-text-primary"
      >
        <Icon name="LogOut" size={19} color="var(--text-secondary)" strokeWidth={2} />
        Sign out
      </button>
    </aside>
  );
}
