"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { StateCard } from "@/app/join/components/StateCard";
import { saveNewPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

/**
 * `appOnly` is join-only mode (src/lib/site-mode.ts, R-123): the web has no
 * sign-in then, so this page never links to one. It ends by sending the person
 * back to the Who Made This? app, and a link that has expired or was already
 * used says so and sends them to the app's Forgot password for a new one.
 * Without it the form is exactly what it was.
 */
export function ResetPasswordForm({ appOnly = false }: { appOnly?: boolean }) {
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
  // WAWU ID answers 401 "Invalid or expired reset token" for a token that is
  // wrong, past its hour, or already used (it deletes every token on success).
  const [linkDead, setLinkDead] = useState(false);

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
      if (appOnly && e instanceof ApiError && e.status === 401) setLinkDead(true);
      else setError(e instanceof Error ? e.message : "Could not update your password. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (appOnly) {
    // A link with no token or no address cannot work either: the same screen.
    if (linkDead || !token || !email) {
      return (
        <StateCard icon="Clock" tone="warning" title="This link has expired">
          <p className="m-0">This link has expired or was already used.</p>
          <p className="m-0">Go back to the Who Made This? app, tap Forgot password and ask for a new link.</p>
        </StateCard>
      );
    }
    if (done) {
      return (
        <StateCard icon="CircleCheck" tone="success" title="Password changed">
          <p className="m-0">
            Your password is changed. Go back to the Who Made This? app and sign in with your new password.
          </p>
        </StateCard>
      );
    }
    return (
      <section className="flex flex-col gap-6 rounded-card border border-hairline bg-card px-6 py-8 dt:px-9 dt:py-10">
        <div className="flex flex-col gap-2.5">
          <h1 className="m-0 text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-text-primary">
            Set a new password
          </h1>
          <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">
            Choose a new password, then go back to the Who Made This? app and sign in with it.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Input
            label="New password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            noZoom
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
            autoComplete="new-password"
            noZoom
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
          {error ? (
            <p role="alert" className="m-0 text-[13px] font-medium text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <Button full size="lg" onClick={onSubmit} disabled={!canSubmit}>
          {submitting ? "Saving…" : "Save new password"}
        </Button>
      </section>
    );
  }

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
        </div>
        <div className="px-5 pb-[26px] pt-4">
          <Button full size="lg" onClick={() => router.push("/sign-in")}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col xl:min-h-0">
      <div className="flex items-center gap-3 px-[18px] pb-3.5 pt-4 xl:px-0">
        <Link
          href="/sign-in"
          aria-label="Back"
          className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag hover:bg-surface-hover active:bg-surface-press"
        >
          <Icon name="ChevronLeft" size={18} color="var(--text-primary)" strokeWidth={2.2} />
        </Link>
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
        <Button full variant="ghost" href="/sign-in">
          Back to sign in
        </Button>
      </div>
    </div>
  );
}