import type { ReactNode } from "react";
import Link from "next/link";

/**
 * The frame the public legal pages (/legal and /legal/<slug>) sit in.
 *
 * These pages are read by people with no account and by the app stores'
 * crawlers, so the frame assumes nothing: no session, no shell, no fetch. It
 * is a plain server component, so the document is already in the HTML that
 * comes back. Outside every route group, like /join, for the same reason.
 *
 * Dark only, like the rest of the website (owner, 12 Oct 2026). The logo
 * lives at the ROOT of public/ because production serves only root-level
 * static files (site mode).
 */
export function PublicLegalShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-page">
      <header className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 px-4 pt-5 xl:px-0 xl:pt-8">
        <Link href="/" aria-label="WAWU home" className="inline-flex">
          <img src="/wawu-logo-white.png" alt="WAWU" className="h-[22px] w-auto object-contain xl:h-[26px]" />
        </Link>
        <Link
          href="/legal"
          className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Legal
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-[18px] px-4 pb-20 pt-6 xl:px-0 xl:pb-24 xl:pt-10">
        {children}
      </main>
    </div>
  );
}
