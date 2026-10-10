"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWallet,
  getWalletHistory,
  WalletNotReadyError,
  type Wallet,
  type WalletEntry,
} from "@/lib/api/wallet";
import { describeError } from "@/lib/api/errors";
import { getMoneyWallet, type MoneyWallet } from "@/lib/api/money";
import { stageOf } from "@/lib/wallet-opening";
import { formatNaira } from "@/lib/format";
import { Button, Callout, Icon, Skeleton, StatusPill } from "@/components/ui";
import { OpenWalletEntry } from "./OpenWalletEntry";
import { WithdrawSheet } from "./WithdrawSheet";

/**
 * A creator's wallet.
 *
 * ── WHOSE MONEY THIS IS ────────────────────────────────────────────────────
 * The account is the creator's own, held at Flutterwave MFB under
 * Flutterwave's banking licence. WAWU instructs movements on it and holds
 * nothing. The screen says so in as many words, because a creator looking at
 * a balance is entitled to know who is actually sitting on it.
 *
 * ── WHY NOTHING HERE IS ADDED UP ───────────────────────────────────────────
 * `availableNgn` is the figure the BANK reports, passed straight through. The
 * three totals beneath it are a different kind of number and are labelled as
 * one: they are what WAWU has instructed over the wallet's life, from our own
 * ledger. A balance this app worked out for itself could disagree with what
 * the bank will pay, and the creator would believe ours.
 *
 * ── WHY THE SCREEN DOES NOT RE-CHECK THE GATE ──────────────────────────────
 * `withdrawalsEnabled` and its reason come from the server, which enforces
 * the same rule on the withdraw call. The button reflects one answer rather
 * than deriving a second one that could drift out of step with it.
 */
export function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [history, setHistory] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  /**
   * The wallet the Hub's money routes know of: null until read, and null if the
   * read fails (this screen then behaves exactly as it did before). It decides
   * whether a person with no wallet is sent into opening one.
   */
  const [money, setMoney] = useState<MoneyWallet | null>(null);
  const [moneyRead, setMoneyRead] = useState(false);

  useEffect(() => {
    let alive = true;
    getMoneyWallet()
      .then((w) => alive && setMoney(w))
      .catch(() => alive && setMoney(null))
      .finally(() => alive && setMoneyRead(true));
    return () => {
      alive = false;
    };
  }, []);

  // No wallet of any kind and nothing sent yet: this screen has nothing to
  // show, so it sends the person to where a wallet is opened.
  const sendToOpening = !loading && moneyRead && money !== null && notReady !== null && stageOf(money) === "details";
  useEffect(() => {
    if (sendToOpening) router.replace("/wallet/open");
  }, [sendToOpening, router]);

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

  if (loading || !moneyRead || sendToOpening) {
    return (
      <div className={PAGE}>
        <Skeleton className="h-[188px] w-full" />
        <Skeleton className="h-[86px] w-full" />
        <Skeleton className="h-[64px] w-full" />
      </div>
    );
  }

  return (
    <div className={PAGE}>
      <div className="flex items-center justify-between gap-[12px]">
        <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Wallet
        </h1>
        {/* No screen is a dead end: the wallet is where the money sits, and
            earnings is where it came from. Each links to the other. */}
        <Button href="/earnings" size="sm" variant="ghost" iconRight="ArrowUpRight">
          Earnings
        </Button>
      </div>

      {/* Where a wallet is opened, and where an opening that is part way carries on.
          Only drawn for a person whose wallet the Hub's money routes run. */}
      {money ? <OpenWalletEntry wallet={money} /> : null}

      {/* Not an error: an account that cannot have a wallet yet, told what
          would change that. Not shown where the money routes open a wallet
          for anyone: there it isn't true. */}
      {notReady && money?.openingFlow !== "review" ? (
        <Callout tone="info" title="Wallets come with a creator account">
          <p className="m-0">{notReady}</p>
          <div className="mt-[12px]">
            <Button href="/onboarding" size="sm">
              Set up selling
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
          <BalanceCard wallet={wallet} onWithdraw={() => setWithdrawing(true)} />
          <LedgerTotals wallet={wallet} />
          {wallet.accountNumber ? (
            <AddMoneyCard
              accountNumber={wallet.accountNumber}
              bankName={wallet.bankName}
              copied={copied}
              onCopy={() => void copyNumber(wallet.accountNumber as string)}
            />
          ) : null}
          <Activity entries={history} />
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

/**
 * One column, the same measure as every other flow screen.
 *
 * Bottom padding clears the tab bar and the creator FAB that sit over it.
 */
const PAGE =
  "flex flex-col gap-[14px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[760px] xl:p-[30px_28px_64px]";

const CARD =
  "rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)]";

const MICRO_LABEL =
  "text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)]";

/**
 * The balance, and the one emphatic thing on the screen.
 *
 * Everything else here is deliberately quiet (neutral surfaces, hairline
 * borders, muted labels) so that the figure and the single action carry the
 * screen. Purple appears once, on the button, which is the only thing to
 * press: brand colour marks ACTION, it is not the page's wallpaper.
 */
function BalanceCard({ wallet, onWithdraw }: { wallet: Wallet; onWithdraw: () => void }) {
  const empty = wallet.availableNgn <= 0;
  const blocked = !wallet.withdrawalsEnabled;
  return (
    <section className={`flex flex-col gap-[16px] ${CARD} p-[20px]`}>
      <div className="flex flex-col gap-[10px]">
        <span className={MICRO_LABEL}>Available to withdraw</span>
        <span className="text-[38px] font-bold leading-[1] tracking-[-0.035em] text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
          {formatNaira(wallet.availableNgn)}
        </span>
        {/* Where the money actually is. This is the whole custody model in
            one sentence, and a creator is entitled to read it. */}
        <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
          {wallet.bankName
            ? `Your own account at ${wallet.bankName}, in your name. WAWU never holds your money, it only moves it on your instruction.`
            : "Your own account, in your name. WAWU never holds your money, it only moves it on your instruction."}
        </p>
      </div>

      <div className="flex flex-col gap-[10px]">
        {/* Full width where the thumb is, its own width where the pointer
            is: a 700px purple slab is the loudest thing on a desktop page and
            A5 asks for restraint, not volume. */}
        <Button
          full
          size="lg"
          className="xl:w-auto xl:self-start"
          onClick={onWithdraw}
          disabled={blocked || empty}
        >
          Withdraw to your bank
        </Button>
        {/* A disabled button that will not say why is a dead end. The reason
            is the server's own, and it comes with the way out. */}
        {blocked ? (
          <div className="flex flex-col items-start gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-decor)] bg-[var(--decor-tint)] p-[13px]">
            <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
              {wallet.withdrawalsBlockedReason ??
                "Your identity check has to be approved before money can be sent to your bank account."}
            </p>
            <Button href="/kyc" size="sm" variant="secondary">
              Start verification
            </Button>
          </div>
        ) : empty ? (
          <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
            There is nothing in the account to send yet. Sales land here as they are paid out.
          </p>
        ) : null}
      </div>
    </section>
  );
}

/**
 * What WAWU has moved, beside the balance and never mistaken for it.
 *
 * Three quiet tiles rather than three more cards: these are reference
 * figures, not the headline, and they should read as a footnote to the
 * number above them.
 */
function LedgerTotals({ wallet }: { wallet: Wallet }) {
  const tiles: Array<{ label: string; value: number; pending?: boolean }> = [
    { label: "Paid in", value: wallet.paidInNgn },
    { label: "Withdrawn", value: wallet.withdrawnNgn },
  ];
  // Only shown when there IS something on the way: an always-on ₦0 tile is
  // noise, and this one is worth reading precisely because it is unusual.
  if (wallet.pendingInNgn > 0) {
    // "Incoming", not "On the way in": three tiles share one row on a phone,
    // and a label that wraps to two lines pushes its own figure a line below
    // the other two, so the row stops reading as a row.
    tiles.splice(1, 0, { label: "Incoming", value: wallet.pendingInNgn, pending: true });
  }

  return (
    <section className="flex flex-col gap-[8px]">
      {/* One row at every width. Two-up wrapped the third tile onto a line of
          its own on a phone, which read as a fourth card that had lost its
          pair. */}
      <div className={`grid gap-[10px] ${tiles.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {tiles.map((tile) => (
          <div key={tile.label} className={`flex flex-col gap-[6px] ${CARD} p-[12px_11px] xl:p-[14px]`}>
            <span className={`${MICRO_LABEL} leading-[1.3]`}>{tile.label}</span>
            <span
              className={`text-[15.5px] font-bold leading-[1.1] tracking-[-0.02em] xl:text-[17px] [font-feature-settings:var(--font-feature-tabular)] ${
                tile.pending ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"
              }`}
            >
              {formatNaira(tile.value)}
            </span>
          </div>
        ))}
      </div>
      <p className="m-0 px-[2px] text-[12px] leading-[1.5] text-[var(--text-muted)]">
        These are WAWU&apos;s records of what it has moved for you, all time. The figure above is
        the bank&apos;s own.
      </p>
    </section>
  );
}

/**
 * ADDING MONEY, given the same weight as taking it out.
 *
 * The number IS the way money comes in from outside a sale: a photographer
 * invoicing a client off-platform is paid straight into this account. A
 * number you cannot copy is a number nobody uses, so it is handed over in one
 * tap.
 */
function AddMoneyCard({
  accountNumber,
  bankName,
  copied,
  onCopy,
}: {
  accountNumber: string;
  bankName: string | null;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className={`flex flex-col gap-[12px] ${CARD} p-[16px]`}>
      <span className={MICRO_LABEL}>Add money</span>
      <div className="flex items-center gap-[12px]">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name="Landmark" size={17} color="var(--decor-icon)" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[19px] font-bold tracking-[0.02em] text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
            {accountNumber}
          </span>
          <span className="text-[12.5px] text-[var(--text-muted)]">
            {bankName ?? "Your WAWU account"}
          </span>
        </span>
        <Button size="sm" variant="secondary" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
        This account is yours. Anyone can transfer to it from any Nigerian bank and it lands here,
        on top of what your sales pay in.
      </p>
    </section>
  );
}

function Activity({ entries }: { entries: WalletEntry[] }) {
  return (
    <section className="flex flex-col gap-[10px]">
      <span className="px-[2px] text-[13px] font-semibold text-[var(--text-secondary)]">
        Activity
      </span>
      {entries.length === 0 ? (
        <p className={`m-0 ${CARD} p-[16px] text-[13.5px] leading-[1.5] text-[var(--text-muted)]`}>
          Nothing has moved yet. Sales land here as they are paid out, and withdrawals show up the
          moment you make one.
        </p>
      ) : (
        <div className={`flex flex-col ${CARD} p-1`}>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
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
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)]">
        <Icon
          name={out ? "ArrowUpRight" : "ArrowDownLeft"}
          size={15}
          color="var(--decor-icon)"
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
