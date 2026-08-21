"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { getNotifications } from "@/lib/api/notifications";
import { useSession } from "@/lib/auth/session-provider";
import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";

/**
 * Route prefixes that render their own local back/title header and must not
 * get the global one stacked on top. A route "owns" its header if it matches
 * exactly or falls under one of these prefixes (e.g. "/services" also covers
 * "/services/cac", "/services/mentors/[id]", etc). Add new screens here as
 * they grow their own header instead of hardcoding exact paths.
 */
const OWN_HEADER_ROUTES = [
  "/search",
  "/notifications",
  "/content",
  "/purchases",
  "/services",
  "/subscription",
  "/create/new",
  "/messages",
  "/settings",
  "/marketplace",
  "/creator",
];

/** Exported so DesktopHeader can hide on the same routes at xl width. */
export function hasOwnHeader(pathname: string) {
  return OWN_HEADER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * App chrome — search pill and notifications bell live on every authenticated
 * screen (CLAUDE.md). Renders nothing on routes that supply their own header.
 * Hidden at the xl breakpoint, where AppShell swaps in DesktopHeader instead.
 * The translucent blurred backdrop is the header's one treatment in every
 * design frame that shows it (Home Feed, Nav IA Board, Nav Locked, User vs
 * Creator, and DesktopHeader's own xl equivalent) — there is no bare/flat
 * variant in the designs, so it is not a per-route opt-in.
 */
export function AppHeader() {
  // The unread dot used to be unconditional, so every user always
  // appeared to have unread notifications.
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((res) => {
        if (!cancelled) setUnreadCount(res.unreadCount);
      })
      .catch(() => {
        /* no badge rather than a wrong one */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pathname = usePathname();
  const { user } = useSession();
  // Live creator state rather than the session's frozen accountType — see
  // creatorGates(). The Browse shortcut only exists on the creator side of
  // this header, so it waits for a real answer instead of guessing.
  const { creator, resolved } = useCreatorState();
  const isCreator = creatorGates({ creator }).isCreator;
  if (hasOwnHeader(pathname)) return null;

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-[11px] border-b border-hairline bg-[rgba(19,19,22,0.86)] px-4 pt-4 pb-3 backdrop-blur xl:hidden"
      style={{ backdropFilter: "var(--blur-chrome)" }}
    >
      <img src="/wawu-icon-white.png" alt="WAWU" className="h-[26px] w-[26px] object-contain" />
      <Link
        href="/search"
        className="flex h-[36px] flex-1 items-center gap-2 rounded-full border border-hairline bg-input px-3 text-[13.5px] text-text-muted hover:border-strong hover:bg-surface-hover active:bg-surface-press"
      >
        <Icon name="Search" size={15} color="var(--text-muted)" />
        Search creators and content
      </Link>
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-full border border-hairline bg-input text-text-secondary hover:border-strong hover:bg-surface-hover active:bg-surface-press"
      >
        <Icon name="Bell" size={17} />
        {unreadCount > 0 ? <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full bg-accent" aria-hidden="true" /> : null}
      </Link>
      {/* Desktop already has an avatar to the profile; mobile had none. */}
      <Link
        href="/profile"
        aria-label="Your profile"
        className="shrink-0 rounded-full hover:bg-state-hover active:bg-state-press"
      >
        <Avatar initial={(user?.fullName ?? "?").charAt(0)} size={34} />
      </Link>
      {!resolved ? (
        <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
      ) : isCreator ? (
        <Link
          href="/explore"
          aria-label="Browse"
          className="grid h-9 w-9 place-items-center rounded-full border border-decor bg-decor-tint text-accent hover:border-strong hover:bg-surface-hover active:bg-surface-press"
        >
          <Icon name="LayoutGrid" size={17} strokeWidth={2.2} />
        </Link>
      ) : null}
    </header>
  );
}