"use client";
import Link from "next/link";

/** Search and notifications live here on every authenticated screen. */
export function AppHeader({ title }: { title?: string }) {
  return (
    <header
      className={
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border-hairline)] " +
        "bg-[var(--surface-page)]/95 px-[var(--gutter)] backdrop-blur-[var(--blur-chrome)]"
      }
    >
      {title ? (
        <h1 className="flex-1 truncate text-[17px] font-semibold text-[var(--text-primary)]">
          {title}
        </h1>
      ) : (
        <span className="flex-1" />
      )}
      <Link href="/search" aria-label="Search" className="text-[var(--text-secondary)]">
        Search
      </Link>
      <Link href="/notifications" aria-label="Notifications" className="text-[var(--text-secondary)]">
        Alerts
      </Link>
    </header>
  );
}
