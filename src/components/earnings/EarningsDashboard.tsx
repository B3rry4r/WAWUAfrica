"use client";

import { useState } from "react";
import Link from "next/link";
import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
import { currentEarnings } from "@/lib/api/earnings";
import { PLANS } from "@/types/subscription";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import { StatBlock } from "@/components/ui/StatBlock";
import { StatusPill } from "@/components/ui/StatusPill";
import { SectionHeader } from "@/components/ui/SectionHeader";
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
  const gates = creatorGates(currentSession);
  const [approved, setApproved] = useState(gates.canEarn);

  const tier = currentSession.creator?.tier ?? "basic";
  const tierLabel = tier === "pro" ? "Pro" : "Basic";
  const keep = PLANS[tier].split;
  const earned = approved ? currentEarnings.payable + currentEarnings.held : currentEarnings.held;

  const streams: StreamRow[] = approved
    ? [
        { icon: "Play", label: "Content sales", amount: 123300, pct: 67 },
        { icon: "MessageCircle", label: "Paid messages", amount: 31050, pct: 17 },
        { icon: "Ticket", label: "Community credits", amount: 21600, pct: 12 },
        { icon: "HandCoins", label: "Tips", amount: 8550, pct: 5 },
      ]
    : [
        { icon: "BookOpen", label: "Content sales", amount: 12750 },
        { icon: "MessageCircle", label: "Paid messages", amount: 0, status: "Not on yet", dim: true },
        { icon: "Ticket", label: "Community credits", amount: 0, status: "No community yet", dim: true },
      ];

  const recent = approved
    ? [
        { title: "CAC in 7 days", subtitle: "3 unlocks today", icon: "GraduationCap" as IconName, meta: formatNaira(6750) },
        { title: "Paid message", subtitle: "Emeka Obi", icon: "MessageCircle" as IconName, meta: formatNaira(270) },
        { title: "Tip", subtitle: "Ngozi Eze", icon: "HandCoins" as IconName, meta: formatNaira(1000) },
      ]
    : [
        { title: "Pricing sheet", subtitle: `15 unlocks · ${formatNaira(1000)}`, icon: "FileText" as IconName, meta: formatNaira(12750) },
        { title: "Trader's playbook", subtitle: "Free · 212 views", icon: "BookOpen" as IconName, meta: formatNaira(0) },
      ];

  return (
    <div>
      <FlowHeader
        title="Earnings"
        right={
          <span className="text-[12.5px] font-semibold text-[var(--text-muted)]">August</span>
        }
      />

      <div className="flex justify-center gap-[4px] pt-[10px] px-[16px] pb-0">
        {[false, true].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setApproved(v)}
            className="h-[30px] py-0 px-[14px] rounded-[999] text-[11.5px] font-semibold cursor-pointer" style={{border: approved === v ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", background: approved === v ? "var(--accent-tint)" : "var(--surface-tag)", color: approved === v ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-sans)"}}
          >
            {v ? "KYC approved" : "KYC pending"}
          </button>
        ))}
      </div>

      <div className="pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[14px]">
        {!approved ? (
          <div
            className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.32)]"
          >
            <div className="flex items-center gap-[12px]">
              <span className="grid place-items-center w-[40px] h-[40px] rounded-[13] bg-[rgba(255,183,3,0.16)] border border-[rgba(255,183,3,0.3)] shrink-0">
                <Icon name="Clock" size={18} color="var(--warning)" stroke={2.2} />
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
            className="text-[38px] font-bold tracking-[-0.035em] leading-[1]" style={{color: approved ? "var(--text-primary)" : "var(--text-secondary)", fontFeatureSettings: "var(--font-feature-tabular)"}}
          >
            {formatNaira(earned)}
          </span>
          <div className="flex gap-[8px] flex-wrap">
            {approved ? (
              <>
                <StatusPill kind="success">Paid to GTB ••••6789</StatusPill>
                <span
                  className="inline-flex items-center h-[26px] py-0 px-[10px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-secondary)] text-[11.5px] font-bold"
                >
                  {keep}/{100 - keep} on {tierLabel}
                </span>
              </>
            ) : (
              <StatusPill kind="warning">Held — not payable yet</StatusPill>
            )}
          </div>
          {!approved ? (
            <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)] pt-[12px] border-t border-t-[var(--border-hairline)]">
              Every naira is counted and kept. It goes to your bank account once verification clears — nothing expires while you wait.
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
            <div key={s.label} className="flex items-center gap-[12px]" style={{opacity: s.dim ? 0.6 : 1}}>
              <span className="grid place-items-center w-[34px] h-[34px] rounded-[11] bg-[var(--surface-tag)] border border-[var(--border-hairline)] shrink-0">
                <Icon name={s.icon} size={15} stroke={2} color={s.dim ? "var(--text-muted)" : "var(--text-secondary)"} />
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
                <div className="flex items-baseline gap-[10px]">
                  <span className="flex-1 text-[13.5px] font-semibold text-[var(--text-primary)]">{s.label}</span>
                  <span
                    className="" style={{fontSize: s.dim ? 13 : 14, fontWeight: s.dim ? 600 : 700, color: s.dim ? "var(--text-muted)" : "var(--text-primary)", fontFeatureSettings: "var(--font-feature-tabular)"}}
                  >
                    {s.status ?? formatNaira(s.amount)}
                  </span>
                </div>
                {s.pct !== undefined ? (
                  <div className="h-[4px] rounded-[999] bg-[var(--surface-tag)] overflow-hidden">
                    <div className="h-full rounded-[999] bg-[var(--accent)]" style={{width: `${s.pct}%`}} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {approved ? (
          <div className="flex gap-[12px]">
            <div className="flex-1 p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <StatBlock value="1,240" label="EVG score" align="start" size="md" />
            </div>
            <div className="flex-1 p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <StatBlock value="86" label="Sales" align="start" size="md" />
            </div>
          </div>
        ) : null}

        <div>
          <SectionHeader caption="Recent" title="Sales" action="See all" />
          <div className="flex flex-col rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] p-[4px]">
            {recent.map((r) => (
              <ListRow key={r.title} title={r.title} subtitle={r.subtitle} icon={r.icon} meta={r.meta} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
