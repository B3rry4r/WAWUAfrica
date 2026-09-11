"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/session-provider";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { getNotifications } from "@/lib/api/notifications";
import { Avatar } from "@/components/ui/Avatar";
import { hasOwnHeader } from "./AppHeader";

/**
 * Desktop header (design D1 · Shell, 68px, sticky, xl breakpoint). Search
 * pill and notification bell mirror AppHeader's mobile chrome; the
 * account-switcher chip is new — there's no mobile equivalent, and since the
 * mock session only ever holds one account, it's a link to /profile rather
 * than a real switcher. Hidden below xl, where AppHeader renders instead.
 *
 * Hides on the same routes AppHeader hides on (search, notifications,
 * content detail, purchases, services) so a route that renders its own local
 * header doesn't get a second one stacked above it at desktop width either —
 * those routes' own headers aren't re-laid-out for desktop in this task.
 */
export function DesktopHeader() {
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
  if (hasOwnHeader(pathname)) return null;

  const firstName = user?.fullName?.split(" ")[0] || "Account";

  return (
    <header
      className="sticky top-0 z-30 hidden h-[68px] shrink-0 items-center gap-4 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur xl:flex"
      style={{ backdropFilter: "var(--blur-chrome)" }}
    >
      <Link
        href="/search"
        className="flex h-10 w-[420px] items-center gap-[10px] rounded-full border border-hairline bg-input px-[14px] text-[14px] text-text-muted hover:border-strong hover:bg-surface-hover active:bg-surface-press"
      >
        <Icon name="Search" size={16} color="var(--text-muted)" />
        Search content, creators, communities
      </Link>
      <span className="flex-1" />
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-hairline bg-input text-text-secondary hover:border-strong hover:bg-surface-hover active:bg-surface-press"
      >
        <Icon name="Bell" size={18} />
        {unreadCount > 0 ? <span className="absolute right-[9px] top-2 h-[7px] w-[7px] rounded-full bg-accent" aria-hidden="true" /> : null}
      </Link>
      <Link
        href="/profile"
        aria-label="Account"
        className="flex h-10 items-center gap-[10px] rounded-full border border-hairline bg-input py-0 pl-[4px] pr-[6px] hover:border-strong hover:bg-surface-hover active:bg-surface-press"
      >
        <Avatar src={user?.avatarUrl} initial={firstName.charAt(0)} size={32} />
        <span className="text-[13.5px] font-semibold text-text-primary">{firstName}</span>
        <Icon name="ChevronDown" size={15} color="var(--text-muted)" strokeWidth={2.2} />
      </Link>
    </header>
  );
}
