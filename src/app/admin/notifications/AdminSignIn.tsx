"use client";

import { useState } from "react";
import { Icon, Input } from "@/components/ui";
import { adminSignIn } from "@/lib/api/notifications";
import { describeError } from "@/lib/api/errors";

/**
 * The admin front door for the composer.
 *
 * A separate identity from the app's: the Hub issues an HS256 admin token
 * from POST /admin/auth/login against its own AdminUser table, and a WAWU ID
 * user token cannot satisfy the admin guard at all (different key, different
 * algorithm). So this is a real sign-in, not a role check on the signed-in
 * user, and it is the only way onto this screen.
 */
export function AdminSignIn({ onSignedIn, title = "Push notifications" }: { onSignedIn: () => void; title?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminSignIn(email.trim(), password);
      onSignedIn();
    } catch (err) {
      setError(describeError(err).body);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col gap-5 px-4 py-16">
      <div className="flex flex-col gap-2">
        <span className="grid h-[40px] w-[40px] place-items-center rounded-full border border-hairline bg-tag text-text-secondary">
          <Icon name="Megaphone" size={18} />
        </span>
        <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
          {title}
        </h1>
        <p className="m-0 text-[13.5px] leading-relaxed text-text-secondary">
          Sign in with your WAWU admin account. This is a different login from the app.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          label="Admin email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error ? (
          <p className="m-0 flex items-start gap-2 text-[12.5px] leading-relaxed text-danger">
            <Icon name="CircleAlert" size={14} color="var(--danger)" />
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !email || !password}
          className="mt-1 h-[46px] rounded-button bg-text-primary px-5 text-[14px] font-semibold text-page transition-colors hover:bg-text-secondary active:bg-text-muted disabled:cursor-not-allowed disabled:border disabled:border-hairline disabled:bg-tag disabled:text-text-disabled"
        >
          {busy ? "Checking..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
