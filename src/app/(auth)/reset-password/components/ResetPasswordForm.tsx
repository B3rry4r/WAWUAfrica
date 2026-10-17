"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { saveNewPassword } from "@/lib/api/auth";

/**
 * `signInHref` is where "sign in" leads. null means the site does not serve a
 * sign-in page right now (join-only mode): the links to it are not drawn and the
 * page points the person to the app instead.
 */
export function ResetPasswordForm({ signInHref = "/sign-in" }: { signInHref?: string | null }) {
  const router = useRouter();
  // WAWU ID's forgot-password (email-link path) builds the reset URL as
  // /reset-password?token=...&email=... — see auth.service.ts resetPasswordByToken.
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValid = password.length >= 8;
  const confirmValid = confirm === password && confirm.length >= 8;
  const canSubmit = passwordValid && confirmValid && !submitting && !done;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveNewPassword({ password, confirmPassword: confirm, token, email });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update your password. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-[18px] px-8 py-10 text-center">
          <span className="grid h-[88px] w-[88px] place-items-center rounded-button border border-decor bg-decor-tint">
            <Icon name="KeyRound" size={40} color="var(--accent)" strokeWidth={2.2} />
          </span>
          <h1 className="m-0 text-[28px] font-bold tracking-[-0.03em]">Password updated</h1>
          <p className="m-0 max-w-[290px] text-[15px] leading-normal text-text-secondary">
            Your new password is active. Next time you sign in, use the one you just set.
          </p>
          <StatusPill kind="success">All done</StatusPill>
          {signInHref ? null : (
            <p className="m-0 max-w-[290px] text-[15px] leading-normal text-text-secondary">Open the WAWU app to sign in.</p>
          )}
        </div>
        {signInHref ? (
          <div className="px-5 pb-[26px] pt-4">
            <Button full size="lg" onClick={() => router.push(signInHref)}>
              Sign in
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col xl:min-h-0">
      <div className="flex items-center gap-3 px-[18px] pb-3.5 pt-4 xl:px-0">
        {signInHref ? (
          <Link
            href={signInHref}
            aria-label="Back"
            className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag hover:bg-surface-hover active:bg-surface-press"
          >
            <Icon name="ChevronLeft" size={18} color="var(--text-primary)" strokeWidth={2.2} />
          </Link>
        ) : null}
        <span className="flex-1 text-[16px] font-semibold">Set a new password</span>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pb-5 pt-4 xl:flex-none xl:px-0">
        <div className="flex flex-col gap-2.5">
          <h1 className="m-0 text-[30px] font-bold leading-[1.12] tracking-[-0.03em]">Choose something new</h1>
          <p className="m-0 text-[14.5px] leading-normal text-text-secondary">
            You will be signed in on this device once it is saved.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Input
            label="New password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="At least 8 characters"
            hint="At least 8 characters."
            error={password ? (passwordValid ? undefined : "Too short, use at least 8 characters.") : undefined}
          />
          <Input
            label="Confirm new password"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError(null);
            }}
            placeholder="Type it once more"
            error={confirm ? (confirmValid ? undefined : "Passwords do not match.") : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="flex items-center gap-[7px] self-start text-[12.5px] font-semibold text-text-secondary hover:text-accent-hover"
          >
            <Icon name={showPassword ? "EyeOff" : "Eye"} size={15} color="var(--text-muted)" strokeWidth={2.2} />
            {showPassword ? "Hide passwords" : "Show passwords"}
          </button>
          {error ? <p className="m-0 text-[13px] font-medium text-danger">{error}</p> : null}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-hairline bg-surface-page px-5 pb-[26px] pt-4 xl:mt-6 xl:border-0 xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0">
        <Button full size="lg" onClick={onSubmit} disabled={!canSubmit}>
          {submitting ? "Saving…" : "Save new password"}
        </Button>
        {signInHref ? (
          <Button full variant="ghost" href={signInHref}>
            Back to sign in
          </Button>
        ) : null}
      </div>
    </div>
  );
}