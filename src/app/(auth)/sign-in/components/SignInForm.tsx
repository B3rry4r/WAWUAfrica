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
      // Creator onboarding (/create) is Dev B's; land everyone on the feed for now.
      router.push("/");
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
      router.push("/");
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "That code did not work.");
    } finally {
      setOtpSubmitting(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="flex min-h-screen flex-col px-5 pt-11 xl:min-h-0 xl:px-0 xl:pt-0">
        <div className="flex flex-1 flex-col gap-6 xl:flex-none">
          <img src="/wawu-logo-white.png" alt="WAWU" className="h-6 w-auto self-start object-contain xl:hidden" />

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
              className="self-center text-[13.5px] font-semibold text-accent"
            >
              Resend code
            </button>
          </div>

          <div className="-mx-5 mt-auto flex flex-col gap-3.5 border-t border-hairline bg-surface-page px-5 pb-[26px] pt-4 xl:mx-0 xl:border-0 xl:bg-transparent xl:px-0 xl:pb-0">
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
              className="self-center text-[13px] font-semibold text-text-secondary"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-11 xl:min-h-0 xl:px-0 xl:pt-0">
      <div className="flex flex-1 flex-col gap-6 xl:flex-none">
        <img src="/wawu-logo-white.png" alt="WAWU" className="h-6 w-auto self-start object-contain xl:hidden" />

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
                className="flex items-center gap-[7px] text-[12.5px] font-semibold text-text-secondary"
              >
                <Icon name={showPassword ? "EyeOff" : "Eye"} size={15} color="var(--text-muted)" strokeWidth={2.2} />
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>
            <Link href="/forgot-password" className="self-start text-[13.5px] font-semibold text-accent">
              Forgot your password?
            </Link>
          </div>
          {error ? <p className="m-0 text-[13px] font-medium text-danger">{error}</p> : null}
        </div>

        <div className="-mx-5 mt-auto flex flex-col gap-3.5 border-t border-hairline bg-surface-page px-5 pb-[26px] pt-4 xl:mx-0 xl:border-0 xl:bg-transparent xl:px-0 xl:pb-0">
          <Button full size="lg" onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-[13px]">
            <span className="text-text-muted">New here?</span>
            <Link href="/sign-up" className="font-semibold text-accent">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}