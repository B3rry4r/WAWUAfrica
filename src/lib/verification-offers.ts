import type { VerificationOffer } from "@/types/verification";

/**
 * The published price list for the two verifications.
 *
 * WHY THIS FILE EXISTS. Build brief B1 prices creator verification at
 * NGN 4,999 a year and professional verification at NGN 9,999 a year, and
 * requires that "prices are configurable, not hardcoded in a component".
 * This is that config: ONE place, outside every screen, that the API layer
 * reads when it has no server answer to use.
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
  { kind: "creator", price: 4999, periodMonths: 12 },
  { kind: "professional", price: 9999, periodMonths: 12 },
];
