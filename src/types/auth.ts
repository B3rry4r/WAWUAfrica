import type { AccountType, CreatorTier, KycStatus, VerificationLevel } from "./account";

export interface SignUpIdentity {
  /**
   * The three parts, collected separately.
   *
   * A single "Full name" box was split on the first space, which stored "Ada
   * Chidinma Okeke" with a surname of "Chidinma Okeke". KYC is a manual review
   * against a government ID, so that record does not match the document.
   */
  firstName: string;
  middleName: string;
  lastName: string;
  /** The three joined, for everything that still renders one display name. */
  fullName: string;
  email: string;
  password: string;
  phone: string;
  phoneCountryCode: string;
}

export interface SignUpDetails {
  country: string;
  region: string | null;
  occupation: string;
  gender: "female" | "male" | "unspecified" | null;
  acceptedTerms: boolean;
}

export interface SignUpPayload extends SignUpIdentity, SignUpDetails {
  accountType: AccountType;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  email: string;
}

export interface NewPasswordPayload {
  password: string;
  confirmPassword: string;
  /** From the reset-link URL (?token=&email=) — WAWU ID's email-link reset path needs both. */
  token: string;
  email: string;
}

/**
 * Matches the approved design (design/screens/WAWU Auth.dc.html: "Verify
 * your email" / "We sent it to ada@okeke.ng") -- a real, freshly generated
 * 6-digit code emailed via WAWU ID's POST /auth/email/verify/start and
 * checked by POST /auth/email/verify/confirm (added directly to WAWU ID
 * for this; it previously only had a phone/WhatsApp OTP, which is what
 * this type used to be wired to -- see git history for that mismatch and
 * why it was wrong).
 */
export interface OtpVerifyPayload {
  email: string;
  code: string;
}

/**
 * Creator state. Null on user accounts.
 *
 * There is ONE gate: `kyc === "approved"` unlocks receiving earnings.
 * Uploading is not gated at all — listing is free. `kyc === "pending"` is a
 * normal state, not an edge case: most new creators live there for their
 * first few days. They can upload, publish and sell; they just cannot be paid
 * out yet.
 *
 * Derive gates via `creatorGates()` in `@/lib/auth/gates`. Never re-check
 * these fields inline in a component.
 */
export interface CreatorState {
  /**
   * Still sent by the backend and still what the revenue split keys off
   * (85/15 standard, 90/10 Pro). NOT a purchasable plan any more and never
   * rendered as a badge or a tier name — subscriptions are gone.
   */
  tier: CreatorTier;
  kyc: KycStatus;
  slotsUsed: number;
  /** Flat cap for every account. See MAX_ITEMS_PER_ACCOUNT in gates.ts. */
  slotsTotal: number;
  /** Creator-set price per message. 0 when DMs are off. */
  dmPrice: number;
  dmEnabled: boolean;
  /** Hours the creator has to reply before the payer is refunded. */
  dmResponseHours?: number;
}

export interface SessionUser {
  wawuId: string;
  fullName: string;
  email: string;
  accountType: AccountType;
  interests: string[];
  /** Profile credibility ladder. Separate from creator KYC. */
  verification: VerificationLevel;
  creator: CreatorState | null;
  /**
   * Null through sign-up/OTP (no photo exists yet for a brand-new account)
   * and picked up on the next real sign-in, same pattern as `creator`.
   */
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: SessionUser;
  /**
   * Seconds the emailed verification code stays valid, straight from WAWU ID.
   * Present on sign-up, which is the only flow that shows the countdown copy.
   */
  codeExpiresIn?: number;
}
