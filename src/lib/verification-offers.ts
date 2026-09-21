import type { VerificationOffer } from "@/types/verification";

/**
 * The published price list for the two verifications.
 *
 * WHY THIS FILE EXISTS. Build brief B1 required that "prices are
 * configurable, not hardcoded in a component". This is that config: ONE
 * place, outside every screen, that the API layer reads when it has no
 * server answer to use.
 *
 * BOTH TICKS ARE NGN 2,000 A YEAR. B1 priced them at 4,999 and 9,999; the
 * product owner set both to 2,000 on 21 Sep 2026. They are now the SAME
 * figure, so nothing here should derive one from the other or assume the
 * professional tick is the dearer one.
 *
 * WHAT WINS. The server always does. `getVerificationOverview()` returns
 * whatever GET /api/hub/verification sends and only falls back to this list
 * when there is no backend configured at all (fixture/dev mode). So a price
 * change is a backend change and never a release of this app; this list is
 * what a no-backend build shows, not a second source of truth competing with
 * the first.
 *
 * Integer Naira. Never dollars, never a formatted string: formatting belongs
 * to formatNaira at the render site.
 */
export const VERIFICATION_OFFERS: readonly VerificationOffer[] = [
  { kind: "creator", price: 2000, periodMonths: 12 },
  { kind: "professional", price: 2000, periodMonths: 12 },
];
