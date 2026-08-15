import { cookies } from "next/headers";
import type { AccountType } from "@/types/account";
import { ACCOUNT_TYPE_COOKIE as COOKIE } from "@/lib/auth/constants";

/** Server-side read. Account type drives the locked bottom-nav slot 3. */
export async function getAccountType(): Promise<AccountType> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  return value === "user" ? "user" : "creator";
}

export const ACCOUNT_TYPE_COOKIE = COOKIE;
