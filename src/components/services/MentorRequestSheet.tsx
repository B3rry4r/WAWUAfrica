"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestMentor } from "@/lib/api/mentors";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Phase = "idle" | "processing" | "done";

export function MentorRequestSheet({
  open,
  onClose,
  mentor,
}: {
  open: boolean;
  onClose: () => void;
  mentor: { id: string; name: string; rate: number };
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  const send = async () => {
    if (!note.trim()) return;
    setPhase("processing");
    try {
      await requestMentor(mentor.id, note.trim());
      setPhase("done");
    } catch {
      setPhase("idle");
    }
  };

  const close = () => {
    setNote("");
    setPhase("idle");
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title="Book a session" caption={`45 minutes with ${mentor.name.split(" ")[0]} — paid when your request is accepted.`}>
      {phase === "idle" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What do you want to work on together?"
            rows={4}
            style={{
              width: "100%",
              background: "var(--surface-input)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--radius-input)",
              padding: "14px 16px",
              color: "var(--text-primary)",
              fontSize: 15,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
              resize: "none",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: "var(--radius-input)",
              background: "var(--surface-tag)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Session rate</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
              ₦{mentor.rate.toLocaleString("en-NG")}
            </span>
          </div>
          <Button full disabled={!note.trim()} onClick={send}>
            Request session · ₦{mentor.rate.toLocaleString("en-NG")}
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "26px 0 14px", textAlign: "center" }}>
          <Icon name="Loader2" size={30} color="var(--accent)" stroke={2} style={{ animation: "wawuSpin 900ms linear infinite" }} />
          <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>Sending your request…</span>
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
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Request sent</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
              {mentor.name.split(" ")[0]} usually replies within a day. You&apos;ll only pay when they accept.
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Button full variant="secondary" onClick={close}>
              Done
            </Button>
            <Button full onClick={() => router.push("/services/mentors")}>
              Browse more
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}