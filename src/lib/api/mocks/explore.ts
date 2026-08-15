import type { ExploreCategoryId, Shop } from "@/types/explore";
import { EXPLORE_CATEGORIES } from "@/types/explore";
import { delay } from "../client";
import { MOCK_PROFILE_FOLLOWING, toggleMockProfileFollow } from "./profile";

export const MOCK_SHOPS: Shop[] = [
  { id: "basket", name: "WAWUBasket", tagline: "Fashion, food, art", stat: "4,120 items", icon: "ShoppingBag" },
  { id: "beauty", name: "WAWUBeauty", tagline: "Hair, nails, skin", stat: "890 services", icon: "Scissors" },
];

const creators = [
  {
    wawuId: "wawu-adaeze",
    name: "Adaeze Okonkwo",
    field: "Business Strategist",
    pieceCount: 4,
    verification: "certified_professional" as const,
    following: false,
  },
  {
    wawuId: "wawu-funmi",
    name: "Funmi Adeyemi",
    field: "Accountant",
    pieceCount: 6,
    verification: "certified_professional" as const,
    following: false,
  },
  {
    wawuId: "wawu-zainab",
    name: "Zainab Bello",
    field: "Agribusiness Trainer",
    pieceCount: 3,
    verification: "verified_business" as const,
    following: true,
  },
  {
    wawuId: "wawu-musa",
    name: "Musa Danladi",
    field: "Welder and trainer",
    pieceCount: 3,
    following: false,
  },
  {
    wawuId: "wawu-ifeanyi",
    name: "Ifeanyi Nwosu",
    field: "Fashion Designer",
    pieceCount: 5,
    verification: "verified_business" as const,
    following: false,
  },
];

export async function getMockCategories(): Promise<typeof EXPLORE_CATEGORIES> {
  await delay(250);
  return EXPLORE_CATEGORIES;
}

export async function getMockCreators(category?: ExploreCategoryId): Promise<typeof creators> {
  await delay(400);
  return creators.map((c) => ({ ...c, following: MOCK_PROFILE_FOLLOWING.has(c.wawuId) }));
}

export async function toggleMockFollow(wawuId: string): Promise<boolean> {
  return toggleMockProfileFollow(wawuId);
}