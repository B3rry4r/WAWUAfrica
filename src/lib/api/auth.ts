import { sessionStorage } from "@/lib/auth/session-storage";
import type { AuthResponse, OtpVerifyPayload, SignInPayload, SignUpPayload, ResetPasswordPayload, NewPasswordPayload, SessionUser } from "@/types/auth";
import { apiFetch } from "@/lib/api/client";

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  try {
    return await apiFetch<AuthResponse>("/api/hub/auth/signup", {
      method: "POST",
      authed: true,
      body: payload,
    });
  } catch {
    // SEAM: replace with POST /api/hub/auth/signup
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
    return await apiFetch<AuthResponse>("/api/hub/auth/otp/verify", {
      method: "POST",
      authed: true,
      body: payload,
    });
  } catch {
    // SEAM: replace with POST /api/hub/auth/otp/verify
    const user: SessionUser = {
      wawuId: `wawu_${payload.email.split("@")[0] ?? "new"}`,
      fullName: "",
      email: payload.email,
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
    return await apiFetch<AuthResponse>("/api/hub/auth/signin", {
      method: "POST",
      authed: true,
      body: payload,
    });
  } catch {
    // SEAM: replace with POST /api/hub/auth/signin
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
    await apiFetch<void>("/api/hub/auth/reset", { method: "POST", authed: true, body: payload });
  } catch {
    // SEAM: replace with POST /api/hub/auth/reset
    return;
  }
}

export async function saveNewPassword(payload: NewPasswordPayload): Promise<void> {
  try {
    await apiFetch<void>("/api/hub/auth/reset/confirm", { method: "POST", authed: true, body: payload });
  } catch {
    // SEAM: replace with POST /api/hub/auth/reset/confirm
    return;
  }
}