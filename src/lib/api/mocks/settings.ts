import type { NotificationSettings, SavedItem } from "@/types/settings";
import { delay } from "../client";

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

export const MOCK_SAVED_ITEMS: SavedItem[] = [
  {
    id: "sv-1",
    title: "Farm paperwork made simple",
    kindLabel: "Course · 6 lessons",
    creator: "Amara Okafor",
    savedAt: "2 days ago",
  },
  {
    id: "sv-2",
    title: "Pricing for creators",
    kindLabel: "Course · 7 lessons",
    creator: "Adaeze Okonkwo",
    savedAt: "Last week",
  },
  {
    id: "sv-3",
    title: "The WAWU Business Playbook",
    kindLabel: "96 pages · PDF",
    creator: "WAWU",
    savedAt: "Last month",
  },
  {
    id: "sv-4",
    title: "Small-business books that balance",
    kindLabel: "Course · 5 lessons",
    creator: "Funmi Adeyemi",
    savedAt: "Last month",
  },
];

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