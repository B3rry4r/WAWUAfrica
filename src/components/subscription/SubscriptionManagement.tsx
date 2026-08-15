"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/format";
import { PLANS } from "@/types/subscription";
import { subscriptionApi } from "@/lib/api/subscription";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { StatusPill } from "@/components/ui/StatusPill";
import { TierBadge } from "@/components/ui/Badge";

type DemoView = "current" | "upgrade" | "pastdue" | "expired";

function CheckRow({ ok, children, icon }: { ok: boolean; children: React.ReactNode; icon?: IconName }) {
  return (
    <span style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13.5, lineHeight: 1.45, color: ok ? "var(--text-secondary)" : "var(--text-muted)" }}>
      <Icon name={icon ?? (ok ? "Check" : "X")} size={15} stroke={2.4} color={ok ? "var(--success)" : "var(--warning)"} style={{ marginTop: 2 }} />
      {children}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 18,
        borderRadius: "var(--radius-card)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
      }}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
      {children}
    </span>
  );
}

export function SubscriptionManagement() {
  const router = useRouter();
  const [view, setView] = useState<DemoView>("current");
  const [showPaid, setShowPaid] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [paying, setPaying] = useState(false);

  const monthlySales = 45000;
  const kept = Math.round((monthlySales * PLANS.basic.split) / 100);
  const proKept = Math.round((monthlySales * PLANS.pro.split) / 100);
  const proCredit = 2750;
  const dueToday = PLANS.pro.price - proCredit;

  const payAndGoPro = () => {
    setPaying(true);
    subscriptionApi.upgradeToPro().then(() => {
      setPaying(false);
      setShowPaid(true);
    });
  };

  const title = view === "upgrade" ? "Move to Pro" : "Tier and billing";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: "var(--mobile-column)", margin: "0 auto" }}>
      <FlowHeader title={title} onBack={() => router.back()} />

      <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "10px 16px 0" }}>
        {([
          ["current", "Active"],
          ["upgrade", "Upgrade"],
          ["pastdue", "Past due"],
          ["expired", "Expired"],
        ] as [DemoView, string][]).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            style={{
              height: 30,
              padding: "0 14px",
              borderRadius: 999,
              border: view === v ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
              background: view === v ? "var(--accent-tint)" : "var(--surface-tag)",
              color: view === v ? "var(--accent)" : "var(--text-muted)",
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        {view === "current" || view === "pastdue" || view === "expired" ? (
          <CurrentView view={view} onUpgrade={() => setView("upgrade")} onCancel={() => setShowCancel(true)} />
        ) : null}

        {view === "upgrade" ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, borderRadius: "var(--radius-card)", background: "var(--surface-elevated)", border: "1px solid var(--border-accent)" }}>
              <CardLabel>The reason to move</CardLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>85%</span>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)" }}>You keep now</span>
                </div>
                <Icon name="ArrowRight" size={20} stroke={2.4} color="var(--accent)" />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.035em", fontFeatureSettings: "var(--font-feature-tabular)" }}>90%</span>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--accent)" }}>On Pro</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>On last month's {formatNaira(monthlySales)} of sales</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>You kept</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(kept)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>You would have kept</span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(proKept)}</span>
                </div>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{formatNaira(proKept - kept)} more, on that month alone.</span>
              </div>
            </div>

            <Card>
              <CardLabel>And you also get</CardLabel>
              <CheckRow ok>7 upload slots instead of 3</CheckRow>
              <CheckRow ok>Private communities</CheckRow>
              <CheckRow ok>Up to 3 free courses, priority support</CheckRow>
              <CheckRow ok>Gold badge, recommended deals</CheckRow>
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Pro, one year</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(PLANS.pro.price)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Credit for the rest of your Basic year</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--success)", fontFeatureSettings: "var(--font-feature-tabular)" }}>−{formatNaira(proCredit)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, paddingTop: 11, borderTop: "1px solid var(--border-hairline)" }}>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Due today</span>
                <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(dueToday)}</span>
              </div>
            </Card>
          </>
        ) : null}
      </div>

      {view !== "pastdue" ? (
        <div style={{ padding: "14px 16px 24px", borderTop: "1px solid var(--border-hairline)", display: "flex", flexDirection: "column", gap: 10 }}>
          {view === "current" ? (
            <Button full size="lg" iconRight="ArrowRight" onClick={() => setView("upgrade")}>
              See what Pro adds
            </Button>
          ) : null}
          {view === "upgrade" ? (
            <>
              <Button full size="lg" loading={paying} onClick={payAndGoPro}>
                Pay {formatNaira(dueToday)} and go Pro
              </Button>
              <span style={{ alignSelf: "center", fontSize: 12, color: "var(--text-muted)" }}>Your 90/10 split starts on the next sale.</span>
            </>
          ) : null}
          {view === "expired" ? (
            <Button full size="lg" onClick={() => setView("upgrade")}>
              Start a tier again
            </Button>
          ) : null}
        </div>
      ) : null}

      <Sheet open={showPaid} onClose={() => setShowPaid(false)} title="Upgrade confirmed">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "14px 6px 6px", textAlign: "center" }}>
          <span style={{ display: "grid", placeItems: "center", width: 72, height: 72, borderRadius: 999, background: "rgba(255,183,3,0.14)", border: "1px solid rgba(255,183,3,0.34)" }}>
            <Icon name="Crown" size={30} stroke={2.2} color="var(--brand-yellow)" />
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>You are on Pro</span>
          <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)", maxWidth: 270 }}>
            Seven slots, private communities, and 90% of every sale from now on.
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%", padding: "15px 16px", borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>Paid today</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(dueToday)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>Renews at {formatNaira(PLANS.pro.price)}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, fontFeatureSettings: "var(--font-feature-tabular)" }}>14 Aug 2027</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", paddingTop: 6 }}>
            <Button full size="lg" icon="Plus" onClick={() => router.push("/create")}>
              Use a new slot
            </Button>
            <Button full variant="ghost" onClick={() => setShowPaid(false)}>
              Back to billing
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Stop renewing Pro?"
        caption="You keep everything until 14 August 2027 — the day it would have renewed."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <CardLabel>After that date</CardLabel>
            <CheckRow ok={false}>Your split goes from 90% back to 85%.</CheckRow>
            <CheckRow ok={false}>No new uploads. Your 6 published pieces stay up.</CheckRow>
            <CheckRow ok={false}>Your private community becomes read-only.</CheckRow>
            <CheckRow ok={false}>Gold badge comes off your profile.</CheckRow>
          </Card>
          <Card>
            <CardLabel>What never changes</CardLabel>
            <CheckRow ok>Buyers keep everything they bought from you.</CheckRow>
            <CheckRow ok>Money you have already earned is still yours.</CheckRow>
          </Card>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", borderRadius: "var(--radius-input)", background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Basic is {formatNaira(PLANS.basic.price)}</span>
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Keeps 3 uploads and open communities</span>
              </div>
            <Button size="sm" variant="secondary" onClick={() => setShowCancel(false)}>
              Move to Basic
            </Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button full size="lg" variant="secondary" onClick={() => setShowCancel(false)}>
              Keep Pro
            </Button>
            <Button full variant="danger" onClick={() => setShowCancel(false)}>
              Stop renewing
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function CurrentView({
  view,
  onUpgrade,
  onCancel,
}: {
  view: DemoView;
  onUpgrade: () => void;
  onCancel: () => void;
}) {
  const expired = view === "expired";
  const pastdue = view === "pastdue";
  const proPrice = PLANS.pro.price;
  const basicPrice = PLANS.basic.price;

  return (
    <>
      {pastdue ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 18, borderRadius: "var(--radius-card)", background: "var(--warning-tint)", border: "1px solid rgba(255,183,3,0.32)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: 13, background: "rgba(255,183,3,0.16)", border: "1px solid rgba(255,183,3,0.3)", flexShrink: 0 }}>
              <Icon name="CreditCard" size={19} stroke={2.2} color="var(--warning)" />
            </span>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Renewal did not go through</span>
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Card 4412 was declined on 2 February</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            We will try twice more. You have <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>11 days</span> before Pro lapses.
          </p>
          <Button full size="lg" onClick={() => onUpgrade()}>
            Pay {formatNaira(proPrice)} now
          </Button>
        </div>
      ) : null}

      {expired ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 18, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-strong)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusPill kind="neutral">Expired</StatusPill>
            <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-muted)" }}>Pro ended 13 February</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            You are back to a plain creator account. Nothing was deleted and nobody lost anything they bought.
          </p>
        </div>
      ) : null}

      {!expired && !pastdue ? (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TierBadge tier="basic" />
            <StatusPill kind="success">Active</StatusPill>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", fontFeatureSettings: "var(--font-feature-tabular)" }}>{formatNaira(basicPrice)}</span>
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>a year</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 13, borderTop: "1px solid var(--border-hairline)" }}>
            <Icon name="Calendar" size={15} color="var(--text-muted)" />
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Renews</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, fontFeatureSettings: "var(--font-feature-tabular)" }}>2 Feb 2027</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="CreditCard" size={15} color="var(--text-muted)" />
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Card ending 4412</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", cursor: "pointer" }}>Change</span>
          </div>
        </Card>
      ) : null}

      {!expired && !pastdue ? (
        <Card>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Upload slots</span>
            <span style={{ fontSize: 17, fontWeight: 700, fontFeatureSettings: "var(--font-feature-tabular)" }}>2 of 3</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--surface-tag)", overflow: "hidden" }}>
            <div style={{ width: "67%", height: "100%", borderRadius: 999, background: "var(--accent)" }} />
          </div>
          <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>1 free and 2 paid. You have used your free one and one paid.</span>
        </Card>
      ) : null}

      {expired ? (
        <>
          <Card>
            <CardLabel>Your work</CardLabel>
            <CheckRow ok>All 6 pieces stay published and keep selling.</CheckRow>
            <CheckRow ok>Everyone who bought keeps their copy, permanently.</CheckRow>
            <CheckRow ok={false}>You cannot upload anything new until you pay again.</CheckRow>
          </Card>
          <Card>
            <CardLabel>Your money</CardLabel>
            <CheckRow ok>Everything already earned is still owed to you and still coming.</CheckRow>
            <CheckRow ok={false} icon="TrendingDown">New sales go back to the 85/15 split from 13 February.</CheckRow>
          </Card>
          <Card>
            <CardLabel>Switched off</CardLabel>
            <CheckRow ok={false} icon="X">Gold badge and priority support</CheckRow>
            <CheckRow ok={false} icon="X">Your private community is read-only</CheckRow>
          </Card>
        </>
      ) : null}

      {!expired && !pastdue ? (
        <Card>
          <CardLabel>What Basic gives you</CardLabel>
          <CheckRow ok>3 uploads · 85/15 split</CheckRow>
          <CheckRow ok>Host open communities · 90% on credits</CheckRow>
          <CheckRow ok>1 free course, business playbook, purple badge</CheckRow>
          <CheckRow ok={false}>No private communities</CheckRow>
        </Card>
      ) : null}

      {!expired && !pastdue ? (
        <span style={{ alignSelf: "flex-start", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer", padding: "2px 0" }} onClick={onCancel}>
          Do not renew
        </span>
      ) : null}

      {pastdue ? (
        <>
          <Card>
            <CardLabel>Still working</CardLabel>
            <CheckRow ok>Everything you published stays live and selling</CheckRow>
            <CheckRow ok>Paid messages and your community</CheckRow>
            <CheckRow ok>Your 90/10 split, until it lapses</CheckRow>
          </Card>
          <Card>
            <CardLabel>Paused until you pay</CardLabel>
            <CheckRow ok={false} icon="X">New uploads</CheckRow>
            <CheckRow ok={false} icon="X">Opening a new private community</CheckRow>
          </Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
            <Icon name="CreditCard" size={16} color="var(--text-muted)" />
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Use a different card</span>
            <Icon name="ChevronRight" size={17} color="var(--text-muted)" stroke={2} />
          </div>
        </>
      ) : null}
    </>
  );
}
