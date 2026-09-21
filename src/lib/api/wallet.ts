import { apiFetch, ApiError } from "@/lib/api/client";
import type { components, operations } from "@/types/api.generated";

/**
 * A creator's wallet: an account at Flutterwave MFB in their own name.
 *
 * WAWU DOES NOT HOLD THIS MONEY. The account is the creator's own, opened in
 * their name under Flutterwave's banking licence, and WAWU only ever
 * instructs movements on it. That is why every figure below comes from the
 * server, which asks Flutterwave: a balance this app worked out for itself
 * can disagree with the one the bank will actually pay, and the creator would
 * believe ours.
 *
 * SHAPES ARE NOT TYPED BY HAND. Every type here is the generated contract
 * (`src/types/api.generated.ts`, produced from the backend's own OpenAPI), so
 * a field the API renames cannot quietly keep compiling here.
 */
type JsonOf<K extends keyof operations, S extends number> = operations[K] extends {
  responses: Record<S, { content: { "application/json": infer T } }>;
}
  ? T
  : never;

export type Wallet = JsonOf<"WalletController_get", 200>;
export type WalletEntry = JsonOf<"WalletController_history", 200>[number];
export type WalletEntryKind = WalletEntry["kind"];
export type WalletEntryStatus = WalletEntry["status"];
export type Bank = components["schemas"]["Bank"];
export type ResolvedAccount = JsonOf<"WalletController_resolve", 201>;
export type WithdrawalReceipt = JsonOf<"WalletController_withdraw", 201>;

/**
 * Thrown when this account has no wallet and cannot have one yet: a buyer
 * account looking at a creator's screen. A distinct type so the screen can
 * show what would make them eligible rather than an error, which is what it
 * would otherwise look like.
 */
export class WalletNotReadyError extends Error {}

export async function getWallet(): Promise<Wallet> {
  try {
    return await apiFetch<Wallet>("/api/hub/wallet", { authed: true });
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) {
      throw new WalletNotReadyError(e.serverMessage ?? e.message);
    }
    throw e;
  }
}

export function getWalletHistory(): Promise<WalletEntry[]> {
  return apiFetch<WalletEntry[]>("/api/hub/wallet/history", { authed: true });
}

export function getBanks(): Promise<Bank[]> {
  return apiFetch<Bank[]>("/api/hub/wallet/banks", { authed: true });
}

/**
 * Whose account this is, checked with the bank before any money is sent.
 *
 * A POST rather than a GET on purpose: an account number in a URL ends up in
 * proxy logs and browser history, and this one is about to be paid.
 */
export function resolveAccount(
  bankCode: string,
  accountNumber: string,
): Promise<ResolvedAccount> {
  return apiFetch("/api/hub/wallet/resolve-account", {
    method: "POST",
    authed: true,
    body: { bankCode, accountNumber },
  });
}

export function withdraw(
  input: components["schemas"]["WithdrawDto"],
): Promise<WithdrawalReceipt> {
  return apiFetch("/api/hub/wallet/withdraw", {
    method: "POST",
    authed: true,
    body: input,
  });
}
