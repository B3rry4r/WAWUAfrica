import type { ExploreCategoryId } from "@/types/explore";
import { EXPLORE_CATEGORIES } from "@/types/explore";
import { delay } from "../client";
import { MOCK_PROFILE_FOLLOWING, toggleMockProfileFollow } from "./profile";

/*
  FIXTURE PHOTOGRAPHS.

  A creator card IS a photograph with a name on it, so with every fixture
  creator carrying `avatarUrl: null` a fixture build showed five coloured
  circles with a letter in them, and the card could not be judged against the
  reference at all.

  public/mock/creators holds real photographs (Lorem Picsum, which serves
  Unsplash images under the Unsplash licence) so the layout can be reviewed as
  it will actually look. They are stock, not anybody's WAWU account.

  Reached ONLY through the mock-mode fallback, which is gated on
  NEXT_PUBLIC_USE_MOCKS or an unset API base. A configured build never sees
  them; a real deployment with no creators renders Explore's empty state
  instead, which is the point of having one.
*/

const creators = [
  {
    wawuId: "wawu-adaeze",
    name: "Adaeze Okonkwo",
    handle: "adaezeokonkwo",
    avatarUrl: "/mock/creators/p1.jpg",
    field: "Business Strategist",
    pieceCount: 4,
    verification: "certified_professional" as const,
    following: false,
    category: "business_entrepreneurship" as ExploreCategoryId,
  },
  {
    wawuId: "wawu-funmi",
    name: "Funmi Adeyemi",
    handle: "funmiadeyemi",
    avatarUrl: "/mock/creators/p2.jpg",
    field: "Accountant",
    pieceCount: 6,
    verification: "certified_professional" as const,
    following: false,
    category: "finance" as ExploreCategoryId,
  },
  {
    wawuId: "wawu-zainab",
    name: "Zainab Bello",
    handle: "zainabbello",
    avatarUrl: "/mock/creators/p3.jpg",
    field: "Agribusiness Trainer",
    pieceCount: 3,
    verification: "verified_business" as const,
    following: true,
    category: "agriculture_food" as ExploreCategoryId,
  },
  {
    wawuId: "wawu-musa",
    name: "Musa Danladi",
    handle: "musadanladi",
    avatarUrl: "/mock/creators/p4.jpg",
    field: "Welder and trainer",
    pieceCount: 3,
    following: false,
    category: "trade_commerce" as ExploreCategoryId,
  },
  {
    wawuId: "wawu-ifeanyi",
    name: "Ifeanyi Nwosu",
    handle: "ifeanyinwosu",
    avatarUrl: "/mock/creators/p5.jpg",
    field: "Fashion Designer",
    pieceCount: 5,
    verification: "verified_business" as const,
    following: false,
    category: "entertainment_creative" as ExploreCategoryId,
  },
];

// SEAM: replace with GET /api/hub/explore/categories
export async function getMockCategories(): Promise<typeof EXPLORE_CATEGORIES> {
  await delay(250);
  return EXPLORE_CATEGORIES;
}

// SEAM: replace with GET /api/hub/explore/creators
export async function getMockCreators(category?: ExploreCategoryId): Promise<typeof creators> {
  await delay(400);
  return creators
    .filter((c) => !category || c.category === category)
    .map((c) => ({ ...c, following: MOCK_PROFILE_FOLLOWING.has(c.wawuId) }));
}

// SEAM: replace with POST /api/hub/creators/:wawuId/follow
export async function toggleMockFollow(wawuId: string): Promise<boolean> {
  return toggleMockProfileFollow(wawuId);
}