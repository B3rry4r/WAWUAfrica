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
import { TierBadge } from "@/components/ui/TierBadge";

type DemoView = "current" | "upgrade" | "pastdue" | "expired";

function CheckRow({ ok, children, icon }: { ok: boolean; children: React.ReactNode; icon?: IconName }) {
  return (
    <span className="flex items-start gap-[9px] text-[13.5px] leading-[1.45]" style={{color: ok ? "var(--text-secondary)" : "var(--text-muted)"}}>
      <Icon name={icon ?? (ok ? "Check" : "X")} size={15} strokeWidth={2.4} color={ok ? "var(--success)" : "var(--warning)"} className="mt-[2px]" />
      {children}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-[12px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]"
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">
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
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
      <FlowHeader title={title} onBack={() => router.back()} />

      <div className="flex justify-center gap-[4px] pt-[10px] px-[16px] pb-0">
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
            className="h-[30px] py-0 px-[14px] rounded-[999] text-[11.5px] font-semibold cursor-pointer" style={{border: view === v ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", background: view === v ? "var(--accent-tint)" : "var(--surface-tag)", color: view === v ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-sans)"}}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[14px]">
        {view === "current" || view === "pastdue" || view === "expired" ? (
          <CurrentView view={view} onUpgrade={() => setView("upgrade")} onCancel={() => setShowCancel(true)} />
        ) : null}

        {view === "upgrade" ? (
          <>
            <div className="flex flex-col gap-[16px] p-0 rounded-[var(--radius-card)] bg-[var(--surface-elevated)] border border-[var(--border-accent)]">
              <CardLabel>The reason to move</CardLabel>
              <div className="flex items-center gap-[14px]">
                <div className="flex flex-col gap-[4px]">
                  <span className="text-[26px] font-bold tracking-[-0.03em] text-[var(--text-muted)]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>85%</span>
                  <span className="text-[11px] font-semibold tracking-[0.05em] uppercase text-[var(--text-muted)]">You keep now</span>
                </div>
                <Icon name="ArrowRight" size={20} strokeWidth={2.4} color="var(--accent)" />
                <div className="flex flex-col gap-[4px]">
                  <span className="text-[34px] font-bold tracking-[-0.035em]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>90%</span>
                  <span className="text-[11px] font-semibold tracking-[0.05em] uppercase text-[var(--accent)]">On Pro</span>
                </div>
              </div>
              <div className="flex flex-col gap-[9px] pt-[14px] border-t border-t-[var(--border-hairline)]">
                <div className="flex items-center gap-[10px]">
                  <span className="flex-1 text-[13px] text-[var(--text-secondary)]">On last month&apos;s {formatNaira(monthlySales)} of sales</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">You kept</span>
                  <span className="text-[14px] font-semibold text-[var(--text-muted)]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(kept)}</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="flex-1 text-[13.5px] font-semibold">You would have kept</span>
                  <span className="text-[16px] font-bold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(proKept)}</span>
                </div>
                <span className="text-[12.5px] text-[var(--text-muted)]">{formatNaira(proKept - kept)} more, on that month alone.</span>
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
              <div className="flex items-center gap-[10px]">
                <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Pro, one year</span>
                <span className="text-[13.5px] font-semibold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(PLANS.pro.price)}</span>
              </div>
              <div className="flex items-center gap-[10px]">
                <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Credit for the rest of your Basic year</span>
                <span className="text-[13.5px] font-semibold text-[var(--success)]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>−{formatNaira(proCredit)}</span>
              </div>
              <div className="flex items-baseline gap-[10px] pt-[11px] border-t border-t-[var(--border-hairline)]">
                <span className="flex-1 text-[15px] font-semibold">Due today</span>
                <span className="text-[24px] font-bold tracking-[-0.03em]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(dueToday)}</span>
              </div>
            </Card>
          </>
        ) : null}
      </div>

      {view !== "pastdue" ? (
        <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px]">
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
              <span className="text-[12px] text-[var(--text-muted)]" style={{alignSelf: "center"}}>Your 90/10 split starts on the next sale.</span>
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
        <div className="flex flex-col items-center gap-[16px] pt-[14px] px-[6px] pb-[6px] text-center">
          <span className="grid place-items-center w-[72px] h-[72px] rounded-[999] bg-[rgba(255,183,3,0.14)] border border-[rgba(255,183,3,0.34)]">
            <Icon name="Crown" size={30} strokeWidth={2.2} color="var(--brand-yellow)" />
          </span>
          <span className="text-[20px] font-bold tracking-[-0.02em]">You are on Pro</span>
          <span className="text-[14px] leading-[1.5] text-[var(--text-secondary)] max-w-[270px]">
            Seven slots, private communities, and 90% of every sale from now on.
          </span>
          <div className="flex flex-col gap-[9px] w-full py-[15px] px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left">
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Paid today</span>
              <span className="text-[13.5px] font-bold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(dueToday)}</span>
            </div>
            <div className="flex items-center gap-[10px]">
              <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Renews at {formatNaira(PLANS.pro.price)}</span>
              <span className="text-[13.5px] font-semibold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>14 Aug 2027</span>
            </div>
          </div>
          <div className="flex flex-col gap-[10px] w-full pt-[6px]">
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
        <div className="flex flex-col gap-[16px]">
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
            <div className="flex items-center gap-[12px] py-[14px] px-[15px] rounded-[var(--radius-input)] bg-[var(--accent-tint)] border border-[var(--border-accent)]">
              <div className="flex-1 flex flex-col gap-[3px]">
                <span className="text-[13.5px] font-semibold">Basic is {formatNaira(PLANS.basic.price)}</span>
                <span className="text-[12.5px] text-[var(--text-secondary)]">Keeps 3 uploads and open communities</span>
              </div>
            <Button size="sm" variant="secondary" onClick={() => setShowCancel(false)}>
              Move to Basic
            </Button>
          </div>
          <div className="flex flex-col gap-[10px]">
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
        <div className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.32)]">
          <div className="flex items-center gap-[12px]">
            <span className="grid place-items-center w-[42px] h-[42px] rounded-[13] bg-[rgba(255,183,3,0.16)] border border-[rgba(255,183,3,0.3)] shrink-0">
              <Icon name="CreditCard" size={19} strokeWidth={2.2} color="var(--warning)" />
            </span>
            <div className="flex-1 flex flex-col gap-[3px]">
              <span className="text-[16px] font-semibold">Renewal did not go through</span>
              <span className="text-[12.5px] text-[var(--text-secondary)]">Card 4412 was declined on 2 February</span>
            </div>
          </div>
          <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            We will try twice more. You have <span className="text-[var(--text-primary)] font-semibold">11 days</span> before Pro lapses.
          </p>
          <Button full size="lg" onClick={() => onUpgrade()}>
            Pay {formatNaira(proPrice)} now
          </Button>
        </div>
      ) : null}

      {expired ? (
        <div className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-strong)]">
          <div className="flex items-center gap-[10px]">
            <StatusPill kind="neutral">Expired</StatusPill>
            <span className="flex-1 text-[12.5px] text-[var(--text-muted)]">Pro ended 13 February</span>
          </div>
          <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            You are back to a plain creator account. Nothing was deleted and nobody lost anything they bought.
          </p>
        </div>
      ) : null}

      {!expired && !pastdue ? (
        <Card>
          <div className="flex items-center gap-[10px]">
            <TierBadge tier="basic" />
            <StatusPill kind="success">Active</StatusPill>
          </div>
          <div className="flex items-baseline gap-[7px]">
            <span className="text-[30px] font-bold tracking-[-0.03em]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(basicPrice)}</span>
            <span className="text-[14px] text-[var(--text-muted)]">a year</span>
          </div>
          <div className="flex items-center gap-[10px] pt-[13px] border-t border-t-[var(--border-hairline)]">
            <Icon name="Calendar" size={15} color="var(--text-muted)" />
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Renews</span>
            <span className="text-[13.5px] font-semibold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>2 Feb 2027</span>
          </div>
          <div className="flex items-center gap-[10px]">
            <Icon name="CreditCard" size={15} color="var(--text-muted)" />
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Card ending 4412</span>
            <span className="text-[13px] font-semibold text-[var(--accent)] cursor-pointer">Change</span>
          </div>
        </Card>
      ) : null}

      {!expired && !pastdue ? (
        <Card>
          <div className="flex items-baseline gap-[10px]">
            <span className="flex-1 text-[14px] font-semibold">Upload slots</span>
            <span className="text-[17px] font-bold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>2 of 3</span>
          </div>
          <div className="h-[6px] rounded-[999] bg-[var(--surface-tag)] overflow-hidden">
            <div className="w-[67%] h-full rounded-[999] bg-[var(--accent)]" />
          </div>
          <span className="text-[12.5px] text-[var(--text-muted)]">1 free and 2 paid. You have used your free one and one paid.</span>
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
        <span className="text-[13px] font-semibold text-[var(--text-secondary)] cursor-pointer py-[2px] px-0" style={{alignSelf: "flex-start"}} onClick={onCancel}>
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
          <div className="flex items-center gap-[12px] py-[15px] px-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
            <Icon name="CreditCard" size={16} color="var(--text-muted)" />
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Use a different card</span>
            <Icon name="ChevronRight" size={17} color="var(--text-muted)" strokeWidth={2} />
          </div>
        </>
      ) : null}
    </>
  );
}
