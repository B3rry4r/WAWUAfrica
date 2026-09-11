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
import { apiFetch, ApiError, delay, isMockModeError } from "@/lib/api/client";
import { WAWU_ID_BASE } from "@/lib/api/config";

/**
 * CRITICAL: never widen this to a bare `catch {}` that returns a fabricated
 * session. Confirmed live (Phase-8-style audit) that doing so meant a WRONG
 * PASSWORD, an INVALID OTP CODE, and an EXPIRED RESET TOKEN all silently
 * logged the user in / showed "success" anyway, because the real backend's
 * 401/400 was being treated identically to "no backend configured, fall
 * back to a demo". Those are not the same failure: `isMockModeError` is
 * true only when there's genuinely no backend to call (dev/demo mode) --
 * every other error means the real backend was reached and said no, and
 * that must reach the caller as a real, visible failure.
 */
function isIntentionalMockMode(e: unknown): boolean {
  return isMockModeError(e);
}

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
  /** Still sent: WAWU ID falls back to splitting it for callers with no parts. */
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
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

// This used to declare only { accountType, interests } — a narrower copy of
// the same GET /api/hub/users/me response verification.ts's own HubMeResponse
// already reads in full, avatarUrl included. The narrow shape silently
// dropped every other field the endpoint actually returns, avatarUrl among
// them, before it ever reached SessionUser: the header avatar rendering
// initials wasn't a missing feature, it was this type lying about the
// response shape.
interface HubMeResponse {
  accountType: AccountType | null;
  interests: string[];
  avatarUrl: string | null;
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

function toCreatorState(state: HubCreatorStateResponse): CreatorState {
  return {
    tier: state.tier,
    subscriptionPaid: state.subscriptionPaid,
    kyc: state.kycStatus,
    slotsUsed: state.slotsUsed,
    slotsTotal: state.slotsTotal,
    dmPrice: state.dmPrice ?? 0,
    dmEnabled: state.dmEnabled,
  };
}

/**
 * Writes the WAWUAfrica-specific account type WAWU ID does not own.
 *
 * This USED to swallow any failure with a comment saying the worst case was
 * "accountType:null until they retry (e.g. on next sign-in)". Nothing retried
 * on next sign-in. A single failed PATCH here left the server believing a
 * paying creator was a reader, forever: the rest of the signup still looked
 * right, because the wizard carries the chosen account type in its own state,
 * and the demotion only appeared the next time they signed in.
 *
 * So it retries. Three quick attempts, because this is one small write on a
 * connection that has already carried a registration successfully, and the
 * cost of losing it is an account that behaves as the wrong type.
 *
 * It is still best-effort at the end: the WAWU ID session is valid either way
 * and blocking signup on this would be worse. What makes that survivable now
 * is that sign-in asks the server for creator state outright rather than
 * trusting this flag, so a creator is recognised even if every attempt failed.
 */
async function completeHubOnboarding(accessToken: string, accountType: AccountType): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await apiFetch("/api/hub/users/me", {
        method: "PATCH",
        token: accessToken,
        body: { accountType },
      });
      return;
    } catch (e) {
      // A refusal will refuse again: only retry what might succeed next time.
      const worthRetrying = !(e instanceof ApiError) || e.status >= 500;
      if (!worthRetrying || attempt === 2) return;
      await delay(400 * (attempt + 1));
    }
  }
}

// ── exported auth API ─────────────────────────────────────────────────────────

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  try {
    const body: WawuIdRegisterBody = {
      fullName: payload.fullName,
      // The parts are what WAWU ID actually stores. fullName above is kept so
      // the request stays valid for readers that still expect it.
      firstName: payload.firstName,
      middleName: payload.middleName || undefined,
      lastName: payload.lastName,
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
    // Real, freshly generated 6-digit code emailed via WAWU ID -- not
    // best-effort like completeHubOnboarding above: if this genuinely
    // fails, the OTP screen the wizard is about to show would have no code
    // to check against, so a real failure here must fail signUp() too
    // (isIntentionalMockMode still lets pure dev/demo mode through).
    // Keep expiresIn. The OTP screen tells the user how long the code lives,
    // and that sentence had drifted to "10 minutes" against a server TTL of
    // five - so anyone who believed it and came back at minute eight found a
    // code that no longer worked, with no reason given. Carrying the server's
    // own number means the copy cannot disagree with the server again.
    const started = await apiFetch<{ message: string; expiresIn: number }>("/auth/email/verify/start", {
      method: "POST",
      baseUrl: WAWU_ID_BASE,
      body: { email: payload.email },
    });

    const user: SessionUser = {
      wawuId: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email ?? payload.email,
      accountType: payload.accountType,
      interests: [],
      verification: mapVerificationTier(result.user.verificationTier),
      creator: null,
      avatarUrl: null,
    };
    return { token: result.accessToken, user, codeExpiresIn: started.expiresIn };
  } catch (e) {
    if (!isIntentionalMockMode(e)) throw e;
    // SEAM: replace with POST /auth/register (WAWU ID) + PATCH /api/hub/users/me
    const user: SessionUser = {
      wawuId: `wawu_${payload.email.split("@")[0] ?? "new"}`,
      fullName: payload.fullName,
      email: payload.email,
      accountType: payload.accountType,
      interests: [],
      verification: "basic",
      creator: null,
      avatarUrl: null,
    };
    return { token: `mock-token-${Date.now()}`, user };
  }
}

export async function verifyOtp(payload: OtpVerifyPayload): Promise<AuthResponse> {
  try {
    const result = await apiFetch<WawuIdTokenResult>("/auth/email/verify/confirm", {
      method: "POST",
      baseUrl: WAWU_ID_BASE,
      body: { email: payload.email, code: payload.code },
    });
    sessionStorage.setRefreshToken(result.refreshToken);

    // This function's one current caller (SignUpFlow) already ran signUp()'s
    // Hub onboarding PATCH earlier in the same flow and overrides
    // accountType/fullName from its own local state when it calls
    // signInUser() — see SignUpFlow.tsx's onVerifyOtp. accountType here is
    // just a safe default for any other caller.
    const user: SessionUser = {
      wawuId: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email ?? payload.email,
      accountType: "user",
      interests: [],
      verification: mapVerificationTier(result.user.verificationTier),
      creator: null,
      avatarUrl: null,
    };
    return { token: result.accessToken, user };
  } catch (e) {
    if (!isIntentionalMockMode(e)) throw e;
    // SEAM: replace with POST /auth/email/verify/confirm (WAWU ID)
    const user: SessionUser = {
      wawuId: `wawu_${payload.email.split("@")[0] ?? "new"}`,
      fullName: "",
      email: payload.email,
      accountType: "user",
      interests: [],
      verification: "basic",
      creator: null,
      avatarUrl: null,
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

    /*
      ALWAYS ASK THE SERVER FOR CREATOR STATE. DO NOT GATE THIS QUESTION ON
      me.accountType.

      This used to read `if (accountType === "creator") { ...fetch state... }`,
      which asked whether somebody is a creator only when a cached profile flag
      already said so. Anything that lost or never wrote that flag therefore
      signed a real creator in as a plain user, silently and permanently: the
      first session after signing up looked right, because the wizard sets the
      account type locally from its own state, and then the NEXT sign-in asked
      the server, got "user", and demoted them. Signing out was all it took.

      creatorGates() has said for a while that "creator state exists ⇒ this IS
      a creator account, full stop", and that the profile flag is a stale cache
      of a guess. Sign-in now agrees with it: ask outright, and let the answer
      decide. A reader simply has no creator state, which costs one 403.
    */
    let creator: CreatorState | null = null;
    try {
      const state = await apiFetch<HubCreatorStateResponse>("/api/hub/creator/state", { token: result.accessToken });
      creator = toCreatorState(state);
    } catch (e) {
      // 403/404 is the ordinary answer for an account that is not a creator,
      // and for a creator who has not picked a tier yet.
      const notACreator = e instanceof ApiError && (e.status === 404 || e.status === 403);
      // Anything else — 5xx, timeout, network — is a REQUEST FAILURE, not
      // evidence about this account. Swallowing it used to hand a real,
      // paid, KYC-approved creator a session with creator:null, which
      // silently locked uploading, earnings and every creator surface for
      // the rest of the session with no error anywhere. Surface it so the
      // sign-in screen can retry instead of signing them in demoted.
      // (Genuine mock mode still falls through to the outer catch below.)
      if (!notACreator && !isIntentionalMockMode(e)) throw e;
    }

    // The server's own answer wins over the cached flag. A profile row that
    // was never written, or written as "user" before they upgraded, must not
    // outrank live creator state.
    const accountType: AccountType = creator !== null ? "creator" : me.accountType ?? "user";

    // Heal the row rather than re-deriving this on every sign-in. If the hub
    // disagrees with its own creator state, the profile write was lost at
    // signup, and every OTHER surface that reads accountType (the dashboard,
    // admin lists, anything not using creatorGates) is still reading the wrong
    // answer. Best-effort on purpose: the session above is already correct, so
    // a failure here costs nothing this time round.
    if (me.accountType !== accountType) {
      void completeHubOnboarding(result.accessToken, accountType);
    }

    const user: SessionUser = {
      wawuId: result.user.id,
      fullName: result.user.fullName,
      email: result.user.email ?? payload.email,
      accountType,
      interests: me.interests ?? [],
      verification: mapVerificationTier(result.user.verificationTier),
      creator,
      avatarUrl: me.avatarUrl ?? null,
    };
    return { token: result.accessToken, user };
  } catch (e) {
    if (!isIntentionalMockMode(e)) throw e;
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
      avatarUrl: null,
    };
    return { token: `mock-token-${Date.now()}`, user };
  }
}

/**
 * Re-sends the email-verification code (codes expire after 5 minutes
 * server-side). The sign-up wizard's OTP screen had a visible countdown
 * with no real resend behind it -- this is that missing real call.
 */
export async function resendEmailVerificationCode(email: string): Promise<{ message: string; expiresIn: number }> {
  try {
    return await apiFetch<{ message: string; expiresIn: number }>("/auth/email/verify/start", {
      method: "POST",
      baseUrl: WAWU_ID_BASE,
      body: { email },
    });
  } catch (e) {
    if (!isIntentionalMockMode(e)) throw e;
    // SEAM: replace with POST /auth/email/verify/start (WAWU ID)
    return { message: "Verification code sent", expiresIn: 300 };
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
  } catch (e) {
    if (!isIntentionalMockMode(e)) throw e;
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
  } catch (e) {
    if (!isIntentionalMockMode(e)) throw e;
    // SEAM: replace with POST /auth/reset-password (WAWU ID, email-link path)
    return;
  }
}

/**
 * Live creator tier/slots/KYC status, read fresh from the Hub API rather
 * than the snapshot captured at sign-in (SessionUser.creator). Used by
 * screens that gate or display slot counts / tier / KYC status and need it
 * current, not just "as of last login" — e.g. after an upgrade, a KYC
 * decision, or a publish that used a slot.
 *
 * Creator-only: returns null for a plain user (no CreatorState row) or a
 * creator account pre-tier-selection, exactly like the sign-in path already
 * treats a 404 here (see signIn above).
 */
export async function getCreatorState(): Promise<CreatorState | null> {
  try {
    const state = await apiFetch<HubCreatorStateResponse>("/api/hub/creator/state", { authed: true });
    return toCreatorState(state);
  } catch (e) {
    if (!isIntentionalMockMode(e)) throw e;
    // SEAM: replace with GET /api/hub/creator/state
    return sessionStorage.getUser()?.creator ?? null;
  }
}
