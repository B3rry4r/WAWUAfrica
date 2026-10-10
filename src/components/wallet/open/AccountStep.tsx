"use client";

import { useState } from "react";
import { Button, Callout, Icon } from "@/components/ui";
import type { MoneyWallet } from "@/lib/api/money";
import { groupedAccountNumber } from "@/lib/wallet-opening";
import { ChecklistRow, StatusBadge } from "./ReviewStates";
import { StepFrame } from "./StepFrame";

type Account = NonNullable<MoneyWallet["account"]>;

/** The wallet's own account: its number, its bank and the name on it, each from the server. */
export function AccountCard({ account }: { account: Account }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section
      aria-label="Your account number"
      className="flex w-full flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[18px] text-left"
    >
      <div className="flex items-center gap-[12px]">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name="Landmark" size={17} color="var(--decor-icon)" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)]">Account number</span>
          <span className="text-[24px] font-bold tracking-[0.02em] [font-feature-settings:var(--font-feature-tabular)]" data-testid="account-number">
            {groupedAccountNumber(account.accountNumber)}
          </span>
        </span>
        <Button size="sm" variant="secondary" icon={copied ? "Check" : "Copy"} onClick={() => void copy()}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[8px] border-t border-t-[var(--border-hairline)] pt-[14px] text-[13.5px]">
        <dt className="text-[var(--text-secondary)]">Bank</dt>
        <dd className="m-0 text-right font-semibold">{account.bankName}</dd>
        <dt className="text-[var(--text-secondary)]">Name on the account</dt>
        <dd className="m-0 text-right font-semibold">{account.accountName}</dd>
      </dl>
      {account.licenceLine || account.depositInsuranceLine ? (
        <p className="m-0 text-[12px] leading-[1.5] text-[var(--text-muted)]">
          {[account.licenceLine, account.depositInsuranceLine].filter(Boolean).join(" ")}
        </p>
      ) : null}
    </section>
  );
}

export interface OnItsWayStepProps {
  checking: boolean;
  onCheck: () => Promise<void>;
  onLeave: () => void;
}

/** Approved, and the account number has not arrived yet: it says so, and the page reads again by itself. */
export function OnItsWayStep({ checking, onCheck, onLeave }: OnItsWayStepProps) {
  return (
    <StepFrame
      footer={
        <>
          <Button full size="lg" variant="secondary" icon="RefreshCw" loading={checking} onClick={() => void onCheck()}>
            Check again
          </Button>
          <Button full variant="ghost" onClick={onLeave}>
            Back to your wallet
          </Button>
        </>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-[18px] px-[12px] py-[20px] text-center">
        <StatusBadge icon="ShieldCheck" tone="success" />
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">You&apos;re approved</h2>
        <p className="m-0 max-w-[34ch] text-[15px] leading-[1.55] text-[var(--text-secondary)]">
          Your account number arrives in a few moments. You can stay on this page.
        </p>
        <ul className="m-0 mt-[6px] flex w-full max-w-[420px] list-none flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[18px] text-left">
          <ChecklistRow state="done">Details checked</ChecklistRow>
          <ChecklistRow state="done">Approved</ChecklistRow>
          <ChecklistRow state="now">Your account number is on its way</ChecklistRow>
          <ChecklistRow state="later">Your transaction PIN</ChecklistRow>
        </ul>
      </div>
    </StepFrame>
  );
}

export interface AccountReadyStepProps {
  account: Account;
  onSetPin: () => void;
}

/** The account is open and shows its number; the PIN is the last thing left. */
export function AccountReadyStep({ account, onSetPin }: AccountReadyStepProps) {
  return (
    <StepFrame
      footer={
        <Button full size="lg" iconRight="ArrowRight" onClick={onSetPin}>
          Set my PIN
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-[14px] px-[12px] py-[10px] text-center">
        <StatusBadge icon="Landmark" tone="success" />
        <h2 className="m-0 text-[26px] font-bold tracking-[-0.03em]">Your account is ready</h2>
        <p className="m-0 max-w-[36ch] text-[15px] leading-[1.55] text-[var(--text-secondary)]">
          Money sent to this account arrives in your wallet.
        </p>
      </div>
      <AccountCard account={account} />
      <Callout tone="info" title="One more step" full>
        Set a transaction PIN. It approves every payment and transfer.
      </Callout>
    </StepFrame>
  );
}
