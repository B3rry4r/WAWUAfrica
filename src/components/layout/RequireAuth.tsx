"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      // Carry where they were trying to go. Without this, following a link to
      // a service and signing in dropped you on the home feed with no sign of
      // what you had asked for.
      const query = search.toString();
      const target = `${pathname}${query ? `?${query}` : ""}`;
      const next = target && target !== "/" ? `?next=${encodeURIComponent(target)}` : "";
      router.replace(`/sign-in${next}`);
    }
  }, [hydrated, isAuthenticated, router, pathname, search]);

  if (!hydrated || !isAuthenticated) return null;
  return <>{children}</>;
}
