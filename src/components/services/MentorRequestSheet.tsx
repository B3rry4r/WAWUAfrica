"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestMentor } from "@/lib/api/mentors";
import { Button, Icon, Sheet } from "@/components/ui";

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
        <div className="flex flex-col gap-[16px]">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What do you want to work on together?"
            rows={4}
            className="w-full resize-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] py-[14px] text-[15px] leading-[1.5] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <div className="flex items-center justify-between rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[12px_14px]">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">Session rate</span>
            <span className="text-[15px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
              ₦{mentor.rate.toLocaleString("en-NG")}
            </span>
          </div>
          <Button full disabled={!note.trim()} onClick={send}>
            Request session · ₦{mentor.rate.toLocaleString("en-NG")}
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div className="flex flex-col items-center gap-[14px] p-[26px_0_14px] text-center">
          <Icon name="Loader2" size={30} color="var(--accent)" className="[animation:wawuSpin_900ms_linear_infinite]" />
          <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">Sending your request…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-[16px] p-[8px_0_4px] text-center">
          <span className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-full border border-[rgba(184,232,62,0.35)] bg-[var(--success-tint)]">
            <Icon name="Check" size={26} color="var(--success)" strokeWidth={2.6} />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[17px] font-bold text-[var(--text-primary)]">Request sent</span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              {mentor.name.split(" ")[0]} usually replies within a day. You&apos;ll only pay when they accept.
            </span>
          </div>
          <div className="mt-[6px] flex gap-[10px]">
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
