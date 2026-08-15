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
  const isCreate = pathname.startsWith(createSlot.href);

  const slots = [...baseSlots.slice(0, 2), createSlot, ...tailSlots];

  return (
    <nav
      aria-label="Primary"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: 78,
        paddingBottom: 12,
        paddingTop: 10,
        display: "flex",
        alignItems: "center",
        background: "rgba(19,19,22,.86)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-hairline)",
        maxWidth: "var(--mobile-column)",
        margin: "0 auto",
        zIndex: 40,
      }}
    >
      {slots.map((slot) => {
        const active =
          slot.href === "/" ? pathname === "/" : pathname.startsWith(slot.href) || isCreate;
        const accent = active && slot.label !== "Create";

        return (
          <Link
            key={slot.href}
            href={slot.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              color: accent ? "var(--accent)" : "var(--text-muted)",
              fontSize: 10.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {slot.label === "Create" ? (
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 34,
                  height: 26,
                  borderRadius: 9,
                  background: accent ? "var(--accent)" : "var(--surface-tag)",
                }}
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
