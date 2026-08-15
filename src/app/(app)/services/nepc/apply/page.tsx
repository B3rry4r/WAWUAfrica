"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, Icon, Input } from "@/components/ui";

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
      <div className="flex flex-col items-center gap-[18px] p-[64px_28px_96px] text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-[rgba(184,232,62,0.35)] bg-[var(--success-tint)]">
          <Icon name="Check" size={34} color="var(--success)" strokeWidth={2.6} />
        </span>
        <div className="flex flex-col gap-[6px]">
          <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            You&apos;re in the queue
          </span>
          <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
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
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          NEPC export support
        </span>
      </div>

      <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
        Tell us about your work. An agent reads this by hand and matches you to the right export desk.
      </p>

      <div className="flex flex-col gap-[14px]">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">What do you make or sell?</span>
          <textarea
            value={whatYouMake}
            onChange={(e) => setWhatYouMake(e.target.value)}
            placeholder="e.g. Hand-dyed ankara tote bags"
            rows={4}
            className="w-full resize-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] py-[14px] text-[15px] leading-[1.5] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </label>
        <Input label="Where do you sell right now?" value={whereYouSell} onChange={(e) => setWhereYouSell(e.target.value)} placeholder="e.g. WAWU + Instagram" />
      </div>

      {error && (
        <span className="inline-flex items-center gap-[6px] text-[12.5px] text-[var(--danger)]">
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
