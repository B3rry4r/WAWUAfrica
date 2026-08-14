"use client";
import { createContext, useContext } from "react";
import type { AccountType, CreatorTier, KycStatus, VerificationLevel } from "@/types/account";

export interface Session {
  wawuId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  accountType: AccountType;
  verification: VerificationLevel;
  /** Creator-only. Null for user accounts. */
  tier: CreatorTier | null;
  /** Creator-only. Subscription unlocks uploading. */
  subscriptionActive: boolean;
  /** Creator-only. KYC unlocks receiving earnings — independent of subscription. */
  kycStatus: KycStatus;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session | null {
  return useContext(SessionContext);
}

export function useIsCreator(): boolean {
  return useSession()?.accountType === "creator";
}

/**
 * The two creator gates are independent. A creator who has paid but whose KYC is
 * still pending CAN upload and sell — they just cannot be paid out yet. That
 * in-between state is normal, not an edge case.
 */
export function useCreatorGates() {
  const s = useSession();
  return {
    canUpload: s?.accountType === "creator" && s.subscriptionActive,
    canEarn: s?.accountType === "creator" && s.kycStatus === "approved",
    kycStatus: s?.kycStatus ?? "not_started",
  };
}
