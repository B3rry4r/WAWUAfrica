import { SessionProvider } from "@/lib/auth/session-provider";
import { SessionGate } from "@/app/(app)/components/SessionGate";
import { LandingContent } from "@/app/(marketing)/components/LandingContent";

/**
 * `/` — server component. Renders the marketing landing for SEO; a client
 * SessionGate swaps in the authenticated home feed when signed in. Only the
 * genuinely interactive leaves (EarningsCalculator, FaqAccordion,
 * CreatorCarousel) are client components.
 */
export default function Page() {
  return (
    <SessionProvider>
      <SessionGate>
        <LandingContent />
      </SessionGate>
    </SessionProvider>
  );
}