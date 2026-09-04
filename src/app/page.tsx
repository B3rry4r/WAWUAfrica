import { SessionProvider } from "@/lib/auth/session-provider";
import { LandingContent } from "@/app/(marketing)/components/LandingContent";
import { SoundToggle } from "@/components/layout/SoundToggle";

/**
 * `/` — the marketing landing page, for everyone, signed in or not.
 *
 * It previously swapped itself out for the authenticated home feed whenever a
 * session existed, which meant the landing page had no address of its own and
 * a signed-in user could never get back to it. The app home now lives at
 * `/home`; this route only ever renders marketing. SessionProvider stays so
 * the header can offer a way back into the app rather than showing "Sign in"
 * to somebody who already is.
 *
 * This was forced dynamic because LandingContent fetched featured content,
 * which meant a build-time fetch (or its failure) got baked in and served to
 * every visitor until the next deploy. That fetch is gone — the page now has
 * no server data at all — so it can be prerendered again. Put the directive
 * back if anything here starts fetching.
 */

export default function Page() {
  return (
    <SessionProvider>
      <LandingContent />
      {/*
        The same toggle the app shell carries, so the theme follows a visitor
        from the landing page into the product without restarting — one
        localStorage key, one component, one choice.

        It still cannot autoplay here: browsers require a user gesture before
        any audible playback, and a landing page is exactly where an
        unrequested song would be most unwelcome anyway. It waits to be asked.
      */}
      <SoundToggle />
    </SessionProvider>
  );
}
