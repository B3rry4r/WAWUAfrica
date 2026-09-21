import type { CreatorProfile } from "@/types/profile";
import { getMockCreators } from "./explore";
import { delay } from "../client";

/**
 * A visited creator's profile, for the fixture build.
 *
 * WHY THIS EXISTS. `getCreatorProfile` was live-only, so in a fixture build
 * every visited profile rendered "Profile not found: running in mock mode".
 * Build brief C2 is explicit that the profile is ONE template for the owner
 * and every visitor, and the visitor half is the one that sells anything -
 * yet it could not be opened, let alone reviewed against the reference,
 * without production credentials.
 *
 * Built from the explore creator fixtures, so the person you tap on Explore
 * is the person whose profile opens, with the same name, handle, photograph
 * and field. A fixture set that disagrees with itself is worse than none.
 *
 * Reached ONLY through the mock-mode fallback, gated on NEXT_PUBLIC_USE_MOCKS
 * or an unset API base.
 */
const BIOS: Record<string, string> = {
  "wawu-adaeze":
    "I help small businesses get their paperwork right, from registration to their first filing. Fifteen years of it, mostly for people who were told it would be complicated.",
  "wawu-funmi":
    "Bookkeeping and tax for traders and small shops. If you can keep a notebook, you can keep books.",
  "wawu-zainab":
    "Training farmers on the business side of agriculture: pricing, storage, and what to do with a surplus.",
  "wawu-musa":
    "Welding, fabrication and teaching both. Everything I know came from a workshop, not a classroom.",
  "wawu-ifeanyi":
    "Pattern drafting and ready-to-wear. I teach the cutting, not just the sewing.",
};

const LOCATIONS: Record<string, string> = {
  "wawu-adaeze": "Lagos, Nigeria",
  "wawu-funmi": "Ibadan, Nigeria",
  "wawu-zainab": "Kano, Nigeria",
  "wawu-musa": "Jos, Nigeria",
  "wawu-ifeanyi": "Enugu, Nigeria",
};

// SEAM: replace with GET /api/hub/users/:wawuId/public-profile
export async function getMockCreatorProfile(wawuId: string): Promise<CreatorProfile> {
  const creators = await getMockCreators();
  const c = creators.find((x) => x.wawuId === wawuId);
  if (!c) throw new Error("This profile doesn't exist or was removed.");

  const { libraryItems } = await import("../creator-content");
  const { CONTENT_TYPE_META } = await import("@/types/content");

  return {
    wawuId: c.wawuId,
    name: c.name,
    handle: c.handle ?? "",
    bio: BIOS[c.wawuId] ?? "",
    verification: c.verification,
    plan: "basic",
    stats: {
      followers: "2.4k",
      piecesLabel: "Pieces",
      pieces: c.pieceCount,
      evg: 640,
    },
    dmEnabled: true,
    dmPrice: 300,
    dmResponseHours: 24,
    categories: [c.field].filter(Boolean),
    avatarUrl: c.avatarUrl,
    // The portrait doubles as the cover in fixtures. Uploading a separate
    // cover is a real, separate act, and inventing a second photograph for
    // every fixture creator would say more than the fixtures know.
    coverUrl: c.avatarUrl,
    socials: { instagram: c.handle ?? undefined, website: undefined },
    experience: [],
    content: libraryItems
      .filter((i) => i.status !== "rejected")
      .map((i) => ({
        id: i.id,
        title: i.title,
        kindLabel: CONTENT_TYPE_META[i.type].label,
        price: i.price,
        locked: i.price > 0,
        previewAssetUrl: i.previewAssetUrl,
      })),
    communities: [],
    products: [],
  };
}

export async function mockCreatorProfile(wawuId: string): Promise<CreatorProfile> {
  const p = await getMockCreatorProfile(wawuId);
  await delay(220);
  return p;
}
