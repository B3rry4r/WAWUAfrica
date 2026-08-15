"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AccountType } from "@/types/account";
import { Icon, type IconName } from "../ui/Icon";

interface Slot {
  href: string;
  label: string;
  icon: IconName;
}

const baseSlots: Slot[] = [
  { href: "/", label: "Home", icon: "House" },
  { href: "/communities", label: "Communities", icon: "Users" },
];

const tailSlots: Slot[] = [
  { href: "/messages", label: "Messages", icon: "MessageCircle" },
  { href: "/profile", label: "Profile", icon: "CircleUser" },
];

export interface BottomNavProps {
  accountType: AccountType;
}

export function BottomNav({ accountType }: BottomNavProps) {
  const pathname = usePathname();
  const createSlot: Slot = {
    href: accountType === "creator" ? "/create" : "/explore",
    label: accountType === "creator" ? "Create" : "Explore",
    icon: accountType === "creator" ? ("Plus" as IconName) : ("Compass" as IconName),
  };

  const slots = [...baseSlots.slice(0, 2), createSlot, ...tailSlots];

  return (
    <nav
      aria-label="Primary"
      className="fixed left-0 right-0 bottom-0 h-[78px] pb-[12px] pt-[10px] flex items-center bg-[rgba(19,19,22,.86)] backdrop-blur-[20px] border-t border-t-[var(--border-hairline)] max-w-[var(--mobile-column)] m-0 z-[40]" style={{WebkitBackdropFilter: "blur(20px)"}}
    >
      {slots.map((slot) => {
        const active = slot.href === "/" ? pathname === "/" : pathname.startsWith(slot.href);
        const accent = active && slot.label !== "Create";

        return (
          <Link
            key={slot.href}
            href={slot.href}
            className="flex-1 flex flex-col items-center gap-[5px] text-[10.5px] font-semibold no-underline" style={{color: accent ? "var(--accent)" : "var(--text-muted)"}}
          >
            {slot.label === "Create" ? (
              <span
                className="grid place-items-center w-[34px] h-[26px] rounded-[9]" style={{background: accent ? "var(--accent)" : "var(--surface-tag)"}}
              >
                <Icon name="Plus" size={18} stroke={2.6} color="#fff" />
              </span>
            ) : (
              <Icon name={slot.icon} size={22} stroke={accent ? 2.4 : 1.8} />
            )}
            {slot.label}
          </Link>
        );
      })}
    </nav>
  );
}
