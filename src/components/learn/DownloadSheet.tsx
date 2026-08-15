"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Phase = "idle" | "processing" | "done";

export function DownloadSheet({ open, onClose, title }: { open: boolean; onClose: () => void; title: string }) {
  const [phase, setPhase] = useState<Phase>("idle");

  const download = async () => {
    setPhase("processing");
    await new Promise((r) => setTimeout(r, 700));
    setPhase("done");
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} caption="Free download — it stays on your device.">
      {phase === "idle" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "6px 0 2px" }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>
            Downloading is free and keeps your copy on your phone even offline.
          </p>
          <Button full onClick={download}>
            Download now
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "26px 0 14px", textAlign: "center" }}>
          <Icon name="Loader2" size={30} color="var(--accent)" stroke={2} style={{ animation: "wawuSpin 900ms linear infinite" }} />
          <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>Downloading…</span>
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
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Download started</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
              You’ll find it in your downloads when it’s ready.
            </span>
          </div>
          <Button full onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </Sheet>
  );
}