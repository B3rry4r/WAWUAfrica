"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session-provider";

/**
 * Client-side route gate for every screen under AppShell/FocusedFlowShell.
 *
 * There was no auth gating anywhere in this app before this: a signed-out
 * visitor could load any authenticated URL directly and see whatever the
 * page rendered against a null session (usually a broken or silently-mocked
 * screen, not a redirect) -- found by direct testing, not a hypothetical.
 *
 * Waits for SessionProvider's `hydrated` flag before deciding anything, so
 * this never redirects during the brief window before localStorage has been
 * read (which would incorrectly bounce an actually-signed-in user).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/sign-in");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;
  return <>{children}</>;
}
