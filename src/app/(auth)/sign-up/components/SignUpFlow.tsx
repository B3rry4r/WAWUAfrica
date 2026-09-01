"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkReferralCode, getSignupState, type ReferralCodeCheck } from "@/lib/api/referral";
import { describeError } from "@/lib/api/errors";
import { referralStorage } from "@/lib/auth/referral-storage";
import { formatNaira } from "@/lib/format";
import { PLANS } from "@/types/subscription";
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
import { COUNTRIES, subdivisionLabelFor, subdivisionsFor } from "@/lib/geo";

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
  /**
   * Whether a regular account can be opened at all right now.
   *
   * `null` while unknown. The discover card is NOT blurred during that
   * moment: flashing a locked door and then unlocking it is worse than a beat
   * of nothing, and the server refuses regardless if it really is closed.
   */
  const [userSignupOpen, setUserSignupOpen] = useState<boolean | null>(null);
  const [referral, setReferral] = useState("");
  const [referralCheck, setReferralCheck] = useState<ReferralCodeCheck | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  const [identity, setIdentity] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    phoneCountryCode: "+234",
  });

  // What everything downstream still wants as one string. Middle name is
  // included so the display name matches the ID the KYC reviewer holds.
  const fullName = [identity.firstName, identity.middleName, identity.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  const [details, setDetails] = useState({ country: "Nigeria", region: "", occupation: "", gender: "female" as "female" | "male" | "unspecified" | null, acceptedTerms: false });
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
    void getSignupState().then((state) => {
      setUserSignupOpen(state.userSignupEnabled);
      // Nobody may sit on a choice that is closed. If they arrived with
      // "user" selected and it has since shut, move them to the one that is
      // actually open rather than letting Continue fail later.
      if (!state.userSignupEnabled) setAccountType("creator");
    });
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

  const regionOptions = subdivisionsFor(details.country);
  const hasRegion = regionOptions.length > 0;

  const onContinueIdentity = () => {
    if (identityError || !identity.firstName.trim() || !identity.lastName.trim() || !identity.phone) return;
    setStep("details");
  };

  async function applyReferral() {
    setCheckingReferral(true);
    setReferralError(null);
    try {
      const check = await checkReferralCode(referral);
      setReferralCheck(check);
      // Remembered so the subscription step can price with it without asking
      // for the same code a second time.
      referralStorage.set(check.code);
      // A valid code is the invitation, so it opens the closed option too.
      if (userSignupOpen === false) setUserSignupOpen(true);
    } catch (e) {
      setReferralCheck(null);
      referralStorage.clear();
      setReferralError(describeError(e).body);
    } finally {
      setCheckingReferral(false);
    }
  }

  const onCreateAccount = async () => {
    if (!details.acceptedTerms) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await signUp({
        ...identity,
        fullName,
        ...details,
        accountType,
      });
      setOtpState({ email: identity.email, phone: identity.phone, fullName, accountType });
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
          <Link href="/" aria-label="WAWUAfrica home" className="self-start xl:hidden">
            <img src="/wawu-logo-white.png" alt="WAWU" className="h-6 w-auto object-contain" />
          </Link>
          <div className="flex flex-col gap-2">
            <h2 className="m-0 text-[30px] font-bold leading-[1.12] tracking-[-0.03em]">What brings you to WAWU?</h2>
            <p className="m-0 text-[14.5px] leading-normal text-text-secondary">
              {userSignupOpen === false
                ? // "Switch later" is the wrong promise when only one option is
                  // open — it offers a choice that is not on the screen.
                  "Creator accounts are open now. The rest follows shortly."
                : "You can switch to a creator account later, nothing here is permanent."}
            </p>
          </div>
          {/*
            The discover account, closed for launch.

            Blurred rather than removed: taking the card away would say WAWU
            has no such thing, which is wrong and would read as a product
            decision instead of a queue. Left in place and blurred, with the
            reason on top, it says "not yet" — which is the truth.

            aria-hidden + inert on the blurred copy, because a card a sighted
            user cannot reach must not still be tabbable or announced; the
            notice above it carries the meaning for a screen reader.
          */}
          <div className="relative">
            <div
              className={userSignupOpen === false ? "pointer-events-none select-none blur-[3px] opacity-55" : ""}
              aria-hidden={userSignupOpen === false}
              {...(userSignupOpen === false ? { inert: "" as unknown as boolean } : {})}
            >
              <button
                type="button"
                disabled={userSignupOpen === false}
                onClick={() => setAccountType("user")}
                className={`flex w-full gap-3.5 rounded-card border bg-card p-4 text-left hover:bg-surface-hover active:bg-surface-press ${
                  accountType === "user" ? "border-selected" : "border-hairline"
                }`}
              >
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-tag text-text-secondary">
                  <Icon name="Compass" size={19} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[17px] font-semibold text-text-primary">I&apos;m here to discover</span>
                    <StatusPill kind="neutral">No subscription</StatusPill>
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-relaxed text-text-secondary">
                    Browse and unlock content, message creators, join communities, shop the marketplace.
                  </span>
                </span>
              </button>
            </div>

            {userSignupOpen === false ? (
              <div className="absolute inset-0 flex items-center justify-center p-3">
                <div className="flex max-w-[92%] items-start gap-2.5 rounded-input border border-hairline bg-[rgba(11,10,13,0.88)] px-3.5 py-[11px] backdrop-blur-sm">
                  <Icon name="Clock" size={16} color="var(--accent)" strokeWidth={2.2} className="mt-0.5 shrink-0" />
                  <span className="text-[12.5px] leading-[1.45] text-text-secondary">
                    <span className="font-semibold text-text-primary">Not open yet.</span>{" "}
                    We are onboarding creators first. Accounts for discovering and buying
                    open shortly — create a creator account below, or use the code you
                    were given.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setAccountType("creator")}
            className={`flex flex-col gap-4 rounded-card border bg-elevated p-[18px] text-left hover:bg-surface-hover active:bg-surface-press ${
              accountType === "creator" ? "border-selected" : "border-hairline"
            }`}
          >
            <span className="flex gap-3.5">
              <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border border-decor bg-decor-tint">
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

          {/*
            The referral code.

            It does two jobs, which is why it sits on this step rather than
            beside a price: it is the invitation that opens the discover
            account while regular signup is closed, AND the discount carried
            forward to whatever plan they buy. Applying it here means somebody
            who was sent a code never has to find where to type it later.
          */}
          <div className="flex flex-col gap-2 rounded-card border border-hairline bg-card p-4">
            <span className="text-[13.5px] font-semibold text-text-primary">Have a referral code?</span>
            <div className="flex gap-2">
              <input
                value={referral}
                onChange={(e) => {
                  setReferral(e.target.value);
                  setReferralError(null);
                  setReferralCheck(null);
                }}
                placeholder="Enter your code"
                aria-label="Referral code"
                autoCapitalize="characters"
                className="h-[46px] min-w-0 flex-1 rounded-input border border-hairline bg-input px-3.5 text-[14px] uppercase outline-none placeholder:normal-case placeholder:text-text-disabled"
              />
              <Button
                variant="secondary"
                onClick={() => void applyReferral()}
                loading={checkingReferral}
                disabled={checkingReferral || referral.trim().length < 3}
              >
                Apply
              </Button>
            </div>
            {referralCheck ? (
              <span className="flex items-start gap-1.5 text-[12.5px] leading-[1.45] text-success">
                <Icon name="Check" size={14} color="var(--success)" strokeWidth={2.6} className="mt-0.5 shrink-0" />
                {referralCheck.discountPercent > 0 ? (
                  <span>
                    {referralCheck.discountPercent}% off {PLANS[referralCheck.tier].name} —{" "}
                    <s className="text-text-muted">{formatNaira(referralCheck.originalPriceNaira)}</s>{" "}
                    <span className="font-semibold text-text-primary">{formatNaira(referralCheck.priceNaira)}</span>
                  </span>
                ) : (
                  // A 0% code is an invitation, not a discount. Saying "0% off"
                  // would read as a broken code rather than an open door.
                  <span>Code accepted. You can create your account.</span>
                )}
              </span>
            ) : null}
            {referralError ? (
              <span className="text-[12.5px] leading-[1.45] text-danger">{referralError}</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-hairline bg-surface-page px-5 pb-[26px] pt-4 xl:mt-6 xl:border-0 xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0">
          <Button
            full
            size="lg"
            iconRight="ArrowRight"
            // Closed + no accepted code + the closed option selected is the one
            // combination that cannot proceed.
            disabled={userSignupOpen === false && accountType === "user" && !referralCheck}
            onClick={() => setStep("identity")}
          >
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
            <div className="flex items-center gap-2.5 rounded-input border border-decor bg-decor-tint px-3.5 py-[11px]">
              <Icon name="Upload" size={16} color="var(--accent)" strokeWidth={2.2} />
              <span className="flex-1 text-[13.5px] font-semibold">Creator account</span>
              <button type="button" onClick={() => setStep("type")} className="text-[13px] font-semibold text-accent hover:text-text-primary">
                Change
              </button>
            </div>
          ) : null}
          {/*
            Three fields, not one "Full name" box.

            The single box was split on the first space, so "Ada Chidinma
            Okeke" was stored with a surname of "Chidinma Okeke". KYC here is
            a manual review against a government ID, and that record does not
            match the document a reviewer is holding — which is also why the
            note below is a requirement rather than a nicety.
          */}
          <Input
            label="First name"
            value={identity.firstName}
            onChange={(e) => setIdentity({ ...identity, firstName: e.target.value })}
            placeholder="Ada"
          />
          <Input
            label="Middle name (optional)"
            value={identity.middleName}
            onChange={(e) => setIdentity({ ...identity, middleName: e.target.value })}
            placeholder="Chidinma"
          />
          <Input
            label="Last name"
            value={identity.lastName}
            onChange={(e) => setIdentity({ ...identity, lastName: e.target.value })}
            placeholder="Okeke"
          />
          <div className="flex items-start gap-2.5 rounded-input border border-hairline bg-input px-3.5 py-[11px]">
            <Icon name="IdCard" size={16} color="var(--text-muted)" strokeWidth={2.2} className="mt-0.5 shrink-0" />
            <span className="flex-1 text-[12.5px] leading-[1.45] text-text-secondary">
              Enter your name exactly as it appears on your government ID. Verification and
              payouts are checked against that document, and a name that does not match will
              hold them up.
            </span>
          </div>
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
          <Button full size="lg" iconRight="ArrowRight" onClick={onContinueIdentity} disabled={Boolean(identityError) || !identity.firstName.trim() || !identity.lastName.trim() || !identity.phone}>
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
                  // Clear the region on every country change. Leaving "Lagos"
                  // selected after switching to Kenya submits a Nigerian state
                  // against a Kenyan account.
                  setDetails({ ...details, country, region: "" });
                }}
                className="h-full w-full appearance-none bg-transparent px-4 pr-10 text-[15px] text-text-primary outline-none"
              >
                {COUNTRIES.map((country) => (
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
              {subdivisionLabelFor(details.country)}
            </label>
            {/*
              A country with no enumerated subdivisions gets a TEXT INPUT, not
              a disabled box. This used to render "No regions listed" with the
              field switched off — so anyone outside the three hardcoded
              countries could not state where they live at all, and Ghana in
              particular was an empty list that stopped the form dead.
            */}
            {regionEmpty ? (
              <input
                id="signup-region"
                value={details.region}
                onChange={(e) => setDetails({ ...details, region: e.target.value })}
                placeholder={`Your ${subdivisionLabelFor(details.country).toLowerCase()}`}
                className="h-[52px] w-full rounded-input border border-hairline bg-input px-4 text-[15px] text-text-primary outline-none placeholder:text-text-muted focus:border-strong"
              />
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
            {regionEmpty ? (
              <span className="text-[12px] text-text-muted">Type where you live.</span>
            ) : null}
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
                    details.gender === value
                      ? "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-press"
                      : "border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setDetails({ ...details, acceptedTerms: !details.acceptedTerms })} className="flex items-start gap-[11px] pt-0.5 text-left hover:bg-state-hover active:bg-state-press">
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
                className="text-[13.5px] font-semibold text-accent hover:text-text-primary disabled:opacity-60 disabled:hover:text-accent"
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
          <span className="grid h-[88px] w-[88px] place-items-center rounded-button border border-decor bg-decor-tint">
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
                selected
                  ? "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-press"
                  : "border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
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
          <button type="button" onClick={onBack} aria-label="Back" className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag hover:bg-surface-hover active:bg-surface-press">
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