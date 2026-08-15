import { cookies } from "next/headers";
import type { AccountType } from "@/types/account";
import { ACCOUNT_TYPE_COOKIE } from "./constants";

/** Server-side read. Account type drives the locked bottom-nav slot 3. */
export async function getAccountType(): Promise<AccountType> {
  const store = await cookies();
  return store.get(ACCOUNT_TYPE_COOKIE)?.value === "creator" ? "creator" : "user";
}
