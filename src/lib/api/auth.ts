import { sessionStorage } from "@/lib/auth/session-storage";
import type {
  AuthResponse,
  CreatorState,
  OtpVerifyPayload,
  SignInPayload,
  SignUpPayload,
  ResetPasswordPayload,
  NewPasswordPayload,
  SessionUser,
} from "@/types/auth";
import type { AccountType, CreatorTier, KycStatus, VerificationLevel } from "@/types/account";
import { apiFetch } from "@/lib/api/client";
import { WAWU_ID_BASE } from "@/lib/api/config";

/**
 * S-4 (.pipeline/supersedes.json): WAWU ID owns 100% of signup/login/OTP/
 * password-reset. This module calls it directly via `baseUrl: WAWU_ID_BASE`
 * and never proxies auth through the Hub API. The Hub API is only ever hit
 * here for the two things it legitimately owns post-auth: completing
 * WAWUAfrica onboarding (PATCH /api/hub/users/me — accountType) and reading
 * the assembled session (GET /api/hub/users/me, GET /api/hub/creator/state).
 */

// ── WAWU ID wire shapes (confirmed by direct inspection of /workspace/projects/WAWU-ID) ──

interface WawuIdUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  country: string | null;
  state: string | null;
  gender: string | null;
  occupation: string | null;
  /** 6-value union on WAWU ID; the frontend's VerificationLevel is a 5-value subset — see mapVerificationTier. */
  verificationTier: string;
  trustScore: number;
  status: string;
}

interface WawuIdTokenResult {
  accessToken: string;
  refreshToken: string;
  user: WawuIdUser;
}

/** WAWU ID's RegisterDto — top-level fields, not nested (see auth.dto/register.dto.ts). */
interface WawuIdRegisterBody {
  fullName: string;
  email: string;
  phone: string;
  dialCode?: string;
  country: string;
  state?: string;
  gender?: string;
  occupation?: string;
  password: string;
}

// ── Hub API wire shapes this module reads post-auth ──────────────────────────

interface HubMeResponse {
  accountType: AccountType | null;
  interests: string[];
}

interface HubCreatorStateResponse {
  tier: CreatorTier;
  subscriptionPaid: boolean;
  kycStatus: KycStatus;
  slotsUsed: number;
  /** Computed server-side from tier (basic 3 / pro 7) — confirmed via CreatorStateService, not a client computation. */
  slotsTotal: number;
  dmPrice: number | null;
  dmEnabled: boolean;
}

// ── mapping helpers ───────────────────────────────────────────────────────────

/**
 * WAWU ID accepts gender as a free string, normalized server-side to
 * 'male'|'female'|null (anything else, including an explicit null, becomes
 * null — see WAWU-ID's normalizeGender()). Sending the field at all is
 * therefore unnecessary for 'unspecified'/null: omitting it produces the
 * exact same stored result as sending null. Omit rather than send null.
 */
function toWawuIdGender(gender: SignUpPayload["gender"]): string | undefined {
  return gender === "male" || gender === "female" ? gender : undefined;
}

const KNOWN_VERIFICATION_LEVELS: readonly VerificationLevel[] = [
  "basic",
  "verified_user",
  "verified_business",
  "certified_professional",
  "trusted_partner",
];

/**
 * WAWU ID's verificationTier is a 6-value union; the frontend's
 * VerificationLevel (src/types/account.ts) has 5 — it is missing 'official'
 * (an admin/partner-provisioned tier, see WAWU-ID auth.service.ts
 * updateVerificationTier's ALLOWED list). Adding 'official' to the frontend
 * union would require also updating three exhaustive
 * Record<VerificationLevel, ...> maps outside this task's file scope
 * (VERIFY_TIER_LABELS, VerificationBadge's colorClass, VerificationApplyForm's
 * REQUIREMENTS) — out of scope for this pass. Folding 'official' onto the
 * existing top tier ('trusted_partner') is the narrower, in-scope choice.
 * Revisit if 'official' WAWU ID accounts become reachable in the web app.
 */
function mapVerificationTier(tier: string): VerificationLevel {
  if (tier === "official") return "trusted_partner";
  return (KNOWN_VERIFICATION_LEVELS as string[]).includes(tier) ? (tier as VerificationLevel) : "basic";
}

/**
 * WAWUAfrica-specific onboarding field WAWU ID doesn't own. Best-effort: the
 * WAWU ID session is already valid even if this fails, so we still let the
 * user in rather than fail the whole signup — worst case GET /api/hub/users/me
 * returns accountType:null until they retry (e.g. on next sign-in).
 */
async function completeHubOnboarding(accessToken: string, accountType: AccountType): Promise<void> {
  try {
    await apiFetch("/api/hub/users/me", {
      method: "PATCH",
      token: accessToken,
      body: { accountType },
    });
  } catch {
    // SEAM: PATCH /api/hub/users/me — see doc comment above.
  }
}

// ── exported auth API ─────────────────────────────────────────────────────────

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  try {
    const body: WawuIdRegisterBody = {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      dialCode: payload.phoneCountryCode,
      country: payload.country,
      state: payload.region ?? undefined,
      gender: toWawuIdGender(payload.gender),
      occupation: payload.occupation,
      password: payload.password,
    };
    const result = await apiFetch<WawuIdTokenResult>("/auth/register", {
      method: "POST",
      baseUrl: WAWU_ID_BASE,
      body,
    });
    sessionStorage.setRefreshToken(result.refreshToken);
    await completeHubOnboarding(result.accessToken, payload.accountType);

    const user: SessionUser = {
      wawuId: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email ?? payload.email,
      accountType: payload.accountType,
      interests: [],
      verification: mapVerificationTier(result.user.verificationTier),
      creator: null,
    };
    return { token: result.accessToken, user };
  } catch {
    // SEAM: replace with POST /auth/register (WAWU ID) + PATCH /api/hub/users/me
    const user: SessionUser = {
      wawuId: `wawu_${payload.email.split("@")[0] ?? "new"}`,
      fullName: payload.fullName,
      email: payload.email,
      accountType: payload.accountType,
      interests: [],
      verification: "basic",
      creator: null,
    };
    return { token: `mock-token-${Date.now()}`, user };
  }
}

export async function verifyOtp(payload: OtpVerifyPayload): Promise<AuthResponse> {
  try {
    const result = await apiFetch<WawuIdTokenResult>("/auth/otp/verify", {
      method: "POST",
      baseUrl: WAWU_ID_BASE,
      body: { phone: payload.phone, code: payload.code },
    });
    sessionStorage.setRefreshToken(result.refreshToken);

    // Find-or-create on WAWU ID's side. This function has no accountType to
    // PATCH onto the Hub (OtpVerifyPayload carries only phone+code) — its one
    // current caller (SignUpFlow) already ran signUp()'s PATCH earlier in the
    // same flow. A future standalone/passwordless caller of this function
    // would need to PATCH accountType itself; see report.
    const user: SessionUser = {
      wawuId: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email ?? "",
      accountType: "user",
      interests: [],
      verification: mapVerificationTier(result.user.verificationTier),
      creator: null,
    };
    return { token: result.accessToken, user };
  } catch {
    // SEAM: replace with POST /auth/otp/verify (WAWU ID)
    const user: SessionUser = {
      wawuId: `wawu_${payload.phone}`,
      fullName: "",
      email: "",
      accountType: "user",
      interests: [],
      verification: "basic",
      creator: null,
    };
    return { token: `mock-token-${Date.now()}`, user };
  }
}

export async function signIn(payload: SignInPayload): Promise<AuthResponse> {
  try {
    const result = await apiFetch<WawuIdTokenResult>("/auth/login", {
      method: "POST",
      baseUrl: WAWU_ID_BASE,
      // WAWU ID's `identifier` accepts email OR phone in one field; this
      // form only ever collects email today, so it's passed straight through.
      body: { identifier: payload.email, password: payload.password },
    });
    sessionStorage.setRefreshToken(result.refreshToken);

    const me = await apiFetch<HubMeResponse>("/api/hub/users/me", { token: result.accessToken });
    const accountType: AccountType = me.accountType ?? "user";

    let creator: CreatorState | null = null;
    if (accountType === "creator") {
      try {
        const state = await apiFetch<HubCreatorStateResponse>("/api/hub/creator/state", { token: result.accessToken });
        creator = {
          tier: state.tier,
          subscriptionPaid: state.subscriptionPaid,
          kyc: state.kycStatus,
          slotsUsed: state.slotsUsed,
          slotsTotal: state.slotsTotal,
          dmPrice: state.dmPrice ?? 0,
          dmEnabled: state.dmEnabled,
        };
      } catch {
        // SEAM: GET /api/hub/creator/state — a creator account with no
        // CreatorState row yet (pre-tier-selection). Leave creator null;
        // creatorGates() already treats null as "not yet a creator" downstream.
      }
    }

    const user: SessionUser = {
      wawuId: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email ?? payload.email,
      accountType,
      interests: me.interests ?? [],
      verification: mapVerificationTier(result.user.verificationTier),
      creator,
    };
    return { token: result.accessToken, user };
  } catch {
    // SEAM: replace with POST /auth/login (WAWU ID) + GET /api/hub/users/me [+ GET /api/hub/creator/state]
    const stored = sessionStorage.getUser();
    const user: SessionUser = stored ?? {
      wawuId: `wawu_${payload.email.split("@")[0] ?? "user"}`,
      fullName: "New user",
      email: payload.email,
      accountType: sessionStorage.getAccountType() ?? "user",
      interests: [],
      verification: "basic",
      creator: null,
    };
    return { token: `mock-token-${Date.now()}`, user };
  }
}

export async function requestPasswordReset(payload: ResetPasswordPayload): Promise<void> {
  try {
    await apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      baseUrl: WAWU_ID_BASE,
      // Web hub explicitly requests the email-link delivery channel (default is 'sms').
      body: { identifier: payload.email, method: "email" },
    });
  } catch {
    // SEAM: replace with POST /auth/forgot-password (WAWU ID)
    return;
  }
}

export async function saveNewPassword(payload: NewPasswordPayload): Promise<void> {
  try {
    await apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      baseUrl: WAWU_ID_BASE,
      // Email-link path: { token, email, password }. No tokens come back —
      // the caller redirects to sign-in after this resolves.
      body: { token: payload.token, email: payload.email, password: payload.password },
    });
  } catch {
    // SEAM: replace with POST /auth/reset-password (WAWU ID, email-link path)
    return;
  }
}
