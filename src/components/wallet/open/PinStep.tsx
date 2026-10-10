"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { describeError } from "@/lib/api/errors";
import { reasonCodeOf, setPin } from "@/lib/api/money";
import { StepFrame } from "./StepFrame";

export interface PinStepProps {
  /** The PIN is set (now, or it already was). */
  onSet: () => void;
}

const FOUR = /^[0-9]{4}$/;

/**
 * The transaction PIN: four digits, entered twice, sent once. Both entries are
 * cleared as soon as the server has answered, whatever it said, and neither is
 * ever kept, logged or put in a URL.
 */
export function PinStep({ onSet }: PinStepProps) {
  const [pin, setPinValue] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field: "pin" | "again" | "form"; text: string } | null>(null);

  const digits = (v: string) => v.replace(/\D+/g, "").slice(0, 4);

  const save = async () => {
    if (busy) return;
    if (!FOUR.test(pin)) {
      setError({ field: "pin", text: "Enter four digits." });
      return;
    }
    if (pin !== again) {
      setError({ field: "again", text: "The two PINs don't match." });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setPin({ pin, pinConfirmation: again });
      onSet();
    } catch (e) {
      const code = reasonCodeOf(e);
      if (code === "pin_already_set") {
        onSet();
        return;
      }
      if (code === "pin_mismatch") setError({ field: "again", text: "The two PINs don't match." });
      else if (code === "wallet_opening") setError({ field: "form", text: "Your account is still being set up. Try again in a moment." });
      else setError({ field: "form", text: describeError(e).body });
    } finally {
      setPinValue("");
      setAgain("");
      setBusy(false);
    }
  };

  return (
    <StepFrame
      footer={
        <Button full size="lg" loading={busy} disabled={pin.length !== 4 || again.length !== 4} onClick={() => void save()}>
          Save my PIN
        </Button>
      }
    >
      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[24px] font-bold tracking-[-0.025em]">Set your transaction PIN</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">Four digits. It approves every payment and transfer.</p>
      </div>
      <div className="flex max-w-[360px] flex-col gap-[14px]">
        <Input
          id="open-pin"
          label="PIN"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPinValue(digits(e.target.value));
            setError(null);
          }}
          error={error?.field === "pin" ? error.text : undefined}
        />
        <Input
          id="open-pin-again"
          label="Enter it again"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={again}
          onChange={(e) => {
            setAgain(digits(e.target.value));
            setError(null);
          }}
          error={error?.field === "again" ? error.text : undefined}
        />
        {error?.field === "form" ? (
          <span role="alert" className="text-[12.5px] text-danger">
            {error.text}
          </span>
        ) : null}
      </div>
    </StepFrame>
  );
}
