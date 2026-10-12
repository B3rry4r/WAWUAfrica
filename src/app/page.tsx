import { SessionProvider } from "@/lib/auth/session-provider";
import { LandingContent } from "@/app/(marketing)/components/LandingContent";
import { SoundFab, SoundResume } from "@/components/layout/SoundToggle";
import { currentSiteMode } from "@/lib/site-mode";

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
 * every visitor until the next deploy. That fetch went away and the page was
 * prerendered for a while. It is forced dynamic again, for a different reason.
 *
 * Which links the landing page draws depends on the site mode (lib/site-mode.ts):
 * on production wawuafrica.com only the landing page and the registration link
 * are open, so the landing page's sign-up buttons go to /join and nothing on it
 * leads into a closed part of the site (owner, 12 Oct 2026). The mode comes
 * from SITE_MODE / VERCEL_ENV, which must be able to change behaviour without a
 * rebuild (the middleware reads them on every request for the same reason). A
 * prerendered page would freeze whichever mode the build ran in, so this page
 * reads the mode when it renders, with the same function the middleware uses.
 * The page has no server data, so rendering it per request is cheap.
 */
export const dynamic = "force-dynamic";

export default function Page() {
  const mode = currentSiteMode();
  return (
    <SessionProvider>
      <LandingContent mode={mode} />
      {/*
        The same toggle the app shell carries, so the theme follows a visitor
        from the landing page into the product without restarting — one
        localStorage key, one component, one choice.

        It still cannot autoplay here: browsers require a user gesture before
        any audible playback, and a landing page is exactly where an
        unrequested song would be most unwelcome anyway. It waits to be asked.
      */}
      <SoundResume />
      <SoundFab />
    </SessionProvider>
  );
}
