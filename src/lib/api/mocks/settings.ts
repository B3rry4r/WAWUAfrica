import type { NotificationSettings, SavedItem, SavedItemKind } from "@/types/settings";
import type { ContentType } from "@/types/content";
import { CONTENT_TYPE_META } from "@/types/content";
import { mockContentById } from "./mockContent";
import { delay } from "../client";

/**
 * Maps a content type to the /saved filter pill it belongs to (design:
 * "WAWU Settings States" frame 5 — All / Content / Guides / Products).
 * video/course/audio are the media the app streams; pdf is written material
 * to learn from ("Guides"); template/image are downloadable deliverables
 * ("Products").
 */
function kindForContentType(type: ContentType): SavedItemKind {
  if (type === "pdf") return "guide";
  if (type === "template" || type === "image") return "product";
  return "content";
}

/** Saved-at labels, oldest last — purely presentational, not derived from real timestamps. */
const SAVED_AT_BY_ID: Record<string, string> = {
  "pricing-for-market-stalls": "2 hours ago",
  "ankara-pattern-drafting": "Yesterday",
  "welding-rebar": "2 days ago",
  "highlife-horn-stems": "3 days ago",
  "invoice-pack-for-tailors": "5 days ago",
  "cac-in-7-days": "Last week",
  "the-traders-playbook": "Last week",
  "dry-season-poultry": "Last month",
  "nsukka-market-in-oils": "Last month",
  "simple-bookkeeping": "Last month",
};

// SEAM: replace with GET /api/hub/saved
export const MOCK_SAVED_ITEMS: SavedItem[] = Object.keys(SAVED_AT_BY_ID)
  .map((id) => {
    const found = mockContentById(id);
    if (!found) return null;
    const { content } = found;
    const item: SavedItem = {
      id: `sv-${content.id}`,
      title: content.title,
      kindLabel: CONTENT_TYPE_META[content.contentType].label,
      creator: content.creator.fullName,
      savedAt: SAVED_AT_BY_ID[id],
      kind: kindForContentType(content.contentType),
      content,
    };
    return item;
  })
  .filter((item): item is SavedItem => item !== null);

export const MOCK_NOTIFICATION_SETTINGS: NotificationSettings = {
  newReplies: true,
  newFollowers: true,
  dmReminders: true,
  refunds: true,
  promotions: false,
  communityDigest: false,
};

// SEAM: replace with GET /api/hub/saved
export async function getMockSavedItems(): Promise<SavedItem[]> {
  await delay(280);
  return MOCK_SAVED_ITEMS;
}

// SEAM: replace with GET /api/hub/notifications/settings
export async function getMockNotificationSettings(): Promise<NotificationSettings> {
  await delay(250);
  return { ...MOCK_NOTIFICATION_SETTINGS };
}

// SEAM: replace with PUT /api/hub/notifications/settings
export async function saveMockNotificationSettings(next: NotificationSettings): Promise<NotificationSettings> {
  await delay(250);
  Object.assign(MOCK_NOTIFICATION_SETTINGS, next);
  return { ...MOCK_NOTIFICATION_SETTINGS };
}

// SEAM: replace with DELETE /api/hub/account
export async function deleteMockAccount(): Promise<boolean> {
  await delay(500);
  return true;
}