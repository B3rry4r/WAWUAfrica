import { apiFetch, ApiError } from "@/lib/api/client";

/**
 * A creator's wallet: an account at Flutterwave MFB in their own name.
 *
 * Every figure here comes from the server, which asks Flutterwave. Nothing is
 * summed client-side, because a balance the app worked out itself can disagree
 * with the one the bank will actually pay out.
 */
export interface Wallet {
  accountReference: string;
  /** Their own account number. Anyone can pay into it directly. */
  accountNumber: string | null;
  bankName: string | null;
  availableNgn: number;
  status: string;
  createdAt: string;
}

export type WalletEntryKind = "earning" | "withdrawal" | "reversal";
export type WalletEntryStatus = "pending" | "completed" | "failed";

export interface WalletEntry {
  id: string;
  kind: WalletEntryKind;
  amount: number;
  status: WalletEntryStatus;
  reference: string;
  failureReason: string | null;
  createdAt: string;
  settledAt: string | null;
}

export interface Bank {
  code: string;
  name: string;
}

/**
 * Thrown when the account has no wallet yet because identity is unverified.
 * A distinct type so the screen can show the "verify first" state rather than
 * an error, which is what it actually is.
 */
export class WalletNotReadyError extends Error {}

export async function getWallet(): Promise<Wallet> {
  try {
    return await apiFetch<Wallet>("/api/hub/wallet", { authed: true });
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) {
      throw new WalletNotReadyError(e.message);
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
export function resolveAccount(bankCode: string, accountNumber: string): Promise<{
  accountNumber: string;
  accountName: string;
}> {
  return apiFetch("/api/hub/wallet/resolve-account", {
    method: "POST",
    authed: true,
    body: { bankCode, accountNumber },
  });
}

export function withdraw(input: {
  amount: number;
  bankCode: string;
  accountNumber: string;
}): Promise<{ reference: string; amount: number; accountName: string; status: string }> {
  return apiFetch("/api/hub/wallet/withdraw", {
    method: "POST",
    authed: true,
    body: input,
  });
}
