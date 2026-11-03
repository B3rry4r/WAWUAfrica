"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SessionProvider, useSession } from "@/lib/auth/session-provider";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { AuthBrandProvider } from "@/app/(auth)/components/AuthBrand";
import { SiteLogo } from "@/app/(site)/_components/SiteLogo";
import { JOIN_PATH } from "@/lib/site-upload/rules";
import { UploadAccessProvider, useUploadAccess } from "./UploadAccess";

/**
 * The trimmed shell of the join-only upload pages (WEB-UPLOAD, R-126).
 *
 * The full site's shell (AppShell, FocusedFlowShell) links to the wallet, explore, messages and the rest,
 * and every one of those lands on /join in this mode: a button that does nothing (R-47). This shell links to
 * the five open pages only: Upload, My uploads, sign out, and /join for a person with no tier. The logo is
 * the smiling-W mark of the brand site, as a picture and not a link, so one mis-tap cannot drop a person
 * out of a half-finished upload (the same rule as the /join frame).
 */
export function SiteUploadRoot({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

function Brand() {
  return (
    <span className="inline-flex items-center">
      <SiteLogo priority className="w-[112px] sm:w-[126px]" />
    </span>
  );
}

/** The signed-out pages: sign in, sign up, forgot password. A logo and one centred column. */
export function SiteAuthFrame({ children }: { children: ReactNode }) {
  return (
    <AuthBrandProvider>
      <div className="relative min-h-[100dvh] overflow-x-clip bg-page">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(ellipse_55%_45%_at_50%_0%,var(--accent-tint-strong),transparent_70%)]"
          aria-hidden="true"
        />
        <header className="relative z-10 mx-auto flex w-full max-w-[480px] items-center px-4 pt-6 dt:pt-9">
          <Brand />
        </header>
        <main className="relative z-10 mx-auto w-full max-w-[480px] px-4 pb-16 pt-6 [&_.min-h-screen]:!min-h-0 [&_a[href='/']]:!hidden dt:pt-10">
          {children}
        </main>
      </div>
    </AuthBrandProvider>
  );
}

function NavTab({ href, label, current }: { href: string; label: string; current: boolean }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`inline-flex h-[40px] flex-1 items-center justify-center rounded-full px-5 text-[14px] font-semibold transition-colors sm:flex-none ${
        current
          ? "bg-accent text-on-accent"
          : "border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
      }`}
    >
      {label}
    </Link>
  );
}

function SignedInHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut, user } = useSession();
  const { access } = useUploadAccess();
  const noTier = access.phase === "ready" && access.state === "no-tier";
  const first = (user?.fullName ?? "").trim().split(/\s+/)[0] ?? "";
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-page">
      <div className="mx-auto flex h-[64px] w-full max-w-[880px] items-center justify-between gap-3 px-4">
        <Brand />
        <div className="flex items-center gap-1">
          {noTier ? (
            <Link href={JOIN_PATH} className="rounded-full px-3 py-2 text-[13.5px] font-semibold text-accent hover:text-text-primary">
              Get a tier
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/sign-in");
            }}
            className="rounded-full px-3 py-2 text-[13.5px] font-semibold text-text-secondary hover:text-text-primary"
            aria-label={first ? `Sign out ${first}` : "Sign out"}
          >
            Sign out
          </button>
        </div>
      </div>
      <nav aria-label="Upload" className="mx-auto flex w-full max-w-[880px] gap-2 px-4 pb-3">
        <NavTab href="/create/new" label="Upload" current={pathname === "/create/new"} />
        <NavTab href="/create/library" label="My uploads" current={pathname === "/create/library"} />
      </nav>
    </header>
  );
}

/** The signed-in pages: Upload and My uploads. Signed-out visitors are sent to sign in and brought back. */
export function SiteWorkFrame({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <UploadAccessProvider>
        <div className="min-h-[100dvh] bg-page">
          <SignedInHeader />
          <main className="mx-auto w-full max-w-[880px] px-4 pb-20 pt-5 dt:pt-8">{children}</main>
        </div>
      </UploadAccessProvider>
    </RequireAuth>
  );
}
