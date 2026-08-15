import { cookies } from "next/headers";
import type { AccountType } from "@/types/account";
import { ACCOUNT_TYPE_COOKIE as COOKIE } from "@/lib/auth/constants";

/**
 * Server-side read. Account type drives the locked bottom-nav slot 3
 * (Explore for users, Create for creators).
 *
 * Defaults to "user" — creator is opt-in, reached by paying for a tier.
 */
export async function getAccountType(): Promise<AccountType> {
  const store = await cookies();
  return store.get(COOKIE)?.value === "creator" ? "creator" : "user";
}

export const ACCOUNT_TYPE_COOKIE = COOKIE;
