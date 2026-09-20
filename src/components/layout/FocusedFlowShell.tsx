"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/session-provider";
import { Sidebar } from "./Sidebar";
import { DesktopHeader } from "./DesktopHeader";
import { RequireAuth } from "./RequireAuth";

interface FocusedFlowShellProps {
  children: ReactNode;
}

/**
 * Chrome for the "focused flow" routes that sit outside `(app)` on purpose —
 * /kyc, /onboarding, /create/new. These are single-purpose screens with their
 * own local back-button navigation, so at mobile widths they render exactly as
 * before: full-bleed, no BottomNav, no global AppHeader. Below `xl` this
 * component renders nothing but its children — do not add any mobile-only
 * markup here.
 *
 * At `xl` (1280px) and up they were falling through with NO chrome at all —
 * unlike every route under `(app)`, a user here had no persistent Sidebar
 * and no way to navigate away except a local back button. This wrapper
 * closes that gap by reusing AppShell's exact desktop half (Sidebar +
 * DesktopHeader, unmodified) without pulling in AppShell's mobile half
 * (AppHeader + BottomNav), which these routes must never get.
 *
 * DesktopHeader already hides itself on routes that render their own local
 * header (see AppHeader.hasOwnHeader) — that's the same mechanism /services
 * and /content use today.
 *
 * Sidebar and DesktopHeader both read useSession(), which throws outside a
 * SessionProvider — these routes aren't nested under `(app)`'s AppShell
 * (which supplies its own), so this wrapper provides one directly, same as
 * AppShell does.
 *
 * There is no bare/chromeless branch any more. /onboarding used to be the
 * paywall and was deliberately stripped of the desktop rail so an unpaid
 * creator could not navigate out of it. There is no payment in this flow at
 * all any more: becoming a creator costs nothing and backing out of it is
 * allowed, so the rail stays and the screen is an ordinary one.
 */
export function FocusedFlowShell({ children }: FocusedFlowShellProps) {
  return (
    <SessionProvider>
      <div className="w-full xl:flex xl:h-screen xl:overflow-hidden">
        <Sidebar />
        <div className="w-full xl:min-w-0 xl:flex-1 xl:flex xl:h-screen xl:flex-col xl:overflow-hidden">
          <DesktopHeader />
          <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            <RequireAuth>{children}</RequireAuth>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
