"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

interface AppHeaderProps {
  /** Sticky header with a backdrop, used on the home feed. */
  elevated?: boolean;
}

/**
 * App chrome — search pill and notifications bell live on every authenticated
 * screen (CLAUDE.md). Renders nothing on routes that supply their own header.
 */
export function AppHeader({ elevated = false }: AppHeaderProps) {
  const pathname = usePathname();
  if (pathname === "/search" || pathname === "/notifications") return null;

  return (
    <header
      className={`sticky top-0 z-30 flex items-center gap-[11px] px-4 py-4 ${
        elevated ? "bg-[rgba(19,19,22,0.86)] backdrop-blur" : "border-b border-hairline"
      }`}
      style={elevated ? { backdropFilter: "var(--blur-chrome)" } : undefined}
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
        <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full bg-accent" aria-hidden="true" />
      </Link>
      <button
        type="button"
        aria-label="Browse"
        className="grid h-9 w-9 place-items-center rounded-full border border-accent bg-accent-tint text-accent"
      >
        <Icon name="LayoutGrid" size={17} strokeWidth={2.2} />
      </button>
    </header>
  );
}