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

export async function getCreditsState(): Promise<CreditsState> {
  return getMockCreditsState();
}

export async function getCommunities(kind: "joined" | "discover"): Promise<Community[]> {
  return getMockCommunities(kind);
}

export async function getCommunity(id: string): Promise<Community | null> {
  return getMockCommunity(id);
}

export async function getCommunityMessages(id: string): Promise<CommunityMessage[]> {
  return getMockCommunityMessages(id);
}

export async function sendCommunityMessage(id: string, text: string): Promise<CommunityMessage> {
  return sendMockCommunityMessage(id, text);
}

export async function joinCommunity(id: string): Promise<boolean> {
  return joinMockCommunity(id);
}

export async function topUpCredits(pack: CreditPackId): Promise<number> {
  return topUpMockCredits(pack);
}