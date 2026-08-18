"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { getNotifications } from "@/lib/api/notifications";
import { useSession } from "@/lib/auth/session-provider";

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
  const { accountType } = useSession();
  if (hasOwnHeader(pathname)) return null;

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-[11px] border-b border-hairline bg-[rgba(19,19,22,0.86)] px-4 pt-4 pb-3 backdrop-blur xl:hidden"
      style={{ backdropFilter: "var(--blur-chrome)" }}
    >
      <img src="/wawu-icon-white.png" alt="WAWU" className="h-[26px] w-[26px] object-contain" />
      <Link
        href="/search"
        className="flex h-[36px] flex-1 items-center gap-2 rounded-full border border-hairline bg-input px-3 text-[13.5px] text-text-muted"
      >
        <Icon name="Search" size={15} color="var(--text-muted)" />
        Search creators and content
      </Link>
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-full border border-hairline bg-input text-text-secondary"
      >
        <Icon name="Bell" size={17} />
        {unreadCount > 0 ? <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full bg-accent" aria-hidden="true" /> : null}
      </Link>
      {accountType === "creator" ? (
        <Link
          href="/explore"
          aria-label="Browse"
          className="grid h-9 w-9 place-items-center rounded-full border border-accent bg-accent-tint text-accent"
        >
          <Icon name="LayoutGrid" size={17} strokeWidth={2.2} />
        </Link>
      ) : null}
    </header>
  );
}