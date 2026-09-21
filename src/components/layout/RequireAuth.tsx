"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isPublicPath } from "@/lib/auth/public-routes";
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
/**
 * Documents anyone may read without an account.
 *
 * The sign-up form asks you to agree to the terms and the privacy policy, and
 * links to them - but both live under (app), so following either link while
 * signed out bounced you to sign-in. You could not read what you were being
 * asked to agree to until after you had agreed to it.
 *
 * Deliberately narrow: /privacy/policy is the public document, while /privacy
 * itself and /privacy/blocked are that account's own settings and stay gated.
 *
 * The list itself now lives in lib/auth/public-routes.ts, because allowing a
 * route takes agreement here, in AppShell and in the API client's 401
 * handler. Two of the three used to hold their own copy of it.
 */

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (isPublic) return;
    if (hydrated && !isAuthenticated) {
      // Carry where they were trying to go. Without this, following a link to
      // a service and signing in dropped you on the home feed with no sign of
      // what you had asked for.
      //
      // Read from `window` rather than useSearchParams(): that hook opts the
      // whole tree out of static prerendering unless every page wrapping it
      // has a Suspense boundary, and this component sits inside AppShell, so
      // it would have broken the build for every statically rendered screen.
      // This effect only ever runs on the client, where `window` is real.
      const target = `${window.location.pathname}${window.location.search}`;
      const next = target && target !== "/" ? `?next=${encodeURIComponent(target)}` : "";
      router.replace(`/sign-in${next}`);
    }
  }, [hydrated, isAuthenticated, router, isPublic]);

  if (isPublic) return <>{children}</>;
  if (!hydrated || !isAuthenticated) return null;
  return <>{children}</>;
}
