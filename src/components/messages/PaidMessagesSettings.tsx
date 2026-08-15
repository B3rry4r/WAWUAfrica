"use client";

import { useEffect, useState } from "react";
import { messagingApi } from "@/lib/api/messaging";
import { currentSession } from "@/lib/api/mocks/session";
import { PLANS } from "@/types/subscription";
import type { PenaltyKind } from "@/types/messaging";
import { NairaInput } from "@/components/ui/Input";
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", maxWidth: "var(--mobile-column)", margin: "0 auto" }}>
      <FlowHeader title="Paid messages" />

      <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "10px 16px 0" }}>
        {penalties.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPenalty(p)}
            style={{
              height: 30,
              padding: "0 12px",
              borderRadius: 999,
              border: penalty === p ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
              background: penalty === p ? "var(--accent-tint)" : "var(--surface-tag)",
              color: penalty === p ? "var(--accent)" : "var(--text-muted)",
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            {p === "none" ? "Good" : p === "warned" ? "Warning" : p === "disabled7" ? "Off 7d" : "Off 30d"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 18 }}>
        {locked ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: "var(--radius-card)",
              background: "var(--surface-card)",
              border: "1px solid var(--border-hairline)",
              opacity: 0.6,
            }}
          >
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Accept paid messages</span>
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                {penalty === "disabled7" ? "Locked until 21 August" : "Locked until 13 September"}
              </span>
            </div>
            <span style={{ position: "relative", width: 52, height: 30, borderRadius: 999, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 3, left: 3, width: 24, height: 24, borderRadius: 999, background: "var(--text-disabled)" }} />
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: "var(--radius-card)",
              background: enabled ? "var(--surface-elevated)" : "var(--surface-card)",
              border: enabled ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Accept paid messages</span>
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                {enabled ? "On since 2 August" : "Off — no one can message you"}
              </span>
            </div>
            <span
              style={{
                position: "relative",
                width: 52,
                height: 30,
                borderRadius: 999,
                background: enabled ? "var(--accent)" : "var(--surface-tag)",
                border: enabled ? "none" : "1px solid var(--border-hairline)",
                flexShrink: 0,
              }}
            >
              <span style={{ position: "absolute", top: 3, right: enabled ? 3 : "auto", left: enabled ? "auto" : 3, width: 24, height: 24, borderRadius: 999, background: enabled ? "#fff" : "var(--text-disabled)" }} />
            </span>
          </button>
        )}

        {!enabled && !locked ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 16,
              borderRadius: "var(--radius-card)",
              background: "var(--surface-card)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              Nothing is charged while it is off
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
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
            hint="Anything from ₦50 to ₦500."
          />
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 16,
            borderRadius: "var(--radius-card)",
            background: "var(--surface-card)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            What you agree to
          </span>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Icon name="Clock" size={16} color="var(--text-secondary)" stroke={2} style={{ marginTop: 1 }} />
            <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: "var(--text-secondary)" }}>
              Reply within <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>24 hours</span> of each message.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Icon name="HandCoins" size={16} color="var(--text-secondary)" stroke={2} style={{ marginTop: 1 }} />
            <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: "var(--text-secondary)" }}>
              You earn <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatNaira(dmEarn)}</span> of every{" "}
              {formatNaira(price)} — {keep}% on {tierLabel}.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Icon name="RotateCcw" size={16} color="var(--text-secondary)" stroke={2} style={{ marginTop: 1 }} />
            <span style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: "var(--text-secondary)" }}>
              Miss the window and the fan is refunded. You earn nothing on that one.
            </span>
          </div>
        </div>

        {penalty === "warned" ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 18, borderRadius: "var(--radius-card)", background: "var(--warning-tint)", border: "1px solid rgba(255,183,3,0.32)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: 13, background: "rgba(255,183,3,0.16)", border: "1px solid rgba(255,183,3,0.3)", flexShrink: 0 }}>
                  <Icon name="TriangleAlert" size={19} color="var(--warning)" stroke={2.2} />
                </span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 16.5, fontWeight: 600, color: "var(--text-primary)" }}>You are missing messages</span>
                  <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{rate}% unanswered in the last 30 days</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                Each miss refunds the fan and earns you nothing. Cross 30% and paid messages switch off for 7 days.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 18, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Where you sit
              </span>
              <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: "var(--surface-tag)" }}>
                <div style={{ width: `${Math.min(rate, 100)}%`, background: "var(--warning)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--success)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>Under 10% — nothing happens</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--warning)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    10 to 30% — a warning, where you are now
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--danger)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>30 to 50% — switched off for 7 days</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--danger)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>Over 50% — switched off for 30 days</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Two ways to fix it</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                Raise your price so you get fewer, more serious questions — or switch paid messages off until you have time.
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <Button size="sm" variant="secondary" style={{ flex: 1 }} onClick={() => { setEnabled(true); setPenalty("none"); }}>
                  Raise the price
                </Button>
                <Button size="sm" variant="secondary" style={{ flex: 1 }} onClick={() => setEnabled(false)}>
                  Switch off
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {penalty === "disabled7" || penalty === "disabled30" ? (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: 18,
                borderRadius: "var(--radius-card)",
                background: "var(--danger-tint)",
                border: `1px solid ${penalty === "disabled7" ? "rgba(255,92,92,0.32)" : "rgba(255,92,92,0.4)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, borderRadius: 13, background: "rgba(255,92,92,0.16)", border: "1px solid rgba(255,92,92,0.3)", flexShrink: 0 }}>
                  <Icon name="Lock" size={19} color="var(--danger)" stroke={2.2} />
                </span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 16.5, fontWeight: 600, color: "var(--text-primary)" }}>
                    {penalty === "disabled7" ? "Paid messages are off" : "Off for 30 days"}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                    {penalty === "disabled7" ? "38% unanswered · back on 21 August" : "64% unanswered · back on 13 September"}
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                {penalty === "disabled7"
                  ? "Seven days. Everyone waiting was refunded. Nothing else on your account is affected."
                  : "More than half the people who paid you got nothing back. Every one of them was refunded."}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Back on in</span>
                <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", fontFeatureSettings: "var(--font-feature-tabular)" }}>
                  {penalty === "disabled7" ? "6 days" : "29 days"}
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: "var(--surface-tag)", overflow: "hidden" }}>
                <div style={{ width: penalty === "disabled7" ? "14%" : "4%", height: "100%", borderRadius: 999, background: "var(--danger)" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                {penalty === "disabled7" ? "Still open to you" : "Do not turn it back on unless you can answer daily"}
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                {penalty === "disabled7"
                  ? "Publishing, communities, tips and your storefront all keep working. Only paid messages are paused."
                  : "A ₦500 price with three answered messages beats a ₦100 price with thirty missed ones. Fewer, better paid questions."}
              </span>
            </div>

            {penalty === "disabled7" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  Miss more than half and it becomes 30 days
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                  When it comes back, answer everything for a fortnight before raising your price again.
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Nothing else changed</span>
                <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                  Your content stays live and keeps selling. Your tier and community hosting are untouched.
                </span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
              <Icon name="Info" size={15} color="var(--text-muted)" style={{ marginTop: 1 }} />
              <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                If something happened that stopped you answering, tell support and they will look at it.
              </span>
            </div>
          </>
        ) : null}

        {penalty === "none" || penalty === "warned" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Your reply record</span>
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                {rate}% missed over the last 30 days
              </span>
            </div>
            <StatusPill kind={penalty === "none" ? "success" : "warning"}>
              {penalty === "none" ? "Good standing" : "Warning"}
            </StatusPill>
          </div>
        ) : null}
      </div>

      <div style={{ padding: "14px 16px 24px", borderTop: "1px solid var(--border-hairline)" }}>
        <Button full size="lg" disabled={locked}>
          Save
        </Button>
      </div>
    </div>
  );
}
