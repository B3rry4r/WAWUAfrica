"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreatorTier } from "@/types/account";
import { formatNaira } from "@/lib/format";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TierBadge } from "@/components/ui/Badge";

type Step = "value" | "tier" | "confirm" | "processing" | "success" | "failed";

function CheckRow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13.5, lineHeight: 1.4, color: "var(--text-secondary)" }}>
      <Icon name="Check" size={15} color="var(--accent)" stroke={2.4} style={{ marginTop: 2 }} />
      {children}
    </span>
  );
}

export function CreatorOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("value");
  const [tier, setTier] = useState<CreatorTier>("pro");
  const [proSelected, setProSelected] = useState(true);

  const price = tier === "pro" ? 18999 : 5999;
  const title = step === "value" ? "Become a creator" : step === "tier" ? "Choose your tier" : step === "confirm" ? "Confirm and pay" : step === "failed" ? "Confirm and pay" : step === "processing" ? "Confirm and pay" : "";

  const pay = () => {
    setStep("processing");
    window.setTimeout(() => setStep("success"), 1500);
  };

  if (step === "processing") {
    return (
      <Centered>
        <span style={{ display: "grid", placeItems: "center", width: 88, height: 88, borderRadius: 999, background: "var(--surface-card)", border: "1px solid var(--border-strong)" }}>
          <Icon name="Loader" size={36} stroke={2.2} color="var(--accent)" />
        </span>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" }}>Confirming your payment</h2>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-secondary)", maxWidth: 280 }}>This takes a few seconds. Do not close the app.</p>
        <div style={{ width: 180, height: 5, borderRadius: 999, background: "var(--surface-tag)", overflow: "hidden", marginTop: 6 }}>
          <div style={{ width: "62%", height: "100%", borderRadius: 999, background: "var(--accent)" }} />
        </div>
      </Centered>
    );
  }

  if (step === "success") {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: "var(--mobile-column)", margin: "0 auto" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "40px 32px", textAlign: "center" }}>
          <span style={{ display: "grid", placeItems: "center", width: 88, height: 88, borderRadius: 999, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
            <Icon name="Check" size={40} stroke={2.6} color="var(--accent)" />
          </span>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>You are on {tier === "pro" ? "Pro" : "Basic"}</h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-secondary)", maxWidth: 290 }}>Uploading is on. Complete KYC next so we can pay you.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textAlign: "left", marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Paid today</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(price)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Renews</span>
              <span style={{ fontSize: 14, fontWeight: 600, fontFeatureSettings: "var(--font-feature-tabular)" }}>14 Aug 2027</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px 26px", borderTop: "1px solid var(--border-hairline)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: "var(--mobile-column)", margin: "0 auto" }}>
      <FlowHeader title={title} onBack={() => (step === "value" ? router.back() : setStep("value"))} right={step === "tier" ? <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)" }}>Billed yearly</span> : undefined} />

      <div style={{ flex: 1, padding: step === "value" ? "24px 20px 20px" : "18px 20px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
        {step === "value" ? (
          <>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              Get paid for what you already know
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {[
                { icon: "Upload" as const, strong: "Publish and price your work.", text: " Video, courses, audio, books, art, templates — ₦100 to ₦5,000 a piece." },
                { icon: "MessageCircle" as const, strong: "Charge for your time.", text: " Set ₦50–₦500 a message and reply within 24 hours." },
                { icon: "Users" as const, strong: "Host a community.", text: " Earn 90% of every credit spent in it." },
              ].map((r) => (
                <div key={r.icon} style={{ display: "flex", gap: 12 }}>
                  <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 12, background: "var(--accent-tint)", border: "1px solid var(--border-accent)", flexShrink: 0 }}>
                    <Icon name={r.icon} size={17} stroke={2} color="var(--accent)" />
                  </span>
                  <span style={{ flex: 1, fontSize: 14, lineHeight: 1.45, color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.strong}</span>
                    {r.text}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>Two steps</span>
              {[
                ["Pick a yearly tier", " — unlocks uploading."],
                ["Complete KYC", " — unlocks payouts. Takes 1–3 days."],
              ].map(([s, r], i) => (
                <div key={s} style={{ display: "flex", gap: 11 }}>
                  <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: 999, background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s}</span>
                    {r}
                  </span>
                </div>
              ))}
              <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--text-muted)", paddingLeft: 35 }}>You can upload and sell while KYC is in review.</span>
            </div>
          </>
        ) : null}

        {step === "tier" ? (
          <>
            <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 999, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
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
                    style={{
                      flex: 1,
                      display: "grid",
                      placeItems: "center",
                      height: 40,
                      borderRadius: 999,
                      border: "none",
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
                      fontSize: 13.5,
                      fontWeight: 600,
                      fontFamily: "var(--font-sans)",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 15, padding: 20, borderRadius: "var(--radius-card)", background: proSelected ? "var(--surface-elevated)" : "var(--surface-card)", border: proSelected ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)" }}>
              <div style={{ display: "flex" }}>
                <TierBadge tier={tier} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em", fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(price)}</span>
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}>a year</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: "var(--radius-input)", background: proSelected ? "var(--accent-tint)" : "var(--surface-tag)", border: proSelected ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)" }}>
                <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", fontFeatureSettings: "var(--font-feature-tabular)" }}>{proSelected ? "90/10" : "85/15"}</span>
                <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4, color: "var(--text-secondary)" }}>
                  {proSelected ? "Keep 90% on content, DMs, tips and storefront — not 85%." : "Community credits still pay 90% on every tier."}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
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
            <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border-hairline)" }}>
                <span style={{ flex: 1, fontSize: 14, color: "var(--text-secondary)" }}>Tier</span>
                <TierBadge tier={tier} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border-hairline)" }}>
                <span style={{ flex: 1, fontSize: 14, color: "var(--text-secondary)" }}>Billing</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Yearly</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border-hairline)" }}>
                <span style={{ flex: 1, fontSize: 14, color: "var(--text-secondary)" }}>Renews on</span>
                <span style={{ fontSize: 14, fontWeight: 600, fontFeatureSettings: "var(--font-feature-tabular)" }}>14 Aug 2027</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, padding: 18 }}>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Total today</span>
                <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(price)}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 12, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)" }}>
                <Icon name="CreditCard" size={17} stroke={2} color="var(--text-secondary)" />
              </span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>Card, transfer or USSD</span>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Handled by Flutterwave</span>
              </div>
            </div>

            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)" }}>
              Your card is stored by Flutterwave for next year's renewal. WAWU never sees it.
            </span>
          </>
        ) : null}

        {step === "failed" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "30px 0", textAlign: "center" }}>
            <span style={{ display: "grid", placeItems: "center", width: 88, height: 88, borderRadius: 999, background: "var(--danger-tint)", border: "1px solid rgba(255,92,92,0.3)" }}>
              <Icon name="TriangleAlert" size={36} stroke={2.2} color="var(--danger)" />
            </span>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" }}>Payment did not go through</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-secondary)", maxWidth: 290 }}>Your bank declined the charge. Nothing was taken from your account.</p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", padding: "14px 16px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textAlign: "left", marginTop: 6 }}>
              <Icon name="Info" size={16} color="var(--text-muted)" style={{ marginTop: 1 }} />
              <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>Try another card, or pay by transfer or USSD instead.</span>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px 26px", borderTop: "1px solid var(--border-hairline)" }}>
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
            <span style={{ alignSelf: "center", fontSize: 12, color: "var(--text-muted)" }}>Renews yearly. Cancel before renewal.</span>
          </>
        ) : null}
        {step === "confirm" ? (
          <>
            <Button full size="lg" onClick={pay}>
              Pay {formatNaira(price)}
            </Button>
            <span style={{ alignSelf: "center", fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }} onClick={() => setStep("failed")}>
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "40px 32px", textAlign: "center", minHeight: "100vh", maxWidth: "var(--mobile-column)", margin: "0 auto" }}>
      {children}
    </div>
  );
}
