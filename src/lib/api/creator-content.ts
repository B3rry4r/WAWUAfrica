/**
 * Creator-side content library: what a creator has uploaded and its review
 * status. The consumer-side reading API lives in ./content.ts — these are
 * deliberately separate surfaces.
 */
import type { ContentItem } from "@/types/content";
import { ApiError, mockRequest } from "./client";
import { currentSession } from "./mocks/session";

export const libraryItems: ContentItem[] = [
  {
    id: "c1",
    type: "course",
    title: "CAC in 7 days",
    meta: "Course · ₦2,500 · 34 sold",
    price: 2500,
    status: "live",
    earned: 76500,
    activity: "34 sold",
  },
  {
    id: "c2",
    type: "video",
    title: "Pricing for market stalls",
    meta: "Video · free · 1,204 views",
    price: 0,
    status: "live",
    isFirstUpload: true,
    activity: "1,204 views",
  },
  {
    id: "c3",
    type: "pdf",
    title: "The trader's playbook",
    meta: "PDF · ₦1,500 · submitted today",
    price: 1500,
    status: "review",
  },
  {
    id: "c4",
    type: "pdf",
    title: "Market survey 2024",
    meta: "PDF",
    price: 0,
    status: "rejected",
    rejectionReason:
      "Charts were taken from another publisher. Replace them or credit the source.",
  },
];

export interface ContentApi {
  getLibrary: () => Promise<ContentItem[]>;
  getLibraryItem: (id: string) => Promise<ContentItem | undefined>;
  publish: (item: Omit<ContentItem, "id" | "status">) => Promise<ContentItem>;
}

export const contentApi: ContentApi = {
  // SEAM: replace with GET /api/hub/content/mine
  getLibrary: () => mockRequest([...libraryItems]),

  getLibraryItem: async (id) => {
    const item = libraryItems.find((i) => i.id === id);
    // SEAM: replace with GET /api/hub/content/:id
    return mockRequest(item ? { ...item } : undefined, 150);
  },

  publish: async (item) => {
    const creator = currentSession.creator;
    if (!creator) {
      throw new ApiError("Only creator accounts can publish.", 403);
    }

    const firstUpload = !libraryItems.some((i) => i.status === "live");
    if (firstUpload && item.price > 0) {
      throw new ApiError("Your first upload has to be free. Publish it free, then price everything after.", 400);
    }

    const inUse = libraryItems.filter((i) => i.status !== "rejected").length;
    if (inUse >= creator.slotsTotal) {
      throw new ApiError("All upload slots are in use. Remove a piece or upgrade to Pro to free a slot.", 409);
    }

    const created: ContentItem = { ...item, id: `c${Date.now()}`, status: "review" };
    libraryItems.unshift(created);
    creator.slotsUsed = inUse + 1;
    // SEAM: replace with POST /api/hub/content
    return mockRequest({ ...created }, 800);
  },
};
