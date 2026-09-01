"use client";

import { useEffect, useState } from "react";
import { messagingApi } from "@/lib/api/messaging";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import { creatorGates } from "@/lib/auth/gates";
import { PLANS } from "@/types/subscription";
import type { PenaltyKind } from "@/types/messaging";
import { NairaInput } from "@/components/ui/NairaInput";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Feedback";
import { formatNaira } from "@/lib/format";

const penalties: PenaltyKind[] = ["none", "warned", "disabled7", "disabled30"];

// Suggestions, not a range. Creators set whatever they want; these are just
// quick taps for common choices.
const PRICE_PRESETS = [100, 500, 1000, 2500];

/**
 * The one abuse guard left on this field, and it is the server's rule
 * (docs/01 §1, docs/02 §2.4: "min ₦50, no ceiling"). There is no maximum —
 * the old ₦500 cap is gone, and the ₦50–₦500 range it came from does not
 * exist anywhere in this product any more.
 */
const MIN_PRICE = 50;

/**
 * How long the creator has to reply before the fan is refunded automatically.
 *
 * This was a fixed 24 hours platform-wide. It is right for a fan asking one
 * question and wrong for anyone quoting on real work, so creators choose —
 * within the server's own 1–336 hour bounds (DTO: update-dm-settings).
 *
 * Changing it never moves a deadline already sold: each message stores the
 * window it was paid against.
 */
const WINDOW_OPTIONS = [
  { value: 24, label: "24 hours" },
  { value: 48, label: "2 days" },
  { value: 72, label: "3 days" },
  { value: 168, label: "1 week" },
] as const;

/** "24 hours" / "3 days" — never a bare hour count once past a day. */
function windowLabel(hours: number): string {
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  if (hours % 168 === 0) {
    const weeks = hours / 168;
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** The price field's own id, so "Raise the price" can send focus to it. */
const PRICE_FIELD_ID = "dm-price";

/** "21 August" — the backend's dmDisabledUntil, never an invented date. */
function formatUntil(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

/** Whole days left on a suspension, rounded up. */
function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** Non-production only — see the switcher's own doc comment below. */
const DEV_TOOLS_ENABLED = process.env.NODE_ENV !== "production";

export function PaidMessagesSettings() {
  const { creator, resolved, reload: reloadCreatorState } = useCreatorState();
  // accountType is deliberately not part of this — see creatorGates().
  const gates = creatorGates({ creator });
  /**
   * null means "this creator has never set a price", and it must READ that
   * way. This used to default to `gates.dmPrice || 300` — ₦300 was a leftover
   * from the deleted ₦50–₦500 range, and it put a number in the field, in the
   * earnings line and in the inbox header as if the creator had chosen it.
   * Nobody had. An unset price is now an empty field with an ask attached, and
   * Save stays closed until they answer it.
   */
  const [price, setPrice] = useState<number | null>(gates.dmPrice > 0 ? gates.dmPrice : null);
  const [penalty, setPenalty] = useState<PenaltyKind>("none");
  const [rate, setRate] = useState(0);
  // Real end-of-suspension timestamp from GET /dm/response-stats. Null when
  // the backend isn't holding paid messages closed — the panels below then
  // render no date at all rather than a made-up one.
  const [disabledUntil, setDisabledUntil] = useState<string | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [enabled, setEnabled] = useState(gates.dmEnabled);
  const [windowHours, setWindowHours] = useState(gates.dmResponseHours);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Real price/accept-toggle come from the session's creator state (GET
  // /api/hub/creator/state at login) — re-sync if that changes under us.
  useEffect(() => {
    setPrice(gates.dmPrice > 0 ? gates.dmPrice : null);
    setEnabled(gates.dmEnabled);
    setWindowHours(gates.dmResponseHours);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gates.dmPrice, gates.dmEnabled, gates.dmResponseHours]);

  useEffect(() => {
    if (!gates.isCreator) return;
    let alive = true;
    messagingApi
      .getState()
      .then((s) => {
        if (!alive) return;
        setPenalty(s.penalty);
        setRate(s.responseStats.rate);
        setDisabledUntil(s.dmDisabledUntil);
      })
      .catch(() => {
        if (alive) setStatsError(true);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gates.isCreator]);

  const tier = gates.tier ?? "basic";
  const tierLabel = PLANS[tier].name;
  const keep = PLANS[tier].split;
  /** Never set: nothing to price, nothing to earn, nothing to state. */
  const priceSet = price !== null && price > 0;
  const dmEarn = priceSet ? Math.round((price * keep) / 100) : null;
  const tooLow = price !== null && price > 0 && price < MIN_PRICE;
  const locked = penalty === "disabled7" || penalty === "disabled30";
  const untilLabel = disabledUntil ? formatUntil(disabledUntil) : null;
  const daysLeft = disabledUntil ? daysUntil(disabledUntil) : null;
  // How far through the suspension they are. Only meaningful with a real end
  // date and a known window length (7 or 30 days), so the whole panel hides
  // without one instead of drawing an invented bar.
  const suspensionDays = penalty === "disabled7" ? 7 : 30;
  const servedPct = daysLeft === null ? null : Math.min(100, Math.max(0, ((suspensionDays - daysLeft) / suspensionDays) * 100));

  /**
   * The real "raise your price" action: steps the field to the next preset
   * above the current price and puts the creator in it, so Save persists a
   * genuinely higher price. It must never touch `penalty` — that is computed
   * server-side, and clearing it locally would hide a live suspension.
   */
  const raisePrice = () => {
    const next = PRICE_PRESETS.find((p) => p > (price ?? 0));
    if (next) setPrice(next);
    const field = document.getElementById(PRICE_FIELD_ID) as HTMLInputElement | null;
    field?.scrollIntoView({ block: "center", behavior: "smooth" });
    field?.focus();
  };

  const save = async () => {
    // Turning paid messages ON without a price would ask fans to pay an amount
    // nobody chose. Off with no price is fine — it charges nothing.
    if (enabled && (!priceSet || tooLow)) return;
    setSaveState("saving");
    try {
      await messagingApi.updateDmSettings({
        dmEnabled: enabled,
        dmPrice: price ?? 0,
        dmResponseHours: windowHours,
      });
      setSaveState("saved");
      reloadCreatorState();
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  };

  // Skeleton until the SERVER has answered whether this account is a creator
  // (`resolved` covers session hydration too). Waiting on hydration alone let
  // the sign-in-time snapshot answer, and it says "user" forever for anyone
  // who became a creator afterwards — they got "Set up a creator account".
  if (!resolved) {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0">
        <FlowHeader title="Paid messages" />
        <div className="flex flex-col gap-[12px] p-[16px]">
          <Skeleton height={80} radius="var(--radius-card)" />
          <Skeleton height={80} radius="var(--radius-card)" />
        </div>
      </div>
    );
  }

  // Paid-message pricing/penalty settings are a creator-only surface — a
  // plain user account has no creator record and the real backend 403s on
  // every one of these endpoints (same root cause as the /messages gate).
  if (!gates.isCreator) {
    return (
      <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0">
        <FlowHeader title="Paid messages" />
        <EmptyState
          icon="Lock"
          title="This setting is for creators"
          caption="Paid messages are something creators turn on to answer fan questions. Switch to a creator account to set this up."
          action="Set up a creator account"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] xl:max-w-[760px] m-0">
      <FlowHeader title="Paid messages" />

      {/*
        DEV ONLY — lets every penalty state (good/warned/disabled7/disabled30)
        be previewed without waiting for the real backend's no-response
        tracker to reach that state. It mutates local UI state only (never
        the real `penalty` the backend computed) and must never render in
        production — gated on NODE_ENV rather than shipped unconditionally.
      */}
      {DEV_TOOLS_ENABLED ? (
        <div className="flex justify-center gap-[4px] pt-[10px] px-[16px] pb-0">
          {penalties.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPenalty(p)}
              className={`h-[30px] py-0 px-[12px] rounded-[999px] text-[11.5px] font-semibold cursor-pointer border font-[family-name:var(--font-sans)] ${
                penalty === p
                  ? "border-[var(--border-selected)] bg-[var(--selected-tint)] text-[var(--accent)]"
                  : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-muted)] hover:border-strong hover:bg-surface-hover active:bg-surface-press"
              }`}
            >
              {p === "none" ? "Good" : p === "warned" ? "Warning" : p === "disabled7" ? "Off 7d" : "Off 30d"}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex-1 py-[18px] px-[16px] flex flex-col gap-[18px]">
        {statsError ? (
          <div className="flex items-center gap-[10px] py-[12px] px-[14px] rounded-[var(--radius-card)] bg-[var(--danger-tint)] border border-[rgba(255,92,92,0.32)]">
            <Icon name="TriangleAlert" size={16} strokeWidth={2.2} color="var(--danger)" />
            <span className="flex-1 text-[12.5px] font-semibold text-[var(--text-primary)]">
              Couldn&apos;t load your reply record, the numbers below may be out of date.
            </span>
          </div>
        ) : null}
        {locked ? (
          <div
            className="flex items-center gap-[14px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] opacity-[0.6]"
          >
            <div className="flex-1 flex flex-col gap-[3px]">
              <span className="text-[16px] font-semibold text-[var(--text-primary)]">Accept paid messages</span>
              {untilLabel ? (
                <span className="text-[12.5px] text-[var(--text-secondary)]">Locked until {untilLabel}</span>
              ) : null}
            </div>
            <span className="relative w-[52px] h-[30px] rounded-[999px] bg-[var(--surface-tag)] border border-[var(--border-hairline)] shrink-0">
              <span className="absolute top-[3px] left-[3px] w-[24px] h-[24px] rounded-[999px] bg-[var(--text-disabled)]" />
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`flex items-center gap-[14px] p-[16px] rounded-[var(--radius-card)] cursor-pointer text-left w-full border font-[family-name:var(--font-sans)] hover:bg-surface-hover active:bg-surface-press ${
              enabled
                ? "bg-[var(--surface-elevated)] border-[var(--border-selected)]"
                : "bg-[var(--surface-card)] border-[var(--border-hairline)]"
            }`}
          >
            <div className="flex-1 flex flex-col gap-[3px]">
              <span className="text-[16px] font-semibold text-[var(--text-primary)]">Accept paid messages</span>
              <span className="text-[12.5px] text-[var(--text-secondary)]">
                {/* There is no "on since" date on the creator state — the
                    invented one that used to sit here is gone. And "on" is
                    only true once there is a price to charge. */}
                {enabled
                  ? priceSet
                    ? `On, fans pay ${formatNaira(price)} to ask you a question`
                    : "On, but nobody can ask until you set a price"
                  : "Off, no one can message you"}
              </span>
            </div>
            <span
              className={`relative w-[52px] h-[30px] rounded-[999px] shrink-0 ${
                enabled
                  ? "bg-[var(--accent)] border-none"
                  : "bg-[var(--surface-tag)] border border-[var(--border-hairline)]"
              }`}
            >
              <span
                className={`absolute top-[3px] w-[24px] h-[24px] rounded-[999px] ${
                  enabled ? "right-[3px] left-auto bg-[var(--text-on-accent)]" : "right-auto left-[3px] bg-[var(--text-disabled)]"
                }`}
              />
            </span>
          </button>
        )}

        {!enabled && !locked ? (
          <div
            className="flex flex-col gap-[10px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]"
          >
            {/* "Turn it BACK on" is only true for somebody who once had it on.
                A creator who has never set a price has never had it on, and
                telling them to restore something they never had is how this
                whole feature stayed undiscovered. */}
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">
              {priceSet ? "Nothing is charged while it is off" : "You have not switched this on yet"}
            </span>
            <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
              {priceSet
                ? "Fans cannot start a paid conversation. Turn it back on whenever you have time to answer."
                : `Fans pay to ask you one question, and you answer inside ${windowLabel(windowHours)}. Switch it on and name your price. You choose the amount and the reply window, and you can change both whenever you like.`}
            </span>
            <Button full variant="secondary" onClick={() => setEnabled(true)}>
              {priceSet ? "Turn back on" : "Turn it on and set a price"}
            </Button>
          </div>
        ) : null}

        {/* Also shown while warned — "raise your price" below is only a real
            fix if the field is actually on screen to raise. */}
        {!locked && enabled ? (
          <div className="flex flex-col gap-[12px]">
            {/* The ask, for a creator who has never named a price. Without it
                the field just sat there pre-filled with a number they never
                chose. */}
            {!priceSet ? (
              <div className="flex flex-col gap-[8px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-accent)] p-[16px]">
                <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">
                  What is one answer from you worth?
                </span>
                <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                  You have not set a price yet, so nobody can pay to ask you anything. Pick one below or type your own -
                  there is no ceiling, and you can change it whenever you like.
                </span>
              </div>
            ) : null}
            <NairaInput
              id={PRICE_FIELD_ID}
              label="Price per message"
              value={price}
              onValueChange={setPrice}
              presets={PRICE_PRESETS}
              placeholder="Set your price"
              error={tooLow ? `The lowest we can charge is ${formatNaira(MIN_PRICE)}.` : undefined}
              hint="You set this. Charge what your time is worth."
            />

            <div className="flex flex-col gap-[8px]">
              <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
                How long you have to reply
              </span>
              <ChoiceChips
                ariaLabel="How long you have to reply"
                options={WINDOW_OPTIONS}
                value={windowHours}
                onSelect={setWindowHours}
              />
              <span className="text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">
                Miss it and the fan is refunded automatically. Buyers see this
                before they pay, so pick a window you can actually keep.
              </span>
            </div>
          </div>
        ) : null}

        <div
          className="flex flex-col gap-[12px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]"
        >
          <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">
            What you agree to
          </span>
          <div className="flex items-start gap-[10px]">
            <Icon name="Clock" size={16} color="var(--text-secondary)" strokeWidth={2} className="mt-[1px]" />
            <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
              Reply within{" "}
              <span className="text-[var(--text-primary)] font-semibold">
                {windowLabel(windowHours)}
              </span>{" "}
              of each message.
            </span>
          </div>
          <div className="flex items-start gap-[10px]">
            <Icon name="HandCoins" size={16} color="var(--text-secondary)" strokeWidth={2} className="mt-[1px]" />
            <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
              {/* No price, no figure. Stating an amount off a default nobody
                  chose is what this whole screen is being fixed for. */}
              {dmEarn !== null && price !== null ? (
                <>
                  You earn <span className="text-[var(--text-primary)] font-semibold">{formatNaira(dmEarn)}</span> of
                  every {formatNaira(price)}, {keep}% on {tierLabel}.
                </>
              ) : (
                <>
                  You keep <span className="text-[var(--text-primary)] font-semibold">{keep}%</span> of whatever you
                  charge, on {tierLabel}. Set a price above and this shows the exact figure.
                </>
              )}
            </span>
          </div>
          <div className="flex items-start gap-[10px]">
            <Icon name="RotateCcw" size={16} color="var(--text-secondary)" strokeWidth={2} className="mt-[1px]" />
            <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
              Miss the window and the fan is refunded. You earn nothing on that one.
            </span>
          </div>
        </div>

        {penalty === "warned" ? (
          <>
            <div className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--warning-tint)] border border-[rgba(255,183,3,0.32)]">
              <div className="flex items-center gap-[12px]">
                <span className="grid place-items-center w-[42px] h-[42px] rounded-[13px] bg-[rgba(255,183,3,0.16)] border border-[rgba(255,183,3,0.3)] shrink-0">
                  <Icon name="TriangleAlert" size={19} color="var(--warning)" strokeWidth={2.2} />
                </span>
                <div className="flex-1 flex flex-col gap-[3px]">
                  <span className="text-[16.5px] font-semibold text-[var(--text-primary)]">You are missing messages</span>
                  <span className="text-[12.5px] text-[var(--text-secondary)]">{rate}% unanswered in the last 30 days</span>
                </div>
              </div>
              <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
                Each miss refunds the fan and earns you nothing. Cross 30% and paid messages switch off for 7 days.
              </p>
            </div>

            <div className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]">
                Where you sit
              </span>
              <div className="flex h-[8px] rounded-[999px] overflow-hidden bg-[var(--surface-tag)]">
                <div className="bg-[var(--warning)]" style={{width: `${Math.min(rate, 100)}%`}} />
              </div>
              <div className="flex flex-col gap-[9px]">
                <div className="flex items-center gap-[10px]">
                  <span className="w-[8px] h-[8px] rounded-[999px] bg-[var(--success)] shrink-0" />
                  <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Under 10%, nothing happens</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="w-[8px] h-[8px] rounded-[999px] bg-[var(--warning)] shrink-0" />
                  <span className="flex-1 text-[13px] font-semibold text-[var(--text-primary)]">
                    10 to 30%, a warning, where you are now
                  </span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="w-[8px] h-[8px] rounded-[999px] bg-[var(--danger)] shrink-0" />
                  <span className="flex-1 text-[13px] text-[var(--text-secondary)]">30 to 50%, switched off for 7 days</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="w-[8px] h-[8px] rounded-[999px] bg-[var(--danger)] shrink-0" />
                  <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Over 50%, switched off for 30 days</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[11px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">Two ways to fix it</span>
              <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                Raise your price so you get fewer, more serious questions, or switch paid messages off until you have time.
              </span>
              <div className="flex gap-[10px]">
                <Button size="sm" variant="secondary" className="flex-1" onClick={raisePrice}>
                  Raise the price
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => setEnabled(false)}>
                  Switch off
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {penalty === "disabled7" || penalty === "disabled30" ? (
          <>
            <div
              className={`flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--danger-tint)] border ${
                penalty === "disabled7" ? "border-[rgba(255,92,92,0.32)]" : "border-[rgba(255,92,92,0.4)]"
              }`}
            >
              <div className="flex items-center gap-[12px]">
                <span className="grid place-items-center w-[42px] h-[42px] rounded-[13px] bg-[rgba(255,92,92,0.16)] border border-[rgba(255,92,92,0.3)] shrink-0">
                  <Icon name="Lock" size={19} color="var(--danger)" strokeWidth={2.2} />
                </span>
                <div className="flex-1 flex flex-col gap-[3px]">
                  <span className="text-[16.5px] font-semibold text-[var(--text-primary)]">
                    {penalty === "disabled7" ? "Paid messages are off" : "Off for 30 days"}
                  </span>
                  <span className="text-[12.5px] text-[var(--text-secondary)]">
                    {rate}% unanswered{untilLabel ? ` · back on ${untilLabel}` : ""}
                  </span>
                </div>
              </div>
              <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
                {penalty === "disabled7"
                  ? "Seven days. Everyone waiting was refunded. Nothing else on your account is affected."
                  : "More than half the people who paid you got nothing back. Every one of them was refunded."}
              </p>
            </div>

            {daysLeft !== null && servedPct !== null ? (
              <div className="flex flex-col gap-[12px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
                <div className="flex items-baseline gap-[10px]">
                  <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Back on in</span>
                  <span className="text-[24px] font-bold tracking-[-0.02em] [font-feature-settings:var(--font-feature-tabular)]">
                    {daysLeft === 1 ? "1 day" : `${daysLeft} days`}
                  </span>
                </div>
                <div className="h-[5px] rounded-[999px] bg-[var(--surface-tag)] overflow-hidden">
                  {/* Width is a live value, so it cannot be a static Tailwind
                      class — same treatment as the warned bar above. */}
                  <div className="h-full rounded-[999px] bg-[var(--danger)]" style={{ width: `${servedPct}%` }} />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-[11px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                {penalty === "disabled7" ? "Still open to you" : "Do not turn it back on unless you can answer daily"}
              </span>
              <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                {penalty === "disabled7"
                  ? "Publishing, communities, tips and your storefront all keep working. Only paid messages are paused."
                  : "A higher price with three answered messages beats a low one with thirty missed. Fewer, better paid questions."}
              </span>
            </div>

            {penalty === "disabled7" ? (
              <div className="flex flex-col gap-[11px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Miss more than half and it becomes 30 days
                </span>
                <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                  When it comes back, answer everything for a fortnight before raising your price again.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-[11px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">Nothing else changed</span>
                <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                  Your content stays live and keeps selling. Your tier and community hosting are untouched.
                </span>
              </div>
            )}

            <div className="flex items-start gap-[10px] py-[13px] px-[14px] rounded-[var(--radius-input)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <Icon name="Info" size={15} color="var(--text-muted)" className="mt-[1px]" />
              <span className="flex-1 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
                If something happened that stopped you answering, tell support and they will look at it.
              </span>
            </div>
          </>
        ) : null}

        {penalty === "none" || penalty === "warned" ? (
          <div className="flex items-center gap-[12px] py-[15px] px-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
            <div className="flex-1 flex flex-col gap-[3px]">
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">Your reply record</span>
              <span className="text-[12.5px] text-[var(--text-secondary)]">
                {rate}% missed over the last 30 days
              </span>
            </div>
            <StatusPill kind={penalty === "none" ? "success" : "warning"}>
              {penalty === "none" ? "Good standing" : "Warning"}
            </StatusPill>
          </div>
        ) : null}
      </div>

      <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)] flex flex-col gap-[8px]">
        {saveState === "error" ? (
          <span className="text-[12.5px] font-semibold text-[var(--danger)] text-center">
            Couldn&apos;t save, check your connection and try again.
          </span>
        ) : null}
        {enabled && !locked && !priceSet ? (
          <span className="text-[12.5px] text-[var(--text-muted)] text-center">
            Set a price and this saves. Nobody is charged until you do.
          </span>
        ) : null}
        <Button
          full
          size="lg"
          disabled={locked || saveState === "saving" || (enabled && (!priceSet || tooLow))}
          onClick={save}
        >
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
}
