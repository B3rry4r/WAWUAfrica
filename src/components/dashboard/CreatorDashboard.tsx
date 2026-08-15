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
import { Avatar } from "@/components/ui";

const typeIcons: Record<ContentType, IconName> = {
  video: "Play",
  course: "GraduationCap",
  audio: "Headphones",
  pdf: "BookOpen",
  image: "Image",
  template: "LayoutTemplate",
};

// D6 · four earnings streams, this month — same total as EarningsDashboard's
// "Where it came from" breakdown (kept in sync so the two screens never
// disagree on how the month split out).
const STREAMS: { label: string; amount: number; pct: number }[] = [
  { label: "Content sales", amount: 123300, pct: 67 },
  { label: "Paid messages", amount: 31050, pct: 17 },
  { label: "Community credits", amount: 21600, pct: 12 },
  { label: "Tips", amount: 8550, pct: 5 },
];

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

  // D6 rail: the one thread whose 24h reply window is actually counting down
  // (expiresAt is only set once a buyer has opened the thread).
  const urgentThread = currentMessaging.threads.find((t) => t.expiresAt);
  const { responded, total } = currentMessaging.responseStats;
  const answeredPct = total > 0 ? Math.round((responded / total) * 100) : 0;

  return (
    <div>
      <div className="xl:hidden">
        <FlowHeader title="Creator dashboard" right={<TierBadge tier={tier} />} />
      </div>

      <div className="xl:hidden pt-[18px] px-[20px] pb-[32px] flex flex-col gap-[16px]">
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
            className={`text-[38px] font-bold tracking-[-0.035em] leading-[1] [font-feature-settings:var(--font-feature-tabular)] ${
              approved ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            }`}
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

      {/* D6 · Creator dashboard, desktop — main column + persistent right rail. */}
      <div className="hidden xl:block xl:p-[26px]">
        <div className="grid grid-cols-[1fr_360px] items-start gap-[22px]">
          <div className="flex min-w-0 flex-col gap-[20px]">
            {!approved ? (
              <div className="flex items-start gap-[11px] rounded-[var(--radius-input)] border border-[rgba(255,183,3,0.28)] bg-[var(--warning-tint)] px-[15px] py-[14px]">
                <Icon name="Clock" size={16} color="var(--warning)" strokeWidth={2.2} className="mt-[1px]" />
                <div className="flex flex-1 flex-col gap-[6px]">
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

            <div className="grid grid-cols-4 gap-[16px]">
              <div className="rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[linear-gradient(140deg,#5A0B7D,#9411C9)] p-[20px]">
                <StatBlock value={formatNaira(earned)} label="Earned this month" align="start" size="md" />
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
                <StatBlock value="86" label="Unlocks" align="start" size="md" />
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
                <StatBlock value={String(responded)} label="Questions answered" align="start" size="md" />
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
                <StatBlock value="1,240" label="EVG" align="start" size="md" />
              </div>
            </div>

            <div className="flex flex-col gap-[16px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  Four streams, this month
                </span>
                <span className="text-[13px] text-[var(--text-muted)]">Payouts land weekly, Fridays</span>
              </div>
              <div className="flex h-[170px] items-end gap-[14px]">
                {STREAMS.map((s, i) => (
                  <div key={s.label} className="flex h-full flex-1 flex-col justify-end gap-[9px]">
                    <div
                      className={`rounded-t-[12px] rounded-b-[4px] ${
                        i === 0
                          ? "bg-[linear-gradient(180deg,#9411C9,#5A0B7D)]"
                          : "border border-[var(--border-hairline)] bg-[var(--surface-elevated)]"
                      }`}
                      style={{ height: `${Math.max(s.pct, 6)}%` }}
                    />
                    <span className="text-[12px] text-[var(--text-secondary)]">
                      {s.label} {formatNaira(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Your pieces
              </span>
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

          <div className="flex min-w-0 flex-col gap-[16px]">
            <div className="flex flex-col gap-[13px] rounded-[var(--radius-card)] border border-[rgba(255,92,92,0.32)] bg-[var(--surface-card)] p-[20px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Needs a reply
              </span>
              {urgentThread ? (
                <>
                  <div className="flex items-center gap-[11px]">
                    <Avatar initial={urgentThread.buyerInitials} size={38} />
                    <div className="flex flex-1 min-w-0 flex-col gap-[2px]">
                      <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
                        {urgentThread.buyerName}
                      </span>
                      <span className="text-[12px] text-[var(--danger)] [font-feature-settings:var(--font-feature-tabular)]">
                        {urgentThread.expiresAt} · {formatNaira(urgentThread.price)} at risk
                      </span>
                    </div>
                  </div>
                  <Link href="/messages" className="no-underline">
                    <Button full size="sm">
                      Reply now
                    </Button>
                  </Link>
                </>
              ) : (
                <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
                  Nothing counting down right now — every open thread is still inside its window.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Response rate
              </span>
              <div className="flex items-baseline gap-[8px]">
                <span className="text-[30px] font-bold tracking-[-0.02em] leading-none text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
                  {answeredPct}%
                </span>
                <span className="text-[13px] text-[var(--text-secondary)]">answered in 24h</span>
              </div>
              <div className="h-[6px] rounded-[999px] bg-[var(--surface-tag)]">
                <div
                  className="h-[6px] rounded-[999px] bg-[linear-gradient(90deg,#5A0B7D,var(--accent))]"
                  style={{ width: `${answeredPct}%` }}
                />
              </div>
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
                Below 70% and paid questions switch off for seven days.
              </span>
            </div>

            <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Slots
              </span>
              <div className="flex items-baseline gap-[8px]">
                <span className="text-[30px] font-bold tracking-[-0.02em] leading-none text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
                  {gates.slotsUsed} / {gates.slotsTotal}
                </span>
                <span className="text-[13px] text-[var(--text-secondary)]">used this month</span>
              </div>
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
                Slots reset on your renewal date.
              </span>
            </div>

            {/* Automatic payout status — design D6 draws a "Withdraw" panel here,
                but CLAUDE.md and docs/01_SPEC.md §6 cut wallet/withdrawal UI
                entirely ("no cash balance, no withdrawal UI, no cash out. Ever").
                Payout is automatic and non-actionable, matching the mobile
                dashboard's existing "Paid out to GTB" treatment above. */}
            <div className="mt-auto flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-elevated)] p-[18px]">
              <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{formatNaira(earned)}</span>
              {approved ? (
                <StatusPill kind="success">Paid out to GTB ••••6789</StatusPill>
              ) : (
                <StatusPill kind="warning">Held — not payable yet</StatusPill>
              )}
              <span className="text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">
                {approved
                  ? "Sent to your bank account automatically — no action needed."
                  : "Released to your bank account as soon as verification clears."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
