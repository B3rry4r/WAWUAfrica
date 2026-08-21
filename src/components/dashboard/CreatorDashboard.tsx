"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session-provider";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { earningsApi } from "@/lib/api/earnings";
import { getEvgScore } from "@/lib/api/profile";
import { earningsStreamRows } from "@/lib/earnings-display";
import type { EarningsSummary } from "@/types/earnings";
import { messagingApi } from "@/lib/api/messaging";
import { contentApi } from "@/lib/api/creator-content";
import type { MessagingState } from "@/types/messaging";
import type { ContentItem } from "@/types/content";
import { PLANS } from "@/types/subscription";
import type { ContentType } from "@/types/content";
import type { KycStatus } from "@/types/account";
import { formatNaira } from "@/lib/format";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { TierBadge } from "@/components/ui/TierBadge";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatBlock } from "@/components/ui/StatBlock";
import { StatusPill } from "@/components/ui/StatusPill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ListRow } from "@/components/ui/ListRow";
import { Avatar, BackLink } from "@/components/ui";

/**
 * Real KYC state, not "in review" for everything that isn't approved. A
 * rejected creator was being told their documents were still being looked at,
 * and a creator who never started was told the same.
 */
function KycNotice({ status }: { status: KycStatus }) {
  if (status === "approved") return null;
  const rejected = status === "rejected";
  const copy =
    status === "not_started"
      ? { title: "Start verification to get paid", body: "Keep selling. Everything you earn is held until you verify.", link: "Start KYC" }
      : rejected
        ? { title: "Verification was not approved", body: "Nothing you have earned is lost. Send your ID again and we will look at it.", link: "Resubmit KYC" }
        : { title: "KYC in review, 1 to 3 days", body: "Keep selling. Everything you earn is held until you are verified.", link: "Check status" };
  return (
    <div
      className={`flex items-start gap-[11px] py-[14px] px-[15px] rounded-[var(--radius-input)] ${
        rejected ? "bg-[var(--danger-tint)] border border-[rgba(255,92,92,0.32)]" : "bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.28)]"
      }`}
    >
      <Icon
        name={rejected ? "TriangleAlert" : "Clock"}
        size={16}
        color={rejected ? "var(--danger)" : "var(--warning)"}
        strokeWidth={2.2}
        className="mt-[1px]"
      />
      <div className="flex-1 flex flex-col gap-[6px]">
        <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">{copy.title}</span>
        <span className="text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">{copy.body}</span>
        <Link href="/kyc" className="text-[12.5px] font-semibold text-[var(--accent)]">
          {copy.link}
        </Link>
      </div>
    </div>
  );
}

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
  const { user, hydrated } = useSession();
  const { creator, loading } = useCreatorState();
  const gates = creatorGates(user ? { accountType: user.accountType, creator } : null);

  // Real GET /api/hub/content/mine/earnings — never the frozen mock. Starts
  // null (nothing rendered for the earned figure) until the real call
  // resolves, same "no fake number while loading" discipline as
  // useCreatorState's snapshot-then-refresh pattern above.
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [earningsFailed, setEarningsFailed] = useState(false);
  // Real inbox + library. These used to import the frozen mock constants
  // directly, bypassing the API layer entirely, so the reply counts, the
  // needs-a-reply rail, the response-rate bar and both content lists were
  // fixtures identical for every creator.
  const [messaging, setMessaging] = useState<MessagingState | null>(null);
  const [library, setLibrary] = useState<ContentItem[] | null>(null);
  // Real EVG, not the hardcoded "1,240" this used to print.
  const [evg, setEvg] = useState<number | null>(null);

  useEffect(() => {
    if (!gates.isCreator) return;
    let cancelled = false;
    setEarningsFailed(false);
    if (user?.wawuId) {
      getEvgScore(user.wawuId).then((score) => {
        if (!cancelled) setEvg(score);
      });
    }
    earningsApi
      .getSummary()
      .then((s) => {
        if (!cancelled) setEarnings(s);
      })
      .catch(() => {
        if (!cancelled) setEarningsFailed(true);
      });
    messagingApi
      .getState()
      .then((m) => {
        if (!cancelled) setMessaging(m);
      })
      .catch(() => {
        // The inbox rail simply stays empty rather than showing fixtures.
        if (!cancelled) setMessaging({ threads: [], responseStats: { responded: 0, total: 0, rate: 0 }, penalty: "none" });
      });
    contentApi
      .getLibrary()
      .then((items) => {
        if (!cancelled) setLibrary(items);
      })
      .catch(() => {
        if (!cancelled) setLibrary([]);
      });
    return () => {
      cancelled = true;
    };
  }, [gates.isCreator, user?.wawuId]);

  // Real session hasn't hydrated yet, or the creator snapshot hasn't loaded
  // (e.g. a creator account with no CreatorState row yet) — hold off rather
  // than render with nothing.
  if (!hydrated || (loading && !creator) || !creator) return null;

  const tier = gates.tier ?? creator.tier;
  const approved = gates.canEarn;
  const keep = PLANS[tier].split;
  const tierLabel = tier === "pro" ? "Pro" : "Basic";
  const slotsLeft = gates.slotsRemaining;
  const earned = earnings ? (approved ? earnings.payable + earnings.held : earnings.held) : null;
  // Real per-stream figures from the same response as the total above, so
  // the chart and the total finally agree.
  const streamRows = earningsStreamRows(earnings);
  const earnedDisplay = earned !== null ? formatNaira(earned) : earningsFailed ? "Unavailable" : "···";
  const threads = messaging?.threads ?? [];
  const urgentCount = threads.filter((t) => !t.opened).length;
  const live = (library ?? []).filter((i) => i.status === "live");

  // D6 rail: the one thread whose 24h reply window is actually counting down
  // (expiresAt is only set once a buyer has opened the thread).
  const urgentThread = threads.find((t) => t.expiresAt);
  // Earliest real reply deadline still outstanding, in plain hours/days.
  const earliestDueLabel = (() => {
    const soonest = threads
      .map((t) => (t.expiresAt ? new Date(t.expiresAt).getTime() : NaN))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b)[0];
    if (soonest === undefined) return null;
    const msLeft = soonest - Date.now();
    if (msLeft <= 0) return "Earliest is overdue";
    const hours = Math.round(msLeft / 3_600_000);
    if (hours < 1) return "Earliest is due within the hour";
    if (hours < 24) return `Earliest is due in ${hours} hour${hours === 1 ? "" : "s"}`;
    const days = Math.round(hours / 24);
    return `Earliest is due in ${days} day${days === 1 ? "" : "s"}`;
  })();
  // The backend sends ONE real figure: a rolling no-response (missed)
  // percentage. There are no responded/total counts behind it, so nothing here
  // may render a count or an "answered" rate derived from one — this used to
  // print a flat "0% answered" above a ban warning for every creator.
  const missedPct = messaging?.responseStats.rate ?? 0;
  // Resolved threads in the inbox (answered, not refunded) — a real count off
  // the thread list, unlike the zeroed responseStats.responded it replaces.
  const answeredCount = threads.filter((t) => t.opened && t.status !== "refunded").length;
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // D6 "Statement" export — a downloadable record of this month's earnings,
  // not a wallet/withdrawal action (CLAUDE.md's no-wallet rule is about cash
  // balances and cash-out UI, not a plain-text statement of what already
  // rendered on screen). Every figure comes from the real earnings response;
  // this used to emit hardcoded amounts and a payout line naming a bank
  // account that was not the creator's, which is a false financial record.
  const handleDownloadStatement = () => {
    // Nothing to state until the real figures have loaded.
    if (!earnings) return;
    const rows = [
      ["WAWUAfrica creator statement", monthLabel],
      [],
      ["Stream", "Amount (NGN)"],
      ...streamRows.map((s) => [s.label, s.stream === "community_credits" ? `${s.amount} credits` : String(s.amount)]),
      [],
      ["Earned this month", earned !== null ? String(earned) : ""],
      ["Revenue split", `${keep}/${100 - keep} (${tierLabel})`],
      ["Payout status", approved ? "Payable to your verified bank account" : "Held, not payable yet"],
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wawu-statement-${monthLabel.replace(" ", "-").toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="xl:hidden">
        <FlowHeader title="Creator dashboard" right={<TierBadge tier={tier} />} />
      </div>

      {/* D6 desktop-only sticky page header — suppresses the global DesktopHeader
          (see hasOwnHeader) so this route shows exactly one header at xl. */}
      <div
        className="sticky top-0 z-20 hidden h-[68px] shrink-0 items-center gap-4 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur xl:flex"
        style={{ backdropFilter: "var(--blur-chrome)" }}
      >
        {/* Desktop has no bottom bar, so without this the dashboard is a dead
            end unless you use the browser's own back button. */}
        <BackLink label="" className="!h-9 !w-9 !justify-center !px-0" />
        <span className="text-[19px] font-semibold tracking-[-0.02em] text-text-primary">Dashboard</span>
        <span className="flex-1" />
        <span className="text-[13.5px] text-text-muted">{monthLabel}</span>
        <Button size="sm" variant="secondary" icon="Download" onClick={handleDownloadStatement}>
          Statement
        </Button>
      </div>

      <div className="xl:hidden pt-[18px] px-[20px] pb-[32px] flex flex-col gap-[16px]">
        <KycNotice status={gates.kycStatus} />

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
            {earnedDisplay}
          </span>
          <div className="flex gap-[8px] flex-wrap">
            {approved ? (
              <StatusPill kind="success">Payable to your bank account</StatusPill>
            ) : (
              <StatusPill kind="warning">Held, not payable yet</StatusPill>
            )}
            <span
              className="inline-flex items-center h-[26px] py-0 px-[10px] rounded-[999px] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-secondary)] text-[11.5px] font-bold"
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
            <StatBlock value={evg !== null ? evg.toLocaleString("en-NG") : "—"} label="EVG score" align="start" size="md" />
          </div>
        </div>

        <Button full size="lg" icon="Plus" onClick={() => router.push("/create")}>
          New upload, {slotsLeft} {slotsLeft === 1 ? "slot" : "slots"} left
        </Button>

        {approved && urgentCount > 0 ? (
          <Link href="/messages" className="no-underline">
            <div
              className="flex items-center gap-[12px] py-[15px] px-[16px] rounded-[var(--radius-card)] bg-[var(--surface-elevated)] border border-[var(--border-accent)]"
            >
              <span className="grid place-items-center w-[38px] h-[38px] rounded-[12px] bg-[var(--accent-tint)] border border-[var(--border-accent)] shrink-0">
                <Icon name="MessageCircle" size={17} color="var(--accent)" strokeWidth={2} />
              </span>
              <div className="flex-1 flex flex-col gap-[2px]">
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {urgentCount} messages to reply
                </span>
                {/* The real earliest deadline across unanswered threads —
                    this was a fixed "4 hours" no matter what was waiting. */}
                {earliestDueLabel ? (
                  <span className="text-[12.5px] text-[var(--warning)]">{earliestDueLabel}</span>
                ) : null}
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
                  : `No charge · ${item.activity ?? "No views yet"}`;
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
            <KycNotice status={gates.kycStatus} />

            <div className="grid grid-cols-4 gap-[16px]">
              <div className="rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[linear-gradient(140deg,#5A0B7D,#9411C9)] p-[20px]">
                <StatBlock value={earnedDisplay} label="Earned this month" align="start" size="md" />
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
                {/* No unlock/units-sold count exists on any response yet — the
                    same gap HomeRightRail documents. "Soon" is honest; the
                    hardcoded "86" that sat here was not. */}
                <StatBlock value="Soon" label="Unlocks" align="start" size="md" />
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
                <StatBlock value={String(answeredCount)} label="Questions answered" align="start" size="md" />
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
                <StatBlock value={evg !== null ? evg.toLocaleString("en-NG") : "—"} label="EVG" align="start" size="md" />
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
                {streamRows.map((s, i) => (
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
                      {s.label} {s.display}
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
                    : `No charge · ${item.activity ?? "No views yet"}`;
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
                  Nothing counting down right now. Every open thread is still inside its window.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Reply record
              </span>
              <div className="flex items-baseline gap-[8px]">
                <span className="text-[30px] font-bold tracking-[-0.02em] leading-none text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
                  {missedPct}%
                </span>
                <span className="text-[13px] text-[var(--text-secondary)]">missed in the last 30 days</span>
              </div>
              <div className="h-[6px] rounded-[999px] bg-[var(--surface-tag)]">
                <div
                  className="h-[6px] rounded-[999px] bg-[linear-gradient(90deg,#5A0B7D,var(--accent))]"
                  style={{ width: `${Math.min(missedPct, 100)}%` }}
                />
              </div>
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
                Above 30% and paid questions switch off for seven days.
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
              <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{earnedDisplay}</span>
              {approved ? (
                <StatusPill kind="success">Payable to your bank account</StatusPill>
              ) : (
                <StatusPill kind="warning">Held, not payable yet</StatusPill>
              )}
              <span className="text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">
                {approved
                  ? "Sent to your bank account automatically. No action needed."
                  : "Released to your bank account as soon as verification clears."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
