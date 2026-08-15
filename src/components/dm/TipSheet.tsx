"use client";

import { useEffect, useState } from "react";
import { sendTip, TIP_PRESETS } from "@/lib/api/tips";
import { Avatar, Button, Icon, Sheet } from "@/components/ui";

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
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center gap-[10px]">
            <Avatar initial={creator.name.charAt(0)} size={36} />
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">Tip {creator.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-[10px]">
            {TIP_PRESETS.map((p) => {
              const active = amount === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={[
                    "h-[54px] cursor-pointer rounded-[var(--radius-input)] border-[1.5px] text-[17px] font-bold [font-feature-settings:var(--font-feature-tabular)]",
                    active
                      ? "border-[var(--border-accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                      : "border-[var(--border-hairline)] bg-[var(--surface-input)] text-[var(--text-primary)]",
                  ].join(" ")}
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
            className="w-full resize-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[15px] py-[13px] text-[14.5px] leading-[1.5] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <Button full disabled={!amount} onClick={pay}>
            Send ₦{amount ? amount.toLocaleString("en-NG") : ""}
          </Button>
        </div>
      ) : phase === "processing" ? (
        <div className="flex flex-col items-center gap-[14px] p-[26px_0_14px] text-center">
          <Icon name="Loader2" size={30} color="var(--accent)" className="[animation:wawuSpin_900ms_linear_infinite]" />
          <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">Sending your tip…</span>
        </div>
      ) : phase === "success" ? (
        <div className="flex flex-col gap-[16px] p-[8px_0_4px] text-center">
          <span className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-full border border-[rgba(184,232,62,0.35)] bg-[var(--success-tint)]">
            <Icon name="HeartHandshake" size={26} color="var(--success)" />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[17px] font-bold text-[var(--text-primary)]">
              ₦{amount?.toLocaleString("en-NG")} sent
            </span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              {creator.name.split(" ")[0]} has your tip. Thanks for supporting their work.
            </span>
          </div>
          <Button full onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-[14px] p-[8px_0_4px] text-center">
          <span className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-full border border-[rgba(255,92,92,0.32)] bg-[var(--danger-tint)]">
            <Icon name="CircleAlert" size={26} color="var(--danger)" />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[17px] font-bold text-[var(--text-primary)]">Payment failed</span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              Nothing was charged. Try again, or pick a different amount.
            </span>
          </div>
          <div className="mt-[6px] flex gap-[10px]">
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
