import type { AccountType } from "@/types/account";
import type { SessionUser } from "@/types/session";
import { delay } from "../client";

/**
 * Mock signed-in user. Creator account by default so both nav states are
 * exercisable — the session provider can switch account type for development.
 */
export const MOCK_USER: SessionUser = {
  wawuId: "wawu-me",
  name: "Amara Okafor",
  handle: "amara",
  email: "amara@example.com",
  accountType: "creator",
  verification: "verified_user",
  creatorTier: "basic",
  kycStatus: "pending",
  credits: 48,
};

export async function getMockCurrentUser(): Promise<SessionUser> {
  await delay(250);
  return { ...MOCK_USER };
}

/** Dev/testing toggle — swaps the account type without a full auth flow. */
export async function setMockAccountType(type: AccountType): Promise<SessionUser> {
  await delay(120);
  MOCK_USER.accountType = type;
  return { ...MOCK_USER };
}