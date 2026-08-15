import type { CreatorProfile } from "@/types/profile";
import {
  getMockCreatorProfile,
  getMockProfileFollowing,
  isMockCommunityJoined,
  toggleMockCommunityJoin,
  toggleMockProfileFollow,
} from "./mocks/profile";

export async function getCreatorProfile(wawuId: string): Promise<CreatorProfile> {
  return getMockCreatorProfile(wawuId);
}

export async function isFollowing(wawuId: string): Promise<boolean> {
  return getMockProfileFollowing(wawuId);
}

export async function toggleFollowProfile(wawuId: string): Promise<boolean> {
  return toggleMockProfileFollow(wawuId);
}

export async function isCommunityJoined(wawuId: string, communityId: string): Promise<boolean> {
  return isMockCommunityJoined(wawuId, communityId);
}

export async function toggleCommunityJoin(wawuId: string, communityId: string): Promise<boolean> {
  return toggleMockCommunityJoin(wawuId, communityId);
}