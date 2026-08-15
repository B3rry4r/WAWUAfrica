import { mockRequest } from "./client";
import { currentSession, setAccountType, setCreatorTier, setKycStatus, setSubscriptionPaid } from "./mocks/session";
import type { Session } from "./mocks/session";
import type { AccountType, CreatorTier, KycStatus } from "@/types/account";

export interface SessionApi {
  getSession: () => Promise<Session>;
  switchAccountType: (type: AccountType) => Promise<Session>;
  setTier: (tier: CreatorTier) => Promise<Session>;
  setKyc: (status: KycStatus) => Promise<Session>;
  setPaid: (paid: boolean) => Promise<Session>;
}

export const sessionApi: SessionApi = {
  getSession: () => mockRequest({ ...currentSession, creator: currentSession.creator ? { ...currentSession.creator } : null }),

  switchAccountType: async (type) => {
    setAccountType(type);
    return sessionApi.getSession();
  },

  setTier: async (tier) => {
    setCreatorTier(tier);
    return sessionApi.getSession();
  },

  setKyc: async (status) => {
    setKycStatus(status);
    return sessionApi.getSession();
  },

  setPaid: async (paid) => {
    setSubscriptionPaid(paid);
    return sessionApi.getSession();
  },
};
