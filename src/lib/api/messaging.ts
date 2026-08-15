import type { MessagingState, ResponseStats, PenaltyKind } from "@/types/messaging";
import { mockRequest } from "./client";

export const currentMessaging: MessagingState = {
  threads: [
    {
      id: "t1",
      buyerName: "Ada",
      buyerInitials: "A",
      preview: "Is your stall pricing guide still available?",
      price: 300,
      opened: true,
      expiresAt: "in 18h 20m",
    },
    {
      id: "t2",
      buyerName: "Musa",
      buyerInitials: "M",
      preview: "I bought the playbook yesterday — quick question.",
      price: 300,
      opened: false,
    },
    {
      id: "t3",
      buyerName: "Tobi",
      buyerInitials: "T",
      preview: "Can I resell your PDF to my group?",
      price: 300,
      opened: false,
    },
  ],
  responseStats: { responded: 14, total: 18, rate: 22 },
  penalty: "warned",
};

export interface MessagingApi {
  getState: () => Promise<MessagingState>;
  getStats: () => Promise<ResponseStats>;
  getPenalty: () => Promise<PenaltyKind>;
}

export const messagingApi: MessagingApi = {
  getState: () => mockRequest({ ...currentMessaging, threads: [...currentMessaging.threads] }),
  getStats: () => mockRequest({ ...currentMessaging.responseStats }),
  getPenalty: () => mockRequest(currentMessaging.penalty),
};
