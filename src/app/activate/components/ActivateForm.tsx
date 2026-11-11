"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { StateCard } from "@/app/join/components/StateCard";
import { activateAccount } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { appUrl } from "@/lib/app-redirects";

/**
 * Sets the first password from the activation mail. WAWU ID answers 401 for a token that is wrong, expired or already
 * used, and 400 "Account already activated" when the account has a password: both are the same sentence here and
 * both lead to /forgot-password. A link with no token or no address cannot work either: the same screen.
 */
export function ActivateForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkDead, setLinkDead] = useState(false);

  const passwordValid = password.length >= 8;
  const confirmValid = confirm === password && confirm.length >= 8;
  const canSubmit = passwordValid && confirmValid && !submitting && !done;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await activateAccount({ password, token, email });
      setDone(true);
    } catch (e) {
      const used = e instanceof ApiError && (e.status === 401 || (e.status === 400 && /already activated/i.test(e.serverMessage ?? e.message)));
      if (used) setLinkDead(true);
      else setError(e instanceof Error ? e.message : "Could not save your password. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (linkDead || !token || !email) {
    return (
      <StateCard
        icon="Clock"
        tone="warning"
        title="This link has expired"
        actions={
          <>
            <Button full size="lg" href="/forgot-password">
              Get a new link
            </Button>
            <Button full variant="ghost" href={appUrl("/sign-in")}>
              Sign in on Who Made This
            </Button>
          </>
        }
      >
        <p className="m-0">This link has expired or was already used. If you already set a password, sign in with it.</p>
        <p className="m-0">Otherwise ask for a new link and we will email it to you.</p>
      </StateCard>
    );
  }

  if (done) {
    return (
      <StateCard
        icon="CircleCheck"
        tone="success"
        title="Your account is ready"
        actions={
          <Button full size="lg" href={appUrl("/sign-in")}>
            Sign in on Who Made This
          </Button>
        }
      >
        <p className="m-0">Your password is saved. Sign in with {email} and the password you just chose.</p>
      </StateCard>
    );
  }

  return (
    <section className="flex flex-col gap-6 rounded-card border border-hairline bg-card px-6 py-8 dt:px-9 dt:py-10">
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-text-primary">Set your password</h1>
        <p className="m-0 text-[14.5px] leading-[1.55] text-text-secondary">
          Choose a password for <span className="break-all font-semibold text-text-primary">{email}</span>, then sign in with it on Who Made This.
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
        {submitting ? "Saving…" : "Save password"}
      </Button>
    </section>
  );
}
