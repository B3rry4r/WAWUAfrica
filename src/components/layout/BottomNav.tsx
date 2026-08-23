"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

/**
 * The 5-slot bottom bar. Every slot is the SAME for everyone.
 *
 * Slot 3 used to swap by account type — Explore for users, Create for
 * creators. On the product owner's instruction Explore now stays for everyone
 * and Create moved to a floating action button (see CreateFab), so a creator
 * no longer loses their way into Explore to gain a Create tab. That also
 * removes the skeleton this slot used to hold while creator state resolved:
 * nothing here depends on the answer any more, so nothing has to wait for it.
 */
export function BottomNav() {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/home", label: "Home", icon: "Home" },
    { href: "/communities", label: "Communities", icon: "Users" },
    { href: "/explore", label: "Explore", icon: "Compass" },
    { href: "/messages", label: "Messages", icon: "MessageCircle" },
    // Slot 5 was Profile. Profile now lives inside Settings and on the
    // header avatar; Settings is the destination people actually navigate to.
    { href: "/settings", label: "Settings", icon: "Settings" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[78px] w-full max-w-[430px] items-center border-t border-hairline bg-[rgba(19,19,22,0.86)] pb-[12px] [backdrop-filter:var(--blur-chrome)]"
    >
      {items.map((item) => {
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
              // Hover lives on the UNSELECTED branch only. The current tab is
              // accent and must stay unmistakably accent while the pointer is
              // over it; lighting an inactive tab to accent on hover would
              // make it impersonate the current one, so it brightens to
              // text-primary (neutral) instead.
              active ? "text-accent" : "text-text-muted hover:text-text-primary"
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