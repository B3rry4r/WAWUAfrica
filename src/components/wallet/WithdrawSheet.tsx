"use client";

import { useEffect, useState } from "react";
import { getBanks, resolveAccount, withdraw, type Bank } from "@/lib/api/wallet";
import { describeError } from "@/lib/api/errors";
import { formatNaira } from "@/lib/format";
import { Button, Callout, Icon, Input, Sheet } from "@/components/ui";

/** Matches the server's floor, so the button refuses before the request does. */
const MIN_WITHDRAWAL = 1000;

type Phase = "form" | "confirm" | "sending" | "sent";

/**
 * Taking money out.
 *
 * ── WHY THERE IS A CONFIRM STEP ────────────────────────────────────────────
 * A bank transfer to the wrong account number is gone. Not reversible, not
 * disputable, gone. So the account is resolved with the bank first and the
 * NAME IT COMES BACK WITH is shown for confirmation before anything is sent.
 * The creator confirms a person, not ten digits they have just retyped.
 *
 * The resolve is also what catches the ordinary mistake: a digit out, or the
 * wrong bank picked from the list, both surface here as somebody else's name
 * rather than as a silent success.
 */
export function WithdrawSheet({
  open,
  available,
  onClose,
  onDone,
}: {
  open: boolean;
  available: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    getBanks().then(setBanks).catch(() => setBanks([]));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPhase("form");
      setError(null);
      setAccountName(null);
    }
  }, [open]);

  const naira = Number(amount.replace(/[^\d]/g, "")) || 0;
  const canCheck =
    bankCode.length > 0 && accountNumber.length === 10 && naira >= MIN_WITHDRAWAL && naira <= available;

  const check = async () => {
    setError(null);
    try {
      const resolved = await resolveAccount(bankCode, accountNumber);
      setAccountName(resolved.accountName);
      setPhase("confirm");
    } catch (e) {
      // The bank could not find it. Almost always a wrong digit, so say that
      // rather than showing a raw provider message.
      setError(
        describeError(e).body ||
          "That account number was not found at this bank. Check the digits and try again.",
      );
    }
  };

  const send = async () => {
    setPhase("sending");
    setError(null);
    try {
      await withdraw({ amount: naira, bankCode, accountNumber });
      setPhase("sent");
    } catch (e) {
      setError(describeError(e).body);
      setPhase("confirm");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Withdraw">
      {phase === "sent" ? (
        <div className="flex flex-col items-center gap-[14px] px-[8px] py-[18px] text-center">
          <span className="grid h-[64px] w-[64px] place-items-center rounded-full border border-decor bg-decor-tint">
            <Icon name="Check" size={28} color="var(--accent)" strokeWidth={2.6} />
          </span>
          <span className="text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            On its way
          </span>
          {/* Deliberately not "sent": the transfer is pending until the bank
              confirms it, and promising more than that is how a support
              conversation starts. */}
          <p className="m-0 max-w-[300px] text-[14px] leading-[1.5] text-[var(--text-secondary)]">
            {formatNaira(naira)} to {accountName}. Bank transfers usually land within minutes,
            and it shows in your activity either way.
          </p>
          <Button full size="lg" onClick={onDone}>
            Done
          </Button>
        </div>
      ) : phase === "confirm" || phase === "sending" ? (
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[6px] rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-[var(--decor-tint)] p-[16px]">
            <span className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">
              Paying
            </span>
            <span className="text-[18px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              {accountName}
            </span>
            <span className="text-[13px] text-[var(--text-secondary)] [font-feature-settings:var(--font-feature-tabular)]">
              {accountNumber} · {banks.find((b) => b.code === bankCode)?.name ?? bankCode}
            </span>
            <span className="pt-[6px] text-[22px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
              {formatNaira(naira)}
            </span>
          </div>

          <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
            Check the name above. A bank transfer cannot be reversed once it has been sent.
          </p>

          {error ? <Callout tone="danger" title="That did not go through">{error}</Callout> : null}

          <div className="flex flex-col gap-[9px]">
            <Button full size="lg" loading={phase === "sending"} disabled={phase === "sending"} onClick={() => void send()}>
              {phase === "sending" ? "Sending…" : `Send ${formatNaira(naira)}`}
            </Button>
            <Button full variant="ghost" disabled={phase === "sending"} onClick={() => setPhase("form")}>
              Change something
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[14px]">
          <span className="text-[13px] text-[var(--text-secondary)]">
            {formatNaira(available)} available.
          </span>

          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-text-secondary">Bank</span>
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="h-[52px] w-full rounded-input border border-hairline bg-input px-4 text-[15px] text-text-primary outline-none focus:border-accent"
            >
              <option value="">Choose your bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Account number"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
            placeholder="10 digits"
          />

          <Input
            label="Amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={String(MIN_WITHDRAWAL)}
            hint={
              naira > available
                ? `That is more than the ${formatNaira(available)} you have.`
                : `The smallest withdrawal is ${formatNaira(MIN_WITHDRAWAL)}.`
            }
          />

          {error ? <Callout tone="danger" title="Check the details">{error}</Callout> : null}

          <Button full size="lg" disabled={!canCheck} onClick={() => void check()}>
            Check the account
          </Button>
        </div>
      )}
    </Sheet>
  );
}
