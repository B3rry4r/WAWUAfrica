"use client";

import { useState } from "react";
import type { CreditPackId } from "@/types/credits";
import { CREDIT_PACKS } from "@/types/credits";
import { topUpCredits } from "@/lib/api/communities";
import { formatNaira } from "@/lib/format";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Phase = "choose" | "processing" | "done";

/** Credits render as a count, never a naira value, never cashable. */
export function CreditsCard({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("choose");
  const [chosen, setChosen] = useState<CreditPackId | null>(null);
  const [added, setAdded] = useState(0);

  const purchase = async () => {
    if (!chosen) return;
    setPhase("processing");
    try {
      const next = await topUpCredits(chosen);
      setAdded(CREDIT_PACKS[chosen].credits);
      setBalance(next);
      setPhase("done");
    } catch {
      setPhase("choose");
    }
  };

  const close = () => {
    setOpen(false);
    setPhase("choose");
    setChosen(null);
  };

  return (
    <>
      <div className="flex items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-elevated p-[14px]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
          <Icon name="Ticket" size={18} color="var(--accent)" strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
            WAWU Credits
          </span>
          <span className="text-[26px] font-extrabold tracking-[-0.03em] text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
            {balance}
          </span>
          <span className="text-[12px] text-text-muted">One credit sends one message. Reading is free.</span>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Top up
        </Button>
      </div>

      <Sheet open={open} onClose={close} title="Top up credits" caption="Credits are for sending community messages — they can't be cashed out.">
        {phase === "choose" ? (
          <div className="flex flex-col gap-[10px]">
            {(Object.keys(CREDIT_PACKS) as CreditPackId[]).map((id) => {
              const p = CREDIT_PACKS[id];
              const active = chosen === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setChosen(id)}
                  className={[
                    "flex cursor-pointer items-center gap-[13px] rounded-[var(--radius-input)] border-[1.5px] p-[14px_15px] text-left",
                    active
                      ? "border-[var(--border-accent)] bg-[var(--accent-tint)]"
                      : "border-hairline bg-input",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px]",
                      active ? "border-accent" : "border-strong",
                    ].join(" ")}
                  >
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                  </span>
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">
                      {p.credits} credits
                      {id === "popular" && (
                        <span className="rounded-full border border-[var(--border-accent)] bg-[var(--accent-tint)] px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.04em] text-accent">
                          Popular
                        </span>
                      )}
                    </span>
                    <span className="text-[12.5px] text-text-muted">{formatNaira(p.price)}</span>
                  </span>
                </button>
              );
            })}
            <Button full disabled={!chosen} onClick={purchase}>
              Buy {chosen ? `${CREDIT_PACKS[chosen].credits} credits` : "credits"}
            </Button>
            <p className="m-0 text-center text-[11.5px] text-text-muted">
              Credits never expire and are never a cash balance.
            </p>
          </div>
        ) : phase === "processing" ? (
          <div className="flex flex-col items-center gap-[14px] px-0 pb-[14px] pt-[26px] text-center">
            <Icon name="Loader2" size={30} color="var(--accent)" strokeWidth={2} className="[animation:wawuSpin_900ms_linear_infinite]" />
            <span className="text-[15.5px] font-semibold text-text-primary">Adding your credits…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-0 pb-1 pt-2 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[rgba(184,232,62,0.35)] bg-[var(--success-tint)]">
              <Icon name="Check" size={26} color="var(--success)" strokeWidth={2.6} />
            </span>
            <div className="flex flex-col gap-[5px]">
              <span className="text-[17px] font-bold text-text-primary">{added} credits added</span>
              <span className="text-[13.5px] text-text-secondary">
                You now have <b>{balance}</b> credits. Reading communities is always free.
              </span>
            </div>
            <Button full onClick={close}>
              Done
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}
