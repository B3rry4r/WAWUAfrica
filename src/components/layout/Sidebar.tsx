"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";
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
 * The same 5 slots as BottomNav, same order, same for every account type —
 * design D1 · Shell draws an identical 5-row base for both. Creators get an
 * ADDITIONAL Create button + Dashboard row below a divider (see below).
 *
 * Mobile used to differ, swapping slot 3 from Explore to Create for creators,
 * which cost a creator their way into Explore entirely. That is gone: mobile
 * now keeps Explore for everyone too and floats Create as a FAB, so the two
 * shells finally agree. Do not reintroduce a per-account-type slot swap in
 * either place.
 */
const BASE_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: "House" },
  { href: "/communities", label: "Communities", icon: "Users" },
  { href: "/explore", label: "Explore", icon: "Compass" },
  { href: "/messages", label: "Messages", icon: "MessageCircle" },
  { href: "/settings", label: "Settings", icon: "Settings" },
];

function navRowClass(active: boolean) {
  return [
    "flex h-[46px] items-center gap-[13px] rounded-2xl border px-[14px] text-[14.5px] transition-colors",
    active
      ? "border-selected bg-selected-tint font-semibold text-text-primary"
      : "border-transparent font-medium text-text-secondary hover:bg-state-hover active:bg-state-press",
  ].join(" ");
}

/**
 * Desktop left rail (design D1 · Shell, 244px, xl breakpoint). Ports
 * BottomNav's route/active-state/account-type logic to a persistent sidebar
 * instead of a 5-slot bottom bar. Hidden below xl — AppShell keeps BottomNav
 * there unchanged.
 */
export function Sidebar() {
  const pathname = usePathname();
  // Live creator state, not the session's sign-in-time accountType: that value
  // is never revisited, so a creator who subscribed after signing in used to
  // get a rail with no Create button and no Dashboard row at all.
  const { creator, resolved } = useCreatorState();
  const gates = creatorGates({ creator });
  const isCreator = gates.isCreator;

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

  const eventsActive = pathname.startsWith('/events');

  const professionalsActive = pathname.startsWith('/professionals');

  return (
    <aside className="hidden w-[244px] shrink-0 flex-col gap-[6px] overflow-y-auto border-r border-hairline bg-page px-[14px] py-[22px] xl:flex xl:h-screen">
      <img src="/wawu-logo-white.png" alt="WAWU" className="mx-[10px] mb-5 mt-[2px] h-6 w-auto object-contain" />

      {BASE_ITEMS.map((item) => {
        const active =
          item.href === "/home" ? pathname === item.href : pathname.startsWith(item.href);
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

      {/*
        Same reasoning as Services: not a bottom-bar slot, so mobile reaches
        events through Explore. The rail has the room, and a host who is about
        to publish an event should not have to go via Explore to find theirs.
      */}
      <Link href="/events" className={navRowClass(eventsActive)}>
        <Icon
          name="CalendarDays"
          size={20}
          color={eventsActive ? "var(--accent)" : "var(--text-secondary)"}
          strokeWidth={eventsActive ? 2.4 : 2}
        />
        Events
      </Link>

      {/*
        Also not a bottom-bar slot, so mobile reaches it through Explore and
        Services. Someone looking for a lawyer should not have to know that
        WAWU calls them "creators".
      */}
      <Link href="/professionals" className={navRowClass(professionalsActive)}>
        <Icon
          name="BriefcaseBusiness"
          size={20}
          color={professionalsActive ? "var(--accent)" : "var(--text-secondary)"}
          strokeWidth={professionalsActive ? 2.4 : 2}
        />
        Professionals
      </Link>

      {!resolved ? (
        // Do NOT fall back to the fan rail while the answer is in flight — a
        // creator would watch Create/Dashboard pop in a beat after first paint.
        <>
          <div className="mt-4 h-px bg-hairline" />
          <Skeleton variant="row" className="mt-4 h-12 rounded-button" />
          <Skeleton variant="row" className="mt-[6px] h-[46px]" />
        </>
      ) : isCreator ? (
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
        {!resolved ? (
          <>
            <Skeleton variant="row" className="h-5" />
            <Skeleton variant="row" className="h-9" />
          </>
        ) : isCreator ? (
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
        No Sign out here. It lives in Settings, once — Settings is a top-level
        row in this very rail (and the desktop Settings list has a dedicated
        Sign out row), so the old "it's two navigations deep" argument for
        duplicating it is gone, and design D1 · Shell never drew one.
      */}
    </aside>
  );
}
