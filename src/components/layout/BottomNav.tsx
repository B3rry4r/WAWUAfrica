"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import type { IconName } from "@/components/ui/Icon";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

/**
 * Locked 5-slot bottom bar (CLAUDE.md). Slot 3 swaps by account type:
 * user → Explore, creator → Create. Destinations owned by Dev B/C are wired
 * but not built here.
 */
export function BottomNav() {
  // Live creator state, not the session's sign-in-time accountType — that is
  // written once and never revisited, so a creator who subscribed later got a
  // bar that sent them to Explore instead of Create for the rest of the
  // session. Slot 3 holds a skeleton until the answer lands rather than
  // guessing "user" and swapping the tab out from under a tapping thumb.
  const { creator, resolved } = useCreatorState();
  const isCreator = creatorGates({ creator }).isCreator;
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/home", label: "Home", icon: "Home" },
    { href: "/communities", label: "Communities", icon: "Users" },
    isCreator
      ? { href: "/create", label: "Create", icon: "PlusCircle" }
      : { href: "/explore", label: "Explore", icon: "Compass" },
    { href: "/messages", label: "Messages", icon: "MessageCircle" },
    // Slot 5 was Profile. Profile now lives inside Settings and on the
    // header avatar; Settings is the destination people actually navigate to.
    { href: "/settings", label: "Settings", icon: "Settings" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[78px] w-full max-w-[430px] items-center border-t border-hairline bg-[rgba(19,19,22,0.86)] pb-[12px] [backdrop-filter:var(--blur-chrome)]"
    >
      {items.map((item, slot) => {
        if (slot === 2 && !resolved) {
          return (
            <div key="slot-3" className="flex flex-1 flex-col items-center gap-[5px]" aria-hidden="true">
              <Skeleton variant="circle" className="h-[22px] w-[22px]" />
              <Skeleton className="h-[10.5px] w-[46px] rounded" />
            </div>
          );
        }
        // Exact match alone unlit the tab as soon as you opened anything
        // inside it, e.g. /settings/notifications. Home stays exact so it does
        // not swallow every route.
        const active =
          item.href === "/home" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-[5px] text-[10.5px] font-semibold transition-colors ${
              active ? "text-accent" : "text-text-muted"
            }`}
          >
            <Icon name={item.icon} size={22} strokeWidth={active ? 2.4 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}