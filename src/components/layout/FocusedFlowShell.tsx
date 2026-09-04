"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "@/lib/auth/session-provider";
import { Sidebar } from "./Sidebar";
import { DesktopHeader } from "./DesktopHeader";
import { RequireAuth } from "./RequireAuth";
import { RequirePaidCreator } from "./RequirePaidCreator";

interface FocusedFlowShellProps {
  children: ReactNode;
}

/**
 * Chrome for the four "focused flow" routes that sit outside `(app)` on
 * purpose — /kyc, /onboarding, /create/new, /subscription. These are
 * single-purpose screens with their own local back-button navigation, so at
 * mobile widths they render exactly as before: full-bleed, no BottomNav, no
 * global AppHeader. Below `xl` this component renders nothing but its
 * children — do not add any mobile-only markup here.
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
 * and /content use today, and /subscription now uses it too (see
 * SubscriptionManagement's local header comment).
 *
 * Sidebar and DesktopHeader both read useSession(), which throws outside a
 * SessionProvider — these 4 routes aren't nested under `(app)`'s AppShell
 * (which supplies its own), so this wrapper provides one directly, same as
 * AppShell does.
 */
/**
 * /onboarding is the paywall, so it gets NO chrome at any width. The desktop
 * Sidebar and header were rendering around it, which handed an unpaid creator
 * a full navigation rail out of the one screen they are meant to complete -
 * the plan screen was decoration, not a gate (product owner, 4 Sep 2026).
 *
 * The other focused routes keep the desktop chrome: /kyc and /subscription
 * both belong to someone who has already paid, and stranding them on a
 * single screen with only a back button is the gap this shell was added to
 * close in the first place.
 */
const BARE_ROUTES = ["/onboarding"];

export function FocusedFlowShell({ children }: FocusedFlowShellProps) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (bare) {
    return (
      <SessionProvider>
        <RequireAuth>{children}</RequireAuth>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <div className="w-full xl:flex xl:h-screen xl:overflow-hidden">
        <Sidebar />
        <div className="w-full xl:min-w-0 xl:flex-1 xl:flex xl:h-screen xl:flex-col xl:overflow-hidden">
          <DesktopHeader />
          <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            <RequireAuth>
              <RequirePaidCreator>{children}</RequirePaidCreator>
            </RequireAuth>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
