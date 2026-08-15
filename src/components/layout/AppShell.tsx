"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/session-provider";
import { BottomNav } from "./BottomNav";
import { AppHeader } from "./AppHeader";

interface AppShellProps {
  children: ReactNode;
  /** Show the app header (search pill + bell). Defaults to true. */
  header?: boolean;
  /** Backdrop-blur sticky header, used on the home feed. */
  elevatedHeader?: boolean;
}

/** Authenticated app chrome — session context, header, content column, bottom nav. */
export function AppShell({ children, header = true, elevatedHeader = false }: AppShellProps) {
  return (
    <SessionProvider>
      <div className="mx-auto min-h-screen w-full max-w-[430px] border-x border-hairline bg-surface-page">
        {header ? <AppHeader elevated={elevatedHeader} /> : null}
        <main className="pb-[96px]">{children}</main>
      </div>
      <BottomNav />
    </SessionProvider>
  );
}