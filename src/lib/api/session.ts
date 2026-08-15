import type { AccountType } from "@/types/account";
import type { SessionUser } from "@/types/session";
import { getMockCurrentUser, setMockAccountType } from "./mocks/session";

/** Session domain — WAWU ID issues the token and owns core profile fields. */
export async function fetchCurrentUser(): Promise<SessionUser> {
  // Target: GET /api/hub/me (mocked until the API is live)
  return getMockCurrentUser();
}

export async function switchAccountType(type: AccountType): Promise<SessionUser> {
  return setMockAccountType(type);
}