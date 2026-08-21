"use client";

import { useEffect, useState } from "react";
import { sendTip, TIP_PRESETS } from "@/lib/api/tips";
import { formatNaira } from "@/lib/format";
import { Avatar, Button, Icon, Sheet } from "@/components/ui";

/**
 * "failure" means nothing was charged. "unconfirmed" is the opposite case:
 * checkout completed and the money moved, but the server-side verify that
 * records the tip failed afterwards. Retrying an unconfirmed charge would tip
 * twice, so the two states must not share a screen.
 */
type Phase = "choose" | "processing" | "success" | "failure" | "unconfirmed";


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
      // Closing the checkout modal charges nothing — go back to the amount
      // picker rather than telling the tipper their payment failed.
      else if (res.result === "cancelled") setPhase("choose");
      else if (res.result === "verify_failed") setPhase("unconfirmed");
      else setPhase("failure");
    } catch {
      setPhase("failure");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Send a tip" caption="Tips go straight to the creator. In-app only, they decide what it's for.">
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
                      ? "border-[var(--border-selected)] bg-[var(--selected-tint)] text-[var(--accent)]"
                      : "border-[var(--border-hairline)] bg-[var(--surface-input)] text-[var(--text-primary)]",
                  ].join(" ")}
                >
                  {formatNaira(p)}
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
            Send {amount ? formatNaira(amount) : ""}
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
              {amount != null ? formatNaira(amount) : ""} sent
            </span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              {creator.name.split(" ")[0]} has your tip. Thanks for supporting their work.
            </span>
          </div>
          <Button full onClick={onClose}>
            Done
          </Button>
        </div>
      ) : phase === "unconfirmed" ? (
        <div className="flex flex-col gap-[14px] p-[8px_0_4px] text-center">
          <span className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-full border border-[rgba(255,183,3,0.32)] bg-[var(--warning-tint)]">
            <Icon name="Clock" size={26} color="var(--warning)" />
          </span>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[17px] font-bold text-[var(--text-primary)]">
              Tip went through, we could not confirm it
            </span>
            <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
              {amount != null ? formatNaira(amount) : "The tip"} left your account and we could not finish recording it.
              You have not been charged twice, so do not send it again. Tell support and they will sort it.
            </span>
          </div>
          <div className="mt-[6px] flex gap-[10px]">
            <Button full variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button full href="mailto:hello@wawuafrica.com">
              Contact support
            </Button>
          </div>
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
