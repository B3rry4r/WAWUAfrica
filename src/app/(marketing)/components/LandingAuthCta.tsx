"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/session-provider";
import { Button } from "@/components/ui/Button";

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
 */
export function LandingAuthCta() {
  const { isAuthenticated, hydrated } = useSession();

  if (hydrated && isAuthenticated) {
    return (
      <Link
        href="/home"
        className="inline-flex h-[42px] items-center rounded-button bg-white px-5 text-[13.5px] font-semibold text-on-light transition-transform duration-200 hover:scale-[1.03]"
      >
        Open app
      </Link>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" href="/sign-in" className="hidden dt:inline-flex">Sign in</Button>
      <Button variant="ghost" size="sm" href="/sign-up" className="hidden dt:inline-flex">Sign up</Button>
      <Link
        href="/sign-up?type=creator"
        className="inline-flex h-[42px] items-center rounded-button bg-white px-5 text-[13.5px] font-semibold text-on-light transition-transform duration-200 hover:scale-[1.03]"
      >
        Join the Movement
      </Link>
    </>
  );
}
