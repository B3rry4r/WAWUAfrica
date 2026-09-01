import { apiFetch, isMockModeError } from "./client";
import type { CreatorTier } from "@/types/account";

/**
 * Referral codes, and the switch that closes regular-user signup.
 *
 * Both reads are UNAUTHENTICATED by design: they are needed by somebody who
 * does not have an account yet and by definition cannot be signed in.
 */

export interface SignupState {
  /**
   * Whether a REGULAR (non-creator) account can be created without a code.
   * Creator signup is never gated by this — onboarding creators is the point.
   */
  userSignupEnabled: boolean;
}

export interface ReferralCodeCheck {
  code: string;
  discountPercent: number;
  tier: CreatorTier;
  /** Priced server-side, so the client never computes what somebody pays. */
  priceNaira: number;
  originalPriceNaira: number;
}

/**
 * Defaults to OPEN when it cannot be read.
 *
 * A network failure must not lock people out of signing up. The server
 * enforces the real gate regardless, so the worst case here is a card that
 * looks available and is refused with a reason — never a door that is shut
 * because a request timed out.
 */
export async function getSignupState(): Promise<SignupState> {
  try {
    // SEAM: replace with GET /api/hub/referral/signup-state
    return await apiFetch<SignupState>("/api/hub/referral/signup-state");
  } catch (e) {
    if (!isMockModeError(e)) {
      // fall through to the open default
    }
    return { userSignupEnabled: true };
  }
}

/** Throws when the code is not valid. The server gives one sentence for every reason. */
export function checkReferralCode(code: string): Promise<ReferralCodeCheck> {
  // SEAM: replace with GET /api/hub/referral/validate
  return apiFetch<ReferralCodeCheck>(
    `/api/hub/referral/validate?code=${encodeURIComponent(code.trim())}`,
  );
}
