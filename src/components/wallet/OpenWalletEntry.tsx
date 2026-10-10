import { Button, Icon } from "@/components/ui";
import type { MoneyWallet } from "@/lib/api/money";
import { entryOf, stageOf } from "@/lib/wallet-opening";
import { AccountCard } from "./open/AccountStep";

/**
 * The wallet screen's way into opening a wallet, and back into it part way.
 *
 * It says where the person stands (nothing sent, documents still to add,
 * being checked, refused, approved, PIN still to set) in the server's own
 * terms and offers the one action that continues from there. An open wallet with its PIN
 * set shows the account it has. It draws nothing for a provider that doesn't
 * open wallets on the website.
 */
export function OpenWalletEntry({ wallet }: { wallet: MoneyWallet }) {
  // An open wallet with its PIN set has nothing to finish: it shows the account it has.
  if (stageOf(wallet) === "done" && wallet.account) {
    return (
      <section aria-label="Your wallet" className="flex flex-col gap-[12px]">
        <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em]">Your wallet is open</h2>
        <AccountCard account={wallet.account} />
      </section>
    );
  }
  const entry = entryOf(wallet);
  if (!entry) return null;
  return (
    <section
      aria-label={entry.title}
      className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[20px]"
    >
      <div className="flex items-start gap-[12px]">
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name={entry.icon} size={17} color="var(--decor-icon)" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <h2 className="m-0 text-[16px] font-semibold tracking-[-0.01em]">{entry.title}</h2>
          <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">{entry.body}</p>
        </span>
      </div>
      <Button href="/wallet/open" size="lg" full className="xl:w-auto xl:self-start" iconRight="ArrowRight">
        {entry.action}
      </Button>
    </section>
  );
}
