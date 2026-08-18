"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { OtpInput } from "../../components/OtpInput";
import { useAuthBrand } from "../../components/AuthBrand";
import { useSession } from "@/lib/auth/session-provider";
import { resendEmailVerificationCode, signUp, verifyOtp } from "@/lib/api/auth";
import type { AccountType } from "@/types/account";

const COUNTRIES: Record<string, string[]> = {
  Nigeria: ["Abia", "Anambra", "Enugu", "Kano", "Kaduna", "Lagos", "Rivers"],
  Ghana: [],
  Kenya: ["Mombasa", "Nairobi"],
};

const INTERESTS = ["Business", "Agriculture", "Finance", "Trade", "Entertainment", "Career", "Education", "Health", "Technology", "Creative Arts", "Culture"];

const INTERESTS_MIN = 5;

type Step = "type" | "identity" | "details" | "otp" | "done" | "interests";

interface OtpState {
  email: string;
  phone: string;
  fullName: string;
  accountType: AccountType;
}

export function SignUpFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInUser, setInterests: persistInterests } = useSession();

  const [step, setStep] = useState<Step>("type");
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [identity, setIdentity] = useState({ fullName: "", email: "", password: "", phone: "", phoneCountryCode: "+234" });
  const [details, setDetails] = useState({ country: "Nigeria", region: "Enugu", occupation: "", gender: "female" as "female" | "male" | "unspecified" | null, acceptedTerms: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpState, setOtpState] = useState<OtpState | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(42);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "creator") setAccountType("creator");
  }, [searchParams]);

  useEffect(() => {
    if (step !== "otp") return;
    const t = setInterval(() => {
      setResendSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  const identityError = useMemo(() => {
    if (!identity.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) {
      return identity.password && identity.password.length < 8 ? "Too short, use at least 8 characters." : null;
    }
    return "That email address is not complete.";
  }, [identity.email, identity.password]);

  const identitySummary = useMemo(() => {
    const emailInvalid = Boolean(identity.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email));
    const passwordInvalid = Boolean(identity.password && identity.password.length < 8);
    const count = Number(emailInvalid) + Number(passwordInvalid);
    if (count === 0) return null;
    return count === 1
      ? "One field needs attention before you can continue."
      : `${count} fields need attention before you can continue.`;
  }, [identity.email, identity.password]);

  const regionOptions = COUNTRIES[details.country] ?? [];
  const hasRegion = regionOptions.length > 0;

  const onContinueIdentity = () => {
    if (identityError || !identity.fullName || !identity.phone) return;
    setStep("details");
  };

  const onCreateAccount = async () => {
    if (!details.acceptedTerms) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await signUp({
        ...identity,
        ...details,
        accountType,
      });
      setOtpState({ email: identity.email, phone: identity.phone, fullName: identity.fullName, accountType });
      setStep("otp");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!otpState || otp.length < 6) return;
    setSubmitting(true);
    setOtpError(null);
    try {
      const res = await verifyOtp({ email: otpState.email, code: otp });
      signInUser({ ...res.user, fullName: otpState.fullName, accountType: otpState.accountType }, res.token);
      setStep("done");
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "That code did not work.");
    } finally {
      setSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    if (!otpState || resendSeconds > 0 || resending) return;
    setResending(true);
    setResendError(null);
    try {
      await resendEmailVerificationCode(otpState.email);
      setResendSeconds(42);
      setOtp("");
    } catch (e) {
      setResendError(e instanceof Error ? e.message : "Could not resend the code.");
    } finally {
      setResending(false);
    }
  };

  const onFinishInterests = () => {
    if (interests.length < INTERESTS_MIN) return;
    persistInterests(interests);
    // Creators go straight into onboarding (tier -> payment -> KYC).
    // Users land on the feed.
    router.push(otpState?.accountType === "creator" ? "/onboarding" : "/home");
  };

  const stepLabel = step === "otp" ? "Step 2 of 3" : step === "interests" ? "Step 3 of 3" : "Step 1 of 3";

  // Desktop: the step progress moves into the brand panel instead of sitting
  // atop the form. The "how will you use WAWU" screen keeps the marketing
  // panel (testimonial) — the numbered list only starts once the account
  // creation flow itself begins.
  useAuthBrand(
    step === "type"
      ? { kind: "marketing" }
      : { kind: "steps", current: step === "otp" ? 2 : step === "interests" ? 3 : 1, steps: ["Your details", "Verify your email", "Pick five interests"] },
  );

  if (step === "type") {
    return (
      <div className="flex min-h-screen flex-col xl:min-h-0">
        <div className="flex flex-1 flex-col gap-5 px-5 pb-5 pt-[34px] xl:flex-none xl:px-0 xl:pb-0 xl:pt-0">
          <img src="/wawu-logo-white.png" alt="WAWU" className="h-6 w-auto self-start object-contain xl:hidden" />
          <div className="flex flex-col gap-2">
            <h2 className="m-0 text-[30px] font-bold leading-[1.12] tracking-[-0.03em]">What brings you to WAWU?</h2>
            <p className="m-0 text-[14.5px] leading-normal text-text-secondary">You can switch to a creator account later, nothing here is permanent.</p>
          </div>
          <button
            type="button"
            onClick={() => setAccountType("user")}
            className={`flex gap-3.5 rounded-card border bg-card p-4 text-left ${
              accountType === "user" ? "border-accent" : "border-hairline"
            }`}
          >
            <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-tag text-text-secondary">
              <Icon name="Compass" size={19} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[17px] font-semibold text-text-primary">I&apos;m here to discover</span>
                <StatusPill kind="neutral">Free</StatusPill>
              </span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-text-secondary">
                Browse and unlock content, message creators, join communities, shop the marketplace.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("creator")}
            className={`flex flex-col gap-4 rounded-card border bg-elevated p-[18px] text-left ${
              accountType === "creator" ? "border-accent" : "border-hairline"
            }`}
          >
            <span className="flex gap-3.5">
              <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border border-accent bg-accent-tint">
                <Icon name="Upload" size={19} color="var(--accent)" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold text-text-primary">I want to create and earn</span>
                <span className="mt-1 block text-[13.5px] leading-relaxed text-text-secondary">
                  Everything above, plus upload and price your work, paid DMs, host communities, and keep 85%, 90% on Pro.
                </span>
              </span>
            </span>
          </button>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-hairline bg-surface-page px-5 pb-[26px] pt-4 xl:mt-6 xl:border-0 xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0">
          <Button full size="lg" iconRight="ArrowRight" onClick={() => setStep("identity")}>
            Continue
          </Button>
          <Button full variant="ghost" href="/sign-in">
            I already have an account
          </Button>
        </div>
      </div>
    );
  }

  if (step === "identity") {
    return (
      <AuthScaffold title="Create your account" stepLabel={stepLabel} onBack={() => setStep("type")}>
        <div className="flex flex-col gap-4">
          {identitySummary ? (
            <div className="flex items-start gap-2.5 rounded-input border border-danger/30 bg-danger-tint px-3.5 py-3">
              <Icon name="CircleAlert" size={16} color="var(--danger)" strokeWidth={2.2} className="mt-0.5" />
              <span className="flex-1 text-[13.5px] leading-[1.45] text-danger">{identitySummary}</span>
            </div>
          ) : null}
          {accountType === "creator" ? (
            <div className="flex items-center gap-2.5 rounded-input border border-accent bg-accent-tint px-3.5 py-[11px]">
              <Icon name="Upload" size={16} color="var(--accent)" strokeWidth={2.2} />
              <span className="flex-1 text-[13.5px] font-semibold">Creator account</span>
              <button type="button" onClick={() => setStep("type")} className="text-[13px] font-semibold text-accent">
                Change
              </button>
            </div>
          ) : null}
          <Input
            label="Full name"
            value={identity.fullName}
            onChange={(e) => setIdentity({ ...identity, fullName: e.target.value })}
            placeholder="Ada Okeke"
          />
          <Input
            label="Email"
            type="email"
            value={identity.email}
            onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
            error={identity.email ? identityError ?? undefined : undefined}
            placeholder="you@email.com"
          />
          <Input
            label="Password"
            type="password"
            value={identity.password}
            onChange={(e) => setIdentity({ ...identity, password: e.target.value })}
            hint="At least 8 characters."
            error={identity.password ? (identity.password.length < 8 ? "Too short, use at least 8 characters." : undefined) : undefined}
          />
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-text-secondary">Phone</span>
            <div className="flex gap-2">
              <div className="flex h-[52px] shrink-0 items-center gap-[7px] rounded-input border border-hairline bg-input px-3.5 text-[15px] font-semibold">
                {identity.phoneCountryCode}
                <Icon name="ChevronDown" size={15} color="var(--text-muted)" strokeWidth={2.2} />
              </div>
              <input
                value={identity.phone}
                onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                placeholder="803 000 0000"
                inputMode="tel"
                className="h-[52px] flex-1 rounded-input border border-hairline bg-input px-4 text-[15px] outline-none placeholder:text-text-disabled [font-feature-settings:var(--font-feature-tabular)]"
                aria-label="Phone number"
              />
            </div>
          </div>
        </div>
        <Footer>
          <Button full size="lg" iconRight="ArrowRight" onClick={onContinueIdentity} disabled={Boolean(identityError) || !identity.fullName || !identity.phone}>
            Continue
          </Button>
          <SecuredByWawuId />
        </Footer>
      </AuthScaffold>
    );
  }

  if (step === "details") {
    const regionEmpty = !hasRegion;
    return (
      <AuthScaffold title="A bit about you" stepLabel={stepLabel} onBack={() => setStep("identity")}>
        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-2">
            <label htmlFor="signup-country" className="text-[13px] font-semibold text-text-secondary">
              Country
            </label>
            <div className="relative flex h-[52px] items-center rounded-input border border-hairline bg-input">
              <select
                id="signup-country"
                value={details.country}
                onChange={(e) => {
                  const country = e.target.value;
                  const regions = COUNTRIES[country] ?? [];
                  setDetails({ ...details, country, region: regions[0] ?? "" });
                }}
                className="h-full w-full appearance-none bg-transparent px-4 pr-10 text-[15px] text-text-primary outline-none"
              >
                {Object.keys(COUNTRIES).map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <Icon
                name="ChevronDown"
                size={16}
                color="var(--text-muted)"
                strokeWidth={2.2}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
              />
            </div>
            <span className="text-[12px] text-text-muted">Sets your national-ID field at verification.</span>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="signup-region" className="text-[13px] font-semibold text-text-secondary">
              {details.country === "Ghana" ? "Region" : "State"}
            </label>
            {regionEmpty ? (
              <div className="flex h-[52px] items-center gap-2.5 rounded-input border border-dashed border-hairline bg-input px-4 opacity-70">
                <span className="flex-1 text-[15px] text-text-disabled">No regions listed</span>
                <Icon name="Minus" size={16} color="var(--text-disabled)" strokeWidth={2.2} />
              </div>
            ) : (
              <div className="relative flex h-[52px] items-center rounded-input border border-hairline bg-input">
                <select
                  id="signup-region"
                  value={details.region}
                  onChange={(e) => setDetails({ ...details, region: e.target.value })}
                  className="h-full w-full appearance-none bg-transparent px-4 pr-10 text-[15px] text-text-primary outline-none"
                >
                  {regionOptions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                <Icon
                  name="ChevronDown"
                  size={16}
                  color="var(--text-muted)"
                  strokeWidth={2.2}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
            )}
            {regionEmpty ? <span className="text-[12px] text-text-muted">Ghana has no regions on file yet, skip this and continue.</span> : null}
          </div>
          <Input
            label="Occupation"
            value={details.occupation}
            onChange={(e) => setDetails({ ...details, occupation: e.target.value })}
            placeholder="e.g. Agripreneur"
          />
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-text-secondary">
              Gender <span className="font-medium text-text-muted">(optional)</span>
            </span>
            <div className="flex gap-2">
              {(
                [
                  ["female", "Female"],
                  ["male", "Male"],
                  ["unspecified", "Prefer not to say"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDetails({ ...details, gender: value })}
                  className={`h-11 flex-1 rounded-button text-[13.5px] font-semibold transition-colors ${
                    details.gender === value ? "bg-accent text-on-accent" : "border border-hairline bg-tag text-text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setDetails({ ...details, acceptedTerms: !details.acceptedTerms })} className="flex items-start gap-[11px] pt-0.5 text-left">
            <span
              className={`mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] ${
                details.acceptedTerms ? "bg-accent" : "border-[1.5px] border-danger bg-transparent"
              }`}
            >
              {details.acceptedTerms ? <Icon name="Check" size={14} color="var(--text-on-accent)" strokeWidth={3} /> : null}
            </span>
            <span className="flex flex-col gap-1 text-[13.5px] leading-normal text-text-secondary">
              <span>
                I agree to the <Link href="/terms">terms of service</Link> and <Link href="/privacy/policy">privacy policy</Link>.
              </span>
              {!details.acceptedTerms ? <span className="text-[12px] text-danger">You need to accept the terms to continue.</span> : null}
            </span>
          </button>
        </div>
        <Footer>
          <Button full size="lg" onClick={onCreateAccount} disabled={!details.acceptedTerms || submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
          <SecuredByWawuId />
        </Footer>
      </AuthScaffold>
    );
  }

  if (step === "otp") {
    return (
      <AuthScaffold title="Verify your email" stepLabel={stepLabel} onBack={() => setStep("details")} spaciousTop>
        <div className="flex flex-col gap-[26px]">
          <div className="flex flex-col gap-2.5">
            <h2 className="m-0 text-[26px] font-bold tracking-[-0.025em]">Enter the 6-digit code</h2>
            <p className="m-0 text-[14.5px] leading-normal text-text-secondary">
              We sent it to <span className="font-semibold text-text-primary">{otpState?.email}</span>. <Link href="/sign-in">Change email</Link>
            </p>
          </div>
          <OtpInput value={otp} onChange={setOtp} />
          {otpError ? <p className="m-0 text-[13px] font-medium text-danger">{otpError}</p> : null}
          {resendError ? <p className="m-0 text-[13px] font-medium text-danger">{resendError}</p> : null}
          <div className="flex items-center gap-2">
            <Icon name="Clock" size={15} color="var(--text-muted)" />
            {resendSeconds > 0 ? (
              <span className="text-[13.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
                Resend the code in 0:{String(resendSeconds).padStart(2, "0")}
              </span>
            ) : (
              <button
                type="button"
                onClick={onResendOtp}
                disabled={resending}
                className="text-[13.5px] font-semibold text-accent disabled:opacity-60"
              >
                {resending ? "Resending…" : "Resend the code"}
              </button>
            )}
          </div>
          <div className="flex items-start gap-2.5 rounded-input border border-hairline bg-card p-3.5">
            <Icon name="Info" size={16} color="var(--text-muted)" className="mt-0.5" />
            <span className="flex-1 text-[13px] leading-normal text-text-secondary">
              Codes come from WAWU ID and expire after 10 minutes. Check your spam folder if it has not arrived.
            </span>
          </div>
        </div>
        <Footer>
          <Button full size="lg" onClick={onVerifyOtp} disabled={otp.length < 6 || submitting}>
            {submitting ? "Verifying…" : "Verify"}
          </Button>
        </Footer>
      </AuthScaffold>
    );
  }

  if (step === "done") {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-[18px] px-8 py-10 text-center">
          <span className="grid h-[88px] w-[88px] place-items-center rounded-button border border-accent bg-accent-tint">
            <Icon name="Check" size={40} color="var(--accent)" strokeWidth={2.6} />
          </span>
          <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em]">Email verified</h2>
          <p className="m-0 max-w-[290px] text-[15px] leading-normal text-text-secondary">
            Your WAWU ID is live. One more step and we will know what to put in front of you.
          </p>
          <StatusPill kind="success">{accountType === "creator" ? "Creator account created" : "User account created"}</StatusPill>
        </div>
        <div className="px-5 pb-[26px] pt-4">
          <Button full size="lg" iconRight="ArrowRight" onClick={() => setStep("interests")}>
            Pick your interests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthScaffold title="What are you into?" stepLabel={stepLabel} onBack={() => setStep("done")} noBorder>
      <p className="m-0 text-[14.5px] leading-normal text-text-secondary">
        Pick at least {INTERESTS_MIN} so your feed starts with work you actually care about.
      </p>
      <div className="flex flex-wrap gap-[9px]">
        {INTERESTS.map((interest) => {
          const selected = interests.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() =>
                setInterests((prev) => (selected ? prev.filter((i) => i !== interest) : [...prev, interest]))
              }
              className={`inline-flex h-10 items-center gap-[7px] rounded-button px-4 text-[14px] transition-colors ${
                selected ? "bg-accent text-on-accent" : "border border-hairline bg-tag text-text-secondary"
              }`}
            >
              {selected ? <Icon name="Check" size={14} color="var(--text-on-accent)" strokeWidth={3} /> : null}
              {interest}
            </button>
          );
        })}
      </div>
      <Footer>
        <div className="flex items-center gap-[9px]">
          <div className="h-[5px] flex-1 overflow-hidden rounded-button bg-tag">
            <div
              className="h-full rounded-button bg-accent transition-all"
              style={{ width: `${Math.min(100, (interests.length / INTERESTS_MIN) * 100)}%` }}
            />
          </div>
          <span className="text-[12.5px] font-semibold text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
            {interests.length} of {INTERESTS_MIN}
          </span>
        </div>
        <Button full size="lg" onClick={onFinishInterests} disabled={interests.length < INTERESTS_MIN}>
          {interests.length >= INTERESTS_MIN ? "Start exploring" : `Pick ${INTERESTS_MIN - interests.length} more`}
        </Button>
      </Footer>
    </AuthScaffold>
  );
}

function AuthScaffold({
  title,
  stepLabel,
  onBack,
  children,
  noBorder = false,
  spaciousTop = false,
}: {
  title: string;
  stepLabel?: string;
  onBack?: () => void;
  children: React.ReactNode;
  noBorder?: boolean;
  spaciousTop?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col xl:min-h-0">
      <div className={`flex items-center gap-3 px-[18px] pb-3.5 pt-4 xl:px-0 ${noBorder ? "" : "border-b border-hairline xl:border-0"}`}>
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Back" className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag">
            <Icon name="ChevronLeft" size={18} color="var(--text-primary)" strokeWidth={2.2} />
          </button>
        ) : null}
        <span className="flex-1 text-[16px] font-semibold">{title}</span>
        {stepLabel ? (
          <span className="text-[12.5px] font-semibold text-text-muted [font-feature-settings:var(--font-feature-tabular)] xl:hidden">
            {stepLabel}
          </span>
        ) : null}
      </div>
      <div
        className={`flex flex-1 flex-col gap-4 px-5 pb-5 xl:flex-none xl:px-0 xl:pb-0 ${spaciousTop ? "pt-8" : "pt-[18px]"}`}
      >
        {children}
      </div>
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-hairline bg-surface-page px-5 pb-[26px] pt-4 xl:mt-6 xl:border-0 xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0">
      {children}
    </div>
  );
}

function SecuredByWawuId() {
  return (
    <span className="flex items-center justify-center gap-[7px] text-[12px] text-text-muted">
      <Icon name="ShieldCheck" size={13} color="var(--text-muted)" />
      Secured by WAWU ID
    </span>
  );
}