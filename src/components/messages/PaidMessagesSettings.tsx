"use client";

import { useEffect, useState } from "react";
import { messagingApi } from "@/lib/api/messaging";
import { currentSession } from "@/lib/api/mocks/session";
import { PLANS } from "@/types/subscription";
import type { PenaltyKind } from "@/types/messaging";
import { NairaInput } from "@/components/ui/NairaInput";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { formatNaira } from "@/lib/format";

const penalties: PenaltyKind[] = ["none", "warned", "disabled7", "disabled30"];

export function PaidMessagesSettings() {
  const [price, setPrice] = useState(300);
  const [penalty, setPenalty] = useState<PenaltyKind>("none");
  const [rate, setRate] = useState(4);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let alive = true;
    messagingApi.getState().then((s) => {
      if (!alive) return;
      setPrice(300);
      setPenalty(s.penalty);
      setRate(s.responseStats.rate);
    });
    return () => {
      alive = false;
    };
  }, []);

  const tier = currentSession.creator?.tier ?? "basic";
  const tierLabel = tier === "pro" ? "Pro" : "Basic";
  const keep = PLANS[tier].split;
  const dmEarn = Math.round((price * keep) / 100);
  const locked = penalty === "disabled7" || penalty === "disabled30";

  return (
    <div className="flex flex-col min-h-[100vh] max-w-[var(--mobile-column)] m-0">
      <FlowHeader title="Paid messages" />

      <div className="flex justify-center gap-[4px] pt-[10px] px-[16px] pb-0">
        {penalties.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPenalty(p)}
            className={`h-[30px] py-0 px-[12px] rounded-[999] text-[11.5px] font-semibold cursor-pointer border font-[family-name:var(--font-sans)] ${
              penalty === p
                ? "border-[var(--border-accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-muted)]"
            }`}
          >
            {p === "none" ? "Good" : p === "warned" ? "Warning" : p === "disabled7" ? "Off 7d" : "Off 30d"}
          </button>
        ))}
      </div>

      <div className="flex-1 py-[18px] px-[16px] flex flex-col gap-[18px]">
        {locked ? (
          <div
            className="flex items-center gap-[14px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)] opacity-[0.6]"
          >
            <div className="flex-1 flex flex-col gap-[3px]">
              <span className="text-[16px] font-semibold text-[var(--text-primary)]">Accept paid messages</span>
              <span className="text-[12.5px] text-[var(--text-secondary)]">
                {penalty === "disabled7" ? "Locked until 21 August" : "Locked until 13 September"}
              </span>
            </div>
            <span className="relative w-[52px] h-[30px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] shrink-0">
              <span className="absolute top-[3px] left-[3px] w-[24px] h-[24px] rounded-[999] bg-[var(--text-disabled)]" />
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`flex items-center gap-[14px] p-[16px] rounded-[var(--radius-card)] cursor-pointer text-left w-full border font-[family-name:var(--font-sans)] ${
              enabled
                ? "bg-[var(--surface-elevated)] border-[var(--border-accent)]"
                : "bg-[var(--surface-card)] border-[var(--border-hairline)]"
            }`}
          >
            <div className="flex-1 flex flex-col gap-[3px]">
              <span className="text-[16px] font-semibold text-[var(--text-primary)]">Accept paid messages</span>
              <span className="text-[12.5px] text-[var(--text-secondary)]">
                {enabled ? "On since 2 August" : "Off — no one can message you"}
              </span>
            </div>
            <span
              className={`relative w-[52px] h-[30px] rounded-[999] shrink-0 ${
                enabled
                  ? "bg-[var(--accent)] border-none"
                  : "bg-[var(--surface-tag)] border border-[var(--border-hairline)]"
              }`}
            >
              <span
                className={`absolute top-[3px] w-[24px] h-[24px] rounded-[999] ${
                  enabled ? "right-[3px] left-auto bg-[#fff]" : "right-auto left-[3px] bg-[var(--text-disabled)]"
                }`}
              />
            </span>
          </button>
        )}

        {!enabled && !locked ? (
          <div
            className="flex flex-col gap-[10px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]"
          >
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">
              Nothing is charged while it is off
            </span>
            <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
              Fans cannot start a paid conversation. Turn it back on whenever you have time to answer.
            </span>
            <Button full variant="secondary" onClick={() => setEnabled(true)}>
              Turn back on
            </Button>
          </div>
        ) : null}

        {penalty === "none" && enabled ? (
          <NairaInput
            label="Price per message"
            value={price}
            onChange={setPrice}
            presets={[50, 100, 300, 500]}
            hint={`Anything from ${formatNaira(50)} to ${formatNaira(500)}.`}
          />
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
              Reply within <span className="text-[var(--text-primary)] font-semibold">24 hours</span> of each message.
            </span>
          </div>
          <div className="flex items-start gap-[10px]">
            <Icon name="HandCoins" size={16} color="var(--text-secondary)" strokeWidth={2} className="mt-[1px]" />
            <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
              You earn <span className="text-[var(--text-primary)] font-semibold">{formatNaira(dmEarn)}</span> of every{" "}
              {formatNaira(price)} — {keep}% on {tierLabel}.
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
                <span className="grid place-items-center w-[42px] h-[42px] rounded-[13] bg-[rgba(255,183,3,0.16)] border border-[rgba(255,183,3,0.3)] shrink-0">
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
              <div className="flex h-[8px] rounded-[999] overflow-hidden bg-[var(--surface-tag)]">
                <div className="bg-[var(--warning)]" style={{width: `${Math.min(rate, 100)}%`}} />
              </div>
              <div className="flex flex-col gap-[9px]">
                <div className="flex items-center gap-[10px]">
                  <span className="w-[8px] h-[8px] rounded-[999] bg-[var(--success)] shrink-0" />
                  <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Under 10% — nothing happens</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="w-[8px] h-[8px] rounded-[999] bg-[var(--warning)] shrink-0" />
                  <span className="flex-1 text-[13px] font-semibold text-[var(--text-primary)]">
                    10 to 30% — a warning, where you are now
                  </span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="w-[8px] h-[8px] rounded-[999] bg-[var(--danger)] shrink-0" />
                  <span className="flex-1 text-[13px] text-[var(--text-secondary)]">30 to 50% — switched off for 7 days</span>
                </div>
                <div className="flex items-center gap-[10px]">
                  <span className="w-[8px] h-[8px] rounded-[999] bg-[var(--danger)] shrink-0" />
                  <span className="flex-1 text-[13px] text-[var(--text-secondary)]">Over 50% — switched off for 30 days</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[11px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">Two ways to fix it</span>
              <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                Raise your price so you get fewer, more serious questions — or switch paid messages off until you have time.
              </span>
              <div className="flex gap-[10px]">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => { setEnabled(true); setPenalty("none"); }}>
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
                <span className="grid place-items-center w-[42px] h-[42px] rounded-[13] bg-[rgba(255,92,92,0.16)] border border-[rgba(255,92,92,0.3)] shrink-0">
                  <Icon name="Lock" size={19} color="var(--danger)" strokeWidth={2.2} />
                </span>
                <div className="flex-1 flex flex-col gap-[3px]">
                  <span className="text-[16.5px] font-semibold text-[var(--text-primary)]">
                    {penalty === "disabled7" ? "Paid messages are off" : "Off for 30 days"}
                  </span>
                  <span className="text-[12.5px] text-[var(--text-secondary)]">
                    {penalty === "disabled7" ? "38% unanswered · back on 21 August" : "64% unanswered · back on 13 September"}
                  </span>
                </div>
              </div>
              <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
                {penalty === "disabled7"
                  ? "Seven days. Everyone waiting was refunded. Nothing else on your account is affected."
                  : "More than half the people who paid you got nothing back. Every one of them was refunded."}
              </p>
            </div>

            <div className="flex flex-col gap-[12px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <div className="flex items-baseline gap-[10px]">
                <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Back on in</span>
                <span className="text-[24px] font-bold tracking-[-0.02em] [font-feature-settings:var(--font-feature-tabular)]">
                  {penalty === "disabled7" ? "6 days" : "29 days"}
                </span>
              </div>
              <div className="h-[5px] rounded-[999] bg-[var(--surface-tag)] overflow-hidden">
                <div
                  className={`h-full rounded-[999] bg-[var(--danger)] ${penalty === "disabled7" ? "w-[14%]" : "w-[4%]"}`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-[11px] p-[16px] rounded-[var(--radius-card)] bg-[var(--surface-card)] border border-[var(--border-hairline)]">
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                {penalty === "disabled7" ? "Still open to you" : "Do not turn it back on unless you can answer daily"}
              </span>
              <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                {penalty === "disabled7"
                  ? "Publishing, communities, tips and your storefront all keep working. Only paid messages are paused."
                  : `A ${formatNaira(500)} price with three answered messages beats a ${formatNaira(100)} price with thirty missed ones. Fewer, better paid questions.`}
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

      <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)]">
        <Button full size="lg" disabled={locked}>
          Save
        </Button>
      </div>
    </div>
  );
}
