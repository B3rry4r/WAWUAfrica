import { SessionProvider } from "@/lib/auth/session-provider";
import { SessionGate } from "@/app/(app)/components/SessionGate";
import { LandingContent } from "@/app/(marketing)/components/LandingContent";

/**
 * `/` — server component. Renders the marketing landing for SEO; a client
 * SessionGate swaps in the authenticated home feed when signed in. Only the
 * genuinely interactive leaves (EarningsCalculator, FaqAccordion,
 * CreatorCarousel) are client components.
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
      <SessionGate>
        <LandingContent />
      </SessionGate>
    </SessionProvider>
  );
}