"use client";

import { useState } from "react";
import type { CreditPackId } from "@/types/credits";
import { CREDIT_PACKS } from "@/types/credits";
import { topUpCredits } from "@/lib/api/communities";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Phase = "choose" | "processing" | "done";

/** Credits render as a count, never a naira value, never cashable. */
export function CreditsCard({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("choose");
  const [chosen, setChosen] = useState<CreditPackId | null>(null);
  const [added, setAdded] = useState(0);

  const purchase = async () => {
    if (!chosen) return;
    setPhase("processing");
    try {
      const next = await topUpCredits(chosen);
      setAdded(CREDIT_PACKS[chosen].credits);
      setBalance(next);
      setPhase("done");
    } catch {
      setPhase("choose");
    }
  };

  const close = () => {
    setOpen(false);
    setPhase("choose");
    setChosen(null);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          padding: 14,
          borderRadius: "var(--radius-card)",
          background: "var(--surface-elevated)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 12,
            background: "var(--accent-tint)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <Icon name="Ticket" size={18} color="var(--accent)" stroke={2} />
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            WAWU Credits
          </span>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
            {balance}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>One credit sends one message. Reading is free.</span>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Top up
        </Button>
      </div>

      <Sheet open={open} onClose={close} title="Top up credits" caption="Credits are for sending community messages — they can't be cashed out.">
        {phase === "choose" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(Object.keys(CREDIT_PACKS) as CreditPackId[]).map((id) => {
              const p = CREDIT_PACKS[id];
              const active = chosen === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setChosen(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: "14px 15px",
                    borderRadius: "var(--radius-input)",
                    border: `1.5px solid ${active ? "var(--border-accent)" : "var(--border-hairline)"}`,
                    background: active ? "var(--accent-tint)" : "var(--surface-input)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      border: `1.5px solid ${active ? "var(--accent)" : "var(--border-strong)"}`,
                      flexShrink: 0,
                    }}
                  >
                    {active && <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--accent)" }} />}
                  </span>
                  <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                      {p.credits} credits
                      {id === "popular" && (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--accent)", padding: "2px 8px", borderRadius: 999, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
                          Popular
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>₦{p.price.toLocaleString("en-NG")}</span>
                  </span>
                </button>
              );
            })}
            <Button full disabled={!chosen} onClick={purchase}>
              Buy {chosen ? `${CREDIT_PACKS[chosen].credits} credits` : "credits"}
            </Button>
            <p style={{ margin: 0, fontSize: 11.5, textAlign: "center", color: "var(--text-muted)" }}>
              Credits never expire and are never a cash balance.
            </p>
          </div>
        ) : phase === "processing" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "26px 0 14px", textAlign: "center" }}>
            <Icon name="Loader2" size={30} color="var(--accent)" stroke={2} style={{ animation: "wawuSpin 900ms linear infinite" }} />
            <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>Adding your credits…</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0 4px", textAlign: "center" }}>
            <span
              style={{
                margin: "0 auto",
                display: "grid",
                placeItems: "center",
                width: 56,
                height: 56,
                borderRadius: 999,
                background: "var(--success-tint)",
                border: "1px solid rgba(184,232,62,0.35)",
              }}
            >
              <Icon name="Check" size={26} color="var(--success)" stroke={2.6} />
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{added} credits added</span>
              <span style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
                You now have <b>{balance}</b> credits. Reading communities is always free.
              </span>
            </div>
            <Button full onClick={close}>
              Done
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}