import type { ContentItem } from "@/types/content";

/**
 * Placeholder data only. Delete once the backend exposes /api/hub/content.
 * Never import mocks directly into a component — go through the domain module.
 */
export const MOCK_FEED: ContentItem[] = [
  {
    id: "c_001",
    contentType: "video",
    title: "Pricing for market stalls",
    description: "How to price when your competitor is three stalls away.",
    thumbnailUrl: null,
    creator: {
      wawuId: "u_adaeze",
      name: "Adaeze Okonkwo",
      avatarUrl: null,
      verified: true,
      tier: "pro",
    },
    accessType: "paid",
    price: 2500,
    previewAssetUrl: null,
    fullAssetUrl: null,
    fullAssetLocked: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c_002",
    contentType: "pdf",
    title: "The trader's playbook",
    description: "A working guide to importing at small scale.",
    thumbnailUrl: null,
    creator: {
      wawuId: "u_musa",
      name: "Musa Danladi",
      avatarUrl: null,
      verified: true,
      tier: "basic",
    },
    accessType: "free",
    price: 0,
    previewAssetUrl: null,
    fullAssetUrl: null,
    fullAssetLocked: false,
    createdAt: new Date().toISOString(),
  },
];
