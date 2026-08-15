"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreatorTier } from "@/types/account";
import { PLANS } from "@/types/subscription";
import { formatNaira } from "@/lib/format";
import { subscriptionApi } from "@/lib/api/subscription";
import { setSubscriptionPaid, setCreatorTier } from "@/lib/api/mocks/session";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TierBadge } from "@/components/ui/TierBadge";

type Step = "value" | "tier" | "confirm" | "processing" | "success" | "failed";

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
  const [step, setStep] = useState<Step>("value");
  const [tier, setTier] = useState<CreatorTier>("pro");
  const [proSelected, setProSelected] = useState(true);

  const price = PLANS[tier].price;
  const title = step === "value" ? "Become a creator" : step === "tier" ? "Choose your tier" : step === "confirm" ? "Confirm and pay" : step === "failed" ? "Confirm and pay" : step === "processing" ? "Confirm and pay" : "";

  const pay = () => {
    setStep("processing");
    subscriptionApi.subscribe(tier).then(() => {
      // Subscription payment succeeded: the session must reflect the paid
      // tier so canUpload flips on for the rest of the app.
      setSubscriptionPaid(true);
      setCreatorTier(tier);
      setStep("success");
    });
  };

  if (step === "processing") {
    return (
      <Centered>
        <span className="grid place-items-center w-[88px] h-[88px] rounded-[999] bg-[var(--surface-card)] border border-[var(--border-strong)]">
          <Icon name="Loader" size={36} strokeWidth={2.2} color="var(--accent)" />
        </span>
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">Confirming your payment</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[280px]">This takes a few seconds. Do not close the app.</p>
        <div className="w-[180px] h-[5px] rounded-[999] bg-[var(--surface-tag)] overflow-hidden mt-[6px]">
          <div className="w-[62%] h-full rounded-[999] bg-[var(--accent)]" />
        </div>
      </Centered>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
        <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[40px] px-[32px] text-center">
          <span className="grid place-items-center w-[88px] h-[88px] rounded-[999] bg-[var(--accent-tint)] border border-[var(--border-accent)]">
            <Icon name="Check" size={40} strokeWidth={2.6} color="var(--accent)" />
          </span>
          <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em]">You are on {tier === "pro" ? "Pro" : "Basic"}</h2>
          <p className="m-0 text-[15px] leading-[1.55] text-[var(--text-secondary)] max-w-[290px]">Uploading is on. Complete KYC next so we can pay you.</p>
          <div className="flex flex-col gap-[8px] w-full p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left mt-[6px]">
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Paid today</span>
              <span className="text-[14px] font-bold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(price)}</span>
            </div>
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Renews</span>
              <span className="text-[14px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">14 Aug 2027</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[10px] pt-[16px] px-[20px] pb-[26px] border-t border-t-[var(--border-hairline)]">
          <Button full size="lg" iconRight="ArrowRight" onClick={() => router.push("/kyc")}>
            Start KYC
          </Button>
          <Button full variant="ghost" onClick={() => router.push("/profile")}>
            Do it later
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
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
                { icon: "Upload" as const, strong: "Publish and price your work.", text: ` Video, courses, audio, books, art, templates — ${formatNaira(100)} to ${formatNaira(5000)} a piece.` },
                { icon: "MessageCircle" as const, strong: "Charge for your time.", text: ` Set ${formatNaira(50)}–${formatNaira(500)} a message and reply within 24 hours.` },
                { icon: "Users" as const, strong: "Host a community.", text: " Earn 90% of every credit spent in it." },
              ].map((r) => (
                <div key={r.icon} className="flex gap-[12px]">
                  <span className="grid place-items-center w-[38px] h-[38px] rounded-[12] bg-[var(--accent-tint)] border border-[var(--border-accent)] shrink-0">
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
                ["Pick a yearly tier", " — unlocks uploading."],
                ["Complete KYC", " — unlocks payouts. Takes 1–3 days."],
              ].map(([s, r], i) => (
                <div key={s} className="flex gap-[11px]">
                  <span className="grid place-items-center w-[24px] h-[24px] rounded-[999] bg-[var(--accent)] text-[#fff] text-[12px] font-bold shrink-0">{i + 1}</span>
                  <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
                    <span className="text-[var(--text-primary)] font-semibold">{s}</span>
                    {r}
                  </span>
                </div>
              ))}
              <span className="text-[12.5px] leading-[1.45] text-[var(--text-muted)] pl-[35px]">You can upload and sell while KYC is in review.</span>
            </div>
          </>
        ) : null}

        {step === "tier" ? (
          <>
            <div className="flex gap-[4px] p-[4px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)]">
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
                    className={`flex-1 grid place-items-center h-[40px] rounded-[999] border-[none] text-[13.5px] font-semibold cursor-pointer font-[family-name:var(--font-sans)] ${
                      active ? "bg-[var(--accent)] text-[var(--text-on-accent)]" : "bg-transparent text-[var(--text-secondary)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div
              className={`flex flex-col gap-[15px] p-0 rounded-[var(--radius-card)] border ${
                proSelected
                  ? "bg-[var(--surface-elevated)] border-[var(--border-accent)]"
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
                    ? "bg-[var(--accent-tint)] border-[var(--border-accent)]"
                    : "bg-[var(--surface-tag)] border-[var(--border-hairline)]"
                }`}
              >
                <span className="text-[24px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">{proSelected ? "90/10" : "85/15"}</span>
                <span className="flex-1 text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">
                  {proSelected ? "Keep 90% on content, DMs, tips and storefront — not 85%." : "Community credits still pay 90% on every tier."}
                </span>
              </div>

              <div className="flex flex-col gap-[9px]">
                {proSelected ? (
                  <>
                    <CheckRow>7 uploads — 2 free, 5 paid</CheckRow>
                    <CheckRow>Open private communities</CheckRow>
                    <CheckRow>Up to 3 free courses of your choice</CheckRow>
                    <CheckRow>Priority support and recommended deals</CheckRow>
                    <CheckRow>Gold badge</CheckRow>
                    <CheckRow>Playbook and pension registration</CheckRow>
                  </>
                ) : (
                  <>
                    <CheckRow>3 uploads — 1 free, 2 paid</CheckRow>
                    <CheckRow>Unlimited messages in open communities</CheckRow>
                    <CheckRow>1 free selected course</CheckRow>
                    <CheckRow>Playbook and pension registration</CheckRow>
                    <CheckRow>Purple badge</CheckRow>
                  </>
                )}
              </div>
            </div>
          </>
        ) : null}

        {step === "confirm" ? (
          <>
            <div className="flex flex-col rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] overflow-hidden">
              <div className="flex items-center gap-[12px] py-[16px] px-[18px] border-b border-b-[var(--border-hairline)]">
                <span className="flex-1 text-[14px] text-[var(--text-secondary)]">Tier</span>
                <TierBadge tier={tier} />
              </div>
              <div className="flex items-center gap-[12px] py-[16px] px-[18px] border-b border-b-[var(--border-hairline)]">
                <span className="flex-1 text-[14px] text-[var(--text-secondary)]">Billing</span>
                <span className="text-[14px] font-semibold">Yearly</span>
              </div>
              <div className="flex items-center gap-[12px] py-[16px] px-[18px] border-b border-b-[var(--border-hairline)]">
                <span className="flex-1 text-[14px] text-[var(--text-secondary)]">Renews on</span>
                <span className="text-[14px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">14 Aug 2027</span>
              </div>
              <div className="flex items-baseline gap-[12px] p-[18px]">
                <span className="flex-1 text-[15px] font-semibold">Total today</span>
                <span className="text-[26px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(price)}</span>
              </div>
            </div>

            <div className="flex items-center gap-[12px] py-[15px] px-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <span className="grid place-items-center w-[38px] h-[38px] rounded-[12] bg-[var(--surface-tag)] border border-[var(--border-hairline)]">
                <Icon name="CreditCard" size={17} strokeWidth={2} color="var(--text-secondary)" />
              </span>
              <div className="flex-1 flex flex-col gap-[2px]">
                <span className="text-[14.5px] font-semibold">Card, transfer or USSD</span>
                <span className="text-[12.5px] text-[var(--text-muted)]">Handled by Flutterwave</span>
              </div>
            </div>

            <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
              Your card is stored by Flutterwave for next year&apos;s renewal. WAWU never sees it.
            </span>
          </>
        ) : null}

        {step === "failed" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-[18px] py-[30px] px-0 text-center">
            <span className="grid place-items-center w-[88px] h-[88px] rounded-[999] bg-[var(--danger-tint)] border border-[rgba(255,92,92,0.3)]">
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
            <Button full size="lg" onClick={() => setStep("confirm")}>
              Continue with {tier === "pro" ? "Pro" : "Basic"} — {formatNaira(price)}
            </Button>
            <span className="text-[12px] text-[var(--text-muted)] self-center">Renews yearly. Cancel before renewal.</span>
          </>
        ) : null}
        {step === "confirm" ? (
          <>
            <Button full size="lg" onClick={pay}>
              Pay {formatNaira(price)}
            </Button>
            {/** DEV ONLY — remove when the session endpoint is live. */}
            <span className="text-[12px] text-[var(--text-muted)] cursor-pointer self-center" onClick={() => setStep("failed")}>
              Simulate a failed payment
            </span>
          </>
        ) : null}
        {step === "failed" ? (
          <>
            <Button full size="lg" icon="RotateCw" onClick={() => setStep("confirm")}>
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
    <div className="flex flex-col items-center justify-center gap-[18px] py-[40px] px-[32px] text-center min-h-[100vh] max-w-[var(--mobile-column)] m-0">
      {children}
    </div>
  );
}
