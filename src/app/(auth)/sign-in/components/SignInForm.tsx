"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { useSession } from "@/lib/auth/session-provider";
import { signIn, resendEmailVerificationCode, verifyOtp } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { OtpInput } from "../../components/OtpInput";

export function SignInForm() {
  const router = useRouter();
  const { signInUser } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // WAWU ID rejects login with EMAIL_NOT_VERIFIED for an account that was
  // registered but never completed the sign-up wizard's OTP step. That is a
  // real, working account (not a dead end) -- send a fresh code and let the
  // user finish verification right here instead of stranding them.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const canSubmit = Boolean(emailValid && passwordValid) && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await signIn({ email, password });
      signInUser(res.user, res.token);
      // Return them to whatever they were trying to reach, falling back to the
      // feed. Only same-origin paths are honoured, so `next` cannot be used to
      // bounce someone to another site after they sign in.
      router.push(safeNext() ?? "/home");
    } catch (e) {
      if (e instanceof ApiError && e.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
        try {
          await resendEmailVerificationCode(email);
          setResendNotice(`We sent a fresh 6-digit code to ${email}.`);
        } catch (resendErr) {
          setError(resendErr instanceof Error ? resendErr.message : "Could not send a verification code. Try again.");
          setNeedsVerification(false);
        }
      } else {
        setError(e instanceof Error ? e.message : "Sign in failed. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyAndSignIn = async () => {
    if (otp.length < 6 || otpSubmitting) return;
    setOtpSubmitting(true);
    setOtpError(null);
    try {
      // Confirms the code (flips emailVerified server-side). Re-run signIn()
      // right after, rather than using verifyOtp()'s own token pair, so the
      // session gets the same accountType/creator-state hydration a normal
      // sign-in does -- WAWU ID's confirm response doesn't carry either.
      await verifyOtp({ email, code: otp });
      const res = await signIn({ email, password });
      signInUser(res.user, res.token);
      router.push("/home");
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "That code did not work.");
    } finally {
      setOtpSubmitting(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="flex min-h-screen flex-col justify-center px-5 py-10 xl:min-h-0 xl:justify-start xl:px-0 xl:py-0 xl:pt-0">
        {/*
          A PANEL, ON MOBILE ONLY.

          The form sits over moving footage here, and a label or a placeholder
          on a bright frame is the thing that makes video backgrounds unusable.
          This is what keeps the text, inputs and buttons at a fixed contrast
          whatever is playing behind them, while still letting the video read
          around and through it.

          xl: drops all of it. Desktop puts the video in the panel BESIDE the
          form, so the form itself is on plain background and needs nothing.
        */}
        <div className="flex flex-col gap-6 rounded-[20px] border border-white/10 bg-[rgba(11,10,13,0.62)] p-5 backdrop-blur-md xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:backdrop-blur-none">
          <Link href="/" aria-label="WAWUAfrica home" className="self-start xl:hidden">
            <img src="/wawu-logo-white.png" alt="WAWU" className="h-6 w-auto object-contain" />
          </Link>

          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[30px] font-bold leading-[1.12] tracking-[-0.03em]">Verify your email</h1>
            <p className="m-0 text-[14.5px] leading-normal text-text-secondary">
              Enter the 6-digit code sent to {email} to finish setting up your account.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <OtpInput value={otp} onChange={setOtp} />
            {resendNotice ? <p className="m-0 text-center text-[13px] text-text-secondary">{resendNotice}</p> : null}
            {otpError ? <p className="m-0 text-center text-[13px] font-medium text-danger">{otpError}</p> : null}
            <button
              type="button"
              onClick={async () => {
                setOtpError(null);
                setResendNotice(null);
                try {
                  await resendEmailVerificationCode(email);
                  setResendNotice(`We sent a fresh 6-digit code to ${email}.`);
                } catch (e) {
                  setOtpError(e instanceof Error ? e.message : "Could not resend the code.");
                }
              }}
              className="self-center text-[13.5px] font-semibold text-accent hover:text-text-primary"
            >
              Resend code
            </button>
          </div>

          <div className="flex flex-col gap-3.5 pt-1 xl:pt-0">
            <Button full size="lg" onClick={onVerifyAndSignIn} disabled={otp.length < 6 || otpSubmitting}>
              {otpSubmitting ? "Verifying…" : "Verify and sign in"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setNeedsVerification(false);
                setOtp("");
                setOtpError(null);
                setResendNotice(null);
              }}
              className="self-center text-[13px] font-semibold text-text-secondary hover:text-accent-hover"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-5 py-10 xl:min-h-0 xl:justify-start xl:px-0 xl:py-0 xl:pt-0">
      {/*
          A PANEL, ON MOBILE ONLY.

          The form sits over moving footage here, and a label or a placeholder
          on a bright frame is the thing that makes video backgrounds unusable.
          This is what keeps the text, inputs and buttons at a fixed contrast
          whatever is playing behind them, while still letting the video read
          around and through it.

          xl: drops all of it. Desktop puts the video in the panel BESIDE the
          form, so the form itself is on plain background and needs nothing.
        */}
        <div className="flex flex-col gap-6 rounded-[20px] border border-white/10 bg-[rgba(11,10,13,0.62)] p-5 backdrop-blur-md xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0 xl:backdrop-blur-none">
        <Link href="/" aria-label="WAWUAfrica home" className="self-start xl:hidden">
            <img src="/wawu-logo-white.png" alt="WAWU" className="h-6 w-auto object-contain" />
          </Link>

        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[30px] font-bold leading-[1.12] tracking-[-0.03em]">Welcome back</h1>
          <p className="m-0 text-[14.5px] leading-normal text-text-secondary">Sign in with your WAWU ID.</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="you@email.com"
            icon="Mail"
          />
          <div className="flex flex-col gap-2">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Your password"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="flex items-center gap-[7px] text-[12.5px] font-semibold text-text-secondary hover:text-accent-hover"
              >
                <Icon name={showPassword ? "EyeOff" : "Eye"} size={15} color="var(--text-muted)" strokeWidth={2.2} />
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>
            <Link href="/forgot-password" className="self-start text-[13.5px] font-semibold text-accent hover:text-text-primary">
              Forgot your password?
            </Link>
          </div>
          {error ? <p className="m-0 text-[13px] font-medium text-danger">{error}</p> : null}
        </div>

        <div className="flex flex-col gap-3.5 pt-1 xl:pt-0">
          <Button full size="lg" onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-[13px]">
            <span className="text-text-muted">New here?</span>
            <Link href="/sign-up" className="font-semibold text-accent hover:text-text-primary">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Where to land after signing in, from the `next` query param.
 *
 * Read off `window` rather than useSearchParams(), which opts the page out of
 * static prerendering unless wrapped in a Suspense boundary. Only called from
 * a submit handler, so `window` always exists.
 *
 * Only same-origin, absolute-path destinations are followed. A `next` of
 * "https://evil.example" or "//evil.example" would otherwise turn the sign-in
 * screen into an open redirect.
 */
function safeNext(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("next");
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
