"use client";

import { useState } from "react";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { useRouter } from "next/navigation";
import type { CreatorTier } from "@/types/account";
import { PLANS } from "@/types/subscription";
import { formatNaira } from "@/lib/format";
import { subscriptionApi } from "@/lib/api/subscription";
import { isFlutterwaveCancelled } from "@/lib/flutterwave";
import { useSession } from "@/lib/auth/session-provider";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TierBadge } from "@/components/ui/TierBadge";

type Step = "value" | "tier" | "processing" | "success" | "failed";

function CheckRow({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-start gap-[9px] text-[13.5px] leading-[1.4] text-[var(--text-secondary)]">
      <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} className="mt-[2px]" />
      {children}
    </span>
  );
}

export function CreatorOnboarding() {
  const router = useRouter();
  const { user, setCreatorState } = useSession();
  const { creator, loading: creatorLoading } = useCreatorState();
  const [step, setStep] = useState<Step>("value");
  /** True only while the checkout modal is being opened. */
  const [paying, setPaying] = useState(false);
  const [tier, setTier] = useState<CreatorTier>("pro");
  const [proSelected, setProSelected] = useState(true);
  // Set from the subscription the server confirms, so the receipt shows the
  // real renewal date rather than a hardcoded one.
  const [renewsAt, setRenewsAt] = useState<string | null>(null);

  const price = PLANS[tier].price;
  // Yearly billing, so the term ends a year from today. Used before payment
  // (the confirm screen has no server date yet); the success screen prefers
  // the real `renewsAt` the subscription came back with.
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const formatDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const projectedRenewal = formatDay(oneYearFromNow);
  const title =
    step === "value"
      ? "Become a creator"
      : step === "tier"
        ? "Choose your tier"
        : step === "failed" || step === "processing"
          ? "Payment"
          : "";

  const pay = () => {
    // No "processing" screen yet: the Flutterwave modal has not even opened,
    // and claiming to confirm a payment nobody has made is what made this
    // flow feel broken. `onCharged` flips to it once the charge is real.
    setPaying(true);
    subscriptionApi
      .subscribe(tier, () => {
        setPaying(false);
        setStep("processing");
      })
      .then((subscription) => {
        // Apply the tier the SERVER confirmed, not the one the user picked:
        // this is what flips canUpload on for the rest of the app, so it must
        // come from the verified subscription row. (This previously mutated
        // the dev-only mock session store, granting creator access locally
        // regardless of what the backend actually said.)
        setCreatorState({
          tier: subscription.plan.tier,
          subscriptionPaid: subscription.state === "active",
          // "not_started", never "pending". Paying for a subscription does not
          // submit anything to review — defaulting to "pending" here is what
          // put "Held, not payable yet · released as soon as verification
          // clears" in front of creators who had never been asked to verify.
          kyc: user?.creator?.kyc ?? "not_started",
          slotsUsed: user?.creator?.slotsUsed ?? 0,
          slotsTotal: subscription.plan.slots,
          dmPrice: user?.creator?.dmPrice ?? 0,
          dmEnabled: user?.creator?.dmEnabled ?? false,
        });
        setRenewsAt(subscription.renewsAt ?? null);
        setStep("success");
      })
      .catch((e) => {
        // Dismissing Flutterwave's checkout charges nothing — send the user
        // back to the confirm screen rather than a payment-declined error.
        setPaying(false);
        // Dismissing checkout charges nothing, so stay on the tier screen
        // rather than showing a payment-declined error.
        if (isFlutterwaveCancelled(e)) {
          setStep("tier");
          return;
        }
        // A real backend rejection (declined card, already subscribed) lands
        // on the real failure screen.
        setStep("failed");
      });
  };

  // Gates for the already-subscribed branch below. Never re-checks
  // `creator.kyc` inline — see src/lib/auth/gates.ts.
  const alreadyGates = creatorGates({ creator });

  // Somebody who has already paid must never be shown the signup flow again.
  // Without this they walked the whole thing and were told, only in the network
  // tab, "Already subscribed — use /upgrade, /downgrade, or /retry-payment".
  if (creator?.subscriptionPaid && step !== "success") {
    return (
      <Centered>
        <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--decor-tint)] border border-[var(--border-decor)]">
          <Icon name="Check" size={38} strokeWidth={2.4} color="var(--accent)" />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">You are already a creator</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[300px]">
          Your {creator.tier === "pro" ? "Pro" : "Basic"} subscription is active, so uploading and the creator tools are
          already on.
          {alreadyGates.canEarn
            ? ""
            : " Verification is the separate step that lets us pay you, and it is still outstanding."}
        </p>
        <div className="flex w-full max-w-[320px] flex-col gap-[10px] pt-[6px]">
          {alreadyGates.canEarn ? null : (
            <Button full size="lg" iconRight="ArrowRight" onClick={() => router.replace("/kyc")}>
              Verify my identity
            </Button>
          )}
          <Button
            full
            size="lg"
            variant={alreadyGates.canEarn ? "primary" : "secondary"}
            iconRight={alreadyGates.canEarn ? "ArrowRight" : undefined}
            onClick={() => router.replace("/creator")}
          >
            Go to your dashboard
          </Button>
          <Button full variant="ghost" onClick={() => router.replace("/subscription")}>
            Manage subscription
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

  if (step === "processing") {
    return (
      <Centered>
        <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--surface-card)] border border-[var(--border-strong)]">
          <Icon name="Loader" size={36} strokeWidth={2.2} color="var(--accent)" />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">Confirming your payment</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[280px]">This takes a few seconds. Do not close the app.</p>
        <div className="w-[180px] h-[5px] rounded-[999px] bg-[var(--surface-tag)] overflow-hidden mt-[6px]">
          <div className="w-[62%] h-full rounded-[999px] bg-[var(--accent)]" />
        </div>
      </Centered>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0">
        <div className="flex-1 flex flex-col items-center justify-center gap-[16px] py-[36px] px-[24px] text-center">
          <span className="grid place-items-center w-[72px] h-[72px] rounded-[999px] bg-[var(--decor-tint)] border border-[var(--border-decor)]">
            <Icon name="Check" size={34} strokeWidth={2.6} color="var(--accent)" />
          </span>
          <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">
            Payment confirmed. You are on {tier === "pro" ? "Pro" : "Basic"}.
          </h2>

          <div className="flex flex-col gap-[8px] w-full p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left">
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Paid today</span>
              <span className="text-[14px] font-bold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(price)}</span>
            </div>
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Renews</span>
              <span className="text-[14px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">
                {renewsAt ? formatDay(new Date(renewsAt)) : projectedRenewal}
              </span>
            </div>
          </div>

          {/* The two gates, said plainly, at the one moment the creator is
              guaranteed to be looking: right after the charge clears. They
              used to be dropped straight onto the dashboard from here and
              only ever learn about verification from a tinted strip they did
              not notice — then find their earnings "held" for a review nobody
              had ever asked them to start. Nothing below is a wall: the ask is
              the primary action, and skipping it changes nothing about what
              they can upload or sell. */}
          <div className="flex flex-col gap-[14px] w-full p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left">
            <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">
              Two separate things
            </span>
            <div className="flex gap-[12px]">
              <span className="grid place-items-center w-[30px] h-[30px] rounded-[10px] bg-[var(--success-tint)] border border-[rgba(184,232,62,0.28)] shrink-0">
                <Icon name="Check" size={16} strokeWidth={2.6} color="var(--success)" />
              </span>
              <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-semibold">Uploading is unlocked.</span> That is what the
                subscription you just paid for does. Publish and sell from today.
              </span>
            </div>
            <div className="flex gap-[12px]">
              <span className="grid place-items-center w-[30px] h-[30px] rounded-[10px] bg-[var(--accent)] shrink-0">
                <Icon name="ShieldAlert" size={16} strokeWidth={2.4} color="var(--text-on-accent)" />
              </span>
              <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-semibold">Getting paid is not.</span> That takes
                verification, which is a separate step and the only thing we have not asked you for yet. Until it clears,
                what you earn is counted and held for you — nothing is lost.
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[10px] pt-[16px] px-[20px] pb-[26px] border-t border-t-[var(--border-hairline)]">
          <Button full size="lg" iconRight="ArrowRight" onClick={() => router.push("/kyc")}>
            Verify my identity
          </Button>
          <Button full variant="ghost" onClick={() => router.push("/creator")}>
            Skip for now
          </Button>
          <span className="text-[12px] leading-[1.45] text-[var(--text-muted)] self-center text-center">
            Skipping costs you nothing today. Verification waits at the top of your dashboard whenever you want it.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0">
      <FlowHeader title={title} onBack={() => (step === "value" ? router.back() : setStep("value"))} right={step === "tier" ? <span className="text-[12.5px] font-semibold text-[var(--text-muted)]">Billed yearly</span> : undefined} />

      <div
        className={`flex-1 flex flex-col gap-[18px] px-[20px] pb-[20px] ${step === "value" ? "pt-[24px]" : "pt-[18px]"}`}
      >
        {step === "value" ? (
          <>
            <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em] leading-[1.15]">
              Get paid for what you already know
            </h2>

            <div className="flex flex-col gap-[15px]">
              {[
                { icon: "Upload" as const, strong: "Publish and price your work.", text: " Video, courses, audio, books, art, templates. You set the price." },
                { icon: "MessageCircle" as const, strong: "Charge for your time.", text: " Set your own price a message and reply within 24 hours." },
                { icon: "Users" as const, strong: "Host a community.", text: " Earn 90% of every credit spent in it." },
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
              <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">Two steps</span>
              {[
                ["Pick a yearly tier", ", unlocks uploading."],
                ["Verify your identity", ", unlocks getting paid. Reviewed in 1–3 days."],
              ].map(([s, r], i) => (
                <div key={s} className="flex gap-[11px]">
                  <span className="grid place-items-center w-[24px] h-[24px] rounded-[999px] bg-[var(--accent)] text-[var(--text-on-accent)] text-[12px] font-bold shrink-0">{i + 1}</span>
                  <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
                    <span className="text-[var(--text-primary)] font-semibold">{s}</span>
                    {r}
                  </span>
                </div>
              ))}
              <span className="text-[12.5px] leading-[1.45] text-[var(--text-muted)] pl-[35px]">They are independent. You can upload and sell before verification, and before it clears — only the payout waits.</span>
            </div>
          </>
        ) : null}

        {step === "tier" ? (
          <>
            <div className="flex gap-[4px] p-[4px] rounded-[999px] bg-[var(--surface-tag)] border border-[var(--border-hairline)]">
              {(["Basic", "Pro"] as const).map((label) => {
                const active = (label === "Pro") === proSelected;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setProSelected(label === "Pro");
                      setTier(label === "Pro" ? "pro" : "basic");
                    }}
                    className={`flex-1 grid place-items-center h-[40px] rounded-[999px] border-[none] text-[13.5px] font-semibold cursor-pointer font-[family-name:var(--font-sans)] ${
                      active
                        ? "bg-[var(--accent)] text-[var(--text-on-accent)]"
                        : "bg-transparent text-[var(--text-secondary)] hover:bg-state-hover active:bg-state-press"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div
              className={`flex flex-col gap-[15px] p-[20px] rounded-[var(--radius-card)] border ${
                proSelected
                  ? "bg-[var(--surface-elevated)] border-[var(--border-selected)]"
                  : "bg-[var(--surface-card)] border-[var(--border-hairline)]"
              }`}
            >
              <div className="flex">
                <TierBadge tier={tier} />
              </div>
              <div className="flex items-baseline gap-[7px]">
                <span className="text-[34px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(price)}</span>
                <span className="text-[14px] text-[var(--text-muted)]">a year</span>
              </div>

              <div
                className={`flex items-center gap-[12px] p-[14px] rounded-[var(--radius-input)] border ${
                  proSelected
                    ? "bg-[var(--selected-tint)] border-[var(--border-selected)]"
                    : "bg-[var(--surface-tag)] border-[var(--border-hairline)]"
                }`}
              >
                <span className="text-[24px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">{proSelected ? "90/10" : "85/15"}</span>
                <span className="flex-1 text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">
                  {proSelected ? "Keep 90% on content, DMs, tips and storefront, not 85%." : "Community credits still pay 90% on every tier."}
                </span>
              </div>

              <div className="flex flex-col gap-[9px]">
                {proSelected ? (
                  <>
                    <CheckRow>15 uploads, 2 included, 13 paid</CheckRow>
                    <CheckRow>Open private communities</CheckRow>
                    <CheckRow>Up to 3 courses of your choice, included</CheckRow>
                    <CheckRow>Priority support and recommended deals</CheckRow>
                    <CheckRow>Gold badge</CheckRow>
                    <CheckRow>Playbook and pension registration</CheckRow>
                  </>
                ) : (
                  <>
                    <CheckRow>6 uploads, 1 included, 5 paid</CheckRow>
                    <CheckRow>Unlimited messages in open communities</CheckRow>
                    <CheckRow>1 selected course, included</CheckRow>
                    <CheckRow>Playbook and pension registration</CheckRow>
                    <CheckRow>Purple badge</CheckRow>
                  </>
                )}
              </div>
            </div>
          </>
        ) : null}

        {step === "failed" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[30px] px-0 text-center">
            <span className="grid place-items-center w-[88px] h-[88px] rounded-[999px] bg-[var(--danger-tint)] border border-[rgba(255,92,92,0.3)]">
              <Icon name="TriangleAlert" size={36} strokeWidth={2.2} color="var(--danger)" />
            </span>
            <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">Payment did not go through</h2>
            <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[290px]">Your bank declined the charge. Nothing was taken from your account.</p>
            <div className="flex items-start gap-[10px] w-full py-[14px] px-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left mt-[6px]">
              <Icon name="Info" size={16} color="var(--text-muted)" className="mt-[1px]" />
              <span className="flex-1 text-[13px] leading-[1.5] text-[var(--text-secondary)]">Try another card, or pay by transfer or USSD instead.</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-[10px] pt-[16px] px-[20px] pb-[26px] border-t border-t-[var(--border-hairline)]">
        {step === "value" ? (
          <Button full size="lg" iconRight="ArrowRight" onClick={() => setStep("tier")}>
            Choose a tier
          </Button>
        ) : null}
        {step === "tier" ? (
          <>
            <Button full size="lg" onClick={pay} disabled={paying}>
              {paying ? "Opening checkout…" : `Pay ${formatNaira(price)} with ${tier === "pro" ? "Pro" : "Basic"}`}
            </Button>
            <span className="text-[12px] text-[var(--text-muted)] self-center">Renews yearly. Cancel before renewal.</span>
          </>
        ) : null}
        {step === "failed" ? (
          <>
            <Button full size="lg" icon="RotateCw" onClick={() => setStep("tier")}>
              Try again
            </Button>
            <Button full variant="ghost" onClick={() => setStep("tier")}>
              Choose another tier
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[18px] py-[40px] px-[32px] text-center min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0">
      {children}
    </div>
  );
}
