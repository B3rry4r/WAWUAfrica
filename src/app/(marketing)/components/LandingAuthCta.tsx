"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/session-provider";
import { Button } from "@/components/ui/Button";
import { pageHref, signUpHref } from "@/lib/site-mode";
import type { SiteMode } from "@/lib/site-mode";

/**
 * The landing header's right-hand actions.
 *
 * The landing page is reachable whether or not you are signed in, so it must
 * not keep telling a signed-in user to sign up. When there is a session this
 * becomes the way back into the app; otherwise it is the usual sign-in /
 * sign-up / join set.
 *
 * Renders the signed-out set until the session has hydrated, because the
 * server has no session to read and flipping the header after hydration is
 * less jarring than an empty gap where the buttons should be.
 *
 * In join-only mode (production, owner 12 Oct 2026) only the registration link
 * is open besides this page: the sign-up buttons go to /join, "Sign in" is not
 * drawn, and a signed-in visitor gets no way back into the app (/home is
 * closed), so the signed-out set is what everyone sees. `mode` defaults to
 * `full` for the other caller (the store header, which join-only keeps closed);
 * the landing page always passes it.
 */
export function LandingAuthCta({ mode = "full" }: { mode?: SiteMode }) {
  const { isAuthenticated, hydrated } = useSession();

  // The way back into the app is a link like any other: in join-only mode /home
  // is closed, so it is null and not drawn.
  const openApp = pageHref(mode, "/home");
  if (openApp && hydrated && isAuthenticated) {
    return (
      <Link
        href={openApp}
        className="inline-flex h-[42px] items-center rounded-button bg-white px-5 text-[13.5px] font-semibold text-on-light transition-transform duration-200 hover:scale-[1.03]"
      >
        Open app
      </Link>
    );
  }

  const signIn = pageHref(mode, "/sign-in");
  return (
    <>
      {signIn ? <Button variant="ghost" size="sm" href={signIn} className="hidden dt:inline-flex">Sign in</Button> : null}
      <Button variant="ghost" size="sm" href={signUpHref(mode, "/sign-up")} className="hidden dt:inline-flex">Sign up</Button>
      <Link
        href={signUpHref(mode, "/sign-up?type=creator")}
        className="inline-flex h-[42px] items-center rounded-button bg-white px-5 text-[13.5px] font-semibold text-on-light transition-transform duration-200 hover:scale-[1.03]"
      >
        Join the Movement
      </Link>
    </>
  );
}
