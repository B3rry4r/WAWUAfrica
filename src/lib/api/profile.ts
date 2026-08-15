import type { CreatorProfile } from "@/types/profile";
import {
  getMockCreatorProfile,
  getMockProfileFollowing,
  isMockCommunityJoined,
  toggleMockCommunityJoin,
  toggleMockProfileFollow,
} from "./mocks/profile";

// SEAM: replace with GET /api/hub/creators/:wawuId
export async function getCreatorProfile(wawuId: string): Promise<CreatorProfile> {
  return getMockCreatorProfile(wawuId);
}

// SEAM: replace with GET /api/hub/creators/:wawuId/following
export async function isFollowing(wawuId: string): Promise<boolean> {
  return getMockProfileFollowing(wawuId);
}

// SEAM: replace with POST /api/hub/creators/:wawuId/follow
export async function toggleFollowProfile(wawuId: string): Promise<boolean> {
  return toggleMockProfileFollow(wawuId);
}

// SEAM: replace with GET /api/hub/communities/:id/joined
export async function isCommunityJoined(wawuId: string, communityId: string): Promise<boolean> {
  return isMockCommunityJoined(wawuId, communityId);
}

// SEAM: replace with POST /api/hub/communities/:id/join
export async function toggleCommunityJoin(wawuId: string, communityId: string): Promise<boolean> {
  return toggleMockCommunityJoin(wawuId, communityId);
}