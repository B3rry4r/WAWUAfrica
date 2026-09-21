"use client";

import { useState } from "react";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates, MAX_ITEMS_PER_ACCOUNT } from "@/lib/auth/gates";
import { useRouter } from "next/navigation";
import { becomeCreator } from "@/lib/api/auth";
import { formatNaira } from "@/lib/format";
import { describeError } from "@/lib/api/errors";
import { useSession } from "@/lib/auth/session-provider";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { verificationCopy } from "@/components/dashboard/VerificationAsk";

type Step = "value" | "activating" | "success" | "failed";

/**
 * Becoming a creator.
 *
 * This was a paywall: a value screen, a tier picker (Basic / Pro / Pro Max),
 * a Flutterwave charge and a payment-confirmed receipt, and an unpaid creator
 * was held on it by RequirePaidCreator until they paid. Subscriptions were
 * removed from the product, so all of that is gone. Registration, profile
 * creation and listing are free; the screen now explains what a creator
 * account is and switches it on.
 *
 * What is NOT gone is KYC. It was always the second, independent gate and it
 * still is: it decides when earnings are paid out, never what can be
 * published.
 */
export function CreatorOnboarding() {
  const router = useRouter();
  const { user, setCreatorState, signOut } = useSession();
  const { creator, loading: creatorLoading, reload } = useCreatorState();
  const [step, setStep] = useState<Step>("value");
  const [error, setError] = useState<string | null>(null);

  // Gates for the already-a-creator branch below. Never re-checks
  // `creator.kyc` inline — see src/lib/auth/gates.ts.
  const alreadyGates = creatorGates({ creator });
  // One wording for all four KYC states, shared with every other surface that
  // asks for verification (src/components/dashboard/VerificationAsk.tsx).
  const alreadyCopy = verificationCopy(alreadyGates.kycStatus);

  const activate = () => {
    setError(null);
    setStep("activating");
    becomeCreator()
      .then(() => {
        // Ask the server what it actually recorded rather than asserting it
        // locally. The old flow could set creator state from a payment it had
        // just verified; there is no receipt to trust here.
        setCreatorState({
          tier: user?.creator?.tier ?? "basic",
          kyc: user?.creator?.kyc ?? "not_started",
          slotsUsed: user?.creator?.slotsUsed ?? 0,
          slotsTotal: MAX_ITEMS_PER_ACCOUNT,
          dmPrice: user?.creator?.dmPrice ?? 0,
          dmEnabled: user?.creator?.dmEnabled ?? false,
        });
        reload();
        setStep("success");
      })
      .catch((e) => {
        setError(describeError(e).body);
        setStep("failed");
      });
  };

  // Somebody who is already a creator must never be walked through this again.
  if (alreadyGates.isCreator && step !== "success") {
    return (
      <Centered>
        <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--decor-tint)] border border-[var(--border-decor)]">
          <Icon name="Check" size={38} strokeWidth={2.4} color="var(--accent)" />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">You are already a creator</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[300px]">
          Uploading and the creator tools are already on. You can list up to {MAX_ITEMS_PER_ACCOUNT} items.
        </p>
        {alreadyCopy ? (
          <p className="m-0 max-w-[300px] text-[14px] leading-[1.5] text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{alreadyCopy.headline}.</span> {alreadyCopy.body}
          </p>
        ) : null}
        <div className="flex w-full max-w-[320px] flex-col gap-[10px] pt-[6px]">
          {/* The setup checklist is the primary way on from here, and it
              carries the verification ask as one of its rows. */}
          <Button full size="lg" iconRight="ArrowRight" onClick={() => router.replace("/creator/setup")}>
            Finish setting up
          </Button>
          {alreadyCopy ? (
            <Button full size="lg" variant="secondary" onClick={() => router.replace("/kyc")}>
              {alreadyCopy.cta}
            </Button>
          ) : null}
          <Button full variant="ghost" onClick={() => router.replace("/creator")}>
            Go to your dashboard
          </Button>
        </div>
      </Centered>
    );
  }

  if (creatorLoading && !creator) {
    return (
      <Centered>
        <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--surface-card)] border border-[var(--border-strong)]">
          <Icon name="Loader" size={34} strokeWidth={2.2} color="var(--accent)" />
        </span>
        <p className="m-0 text-[15px] text-[var(--text-secondary)]">Checking your account…</p>
      </Centered>
    );
  }

  if (step === "activating") {
    return (
      <Centered>
        <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--surface-card)] border border-[var(--border-strong)]">
          <Icon name="Loader" size={36} strokeWidth={2.2} color="var(--accent)" />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">Setting up your creator account</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[280px]">
          This takes a few seconds.
        </p>
      </Centered>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center gap-[16px] py-[36px] px-[24px] text-center">
          <span className="grid place-items-center w-[72px] h-[72px] rounded-[999px] bg-[var(--decor-tint)] border border-[var(--border-decor)]">
            <Icon name="Check" size={34} strokeWidth={2.6} color="var(--accent)" />
          </span>
          <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">You are a creator now</h2>
          <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[320px]">
            Nothing to pay. Publish and sell from today, up to {MAX_ITEMS_PER_ACCOUNT} items on your account.
          </p>

          {/* The one remaining gate, said plainly at the moment somebody is
              guaranteed to be looking. It is not a wall: the ask is the
              primary action, and skipping it changes nothing about what they
              can upload or sell. */}
          <div className="flex flex-col gap-[14px] w-full p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left">
            <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">
              Two separate things
            </span>
            <div className="flex gap-[12px]">
              <span className="grid place-items-center w-[30px] h-[30px] rounded-[10px] bg-[var(--success-tint)] border border-[rgba(184,232,62,0.28)] shrink-0">
                <Icon name="Check" size={16} strokeWidth={2.6} color="var(--success)" />
              </span>
              <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-semibold">Uploading is open.</span> It costs nothing
                and there is no plan to buy. Publish and sell from today.
              </span>
            </div>
            <div className="flex gap-[12px]">
              <span className="grid place-items-center w-[30px] h-[30px] rounded-[10px] bg-[var(--accent)] shrink-0">
                <Icon name="ShieldAlert" size={16} strokeWidth={2.4} color="var(--text-on-accent)" />
              </span>
              <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-semibold">Getting paid is not.</span> That takes
                verification, which is a separate step and the only thing we have not asked you for yet. Until it clears,
                what you earn is counted and held for you. Nothing is lost.
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[10px] pt-[16px] px-[20px] pb-[26px] border-t border-t-[var(--border-hairline)]">
          <Button full size="lg" iconRight="ArrowRight" onClick={() => router.push("/creator/setup")}>
            Set up your account
          </Button>
          <Button full variant="ghost" onClick={() => router.push("/creator")}>
            Skip for now
          </Button>
          <span className="text-[12px] leading-[1.45] text-[var(--text-muted)] self-center text-center">
            Five steps, none of them urgent. Verification is one of them. Skipping costs you nothing today; the
            checklist waits at the top of your dashboard whenever you want it.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] mx-auto">
      {/*
        Back genuinely goes back now. This used to sign the user out, because
        /onboarding was a paywall an unpaid creator could not leave: every app
        route bounced them straight back here, so an ordinary back button
        looked broken. Nothing holds them here any more.
      */}
      <FlowHeader
        title={step === "failed" ? "Something went wrong" : "Become a creator"}
        onBack={() => router.push("/home")}
      />

      <div className="flex-1 flex flex-col gap-[18px] px-[20px] pb-[20px] pt-[24px]">
        {step === "value" ? (
          <>
            <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em] leading-[1.15]">
              Get paid for what you already know
            </h2>

            <div className="flex flex-col gap-[15px]">
              {[
                { icon: "Upload" as const, strong: "Publish and price your work.", text: " Video, courses, audio, books, art, templates. You set the price." },
                { icon: "MessageCircle" as const, strong: "Charge for your time.", text: " Set your own price for a message, and choose how long you get to reply." },
                { icon: "Users" as const, strong: "Host a community.", text: " Earn 85% of every credit spent in it, and it costs you no listing slot." },
              ].map((r) => (
                <div key={r.icon} className="flex gap-[12px]">
                  <span className="grid place-items-center w-[38px] h-[38px] rounded-[12px] bg-[var(--decor-tint)] border border-[var(--border-decor)] shrink-0">
                    <Icon name={r.icon} size={17} strokeWidth={2} color="var(--accent)" />
                  </span>
                  <span className="flex-1 text-[14px] leading-[1.45] text-[var(--text-secondary)]">
                    <span className="text-[var(--text-primary)] font-semibold">{r.strong}</span>
                    {r.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-[12px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">
                What it costs
              </span>
              <span className="text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-semibold">Nothing.</span> Creating your account,
                building your profile and listing your work all cost {formatNaira(0)}. You can list up to{" "}
                {MAX_ITEMS_PER_ACCOUNT} items.
              </span>
              <span className="text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-semibold">Verification is separate.</span> It unlocks
                getting paid, and it is reviewed by a person in 1 to 3 days. You can upload and sell before it clears.
                Only the payout waits.
              </span>
            </div>
          </>
        ) : null}

        {step === "failed" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[30px] px-0 text-center">
            <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--danger-tint)] border border-[rgba(255,92,92,0.3)]">
              <Icon name="TriangleAlert" size={36} strokeWidth={2.2} color="var(--danger)" />
            </span>
            <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">We could not switch your account over</h2>
            <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[290px]">
              {error ?? "Something went wrong on our side. Nothing about your account has changed."}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-[10px] pt-[16px] px-[20px] pb-[26px] border-t border-t-[var(--border-hairline)]">
        {step === "value" ? (
          <>
            <Button full size="lg" iconRight="ArrowRight" onClick={activate}>
              Become a creator
            </Button>
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="self-center text-[12.5px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Not now
            </button>
          </>
        ) : null}
        {step === "failed" ? (
          <>
            <Button full size="lg" icon="RotateCw" onClick={activate}>
              Try again
            </Button>
            <Button
              full
              variant="ghost"
              onClick={() => {
                signOut();
                router.replace("/sign-in");
              }}
            >
              Sign out
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[18px] py-[40px] px-[32px] text-center min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] mx-auto">
      {children}
    </div>
  );
}
