"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/format";
import { PLANS } from "@/types/subscription";
import type { Subscription } from "@/types/subscription";
import type { CreatorTier } from "@/types/account";
import { subscriptionApi } from "@/lib/api/subscription";
import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusPill } from "@/components/ui/StatusPill";
import { TierBadge } from "@/components/ui/TierBadge";

/** Where within the flow the screen is currently drawn — not a state switcher. */
type Screen = "billing" | "upgrade" | "resubscribe";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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
  const gates = creatorGates(currentSession);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [screen, setScreen] = useState<Screen>("billing");

  const [showPaid, setShowPaid] = useState(false);
  const [paidSummary, setPaidSummary] = useState<{ tier: CreatorTier; paid: number } | null>(null);
  const [paying, setPaying] = useState(false);
  const [resubTier, setResubTier] = useState<CreatorTier | null>(null);
  const [retrying, setRetrying] = useState(false);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downgrading, setDowngrading] = useState(false);

  const [showCard, setShowCard] = useState(false);
  const [cardLast4, setCardLast4] = useState("4412");
  const [cardBusy, setCardBusy] = useState<string | null>(null);

  const load = () => {
    setLoadState("loading");
    subscriptionApi
      .getSubscription()
      // SEAM: replace with GET /api/hub/creator-subscription
      .then((sub) => {
        setSubscription(sub);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  };

  useEffect(() => {
    load();
  }, []);

  const monthlySales = 45000;
  const basicKept = Math.round((monthlySales * PLANS.basic.split) / 100);
  const proKept = Math.round((monthlySales * PLANS.pro.split) / 100);
  const proCredit = 2750;
  const dueToday = PLANS.pro.price - proCredit;

  const payAndGoPro = async () => {
    setPaying(true);
    const sub = await subscriptionApi.upgradeToPro();
    setSubscription(sub);
    setPaying(false);
    setPaidSummary({ tier: "pro", paid: dueToday });
    setShowPaid(true);
    setScreen("billing");
  };

  const startTier = async (tier: CreatorTier) => {
    setResubTier(tier);
    const sub = tier === "pro" ? await subscriptionApi.upgradeToPro() : await subscriptionApi.downgradeToBasic();
    setSubscription(sub);
    setResubTier(null);
    setPaidSummary({ tier, paid: PLANS[tier].price });
    setShowPaid(true);
    setScreen("billing");
  };

  const retryPayment = async () => {
    setRetrying(true);
    const sub = await subscriptionApi.retryPayment();
    setSubscription(sub);
    setRetrying(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    const sub = await subscriptionApi.cancelPro();
    setSubscription(sub);
    setCancelling(false);
    setShowCancel(false);
  };

  const handleDowngrade = async () => {
    setDowngrading(true);
    const sub = await subscriptionApi.downgradeToBasic();
    setSubscription(sub);
    setDowngrading(false);
    setShowCancel(false);
  };

  const changeCard = async (last4: string) => {
    if (last4 === cardLast4) {
      setShowCard(false);
      return;
    }
    setCardBusy(last4);
    await subscriptionApi.updateCard(last4);
    // SEAM: replace with POST /api/hub/creator-subscription/card
    setCardLast4(last4);
    setCardBusy(null);
    setShowCard(false);
  };

  const tier = subscription?.plan.tier ?? gates.tier ?? "basic";
  const state = subscription?.state ?? "active";
  const tierLabel = tier === "pro" ? "Pro" : "Basic";
  const title = screen === "upgrade" ? "Move to Pro" : screen === "resubscribe" ? "Choose a plan" : "Tier and billing";

  const onBack = () => {
    if (screen !== "billing") {
      setScreen("billing");
      return;
    }
    router.back();
  };

  return (
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
      <FlowHeader title={title} onBack={onBack} />

      {loadState === "loading" ? (
        <div className="flex-1 pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[14px]">
          <Skeleton variant="card" className="h-[160px]" />
          <Skeleton variant="card" className="h-[96px]" />
          <Skeleton variant="card" className="h-[140px]" />
        </div>
      ) : loadState === "error" || !subscription ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-[14px] px-[24px] text-center">
          <Icon name="CircleAlert" size={30} color="var(--danger)" />
          <span className="text-[15px] font-semibold">Could not load your billing</span>
          <span className="text-[13px] text-[var(--text-secondary)]">Check your connection and try again.</span>
          <Button onClick={load}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="flex-1 pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[14px]">
            {screen === "billing" ? (
              <CurrentView
                subscription={subscription}
                slotsUsed={gates.slotsUsed}
                slotsTotal={gates.slotsTotal}
                cardLast4={cardLast4}
                retrying={retrying}
                onUpgrade={() => setScreen("upgrade")}
                onStartTier={() => setScreen("resubscribe")}
                onCancel={() => setShowCancel(true)}
                onChangeCard={() => setShowCard(true)}
                onRetryPayment={retryPayment}
              />
            ) : null}

            {screen === "upgrade" ? (
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
                      <span className="text-[14px] font-semibold text-[var(--text-muted)]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(basicKept)}</span>
                    </div>
                    <div className="flex items-center gap-[10px]">
                      <span className="flex-1 text-[13.5px] font-semibold">You would have kept</span>
                      <span className="text-[16px] font-bold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(proKept)}</span>
                    </div>
                    <span className="text-[12.5px] text-[var(--text-muted)]">{formatNaira(proKept - basicKept)} more, on that month alone.</span>
                  </div>
                </div>

                <Card>
                  <CardLabel>And you also get</CardLabel>
                  {PLANS.pro.features.map((f) => (
                    <CheckRow key={f} ok>{f}</CheckRow>
                  ))}
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

            {screen === "resubscribe" ? (
              <>
                <Card>
                  <CardLabel>Starting fresh</CardLabel>
                  <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                    No proration — this is a new term at full price. Nothing you already published or sold was touched while you were off.
                  </span>
                </Card>
                {(["basic", "pro"] as CreatorTier[]).map((t) => (
                  <Card key={t}>
                    <div className="flex items-center gap-[10px]">
                      <TierBadge tier={t} />
                      <span className="flex-1 text-[20px] font-bold tracking-[-0.02em]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>
                        {formatNaira(PLANS[t].price)}
                        <span className="text-[13px] font-normal text-[var(--text-muted)]"> / year</span>
                      </span>
                    </div>
                    {PLANS[t].features.map((f) => (
                      <CheckRow key={f} ok>{f}</CheckRow>
                    ))}
                    <Button full loading={resubTier === t} onClick={() => startTier(t)}>
                      Start {t === "pro" ? "Pro" : "Basic"} — {formatNaira(PLANS[t].price)}
                    </Button>
                  </Card>
                ))}
              </>
            ) : null}
          </div>

          {screen === "billing" && state === "active" && tier === "basic" ? (
            <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px]">
              <Button full size="lg" iconRight="ArrowRight" onClick={() => setScreen("upgrade")}>
                See what Pro adds
              </Button>
            </div>
          ) : null}

          {screen === "billing" && (state === "expired" || state === "none") ? (
            <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px]">
              <Button full size="lg" onClick={() => setScreen("resubscribe")}>
                {state === "expired" ? "Start a tier again" : "Choose a plan"}
              </Button>
            </div>
          ) : null}

          {screen === "upgrade" ? (
            <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px]">
              <Button full size="lg" loading={paying} onClick={payAndGoPro}>
                Pay {formatNaira(dueToday)} and go Pro
              </Button>
              <span className="text-[12px] text-[var(--text-muted)]" style={{alignSelf: "center"}}>Your 90/10 split starts on the next sale.</span>
            </div>
          ) : null}
        </>
      )}

      <Sheet open={showPaid} onClose={() => setShowPaid(false)} title={paidSummary?.tier === "pro" ? "Upgrade confirmed" : "Plan updated"}>
        {paidSummary ? (
          <div className="flex flex-col items-center gap-[16px] pt-[14px] px-[6px] pb-[6px] text-center">
            <span
              className="grid place-items-center w-[72px] h-[72px] rounded-[999]"
              style={
                paidSummary.tier === "pro"
                  ? { background: "rgba(255,183,3,0.14)", border: "1px solid rgba(255,183,3,0.34)" }
                  : { background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }
              }
            >
              <Icon name={paidSummary.tier === "pro" ? "Crown" : "Check"} size={30} strokeWidth={2.2} color={paidSummary.tier === "pro" ? "var(--brand-yellow)" : "var(--accent)"} />
            </span>
            <span className="text-[20px] font-bold tracking-[-0.02em]">You are on {paidSummary.tier === "pro" ? "Pro" : "Basic"}</span>
            <span className="text-[14px] leading-[1.5] text-[var(--text-secondary)] max-w-[270px]">
              {paidSummary.tier === "pro"
                ? "Seven slots, private communities, and 90% of every sale from now on."
                : "Three slots, open communities, and 85% of every sale."}
            </span>
            <div className="flex flex-col gap-[9px] w-full py-[15px] px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left">
              <div className="flex items-center gap-[10px]">
                <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Paid today</span>
                <span className="text-[13.5px] font-bold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(paidSummary.paid)}</span>
              </div>
              <div className="flex items-center gap-[10px]">
                <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Renews at {formatNaira(PLANS[paidSummary.tier].price)}</span>
                <span className="text-[13.5px] font-semibold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatDate(subscription?.renewsAt)}</span>
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
        ) : null}
      </Sheet>

      <Sheet
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title={tier === "pro" ? "Stop renewing Pro?" : "Stop renewing Basic?"}
        caption={
          subscription?.renewsAt
            ? `You keep everything until ${formatDate(subscription.renewsAt)} — the day it would have renewed.`
            : undefined
        }
      >
        <div className="flex flex-col gap-[16px]">
          <Card>
            <CardLabel>After that date</CardLabel>
            {tier === "pro" ? (
              <>
                <CheckRow ok={false}>Your split goes from 90% back to 85%.</CheckRow>
                <CheckRow ok={false}>No new uploads. Your published pieces stay up.</CheckRow>
                <CheckRow ok={false}>Your private community becomes read-only.</CheckRow>
                <CheckRow ok={false}>Gold badge comes off your profile.</CheckRow>
              </>
            ) : (
              <>
                <CheckRow ok={false}>No new uploads until you resubscribe.</CheckRow>
                <CheckRow ok={false}>Your open community stays up but you cannot open a new one.</CheckRow>
                <CheckRow ok={false}>Purple badge comes off your profile.</CheckRow>
              </>
            )}
          </Card>
          <Card>
            <CardLabel>What never changes</CardLabel>
            <CheckRow ok>Buyers keep everything they bought from you.</CheckRow>
            <CheckRow ok>Money you have already earned is still yours.</CheckRow>
          </Card>
          {tier === "pro" ? (
            <div className="flex items-center gap-[12px] py-[14px] px-[15px] rounded-[var(--radius-input)] bg-[var(--accent-tint)] border border-[var(--border-accent)]">
              <div className="flex-1 flex flex-col gap-[3px]">
                <span className="text-[13.5px] font-semibold">Basic is {formatNaira(PLANS.basic.price)}</span>
                <span className="text-[12.5px] text-[var(--text-secondary)]">Keeps 3 uploads and open communities</span>
              </div>
              <Button size="sm" variant="secondary" loading={downgrading} onClick={handleDowngrade}>
                Move to Basic
              </Button>
            </div>
          ) : null}
          <div className="flex flex-col gap-[10px]">
            <Button full size="lg" variant="secondary" onClick={() => setShowCancel(false)}>
              Keep {tierLabel}
            </Button>
            <Button full variant="danger" loading={cancelling} onClick={handleCancel}>
              Stop renewing
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet open={showCard} onClose={() => setShowCard(false)} title="Payment card" caption="Card changes are mocked here — no payment processor is connected yet.">
        <div className="flex flex-col gap-[10px]">
          {["4412", "9021"].map((last4) => {
            const active = last4 === cardLast4;
            return (
              <button
                key={last4}
                type="button"
                disabled={cardBusy !== null}
                onClick={() => changeCard(last4)}
                className="flex items-center gap-[12px] py-[14px] px-[15px] rounded-[var(--radius-input)] border text-left disabled:opacity-60"
                style={{
                  borderColor: active ? "var(--border-accent)" : "var(--border-hairline)",
                  background: active ? "var(--accent-tint)" : "var(--surface-card)",
                }}
              >
                <Icon name="CreditCard" size={16} color={active ? "var(--accent)" : "var(--text-muted)"} />
                <span className="flex-1 text-[13.5px] font-semibold">Card ending {last4}</span>
                {cardBusy === last4 ? (
                  <Icon name="Loader2" size={16} color="var(--text-muted)" className="[animation:wawuSpin_900ms_linear_infinite]" />
                ) : active ? (
                  <StatusPill kind="success" size="sm">In use</StatusPill>
                ) : null}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

function CurrentView({
  subscription,
  slotsUsed,
  slotsTotal,
  cardLast4,
  retrying,
  onUpgrade,
  onStartTier,
  onCancel,
  onChangeCard,
  onRetryPayment,
}: {
  subscription: Subscription;
  slotsUsed: number;
  slotsTotal: number;
  cardLast4: string;
  retrying: boolean;
  onUpgrade: () => void;
  onStartTier: () => void;
  onCancel: () => void;
  onChangeCard: () => void;
  onRetryPayment: () => void;
}) {
  const tier = subscription.plan.tier;
  const state = subscription.state;
  const pastdue = state === "past_due";
  const expired = state === "expired";
  const none = state === "none";
  const active = state === "active";
  const price = subscription.plan.price;
  const slotsPct = slotsTotal > 0 ? Math.round((slotsUsed / slotsTotal) * 100) : 0;

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
              <span className="text-[12.5px] text-[var(--text-secondary)]">Card {cardLast4} was declined</span>
            </div>
          </div>
          <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            We will try twice more before {tier === "pro" ? "Pro" : "Basic"} lapses.
          </p>
          <Button full size="lg" loading={retrying} onClick={onRetryPayment}>
            Pay {formatNaira(price)} now
          </Button>
        </div>
      ) : null}

      {expired ? (
        <div className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-strong)]">
          <div className="flex items-center gap-[10px]">
            <StatusPill kind="neutral">Expired</StatusPill>
            <span className="flex-1 text-[12.5px] text-[var(--text-muted)]">{tier === "pro" ? "Pro" : "Basic"} ended {formatDate(subscription.cancelsAt ?? subscription.renewsAt)}</span>
          </div>
          <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            You are back to a plain creator account. Nothing was deleted and nobody lost anything they bought.
          </p>
        </div>
      ) : null}

      {none ? (
        <div className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-strong)]">
          <div className="flex items-center gap-[10px]">
            <StatusPill kind="neutral">No plan yet</StatusPill>
          </div>
          <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            Choose Basic or Pro to start uploading and selling.
          </p>
        </div>
      ) : null}

      {active ? (
        <Card>
          <div className="flex items-center gap-[10px]">
            <TierBadge tier={tier} />
            <StatusPill kind="success">Active</StatusPill>
          </div>
          <div className="flex items-baseline gap-[7px]">
            <span className="text-[30px] font-bold tracking-[-0.03em]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{formatNaira(price)}</span>
            <span className="text-[14px] text-[var(--text-muted)]">a year</span>
          </div>
          <div className="flex items-center gap-[10px] pt-[13px] border-t border-t-[var(--border-hairline)]">
            <Icon name="Calendar" size={15} color="var(--text-muted)" />
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">{subscription.cancelsAt ? "Renewal off — ends" : "Renews"}</span>
            <span className="text-[13.5px] font-semibold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>
              {formatDate(subscription.cancelsAt ?? subscription.renewsAt)}
            </span>
          </div>
          <div className="flex items-center gap-[10px]">
            <Icon name="CreditCard" size={15} color="var(--text-muted)" />
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Card ending {cardLast4}</span>
            <button type="button" onClick={onChangeCard} className="text-[13px] font-semibold text-[var(--accent)] bg-transparent border-0 cursor-pointer p-0">
              Change
            </button>
          </div>
        </Card>
      ) : null}

      {active ? (
        <Card>
          <div className="flex items-baseline gap-[10px]">
            <span className="flex-1 text-[14px] font-semibold">Upload slots</span>
            <span className="text-[17px] font-bold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}>{slotsUsed} of {slotsTotal}</span>
          </div>
          <div className="h-[6px] rounded-[999] bg-[var(--surface-tag)] overflow-hidden">
            <div className="h-full rounded-[999] bg-[var(--accent)]" style={{width: `${Math.min(100, slotsPct)}%`}} />
          </div>
          <span className="text-[12.5px] text-[var(--text-muted)]">{PLANS[tier].freeSlots} free and {PLANS[tier].slots - PLANS[tier].freeSlots} paid, included on {tier === "pro" ? "Pro" : "Basic"}.</span>
        </Card>
      ) : null}

      {expired ? (
        <>
          <Card>
            <CardLabel>Your work</CardLabel>
            <CheckRow ok>Everything published stays up and keeps selling.</CheckRow>
            <CheckRow ok>Everyone who bought keeps their copy, permanently.</CheckRow>
            <CheckRow ok={false}>You cannot upload anything new until you pay again.</CheckRow>
          </Card>
          <Card>
            <CardLabel>Your money</CardLabel>
            <CheckRow ok>Everything already earned is still owed to you and still coming.</CheckRow>
            <CheckRow ok={false} icon="TrendingDown">New sales go back to the 85/15 split.</CheckRow>
          </Card>
          <Card>
            <CardLabel>Switched off</CardLabel>
            <CheckRow ok={false} icon="X">{tier === "pro" ? "Gold badge and priority support" : "Purple badge"}</CheckRow>
            {tier === "pro" ? <CheckRow ok={false} icon="X">Your private community is read-only</CheckRow> : null}
          </Card>
        </>
      ) : null}

      {active ? (
        <Card>
          <CardLabel>What {tier === "pro" ? "Pro" : "Basic"} gives you</CardLabel>
          {PLANS[tier].features.map((f) => (
            <CheckRow key={f} ok>{f}</CheckRow>
          ))}
        </Card>
      ) : null}

      {active ? (
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-semibold text-[var(--text-secondary)] bg-transparent border-0 cursor-pointer py-[2px] px-0 self-start"
        >
          Do not renew
        </button>
      ) : null}

      {pastdue ? (
        <>
          <Card>
            <CardLabel>Still working</CardLabel>
            <CheckRow ok>Everything you published stays live and selling</CheckRow>
            <CheckRow ok>Paid messages and your community</CheckRow>
            <CheckRow ok>Your {PLANS[tier].split}/{100 - PLANS[tier].split} split, until it lapses</CheckRow>
          </Card>
          <Card>
            <CardLabel>Paused until you pay</CardLabel>
            <CheckRow ok={false} icon="X">New uploads</CheckRow>
            <CheckRow ok={false} icon="X">{tier === "pro" ? "Opening a new private community" : "Opening a new community"}</CheckRow>
          </Card>
          <button
            type="button"
            onClick={onChangeCard}
            className="flex items-center gap-[12px] py-[15px] px-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left cursor-pointer"
          >
            <Icon name="CreditCard" size={16} color="var(--text-muted)" />
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Use a different card</span>
            <Icon name="ChevronRight" size={17} color="var(--text-muted)" strokeWidth={2} />
          </button>
        </>
      ) : null}

      {none ? (
        <Card>
          <CardLabel>Basic — {formatNaira(PLANS.basic.price)}/yr</CardLabel>
          {PLANS.basic.features.map((f) => (
            <CheckRow key={f} ok>{f}</CheckRow>
          ))}
        </Card>
      ) : null}
    </>
  );
}
