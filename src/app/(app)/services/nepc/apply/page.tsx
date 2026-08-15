"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";

export default function NepcApplyPage() {
  const router = useRouter();
  const [whatYouMake, setWhatYouMake] = useState("");
  const [whereYouSell, setWhereYouSell] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(undefined);
    if (!whatYouMake.trim() || !whereYouSell.trim()) {
      setError("Fill in both fields to continue.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "64px 28px 96px", textAlign: "center" }}>
        <span style={{ display: "grid", placeItems: "center", width: 72, height: 72, borderRadius: 999, background: "var(--success-tint)", border: "1px solid rgba(184,232,62,0.35)" }}>
          <Icon name="Check" size={34} color="var(--success)" stroke={2.6} />
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            You&apos;re in the queue
          </span>
          <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            An export agent will reply within 3–5 days and connect you to the right NEPC desk.
          </span>
        </div>
        <Button full onClick={() => router.push("/services/nepc")}>
          Back to NEPC export support
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProfileBackButton compact />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          NEPC export support
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
        Tell us about your work. An agent reads this by hand and matches you to the right export desk.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="What do you make or sell?" value={whatYouMake} onChange={setWhatYouMake} multiline placeholder="e.g. Hand-dyed ankara tote bags" />
        <Input label="Where do you sell right now?" value={whereYouSell} onChange={setWhereYouSell} placeholder="e.g. WAWU + Instagram" />
      </div>

      {error && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger)" }}>
          <Icon name="CircleAlert" size={14} color="var(--danger)" />
          {error}
        </span>
      )}

      <Button full disabled={submitting} onClick={submit}>
        {submitting ? "Submitting…" : "Start · Free"}
      </Button>
    </div>
  );
}