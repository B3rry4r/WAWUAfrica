import type { Community, CommunityMessage, CreditPackId, CreditsState } from "@/types/credits";
import {
  getMockCommunities,
  getMockCommunity,
  getMockCommunityMessages,
  getMockCreditsState,
  joinMockCommunity,
  sendMockCommunityMessage,
  topUpMockCredits,
} from "./mocks/communities";

// SEAM: replace with GET /api/hub/credits
export async function getCreditsState(): Promise<CreditsState> {
  return getMockCreditsState();
}

// SEAM: replace with GET /api/hub/communities
export async function getCommunities(kind: "joined" | "discover"): Promise<Community[]> {
  return getMockCommunities(kind);
}

// SEAM: replace with GET /api/hub/communities/:id
export async function getCommunity(id: string): Promise<Community | null> {
  return getMockCommunity(id);
}

// SEAM: replace with GET /api/hub/communities/:id/messages
export async function getCommunityMessages(id: string): Promise<CommunityMessage[]> {
  return getMockCommunityMessages(id);
}

// SEAM: replace with POST /api/hub/communities/:id/messages
export async function sendCommunityMessage(id: string, text: string): Promise<CommunityMessage> {
  return sendMockCommunityMessage(id, text);
}

// SEAM: replace with POST /api/hub/communities/:id/join
export async function joinCommunity(id: string): Promise<boolean> {
  return joinMockCommunity(id);
}

// SEAM: replace with POST /api/hub/credits/purchase
export async function topUpCredits(pack: CreditPackId): Promise<number> {
  return topUpMockCredits(pack);
}