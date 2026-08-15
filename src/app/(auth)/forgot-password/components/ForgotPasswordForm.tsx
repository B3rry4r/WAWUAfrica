"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { requestPasswordReset } from "@/lib/api/auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = Boolean(emailValid) && !submitting && !sent;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset({ email });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the link. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col xl:min-h-0">
      <div className="flex items-center gap-3 px-[18px] pb-3.5 pt-4 xl:px-0">
        <Link
          href="/sign-in"
          aria-label="Back"
          className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag"
        >
          <Icon name="ChevronLeft" size={18} color="var(--text-primary)" strokeWidth={2.2} />
        </Link>
        <span className="flex-1 text-[16px] font-semibold">Forgot password</span>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pb-5 pt-4 xl:flex-none xl:px-0">
        {sent ? (
          <div className="flex flex-col items-start gap-4">
            <span className="grid h-[72px] w-[72px] place-items-center rounded-button border border-accent bg-accent-tint">
              <Icon name="MailCheck" size={32} color="var(--accent)" strokeWidth={2.2} />
            </span>
            <h1 className="m-0 text-[26px] font-bold leading-[1.15] tracking-[-0.025em]">Check your email</h1>
            <p className="m-0 text-[14.5px] leading-relaxed text-text-secondary">
              We sent a reset link to <span className="font-semibold text-text-primary">{email}</span>. It expires in 30 minutes — follow it to pick a new password.
            </p>
            <StatusPill kind="info">Reset email sent</StatusPill>
            <div className="mt-2 flex flex-col gap-3">
              <Button full variant="secondary" size="lg" onClick={() => setSent(false)}>
                Use a different email
              </Button>
              <Button full size="lg" href="/sign-in">
                Back to sign in
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              <h1 className="m-0 text-[30px] font-bold leading-[1.12] tracking-[-0.03em]">Forgot password?</h1>
              <p className="m-0 text-[14.5px] leading-normal text-text-secondary">
                No stress. Tell us the email and we will send you a link to set a new one.
              </p>
            </div>
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
              error={error ?? undefined}
            />
          </div>
        )}
      </div>

      {!sent ? (
        <div className="mt-auto flex flex-col gap-3 border-t border-hairline bg-surface-page px-5 pb-[26px] pt-4 xl:mt-6 xl:border-0 xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0">
          <Button full size="lg" onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
          <Button full variant="ghost" href="/sign-in">
            Back to sign in
          </Button>
        </div>
      ) : null}
    </div>
  );
}