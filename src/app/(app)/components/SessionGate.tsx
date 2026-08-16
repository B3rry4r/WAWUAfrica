"use client";

import type { ReactNode } from "react";
import { useSession } from "@/lib/auth/session-provider";
import { AppShell } from "@/components/layout/AppShell";
import { HomeFeed } from "./HomeFeed";

/**
 * Client gate at `/`. Renders the server-rendered landing (children) when
 * signed out and swaps in the authenticated home feed when signed in.
 * The session store is in-memory, so the server always renders the landing
 * first (SEO) and only client-side state decides whether to swap to the feed.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();
  if (!isAuthenticated) return <>{children}</>;
  return (
    <AppShell>
      <HomeFeed />
    </AppShell>
  );
}