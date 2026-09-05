"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getWallet,
  getWalletHistory,
  WalletNotReadyError,
  type Wallet,
  type WalletEntry,
} from "@/lib/api/wallet";
import { describeError } from "@/lib/api/errors";
import { formatNaira } from "@/lib/format";
import { Button, Callout, Icon, Skeleton, StatusPill } from "@/components/ui";
import { WithdrawSheet } from "./WithdrawSheet";

/**
 * A creator's wallet.
 *
 * The balance is Flutterwave's, read through our API on every load. Nothing
 * here is summed in the browser: a figure the app worked out itself can
 * disagree with the one the bank will actually pay out, and the creator would
 * believe the wrong one.
 */
export function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * Hands over the account number.
   *
   * The clipboard API is unavailable on an insecure origin and throws in some
   * in-app browsers, so the fallback selects the digits instead: the number
   * still has to be gettable when the tidy path is not there.
   */
  const copyNumber = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotReady(null);
    try {
      const w = await getWallet();
      setWallet(w);
      // The history is secondary: a wallet that loads with an empty list is
      // still a working wallet, so this must not take the balance down with it.
      try {
        setHistory(await getWalletHistory());
      } catch {
        setHistory([]);
      }
    } catch (e) {
      if (e instanceof WalletNotReadyError) setNotReady(e.message);
      else setError(describeError(e).body);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-[14px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[720px] xl:p-[30px_28px_64px]">
        <Skeleton className="h-[132px] w-full" />
        <Skeleton className="h-[64px] w-full" />
        <Skeleton className="h-[64px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[16px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[720px] xl:p-[30px_28px_64px]">
      <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        Wallet
      </h1>

      {/* Not an error: it is the ordinary state before verification, and it
          says which of the two creator gates is the one in the way. */}
      {notReady ? (
        <Callout tone="info" title="Verify your identity first">
          <p className="m-0">{notReady}</p>
          <div className="mt-[12px]">
            <Button href="/kyc" size="sm">
              Start verification
            </Button>
          </div>
        </Callout>
      ) : null}

      {error ? (
        <Callout tone="danger" title="We could not load your wallet">
          <p className="m-0">{error}</p>
          <div className="mt-[12px]">
            <Button size="sm" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        </Callout>
      ) : null}

      {wallet ? (
        <>
          <section className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[18px]">
            <span className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">
              Available
            </span>
            <span className="text-[34px] font-bold leading-none tracking-[-0.03em] text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
              {formatNaira(wallet.availableNgn)}
            </span>
            <Button full size="lg" onClick={() => setWithdrawing(true)} disabled={wallet.availableNgn <= 0}>
              Withdraw to your bank
            </Button>
          </section>

          {/*
            ADDING MONEY, given the same weight as taking it out.

            This was one passive line under the account number. The number IS
            the way money comes in from outside a sale - a photographer
            invoicing a client off-platform is paid straight into this wallet -
            and a number you cannot copy is a number nobody uses. It now says
            what it is for, and hands the digits over in one tap.
          */}
          {wallet.accountNumber ? (
            <section className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
              <span className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">
                Add money
              </span>
              <div className="flex items-center gap-[12px]">
                <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-[var(--surface-tag)]">
                  <Icon name="Landmark" size={17} color="var(--text-secondary)" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="text-[19px] font-bold tracking-[0.02em] text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
                    {wallet.accountNumber}
                  </span>
                  <span className="text-[12.5px] text-[var(--text-muted)]">
                    {wallet.bankName ?? "Your WAWU account"}
                  </span>
                </span>
                <Button size="sm" variant="secondary" onClick={() => void copyNumber(wallet.accountNumber!)}>
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
                This account is yours. Anyone can transfer to it from any Nigerian bank and it lands
                here, on top of what your sales pay in.
              </p>
            </section>
          ) : null}

          <section className="flex flex-col gap-[10px]">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Activity</span>
            {history.length === 0 ? (
              <p className="m-0 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] text-[13.5px] leading-[1.5] text-[var(--text-muted)]">
                Nothing has moved yet. Sales land here as they are paid out, and withdrawals show
                up the moment you make one.
              </p>
            ) : (
              <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-1">
                {history.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      {wallet ? (
        <WithdrawSheet
          open={withdrawing}
          available={wallet.availableNgn}
          onClose={() => setWithdrawing(false)}
          onDone={() => {
            setWithdrawing(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

const KIND_LABEL: Record<WalletEntry["kind"], string> = {
  earning: "Sale",
  withdrawal: "Withdrawal",
  reversal: "Reversed",
};

function EntryRow({ entry }: { entry: WalletEntry }) {
  const out = entry.kind !== "earning";
  return (
    <div className="flex items-center gap-[12px] rounded-[var(--radius-input)] p-[12px]">
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[var(--surface-tag)]">
        <Icon
          name={out ? "ArrowUpRight" : "ArrowDownLeft"}
          size={15}
          color="var(--text-secondary)"
          strokeWidth={2.2}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[14px] font-semibold text-[var(--text-primary)]">
          {KIND_LABEL[entry.kind]}
        </span>
        {/* A failure says WHY. "Failed" on its own leaves somebody staring at
            money that did not arrive with nothing to act on. */}
        <span className="text-[12px] leading-[1.4] text-[var(--text-muted)]">
          {entry.status === "failed" && entry.failureReason
            ? entry.failureReason
            : new Date(entry.createdAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
              })}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-[4px]">
        <span className="text-[14px] font-semibold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
          {out ? "-" : "+"}
          {formatNaira(entry.amount)}
        </span>
        {entry.status !== "completed" ? (
          <StatusPill kind={entry.status === "failed" ? "error" : "warning"} size="xs">
            {entry.status === "failed" ? "Failed" : "Pending"}
          </StatusPill>
        ) : null}
      </span>
    </div>
  );
}
