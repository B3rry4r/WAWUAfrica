"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

type Phase = "idle" | "processing" | "done";

export function UnlockCourseSheet({ open, onClose, title, price }: { open: boolean; onClose: () => void; title: string; price: number }) {
  const [phase, setPhase] = useState<Phase>("idle");

  const start = async () => {
    setPhase("processing");
    await new Promise((r) => setTimeout(r, 650));
    setPhase("done");
  };

  return (
    <Sheet open={open} onClose={onClose} title="Unlock course" caption={title}>
      {phase === "idle" ? (
        <div className="flex flex-col gap-4 p-[6px_0_2px]">
          <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
            Pay once and it stays yours on WAWU — on your phone, forever.
          </p>
          <div className="flex items-center justify-between rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[12px_14px]">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">Course price</span>
            <span className="text-[15px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
              {formatNaira(price)}
            </span>
          </div>
          <Button full onClick={start}>
            Unlock course · {formatNaira(price)}
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div className="flex flex-col items-center gap-3.5 p-[26px_0_14px] text-center">
          <Icon name="Loader2" size={30} color="var(--accent)" strokeWidth={2} className="animate-[wawuSpin_900ms_linear_infinite]" />
          <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">Unlocking your course…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-[8px_0_4px] text-center">
          <span className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-[999px] border border-[rgba(184,232,62,0.35)] bg-[var(--success-tint)]">
            <Icon name="Check" size={26} color="var(--success)" strokeWidth={2.6} />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[17px] font-bold text-[var(--text-primary)]">Course unlocked</span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              Start with lesson 1. You can pick it up any time.
            </span>
          </div>
          <Button full onClick={onClose}>
            Start learning
          </Button>
        </div>
      )}
    </Sheet>
  );
}
