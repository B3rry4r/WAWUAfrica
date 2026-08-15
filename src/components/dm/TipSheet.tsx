"use client";

import { useEffect, useState } from "react";
import { sendTip, TIP_PRESETS } from "@/lib/api/tips";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

type Phase = "choose" | "processing" | "success" | "failure";

/** Tip a creator in-app. One sheet, presets locked to the design's amounts. */
export function TipSheet({
  open,
  onClose,
  creator,
}: {
  open: boolean;
  onClose: () => void;
  creator: { wawuId: string; name: string } | null;
}) {
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("choose");

  useEffect(() => {
    if (open) {
      setAmount(null);
      setNote("");
      setPhase("choose");
    }
  }, [open]);

  const pay = async () => {
    if (!creator || !amount) return;
    setPhase("processing");
    try {
      const res = await sendTip({ wawuId: creator.wawuId, name: creator.name }, amount, note.trim() || undefined);
      if (res.result === "success") setPhase("success");
      else setPhase("failure");
    } catch {
      setPhase("failure");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Send a tip" caption="Tips go straight to the creator. In-app only — they decide what it's for.">
      {!creator ? null : phase === "choose" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initial={creator.name.charAt(0)} size={36} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Tip {creator.name}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {TIP_PRESETS.map((p) => {
              const active = amount === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  style={{
                    height: 54,
                    borderRadius: "var(--radius-input)",
                    border: `1.5px solid ${active ? "var(--border-accent)" : "var(--border-hairline)"}`,
                    background: active ? "var(--accent-tint)" : "var(--surface-input)",
                    color: active ? "var(--accent)" : "var(--text-primary)",
                    fontSize: 17,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFeatureSettings: "var(--font-feature-tabular)",
                  }}
                >
                  ₦{p.toLocaleString("en-NG")}
                </button>
              );
            })}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            rows={2}
            style={{
              width: "100%",
              background: "var(--surface-input)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--radius-input)",
              padding: "13px 15px",
              color: "var(--text-primary)",
              fontSize: 14.5,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
              resize: "none",
              outline: "none",
            }}
          />
          <Button full disabled={!amount} onClick={pay}>
            Send ₦{amount ? amount.toLocaleString("en-NG") : ""}
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "26px 0 14px", textAlign: "center" }}>
          <Icon name="Loader2" size={30} color="var(--accent)" stroke={2} style={{ animation: "wawuSpin 900ms linear infinite" }} />
          <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>Sending your tip…</span>
        </div>
      ) : phase === "success" ? (
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
            <Icon name="HeartHandshake" size={26} color="var(--success)" stroke={2} />
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
              ₦{amount?.toLocaleString("en-NG")} sent
            </span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
              {creator.name.split(" ")[0]} has your tip. Thanks for supporting their work.
            </span>
          </div>
          <Button full onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0 4px", textAlign: "center" }}>
          <span
            style={{
              margin: "0 auto",
              display: "grid",
              placeItems: "center",
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "var(--danger-tint)",
              border: "1px solid rgba(255,92,92,0.32)",
            }}
          >
            <Icon name="CircleAlert" size={26} color="var(--danger)" stroke={2} />
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Payment failed</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
              Nothing was charged. Try again, or pick a different amount.
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Button full variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button full onClick={pay}>
              Try again
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}