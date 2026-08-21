"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatNaira } from "@/lib/format";
import { PLANS } from "@/types/subscription";
import type { Subscription } from "@/types/subscription";
import type { CreatorTier } from "@/types/account";
import { subscriptionApi } from "@/lib/api/subscription";
import { isFlutterwaveCancelled } from "@/lib/flutterwave";
import type { BillingHistoryPage } from "@/lib/api/subscription";
import { creatorGates } from "@/lib/auth/gates";
import { useSession } from "@/lib/auth/session-provider";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatBlock } from "@/components/ui/StatBlock";
import { StatusPill } from "@/components/ui/StatusPill";
import { TierBadge } from "@/components/ui/TierBadge";

/** Where within the flow the screen is currently drawn — not a state switcher. */
type Screen = "billing" | "upgrade" | "resubscribe";

function formatDate(iso?: string): string {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function CheckRow({ ok, children, icon }: { ok: boolean; children: React.ReactNode; icon?: IconName }) {
  return (
    <span
      className={`flex items-start gap-[9px] text-[13.5px] leading-[1.45] ${
        ok ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
      }`}
    >
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
  // Derive gates from the REAL signed-in user. This previously read the
  // frozen dev mock session (always creator/pro/paid), so the billing screen
  // showed every visitor as a paid Pro creator regardless of their account.
  const { user } = useSession();
  const gates = creatorGates(user);

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
  // Every money action below can reject (declined card, dropped connection,
  // 5xx). Without this the spinner simply never stopped and the screen said
  // nothing at all about what happened.
  const [actionError, setActionError] = useState<string | null>(null);
  // Real value from the fetched subscription (subscription.cardLast4), not a
  // hardcoded placeholder — falls back only while nothing has loaded yet.
  // Nullable on the backend, so there is often no card on file. It used to
  // fall back to the literal "4412", which rendered as the creator's real
  // card in five places — including "Card 4412 was declined".
  const cardLast4 = subscription?.cardLast4 ?? null;

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

  // An explicitly-labelled worked example, not the creator's own sales —
  // there is no per-month sales figure on the earnings response to use here,
  // and presenting one as theirs would be inventing their numbers.
  // A worked EXAMPLE, not this creator's sales. There is no per-month sales
  // figure on the earnings response to use, and the copy below must say so —
  // it previously read "On last month's ₦45,000 of sales", presenting an
  // invented number as the creator's own history to sell an upgrade.
  const monthlySales = 45000;
  const basicKept = Math.round((monthlySales * PLANS.basic.split) / 100);
  const proKept = Math.round((monthlySales * PLANS.pro.split) / 100);
  // The real prorated amount comes back from the server on upgrade
  // (creator-subscription.service.ts: credit = daysRemaining/365 * Basic
  // price). Shown as "up to" here because the exact credit is only known
  // once the upgrade is initiated.

  /**
   * The charge and the server-side verify both happen inside
   * `subscriptionApi`, so a rejection here cannot tell a decline (no money
   * moved) from a verify failure (money moved). The copy therefore never
   * claims "nothing was charged" and never invites a blind second payment.
   */
  const PAYMENT_ERROR =
    "We could not complete that payment. If money left your account, do not pay again, contact hello@wawuafrica.com and we will sort it.";

  const payAndGoPro = async () => {
    setActionError(null);
    setPaying(true);
    try {
      // The receipt must show what Flutterwave actually charged (the server
      // prorates the unused Basic term), not a locally-guessed figure.
      const { subscription: sub, amountCharged } = await subscriptionApi.upgradeToPro();
      setSubscription(sub);
      setPaidSummary({ tier: "pro", paid: amountCharged });
      setShowPaid(true);
      setScreen("billing");
    } catch (e) {
      // Dismissing the checkout modal charges nothing and is not an error.
      if (!isFlutterwaveCancelled(e)) setActionError(PAYMENT_ERROR);
    } finally {
      setPaying(false);
    }
  };

  const startTier = async (tier: CreatorTier) => {
    setActionError(null);
    setResubTier(tier);
    try {
      let sub: Subscription;
      let charged = PLANS[tier].price;
      if (tier === "pro") {
        const result = await subscriptionApi.upgradeToPro();
        sub = result.subscription;
        charged = result.amountCharged;
      } else {
        sub = await subscriptionApi.downgradeToBasic();
      }
      setSubscription(sub);
      setPaidSummary({ tier, paid: charged });
      setShowPaid(true);
      setScreen("billing");
    } catch (e) {
      if (!isFlutterwaveCancelled(e)) setActionError(PAYMENT_ERROR);
    } finally {
      setResubTier(null);
    }
  };

  const retryPayment = async () => {
    setActionError(null);
    setRetrying(true);
    try {
      const sub = await subscriptionApi.retryPayment();
      setSubscription(sub);
    } catch {
      setActionError("That retry did not go through. Check the card on file and try again.");
    } finally {
      setRetrying(false);
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    setCancelling(true);
    try {
      const sub = await subscriptionApi.cancelPro();
      setSubscription(sub);
    } catch {
      setActionError("We could not cancel your subscription. Nothing changed, please try again.");
    } finally {
      setCancelling(false);
      // Closed either way, so the message below is not hidden behind the sheet.
      setShowCancel(false);
    }
  };

  const handleDowngrade = async () => {
    setActionError(null);
    setDowngrading(true);
    try {
      const sub = await subscriptionApi.downgradeToBasic();
      setSubscription(sub);
    } catch {
      setActionError("We could not move you to Basic. Nothing changed, please try again.");
    } finally {
      setDowngrading(false);
      setShowCancel(false);
    }
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
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0 xl:min-h-0 xl:max-w-none">
      <div className="xl:hidden">
        <FlowHeader title={title} onBack={onBack} />
      </div>

      {/* D9's own 68px "‹ Settings / Subscription" bar. /subscription now lives in
          the (focused) route group, whose layout gives it a persistent Sidebar +
          DesktopHeader (search/notifications/account chip) — but neither of those
          does back-navigation, and DesktopHeader has no concept of "which settings
          page am I under." This bar still earns its place for that: it's the
          breadcrumb back to /settings, same job AppHeader's mobile back-arrow
          would do. It's registered in AppHeader's OWN_HEADER_ROUTES so DesktopHeader
          hides here instead of stacking above it — the same mechanism /services and
          /content already use for their own local headers. */}
      <div className="hidden h-[68px] shrink-0 items-center gap-4 border-b border-[var(--border-hairline)] px-[26px] xl:flex">
        <Link href="/settings" className="flex items-center gap-[9px] text-[14px] font-semibold text-[var(--text-secondary)] no-underline">
          <Icon name="ArrowLeft" size={18} color="var(--text-secondary)" />
          Settings
        </Link>
        <span className="ml-[10px] text-[19px] font-semibold tracking-[-0.02em]">Subscription</span>
      </div>

      {loadState === "loading" ? (
        <div className="flex-1 pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[14px] xl:mx-auto xl:mt-[26px] xl:w-full xl:max-w-[560px] xl:px-0">
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
          {actionError ? (
            <div
              role="alert"
              className="mx-[16px] mt-[14px] flex items-start gap-[10px] rounded-[var(--radius-card)] border border-[rgba(255,92,92,0.32)] bg-[var(--danger-tint)] px-[14px] py-[12px] xl:mx-[26px]"
            >
              <Icon name="TriangleAlert" size={16} strokeWidth={2.2} color="var(--danger)" className="mt-[1px]" />
              <span className="flex-1 text-[12.5px] font-semibold leading-[1.45] text-[var(--text-primary)]">
                {actionError}
              </span>
            </div>
          ) : null}
          <div className="flex-1 pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[14px] xl:hidden">
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
                      <span className="text-[26px] font-bold tracking-[-0.03em] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">85%</span>
                      <span className="text-[11px] font-semibold tracking-[0.05em] uppercase text-[var(--text-muted)]">You keep now</span>
                    </div>
                    <Icon name="ArrowRight" size={20} strokeWidth={2.4} color="var(--accent)" />
                    <div className="flex flex-col gap-[4px]">
                      <span className="text-[34px] font-bold tracking-[-0.035em] [font-feature-settings:var(--font-feature-tabular)]">90%</span>
                      <span className="text-[11px] font-semibold tracking-[0.05em] uppercase text-[var(--accent)]">On Pro</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[9px] pt-[14px] border-t border-t-[var(--border-hairline)]">
                    <div className="flex items-center gap-[10px]">
                      <span className="flex-1 text-[13px] text-[var(--text-secondary)]">For example, on {formatNaira(monthlySales)} of sales</span>
                    </div>
                    <div className="flex items-center gap-[10px]">
                      <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">You kept</span>
                      <span className="text-[14px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(basicKept)}</span>
                    </div>
                    <div className="flex items-center gap-[10px]">
                      <span className="flex-1 text-[13.5px] font-semibold">You would have kept</span>
                      <span className="text-[16px] font-bold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(proKept)}</span>
                    </div>
                    <span className="text-[12.5px] text-[var(--text-muted)]">{formatNaira(proKept - basicKept)} more on that example. Your own split applies to whatever you actually sell.</span>
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
                    <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(PLANS.pro.price)}</span>
                  </div>
                  <div className="flex items-center gap-[10px]">
                    <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Credit for the rest of your Basic year</span>
                    <span className="text-[13.5px] font-semibold text-[var(--success)]">Applied at checkout</span>
                  </div>
                  <div className="flex items-baseline gap-[10px] pt-[11px] border-t border-t-[var(--border-hairline)]">
                    <span className="flex-1 text-[15px] font-semibold">Due today</span>
                    <span className="text-[24px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">
                      Up to {formatNaira(PLANS.pro.price)}
                    </span>
                  </div>
                  <span className="text-[12px] leading-[1.45] text-[var(--text-muted)]">
                    We subtract the unused part of your Basic year. Flutterwave shows the exact amount before you confirm.
                  </span>
                </Card>
              </>
            ) : null}

            {screen === "resubscribe" ? (
              <>
                <Card>
                  <CardLabel>Starting fresh</CardLabel>
                  <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                    No proration. This is a new term at full price. Nothing you already published or sold was touched while you were off.
                  </span>
                </Card>
                {(["basic", "pro"] as CreatorTier[]).map((t) => (
                  <Card key={t}>
                    <div className="flex items-center gap-[10px]">
                      <TierBadge tier={t} />
                      <span className="flex-1 text-[20px] font-bold tracking-[-0.02em] [font-feature-settings:var(--font-feature-tabular)]">
                        {formatNaira(PLANS[t].price)}
                        <span className="text-[13px] font-normal text-[var(--text-muted)]"> / year</span>
                      </span>
                    </div>
                    {PLANS[t].features.map((f) => (
                      <CheckRow key={f} ok>{f}</CheckRow>
                    ))}
                    <Button full loading={resubTier === t} onClick={() => startTier(t)}>
                      Start {t === "pro" ? "Pro" : "Basic"}, {formatNaira(PLANS[t].price)}
                    </Button>
                  </Card>
                ))}
              </>
            ) : null}
          </div>

          {screen === "billing" && state === "active" && tier === "basic" ? (
            <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px] xl:hidden">
              <Button full size="lg" iconRight="ArrowRight" onClick={() => setScreen("upgrade")}>
                See what Pro adds
              </Button>
            </div>
          ) : null}

          {screen === "billing" && (state === "expired" || state === "none") ? (
            <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px] xl:hidden">
              <Button full size="lg" onClick={() => setScreen("resubscribe")}>
                {state === "expired" ? "Start a tier again" : "Choose a plan"}
              </Button>
            </div>
          ) : null}

          {screen === "upgrade" ? (
            <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[10px] xl:hidden">
              <Button full size="lg" loading={paying} onClick={payAndGoPro}>
                Go Pro
              </Button>
              <span className="text-[12px] text-[var(--text-muted)] self-center">Your 90/10 split starts on the next sale.</span>
            </div>
          ) : null}

          {/* D9 · Subscription, desktop — current plan and the upgrade case, side by
              side, instead of mobile's four-screen flow (billing/upgrade/resubscribe). */}
          <div className="hidden xl:block">
            <DesktopSubscriptionView
              subscription={subscription}
              slotsUsed={gates.slotsUsed}
              slotsTotal={gates.slotsTotal}
              cardLast4={cardLast4}
              retrying={retrying}
              paying={paying}
              cancelling={cancelling}
              downgrading={downgrading}
              resubTier={resubTier}
              monthlySales={monthlySales}
              basicKept={basicKept}
              proKept={proKept}
              onUpgrade={payAndGoPro}
              onStartTier={startTier}
              onCancel={() => setShowCancel(true)}
              onDowngrade={handleDowngrade}
              onChangeCard={() => setShowCard(true)}
              onRetryPayment={retryPayment}
            />
          </div>
        </>
      )}

      <Sheet open={showPaid} onClose={() => setShowPaid(false)} title={paidSummary?.tier === "pro" ? "Upgrade confirmed" : "Plan updated"}>
        {paidSummary ? (
          <div className="flex flex-col items-center gap-[16px] pt-[14px] px-[6px] pb-[6px] text-center">
            <span
              className={`grid place-items-center w-[72px] h-[72px] rounded-[999px] border ${
                paidSummary.tier === "pro"
                  ? "bg-[rgba(255,183,3,0.14)] border-[rgba(255,183,3,0.34)]"
                  : "bg-[var(--accent-tint)] border-[var(--border-accent)]"
              }`}
            >
              <Icon name={paidSummary.tier === "pro" ? "Crown" : "Check"} size={30} strokeWidth={2.2} color={paidSummary.tier === "pro" ? "var(--brand-yellow)" : "var(--accent)"} />
            </span>
            <span className="text-[20px] font-bold tracking-[-0.02em]">You are on {paidSummary.tier === "pro" ? "Pro" : "Basic"}</span>
            <span className="text-[14px] leading-[1.5] text-[var(--text-secondary)] max-w-[270px]">
              {paidSummary.tier === "pro"
                ? "Fifteen slots, private communities, and 90% of every sale from now on."
                : "Six slots, open communities, and 85% of every sale."}
            </span>
            <div className="flex flex-col gap-[9px] w-full py-[15px] px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-card)] border border-[var(--border-hairline)] text-left">
              <div className="flex items-center gap-[10px]">
                <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Paid today</span>
                <span className="text-[13.5px] font-bold [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(paidSummary.paid)}</span>
              </div>
              <div className="flex items-center gap-[10px]">
                <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Renews at {formatNaira(PLANS[paidSummary.tier].price)}</span>
                <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">{formatDate(subscription?.renewsAt)}</span>
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
            ? `You keep everything until ${formatDate(subscription.renewsAt)}, the day it would have renewed.`
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
                <span className="text-[12.5px] text-[var(--text-secondary)]">Keeps 6 uploads and open communities</span>
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

      <Sheet
        open={showCard}
        onClose={() => setShowCard(false)}
        title="Payment card"
        caption="Your card is handled by Flutterwave at checkout."
      >
        {/* This used to be a picker of two invented cards ("4412"/"9021")
            that POSTed the display digits as `flutterwaveCardToken`, writing
            a garbage token to the real backend. There is no PCI-compliant
            card-management flow in this product: the card is entered on
            Flutterwave's own surface each time a charge is made. */}
        <div className="flex flex-col gap-[12px]">
          <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
            WAWU never stores your card. You enter it on Flutterwave&apos;s secure checkout
            when you subscribe or renew, and you can use a different card any time you pay.
          </p>
          <Button full variant="secondary" onClick={() => setShowCard(false)}>
            Got it
          </Button>
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
  cardLast4: string | null;
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
            <span className="grid place-items-center w-[42px] h-[42px] rounded-[13px] bg-[rgba(255,183,3,0.16)] border border-[rgba(255,183,3,0.3)] shrink-0">
              <Icon name="CreditCard" size={19} strokeWidth={2.2} color="var(--warning)" />
            </span>
            <div className="flex-1 flex flex-col gap-[3px]">
              <span className="text-[16px] font-semibold">Renewal did not go through</span>
              <span className="text-[12.5px] text-[var(--text-secondary)]">{cardLast4 ? `Card ending ${cardLast4} was declined` : "Your last payment was declined"}</span>
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
            <span className="text-[30px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(price)}</span>
            <span className="text-[14px] text-[var(--text-muted)]">a year</span>
          </div>
          <div className="flex items-center gap-[10px] pt-[13px] border-t border-t-[var(--border-hairline)]">
            <Icon name="Calendar" size={15} color="var(--text-muted)" />
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">{subscription.cancelsAt ? "Renewal off, ends" : "Renews"}</span>
            <span className="text-[13.5px] font-semibold [font-feature-settings:var(--font-feature-tabular)]">
              {formatDate(subscription.cancelsAt ?? subscription.renewsAt)}
            </span>
          </div>
          <div className="flex items-center gap-[10px]">
            <Icon name="CreditCard" size={15} color="var(--text-muted)" />
            <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">{cardLast4 ? `Card ending ${cardLast4}` : "No card saved"}</span>
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
            <span className="text-[17px] font-bold [font-feature-settings:var(--font-feature-tabular)]">{slotsUsed} of {slotsTotal}</span>
          </div>
          <div className="h-[6px] rounded-[999px] bg-[var(--surface-tag)] overflow-hidden">
            <div className="h-full rounded-[999px] bg-[var(--accent)]" style={{width: `${Math.min(100, slotsPct)}%`}} />
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
          <CardLabel>Basic, {formatNaira(PLANS.basic.price)}/yr</CardLabel>
          {PLANS.basic.features.map((f) => (
            <CheckRow key={f} ok>{f}</CheckRow>
          ))}
        </Card>
      ) : null}
    </>
  );
}

/**
 * Real billing history. This used to render three fabricated "Paid" rows
 * (12 Aug / 12 Jul / 12 Jun) as if they were the creator's own payment
 * record. The endpoint exists and is now called; the backend has no ledger
 * table behind it yet, so it correctly returns nothing and this renders an
 * honest empty state instead of invented receipts.
 */
function BillingHistoryCard() {
  const [rows, setRows] = useState<BillingHistoryPage["items"] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    subscriptionApi
      .getBillingHistory()
      .then((page) => {
        if (!cancelled) setRows(page.items);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardLabel>Billing history</CardLabel>
      {rows === null && !failed ? (
        <span className="text-[13px] text-[var(--text-muted)]">Loading…</span>
      ) : failed ? (
        <span className="text-[13px] text-[var(--text-muted)]">We could not load your billing history.</span>
      ) : rows && rows.length > 0 ? (
        <div className="flex flex-col -mx-[6px]">
          {rows.map((row, i) => (
            <ListRow key={i} title="Paid" subtitle="" icon="CheckCheck" trailing="none" />
          ))}
        </div>
      ) : (
        <span className="text-[13px] leading-[1.5] text-[var(--text-muted)]">
          No payments recorded yet. Receipts appear here once your first renewal is charged.
        </span>
      )}
    </Card>
  );
}

/**
 * D9 · Subscription, desktop (1440×900) — current plan and the upgrade case laid
 * out side by side, replacing the mobile flow's four separate screens
 * (active/upgrade/past-due/expired) with one view that reads real state off
 * `subscription` (creatorGates()/subscriptionApi.getSubscription(), unchanged).
 *
 * Design D9 also draws a "Pause for a month" button in the right column. There
 * is no pause state in `SubscriptionState` ("none" | "active" | "past_due" |
 * "expired") or in `subscriptionApi` — inventing one would mean wiring a UI
 * control to nothing real. Substituted the *real* equivalent action instead:
 * downgrading Pro → Basic (already wired via `onDowngrade`/`handleDowngrade`,
 * the same action the mobile cancel sheet already offers Pro creators) is the
 * closest genuine "cheaper, not cancelled" option this backend supports.
 */
function DesktopSubscriptionView({
  subscription,
  slotsUsed,
  slotsTotal,
  cardLast4,
  retrying,
  paying,
  cancelling,
  downgrading,
  resubTier,
  monthlySales,
  basicKept,
  proKept,
  onUpgrade,
  onStartTier,
  onCancel,
  onDowngrade,
  onChangeCard,
  onRetryPayment,
}: {
  subscription: Subscription;
  slotsUsed: number;
  slotsTotal: number;
  cardLast4: string | null;
  retrying: boolean;
  paying: boolean;
  cancelling: boolean;
  downgrading: boolean;
  resubTier: CreatorTier | null;
  monthlySales: number;
  basicKept: number;
  proKept: number;
  onUpgrade: () => void;
  onStartTier: (tier: CreatorTier) => void;
  onCancel: () => void;
  onDowngrade: () => void;
  onChangeCard: () => void;
  onRetryPayment: () => void;
}) {
  const tier = subscription.plan.tier;
  const state = subscription.state;
  const price = subscription.plan.price;
  const active = state === "active";
  const pastdue = state === "past_due";
  const expired = state === "expired";
  const none = state === "none";
  const slotsPct = slotsTotal > 0 ? Math.round((slotsUsed / slotsTotal) * 100) : 0;

  return (
    <div className="grid w-full grid-cols-2 items-start gap-[26px] p-[26px]">
      {/* Left column — current status, reused across every renewal state. */}
      <div className="flex min-w-0 flex-col gap-[16px]">
        {active ? (
          <div
            className={`flex flex-col gap-[16px] rounded-[var(--radius-card)] border p-[24px] ${
              tier === "pro"
                ? "border-[var(--border-accent)] bg-[var(--surface-elevated)]"
                : "border-[var(--border-accent)] bg-[linear-gradient(140deg,#3B0A55,#131316)]"
            }`}
          >
            <div className="flex items-center gap-[12px]">
              <TierBadge tier={tier} />
              <span className="text-[21px] font-semibold tracking-[-0.02em]">
                {tier === "pro" ? "Pro" : "Basic"} · {formatNaira(price)} a year
              </span>
            </div>
            <div className="flex gap-[32px]">
              <StatBlock value={formatDate(subscription.cancelsAt ?? subscription.renewsAt)} label={subscription.cancelsAt ? "Ends" : "Renews"} align="start" size="md" />
              <StatBlock value={`${slotsUsed} / ${slotsTotal}`} label="Slots used" align="start" size="md" />
              <StatBlock value={`${PLANS[tier].split}%`} label="You keep" align="start" size="md" />
            </div>
            <div className="flex gap-[12px] border-t border-t-[rgba(255,255,255,0.14)] pt-[16px]">
              <Button size="sm" variant="secondary" onClick={onChangeCard}>
                Change card
              </Button>
              <Button size="sm" variant="ghost" loading={cancelling} onClick={onCancel}>
                {subscription.cancelsAt ? "Renewal off" : "Cancel plan"}
              </Button>
            </div>
          </div>
        ) : null}

        {pastdue ? (
          <div className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[rgba(255,183,3,0.32)] bg-[var(--warning-tint)] p-[24px]">
            <div className="flex items-center gap-[12px]">
              <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border border-[rgba(255,183,3,0.3)] bg-[rgba(255,183,3,0.16)]">
                <Icon name="CreditCard" size={19} strokeWidth={2.2} color="var(--warning)" />
              </span>
              <div className="flex flex-1 flex-col gap-[3px]">
                <span className="text-[16px] font-semibold">Renewal did not go through</span>
                <span className="text-[12.5px] text-[var(--text-secondary)]">{cardLast4 ? `Card ending ${cardLast4} was declined` : "Your last payment was declined"}</span>
              </div>
            </div>
            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              We will try twice more before {tier === "pro" ? "Pro" : "Basic"} lapses.
            </p>
            <Button size="lg" loading={retrying} onClick={onRetryPayment}>
              Pay {formatNaira(price)} now
            </Button>
          </div>
        ) : null}

        {expired ? (
          <div className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-strong)] bg-[var(--surface-card)] p-[24px]">
            <div className="flex items-center gap-[10px]">
              <StatusPill kind="neutral">Expired</StatusPill>
              <span className="flex-1 text-[12.5px] text-[var(--text-muted)]">
                {tier === "pro" ? "Pro" : "Basic"} ended {formatDate(subscription.cancelsAt ?? subscription.renewsAt)}
              </span>
            </div>
            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              You are back to a plain creator account. Nothing was deleted and nobody lost anything they bought.
            </p>
          </div>
        ) : null}

        {none ? (
          <div className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-strong)] bg-[var(--surface-card)] p-[24px]">
            <StatusPill kind="neutral">No plan yet</StatusPill>
            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              Choose Basic or Pro to start uploading and selling.
            </p>
          </div>
        ) : null}

        {!none ? <BillingHistoryCard /> : null}

        {active ? (
          <div className="flex gap-[13px] rounded-[var(--radius-card)] border border-[rgba(255,183,3,0.4)] bg-[var(--surface-card)] p-[20px]">
            <Icon name="TriangleAlert" size={18} color="var(--warning)" />
            <div className="flex flex-col gap-[5px]">
              <span className="text-[14px] font-semibold">If a renewal fails</span>
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
                Published pieces stay readable and buyers keep access. You cannot post or take new questions until it clears.
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Right column — the case for what to do next, shaped by the same state. */}
      <div className="flex min-w-0 flex-col gap-[16px]">
        {active && tier === "basic" ? (
          <>
            <div className="flex flex-col gap-[16px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-elevated)] p-[24px]">
              <div className="flex items-center gap-[12px]">
                <TierBadge tier="pro" />
                <span className="text-[21px] font-semibold tracking-[-0.02em]">Pro · {formatNaira(PLANS.pro.price)} a year</span>
              </div>
              <span className="text-[14px] leading-[1.55] text-[var(--text-secondary)]">
                For example, on {formatNaira(monthlySales)} of sales the extra 5% would add {formatNaira(proKept - basicKept)}.
              </span>
              <div className="flex flex-col gap-[12px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-page)] p-[18px]">
                <div className="flex justify-between text-[13.5px] text-[var(--text-secondary)]">
                  <span>Sales, last month</span>
                  <span className="font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(monthlySales)}</span>
                </div>
                <div className="flex justify-between text-[13.5px] text-[var(--text-secondary)]">
                  <span>Kept on Basic, 85%</span>
                  <span className="[font-feature-settings:var(--font-feature-tabular)]">{formatNaira(basicKept)}</span>
                </div>
                <div className="flex justify-between text-[13.5px] text-[var(--text-secondary)]">
                  <span>Would have kept on Pro, 90%</span>
                  <span className="font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(proKept)}</span>
                </div>
                <div className="flex justify-between border-t border-t-[var(--border-hairline)] pt-[10px] text-[15px] font-bold">
                  <span>Difference</span>
                  <span className="text-[var(--success)] [font-feature-settings:var(--font-feature-tabular)]">+{formatNaira(proKept - basicKept)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-[10px]">
                {PLANS.pro.features.map((f) => (
                  <CheckRow key={f} ok>{f}</CheckRow>
                ))}
              </div>
              <Button full size="lg" loading={paying} onClick={onUpgrade}>
                Upgrade to Pro
              </Button>
              <span className="text-center text-[12.5px] text-[var(--text-muted)]">
                Credited for the rest of your Basic year, then {formatNaira(PLANS.pro.price)} annually
              </span>
            </div>
            <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
              <span className="text-[14px] font-semibold">Rather not commit right now?</span>
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
                Your pieces and community stay live either way, stopping the renewal only takes effect at your renewal date.
              </span>
              <Button size="sm" variant="secondary" loading={cancelling} onClick={onCancel}>
                Do not renew
              </Button>
            </div>
          </>
        ) : null}

        {active && tier === "pro" ? (
          <>
            <div className="flex flex-col gap-[16px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-elevated)] p-[24px]">
              <div className="flex items-center gap-[12px]">
                <TierBadge tier="pro" />
                <span className="text-[21px] font-semibold tracking-[-0.02em]">You&apos;re already on Pro</span>
              </div>
              <span className="text-[14px] leading-[1.55] text-[var(--text-secondary)]">
                Keeping 90% of every sale instead of 85%, with no slot cap.
              </span>
              <div className="flex flex-col gap-[10px]">
                {PLANS.pro.features.map((f) => (
                  <CheckRow key={f} ok>{f}</CheckRow>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
              <span className="text-[14px] font-semibold">Not selling much right now?</span>
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
                Move to Basic instead of cancelling, {formatNaira(PLANS.basic.price)}/yr keeps {PLANS.basic.slots} uploads and open communities. Nothing you published or sold is touched.
              </span>
              <div className="flex gap-[10px]">
                <Button size="sm" variant="secondary" loading={downgrading} onClick={onDowngrade}>
                  Move to Basic
                </Button>
                <Button size="sm" variant="ghost" loading={cancelling} onClick={onCancel}>
                  Do not renew
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {pastdue ? (
          <>
            <Card>
              <CardLabel>Still working</CardLabel>
              <CheckRow ok>Everything you published stays live and selling</CheckRow>
              <CheckRow ok>Paid messages and your community</CheckRow>
              <CheckRow ok>
                Your {PLANS[tier].split}/{100 - PLANS[tier].split} split, until it lapses
              </CheckRow>
            </Card>
            <Card>
              <CardLabel>Paused until you pay</CardLabel>
              <CheckRow ok={false} icon="X">New uploads</CheckRow>
              <CheckRow ok={false} icon="X">
                {tier === "pro" ? "Opening a new private community" : "Opening a new community"}
              </CheckRow>
            </Card>
            <button
              type="button"
              onClick={onChangeCard}
              className="flex cursor-pointer items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-[16px] py-[15px] text-left"
            >
              <Icon name="CreditCard" size={16} color="var(--text-muted)" />
              <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Use a different card</span>
              <Icon name="ChevronRight" size={17} color="var(--text-muted)" strokeWidth={2} />
            </button>
          </>
        ) : null}

        {expired || none ? (
          <>
            <Card>
              <CardLabel>Starting fresh</CardLabel>
              <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                {expired
                  ? "No proration. This is a new term at full price. Everything you already published or sold was untouched while you were off."
                  : "Pick a tier to start uploading and selling."}
              </span>
            </Card>
            {(["basic", "pro"] as CreatorTier[]).map((t) => (
              <Card key={t}>
                <div className="flex items-center gap-[10px]">
                  <TierBadge tier={t} />
                  <span className="flex-1 text-[20px] font-bold tracking-[-0.02em] [font-feature-settings:var(--font-feature-tabular)]">
                    {formatNaira(PLANS[t].price)}
                    <span className="text-[13px] font-normal text-[var(--text-muted)]"> / year</span>
                  </span>
                </div>
                {PLANS[t].features.map((f) => (
                  <CheckRow key={f} ok>{f}</CheckRow>
                ))}
                <Button full loading={resubTier === t} onClick={() => onStartTier(t)}>
                  Start {t === "pro" ? "Pro" : "Basic"}, {formatNaira(PLANS[t].price)}
                </Button>
              </Card>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
