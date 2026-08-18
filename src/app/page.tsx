import { SessionProvider } from "@/lib/auth/session-provider";
import { LandingContent } from "@/app/(marketing)/components/LandingContent";

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
 * Forced dynamic: without this, Next statically prerenders "/" once at
 * build time, so LandingContent's getFeaturedContent() call runs exactly
 * once, at build time, and whatever it got (including a failure, e.g. the
 * build environment not being able to reach the API service) is baked into
 * the page and served identically to every visitor until the next deploy —
 * confirmed live on Railway. Still fully server-rendered/crawlable for SEO,
 * just per-request instead of once.
 */
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <SessionProvider>
      <LandingContent />
    </SessionProvider>
  );
}
