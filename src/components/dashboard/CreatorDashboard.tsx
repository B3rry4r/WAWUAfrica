"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { currentSession } from "@/lib/api/mocks/session";
import { currentEarnings } from "@/lib/api/earnings";
import { currentMessaging } from "@/lib/api/messaging";
import { libraryItems } from "@/lib/api/content";
import { PLANS } from "@/types/subscription";
import type { ContentType } from "@/types/content";
import { formatNaira } from "@/lib/format";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { TierBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatBlock } from "@/components/ui/StatBlock";
import { StatusPill } from "@/components/ui/StatusPill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ListRow } from "@/components/ui/ListRow";

const typeIcons: Record<ContentType, IconName> = {
  video: "Play",
  course: "GraduationCap",
  audio: "Headphones",
  pdf: "BookOpen",
  image: "Image",
  template: "LayoutTemplate",
};

export function CreatorDashboard() {
  const router = useRouter();
  const creator = currentSession.creator;
  if (!creator) return null;

  const tier = creator.tier;
  const approved = creator.kyc === "approved";
  const keep = PLANS[tier].split;
  const tierLabel = tier === "pro" ? "Pro" : "Basic";
  const slotsLeft = Math.max(0, creator.slotsTotal - creator.slotsUsed);
  const earned = approved ? currentEarnings.payable + currentEarnings.held : currentEarnings.held;
  const urgentCount = currentMessaging.threads.filter((t) => !t.opened).length;
  const live = libraryItems.filter((i) => i.status === "live");

  return (
    <div>
      <FlowHeader title="Creator dashboard" right={<TierBadge tier={tier} />} />

      <div style={{ padding: "18px 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {!approved ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
              padding: "14px 15px",
              borderRadius: "var(--radius-input)",
              background: "var(--warning-tint)",
              border: "1px solid rgba(255,183,3,0.28)",
            }}
          >
            <Icon name="Clock" size={16} color="var(--warning)" stroke={2.2} style={{ marginTop: 1 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
                KYC in review — 1 to 3 days
              </span>
              <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--text-secondary)" }}>
                Keep selling. Everything you earn is held until you are verified.
              </span>
              <Link href="/kyc" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>
                Check status
              </Link>
            </div>
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
              <StatusPill kind="success">Paid out to GTB ••••6789</StatusPill>
            ) : (
              <StatusPill kind="warning">Held — not payable yet</StatusPill>
            )}
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
          </div>
          {!approved ? (
            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)", paddingTop: 12, borderTop: "1px solid var(--border-hairline)" }}>
              Released to your bank account as soon as verification clears. Nothing is lost while you wait.
            </span>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
            <StatBlock value={`${creator.slotsUsed} / ${creator.slotsTotal}`} label="Upload slots" align="start" size="md" />
          </div>
          <div style={{ flex: 1, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
            <StatBlock value="1,240" label="EVG score" align="start" size="md" />
          </div>
        </div>

        <Button full size="lg" icon="Plus" onClick={() => router.push("/create")}>
          New upload — {slotsLeft} {slotsLeft === 1 ? "slot" : "slots"} left
        </Button>

        {approved && urgentCount > 0 ? (
          <Link href="/messages" style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "15px 16px",
                borderRadius: "var(--radius-card)",
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-accent)",
              }}
            >
              <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 12, background: "var(--accent-tint)", border: "1px solid var(--border-accent)", flexShrink: 0 }}>
                <Icon name="MessageCircle" size={17} color="var(--accent)" stroke={2} />
              </span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                  {urgentCount} messages to reply
                </span>
                <span style={{ fontSize: 12.5, color: "var(--warning)" }}>Earliest is due in 4 hours</span>
              </div>
              <Icon name="ChevronRight" size={18} color="var(--accent)" stroke={2.2} />
            </div>
          </Link>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {approved ? (
            <SectionHeader caption="Selling best" title="Your content" action="See all" onAction={() => router.push("/create/library")} />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
            {live.map((item) => {
              const subtitle =
                item.price > 0
                  ? `${item.activity ?? "Live"} · ${formatNaira(item.price)}`
                  : `Free · ${item.activity ?? "No views yet"}`;
              return (
                <ListRow
                  key={item.id}
                  title={item.title}
                  subtitle={subtitle}
                  icon={typeIcons[item.type]}
                  meta={formatNaira(item.earned ?? 0)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
