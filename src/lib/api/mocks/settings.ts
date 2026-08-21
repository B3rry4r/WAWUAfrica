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
 * ("Products"). Exported: settings.ts's real getSavedItems() reuses this
 * same mapping when enriching real GET /users/me/saved rows.
 */
export function kindForContentType(type: ContentType): SavedItemKind {
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
  "measuring-for-tailors": "5 days ago",
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

// Local to this wave's Privacy rebuild — kept here rather than in
// @/types/settings to stay inside this task's file scope. Candidate to move
// there in a later pass for consistency with NotificationSettings/SavedItem.
export interface PrivacySettings {
  showPurchases: boolean;
  showSavedItems: boolean;
  showFollowing: boolean;
  showInMemberLists: boolean;
}

export interface BlockedAccount {
  id: string;
  name: string;
  handle: string;
  blockedAt: string;
}

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

export const MOCK_PRIVACY_SETTINGS: PrivacySettings = {
  showPurchases: false,
  showSavedItems: false,
  showFollowing: true,
  showInMemberLists: true,
};

export const MOCK_BLOCKED_ACCOUNTS: BlockedAccount[] = [
  { id: "blk-1", name: "Chinedu Eze", handle: "@chinedu.eze", blockedAt: "3 weeks ago" },
  { id: "blk-2", name: "Kelechi Uba", handle: "@kelechi.uba", blockedAt: "2 months ago" },
];

// SEAM: replace with GET /api/hub/privacy/settings
export async function getMockPrivacySettings(): Promise<PrivacySettings> {
  await delay(220);
  return { ...MOCK_PRIVACY_SETTINGS };
}

// SEAM: replace with PUT /api/hub/privacy/settings
export async function saveMockPrivacySettings(next: PrivacySettings): Promise<PrivacySettings> {
  await delay(220);
  Object.assign(MOCK_PRIVACY_SETTINGS, next);
  return { ...MOCK_PRIVACY_SETTINGS };
}

// SEAM: replace with GET /api/hub/privacy/blocked
export async function getMockBlockedAccounts(): Promise<BlockedAccount[]> {
  await delay(260);
  return [...MOCK_BLOCKED_ACCOUNTS];
}

// SEAM: replace with DELETE /api/hub/privacy/blocked/:id
export async function unblockMockAccount(id: string): Promise<boolean> {
  await delay(260);
  const idx = MOCK_BLOCKED_ACCOUNTS.findIndex((a) => a.id === id);
  if (idx >= 0) MOCK_BLOCKED_ACCOUNTS.splice(idx, 1);
  return true;
}

// SEAM: replace with POST /api/hub/privacy/export
export async function requestMockDataExport(): Promise<{ requestedAt: string }> {
  await delay(450);
  return { requestedAt: new Date().toISOString() };
}