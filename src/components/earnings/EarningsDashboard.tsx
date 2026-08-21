"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { earningsApi } from "@/lib/api/earnings";
import { getEvgScore } from "@/lib/api/profile";
import { earningsStreamRows, saleSourceLabel, saleAmountDisplay, relativeTime } from "@/lib/earnings-display";
import type { EarningsSummary } from "@/types/earnings";
import { PLANS } from "@/types/subscription";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import { StatBlock } from "@/components/ui/StatBlock";
import { StatusPill } from "@/components/ui/StatusPill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { formatNaira } from "@/lib/format";

interface StreamRow {
  icon: IconName;
  label: string;
  amount: number;
  status?: string;
  pct?: number;
  dim?: boolean;
}

export function EarningsDashboard() {
  const { user, hydrated } = useSession();
  const { creator, loading: creatorLoading } = useCreatorState();
  const gates = creatorGates(user ? { accountType: user.accountType, creator } : null);
  const approved = gates.canEarn;

  // Real GET /api/hub/content/mine/earnings — never the frozen mock.
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  // Real EVG, not the hardcoded "1,240" this used to print.
  const [evg, setEvg] = useState<number | null>(null);
  const [earningsError, setEarningsError] = useState(false);

  const loadEarnings = () => {
    setEarnings(null);
    setEarningsError(false);
    if (user?.wawuId) {
      getEvgScore(user.wawuId).then(setEvg);
    }
    earningsApi
      .getSummary()
      .then(setEarnings)
      .catch(() => setEarningsError(true));
  };

  useEffect(() => {
    if (!hydrated || !gates.isCreator) return;
    loadEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, gates.isCreator]);

  if (!hydrated || (creatorLoading && !creator)) {
    return (
      <div>
        <FlowHeader title="Earnings" />
        <div className="pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[14px] xl:mx-auto xl:w-full xl:max-w-[820px] xl:px-[28px] xl:pt-[28px]">
          <Skeleton height={120} radius="var(--radius-card)" />
          <Skeleton height={160} radius="var(--radius-card)" />
        </div>
      </div>
    );
  }

  if (!gates.isCreator) return null;

  if (earningsError) {
    return (
      <div>
        <FlowHeader title="Earnings" />
        <ErrorState title="Could not load your earnings" onRetry={loadEarnings} />
      </div>
    );
  }

  if (!earnings) {
    return (
      <div>
        <FlowHeader title="Earnings" />
        <div className="pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[14px] xl:mx-auto xl:w-full xl:max-w-[820px] xl:px-[28px] xl:pt-[28px]">
          <Skeleton height={120} radius="var(--radius-card)" />
          <Skeleton height={160} radius="var(--radius-card)" />
        </div>
      </div>
    );
  }

  const tier = gates.tier ?? "basic";
  const tierLabel = tier === "pro" ? "Pro" : "Basic";
  const keep = PLANS[tier].split;
  const earned = approved ? earnings.payable + earnings.held : earnings.held;

  // Real per-stream figures and real recent sales, both from the same
  // earnings response as the total above. These were four hardcoded amounts
  // and three invented sales with made-up buyer names, sitting directly
  // under a real total they did not sum to.
  const STREAM_ICONS: Record<string, IconName> = {
    content: "Play",
    dm: "MessageCircle",
    community_credits: "Ticket",
    tips: "HandCoins",
  };
  const streams: StreamRow[] = earningsStreamRows(earnings).map((row) => ({
    icon: STREAM_ICONS[row.stream] ?? "Play",
    label: row.label,
    amount: row.amount,
    pct: row.pct,
    dim: row.amount === 0,
    status: row.amount === 0 ? "Nothing yet" : undefined,
  }));

  const SALE_ICONS: Record<string, IconName> = {
    content: "GraduationCap",
    dm: "MessageCircle",
    tip: "HandCoins",
    community_credits: "Ticket",
    subscription: "Crown",
  };
  const recent = earnings.recentSales.map((sale) => ({
    // Keyed by the sale's own id: several sales share one source label, and
    // keying the list by title collided (React reused rows across sales).
    id: sale.id,
    title: saleSourceLabel(sale.source),
    subtitle: relativeTime(sale.occurredAt),
    icon: SALE_ICONS[sale.source] ?? "HandCoins",
    meta: saleAmountDisplay(sale.source, sale.amount),
  }));

  return (
    <div>
      <FlowHeader
        title="Earnings"
        right={
          <span className="text-[12.5px] font-semibold text-[var(--text-muted)]">
            {new Date().toLocaleDateString("en-NG", { month: "long" })}
          </span>
        }
      />

      <div className="pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[14px] xl:mx-auto xl:w-full xl:max-w-[820px] xl:px-[28px] xl:pt-[28px]">
        {!approved ? (
          <div
            className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.32)]"
          >
            <div className="flex items-center gap-[12px]">
              <span className="grid place-items-center w-[40px] h-[40px] rounded-[13px] bg-[rgba(255,183,3,0.16)] border border-[rgba(255,183,3,0.3)] shrink-0">
                <Icon name="Clock" size={18} color="var(--warning)" strokeWidth={2.2} />
              </span>
              <div className="flex-1 flex flex-col gap-[3px]">
                <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">Finish verification to get paid</span>
                <span className="text-[12.5px] text-[var(--text-secondary)]">Two steps left · takes 1 to 3 days</span>
              </div>
            </div>
            <Link href="/kyc" className="no-underline">
              <Button full iconRight="ArrowRight" className="h-[48px]">
                Complete verification
              </Button>
            </Link>
          </div>
        ) : null}

        <div
          className="flex flex-col gap-[12px] p-0 rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]"
        >
          <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">
            Earned this month
          </span>
          <span
            className={`text-[38px] font-bold tracking-[-0.035em] leading-[1] [font-feature-settings:var(--font-feature-tabular)] ${
              approved ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            }`}
          >
            {formatNaira(earned)}
          </span>
          <div className="flex gap-[8px] flex-wrap">
            {approved ? (
              <>
                <StatusPill kind="success">Payable to your bank account</StatusPill>
                <span
                  className="inline-flex items-center h-[26px] py-0 px-[10px] rounded-[999px] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-secondary)] text-[11.5px] font-bold"
                >
                  {keep}/{100 - keep} on {tierLabel}
                </span>
              </>
            ) : (
              <StatusPill kind="warning">Held, not payable yet</StatusPill>
            )}
          </div>
          {!approved ? (
            <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)] pt-[12px] border-t border-t-[var(--border-hairline)]">
              Every naira is counted and kept. It goes to your bank account once verification clears. Nothing expires while you wait.
            </span>
          ) : null}
        </div>

        <div
          className="flex flex-col gap-[12px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]"
        >
          <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">
            Where it came from
          </span>
          {streams.map((s) => (
            <div key={s.label} className={`flex items-center gap-[12px] ${s.dim ? "opacity-60" : "opacity-100"}`}>
              <span className="grid place-items-center w-[34px] h-[34px] rounded-[11px] bg-[var(--surface-tag)] border border-[var(--border-hairline)] shrink-0">
                <Icon name={s.icon} size={15} strokeWidth={2} color={s.dim ? "var(--text-muted)" : "var(--text-secondary)"} />
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
                <div className="flex items-baseline gap-[10px]">
                  <span className="flex-1 text-[13.5px] font-semibold text-[var(--text-primary)]">{s.label}</span>
                  <span
                    className={`[font-feature-settings:var(--font-feature-tabular)] ${
                      s.dim
                        ? "text-[13px] font-semibold text-[var(--text-muted)]"
                        : "text-[14px] font-bold text-[var(--text-primary)]"
                    }`}
                  >
                    {s.status ?? formatNaira(s.amount)}
                  </span>
                </div>
                {s.pct !== undefined ? (
                  <div className="h-[4px] rounded-[999px] bg-[var(--surface-tag)] overflow-hidden">
                    <div className="h-full rounded-[999px] bg-[var(--accent)]" style={{width: `${s.pct}%`}} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {approved ? (
          <div className="flex gap-[12px]">
            <div className="flex-1 p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <StatBlock value={evg !== null ? evg.toLocaleString("en-NG") : "—"} label="EVG score" align="start" size="md" />
            </div>
            <div className="flex-1 p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              {/* No units-sold count exists on the earnings response — same
                  gap HomeRightRail documents. "Soon" is honest; the "86" that
                  used to sit here beside a real EVG was invented. */}
              <StatBlock value="Soon" label="Sales" align="start" size="md" />
            </div>
          </div>
        ) : null}

        <div>
          {/* No all-sales screen exists to send them to, so no action here —
              this rendered a button that did nothing when tapped. */}
          <SectionHeader caption="Recent" title="Sales" />
          <div className="flex flex-col rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] p-[4px]">
            {recent.map((r) => (
              <ListRow key={r.id} title={r.title} subtitle={r.subtitle} icon={r.icon} meta={r.meta} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
