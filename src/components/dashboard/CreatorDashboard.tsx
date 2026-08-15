"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
import { currentEarnings } from "@/lib/api/earnings";
import { currentMessaging } from "@/lib/api/messaging";
import { libraryItems } from "@/lib/api/creator-content";
import { PLANS } from "@/types/subscription";
import type { ContentType } from "@/types/content";
import { formatNaira } from "@/lib/format";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { TierBadge } from "@/components/ui/TierBadge";
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

  const gates = creatorGates(currentSession);
  const tier = gates.tier ?? creator.tier;
  const approved = gates.canEarn;
  const keep = PLANS[tier].split;
  const tierLabel = tier === "pro" ? "Pro" : "Basic";
  const slotsLeft = gates.slotsRemaining;
  const earned = approved ? currentEarnings.payable + currentEarnings.held : currentEarnings.held;
  const urgentCount = currentMessaging.threads.filter((t) => !t.opened).length;
  const live = libraryItems.filter((i) => i.status === "live");

  return (
    <div>
      <FlowHeader title="Creator dashboard" right={<TierBadge tier={tier} />} />

      <div className="pt-[18px] px-[20px] pb-[32px] flex flex-col gap-[16px]">
        {!approved ? (
          <div
            className="flex items-start gap-[11px] py-[14px] px-[15px] rounded-[var(--radius-input)] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.28)]"
          >
            <Icon name="Clock" size={16} color="var(--warning)" strokeWidth={2.2} className="mt-[1px]" />
            <div className="flex-1 flex flex-col gap-[6px]">
              <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
                KYC in review — 1 to 3 days
              </span>
              <span className="text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">
                Keep selling. Everything you earn is held until you are verified.
              </span>
              <Link href="/kyc" className="text-[12.5px] font-semibold text-[var(--accent)]">
                Check status
              </Link>
            </div>
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
              <StatusPill kind="success">Paid out to GTB ••••6789</StatusPill>
            ) : (
              <StatusPill kind="warning">Held — not payable yet</StatusPill>
            )}
            <span
              className="inline-flex items-center h-[26px] py-0 px-[10px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-secondary)] text-[11.5px] font-bold"
            >
              {keep}/{100 - keep} on {tierLabel}
            </span>
          </div>
          {!approved ? (
            <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)] pt-[12px] border-t border-t-[var(--border-hairline)]">
              Released to your bank account as soon as verification clears. Nothing is lost while you wait.
            </span>
          ) : null}
        </div>

        <div className="flex gap-[12px]">
          <div className="flex-1 p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
            <StatBlock value={`${creator.slotsUsed} / ${creator.slotsTotal}`} label="Upload slots" align="start" size="md" />
          </div>
          <div className="flex-1 p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
            <StatBlock value="1,240" label="EVG score" align="start" size="md" />
          </div>
        </div>

        <Button full size="lg" icon="Plus" onClick={() => router.push("/create")}>
          New upload — {slotsLeft} {slotsLeft === 1 ? "slot" : "slots"} left
        </Button>

        {approved && urgentCount > 0 ? (
          <Link href="/messages" className="no-underline">
            <div
              className="flex items-center gap-[12px] py-[15px] px-[16px] rounded-[var(--radius-card)] bg-[var(--surface-elevated)] border border-[var(--border-accent)]"
            >
              <span className="grid place-items-center w-[38px] h-[38px] rounded-[12] bg-[var(--accent-tint)] border border-[var(--border-accent)] shrink-0">
                <Icon name="MessageCircle" size={17} color="var(--accent)" strokeWidth={2} />
              </span>
              <div className="flex-1 flex flex-col gap-[2px]">
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {urgentCount} messages to reply
                </span>
                <span className="text-[12.5px] text-[var(--warning)]">Earliest is due in 4 hours</span>
              </div>
              <Icon name="ChevronRight" size={18} color="var(--accent)" strokeWidth={2.2} />
            </div>
          </Link>
        ) : null}

        <div className="flex flex-col gap-[10px]">
          {approved ? (
            <SectionHeader caption="Selling best" title="Your content" action="See all" onAction={() => router.push("/create/library")} />
          ) : null}
          <div className="flex flex-col rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] p-[4px]">
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
