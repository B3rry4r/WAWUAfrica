"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { SessionProvider } from "@/lib/auth/session-provider";
import { preloadFlutterwaveCheckout } from "@/lib/flutterwave";
import { BottomNav } from "./BottomNav";
import { CreateFab } from "./CreateFab";
import { SoundToggle } from "./SoundToggle";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";
import { DesktopHeader } from "./DesktopHeader";
import { RequireAuth } from "./RequireAuth";

interface AppShellProps {
  children: ReactNode;
  /** Show the app header (search pill + bell). Defaults to true. */
  header?: boolean;
}

/**
 * Authenticated app chrome — session context, header, content column, and
 * navigation.
 *
 * Below the `xl` breakpoint (1280px) this renders exactly as it always has:
 * the 430px mobile column with AppHeader on top and BottomNav fixed to the
 * bottom. Nothing here changes mobile's markup or classes — every mobile
 * class below is the same one that shipped before desktop existed; `xl:`
 * classes are additive, never a replacement.
 *
 * At `xl` and up (design D1 · Shell) the mobile column is replaced by a
 * persistent left Sidebar + a right column carrying a sticky DesktopHeader
 * and the routed content — BottomNav and the mobile AppHeader disappear.
 * Since one route serves one component tree at every width, this is the only
 * place that decision gets made; no per-route changes are needed for a
 * screen to pick up the desktop shell.
 *
 * AMBIGUITY RESOLVED: 4 of the 17 desktop frames (D9 Subscription, D11
 * Product detail, D12 Learn, D13 Services) are drawn without a sidebar in
 * the design file — just a header. Treated as a drawing omission, not a
 * distinct "focused" layout: every (app) route gets the persistent
 * Sidebar + DesktopHeader here, unconditionally, the same way mobile's
 * AppShell already puts BottomNav on every app route. Rationale:
 *   1. No caption or framing in the design doc calls those four out as
 *      intentionally chromeless — contrast with frames that DO carry an
 *      explicit note (D1's own captions call out its nav differences).
 *   2. All four still render a local back-arrow + title row at the top,
 *      the same "owns its own header" pattern mobile already uses for
 *      sub-screens (see AppHeader's hasOwnHeader) — that's a sub-screen
 *      convention, not evidence of a deliberately sidebar-less desktop mode.
 *   3. Their body content (two-column card grids, list rows) is exactly as
 *      wide/heavy as every sidebar-having frame — nothing about the content
 *      density suggests it was composed for the extra ~244px a missing
 *      sidebar would free up.
 *   4. D1's own caption text says "slot 3 swaps" while its markup shows it
 *      does not — this doc's captions are demonstrably not fully reliable,
 *      so their *absence* on D9/D11/D12/D13 is weak evidence on its own.
 * A persistent shell is also the simpler, more consistent default for a
 * swarm of later screen-level tasks to build against. If a later screen
 * genuinely needs a sidebar-less focused layout, that's a per-route decision
 * for that screen's task, not a shell-level exception.
 */
export function AppShell({ children, header = true }: AppShellProps) {
  // Warm Flutterwave's script so tapping Pay opens the modal immediately
  // instead of sitting on a dead button while a cross-origin script loads.
  useEffect(() => preloadFlutterwaveCheckout(), []);
  return (
    <SessionProvider>
      <div className="w-full xl:flex xl:h-screen xl:overflow-hidden">
        <Sidebar />
        <div className="mx-auto min-h-screen w-full max-w-[430px] border-x border-hairline bg-page xl:mx-0 xl:flex xl:h-screen xl:max-w-none xl:min-w-0 xl:flex-1 xl:flex-col xl:overflow-hidden xl:border-0">
          {header ? (
            <>
              <AppHeader />
              <DesktopHeader />
            </>
          ) : null}
          <main className="pb-[96px] xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-0">
            <RequireAuth>{children}</RequireAuth>
          </main>
        </div>
      </div>
      <div className="xl:hidden">
        {/* Create is a floating action button, not a nav slot — it hides itself
            for non-creators and on screens that already own the bottom edge. */}
        <CreateFab />
        <BottomNav />
      </div>
      {/*
        OUTSIDE the xl:hidden block. Create and the bottom bar are mobile-only,
        but the music is not: putting the toggle in there made it invisible on
        desktop, where the shell has no bottom bar and the button has a corner
        to itself. It positions itself for both.

        In the shell rather than on a page, so the track survives every in-app
        navigation instead of restarting on each route change.
      */}
      <SoundToggle aboveBottomBar />
    </SessionProvider>
  );
}
