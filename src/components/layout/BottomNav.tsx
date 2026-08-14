"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useIsCreator } from "@/lib/auth/session";

/**
 * Locked navigation — five slots. Slot 3 swaps by account type:
 *   user    → Explore
 *   creator → Create
 * Search and notifications live in the header, not here.
 */
type Slot = { label: string; href: string };

const SLOT_1_2: Slot[] = [
  { label: "Home", href: "/home" },
  { label: "Communities", href: "/communities" },
];
const SLOT_4_5: Slot[] = [
  { label: "Messages", href: "/messages" },
  { label: "Profile", href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isCreator = useIsCreator();

  const middle: Slot = isCreator
    ? { label: "Create", href: "/create" }
    : { label: "Explore", href: "/explore" };

  const slots = [...SLOT_1_2, middle, ...SLOT_4_5];

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[var(--mobile-column)] items-stretch",
        "border-t border-[var(--border-hairline)] bg-[var(--surface-card)]/95",
        "backdrop-blur-[var(--blur-chrome)]"
      )}
    >
      {slots.map((slot) => {
        const active = pathname.startsWith(slot.href);
        return (
          <Link
            key={slot.href}
            href={slot.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[var(--tap-min)] flex-1 flex-col items-center justify-center gap-1 py-2",
              "text-[11px] font-medium transition-colors duration-[var(--dur-fast)]",
              active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
            )}
          >
            {slot.label}
          </Link>
        );
      })}
    </nav>
  );
}
