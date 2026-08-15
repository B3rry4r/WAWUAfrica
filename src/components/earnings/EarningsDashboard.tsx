"use client";

import { useState } from "react";
import Link from "next/link";
import { currentSession } from "@/lib/api/mocks/session";
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
  amount: string;
  pct?: number;
  dim?: boolean;
}

export function EarningsDashboard() {
  const [approved, setApproved] = useState(false);

  const tier = currentSession.creator?.tier ?? "basic";
  const tierLabel = tier === "pro" ? "Pro" : "Basic";
  const keep = PLANS[tier].split;
  const earned = approved ? currentEarnings.payable + currentEarnings.held : currentEarnings.held;

  const streams: StreamRow[] = approved
    ? [
        { icon: "Play", label: "Content sales", amount: "₦123,300", pct: 67 },
        { icon: "MessageCircle", label: "Paid messages", amount: "₦31,050", pct: 17 },
        { icon: "Ticket", label: "Community credits", amount: "₦21,600", pct: 12 },
        { icon: "HandCoins", label: "Tips", amount: "₦8,550", pct: 5 },
      ]
    : [
        { icon: "BookOpen", label: "Content sales", amount: "₦12,750" },
        { icon: "MessageCircle", label: "Paid messages", amount: "Not on yet", dim: true },
        { icon: "Ticket", label: "Community credits", amount: "No community yet", dim: true },
      ];

  const recent = approved
    ? [
        { title: "CAC in 7 days", subtitle: "3 unlocks today", icon: "GraduationCap" as IconName, meta: "₦6,750" },
        { title: "Paid message", subtitle: "Emeka Obi", icon: "MessageCircle" as IconName, meta: "₦270" },
        { title: "Tip", subtitle: "Ngozi Eze", icon: "HandCoins" as IconName, meta: "₦1,000" },
      ]
    : [
        { title: "Pricing sheet", subtitle: "15 unlocks · ₦1,000", icon: "FileText" as IconName, meta: "₦12,750" },
        { title: "Trader's playbook", subtitle: "Free · 212 views", icon: "BookOpen" as IconName, meta: "₦0" },
      ];

  return (
    <div>
      <FlowHeader
        title="Earnings"
        right={
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)" }}>August</span>
        }
      />

      <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "10px 16px 0" }}>
        {[false, true].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setApproved(v)}
            style={{
              height: 30,
              padding: "0 14px",
              borderRadius: 999,
              border: approved === v ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
              background: approved === v ? "var(--accent-tint)" : "var(--surface-tag)",
              color: approved === v ? "var(--accent)" : "var(--text-muted)",
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            {v ? "KYC approved" : "KYC pending"}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        {!approved ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: 18,
              borderRadius: "var(--radius-card)",
              background: "var(--warning-tint)",
              border: "1px solid rgba(255,183,3,0.32)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 13, background: "rgba(255,183,3,0.16)", border: "1px solid rgba(255,183,3,0.3)", flexShrink: 0 }}>
                <Icon name="Clock" size={18} color="var(--warning)" stroke={2.2} />
              </span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>Finish verification to get paid</span>
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Two steps left · takes 1 to 3 days</span>
              </div>
            </div>
            <Link href="/kyc" style={{ textDecoration: "none" }}>
              <Button full iconRight="ArrowRight" style={{ height: 48 }}>
                Complete verification
              </Button>
            </Link>
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 20,
            borderRadius: "var(--radius-card)",
            background: "var(--surface-card)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Earned this month
          </span>
          <span
            style={{
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              color: approved ? "var(--text-primary)" : "var(--text-secondary)",
              fontFeatureSettings: "var(--font-feature-tabular)",
            }}
          >
            {formatNaira(earned)}
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {approved ? (
              <>
                <StatusPill kind="success">Paid to GTB ••••6789</StatusPill>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: 26,
                    padding: "0 10px",
                    borderRadius: 999,
                    background: "var(--surface-tag)",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-secondary)",
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  {keep}/{100 - keep} on {tierLabel}
                </span>
              </>
            ) : (
              <StatusPill kind="warning">Held — not payable yet</StatusPill>
            )}
          </div>
          {!approved ? (
            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)", paddingTop: 12, borderTop: "1px solid var(--border-hairline)" }}>
              Every naira is counted and kept. It goes to your bank account once verification clears — nothing expires while you wait.
            </span>
          ) : null}
        </div>

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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Where it came from
          </span>
          {streams.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, opacity: s.dim ? 0.6 : 1 }}>
              <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 11, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)", flexShrink: 0 }}>
                <Icon name={s.icon} size={15} stroke={2} color={s.dim ? "var(--text-muted)" : "var(--text-secondary)"} />
              </span>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>{s.label}</span>
                  <span
                    style={{
                      fontSize: s.dim ? 13 : 14,
                      fontWeight: s.dim ? 600 : 700,
                      color: s.dim ? "var(--text-muted)" : "var(--text-primary)",
                      fontFeatureSettings: "var(--font-feature-tabular)",
                    }}
                  >
                    {s.amount}
                  </span>
                </div>
                {s.pct !== undefined ? (
                  <div style={{ height: 4, borderRadius: 999, background: "var(--surface-tag)", overflow: "hidden" }}>
                    <div style={{ width: `${s.pct}%`, height: "100%", borderRadius: 999, background: "var(--accent)" }} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {approved ? (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <StatBlock value="1,240" label="EVG score" align="start" size="md" />
            </div>
            <div style={{ flex: 1, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <StatBlock value="86" label="Sales" align="start" size="md" />
            </div>
          </div>
        ) : null}

        <div>
          <SectionHeader caption="Recent" title="Sales" action="See all" />
          <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
            {recent.map((r) => (
              <ListRow key={r.title} title={r.title} subtitle={r.subtitle} icon={r.icon} meta={r.meta} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
