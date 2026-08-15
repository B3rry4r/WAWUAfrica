import type { NotificationSettings, SavedItem } from "@/types/settings";
import type { PrivacySettings, BlockedAccount } from "./mocks/settings";
import {
  deleteMockAccount,
  getMockNotificationSettings,
  getMockSavedItems,
  saveMockNotificationSettings,
  getMockPrivacySettings,
  saveMockPrivacySettings,
  getMockBlockedAccounts,
  unblockMockAccount,
  requestMockDataExport,
} from "./mocks/settings";
export type { PrivacySettings, BlockedAccount } from "./mocks/settings";

// SEAM: replace with GET /api/hub/saved
export async function getSavedItems(): Promise<SavedItem[]> {
  return getMockSavedItems();
}

// SEAM: replace with GET /api/hub/notifications/settings
export async function getNotificationSettings(): Promise<NotificationSettings> {
  return getMockNotificationSettings();
}

// SEAM: replace with PUT /api/hub/notifications/settings
export async function saveNotificationSettings(next: NotificationSettings): Promise<NotificationSettings> {
  return saveMockNotificationSettings(next);
}

// SEAM: replace with DELETE /api/hub/account
export async function deleteAccount(): Promise<boolean> {
  return deleteMockAccount();
}

// SEAM: replace with GET /api/hub/privacy/settings
export async function getPrivacySettings(): Promise<PrivacySettings> {
  return getMockPrivacySettings();
}

// SEAM: replace with PUT /api/hub/privacy/settings
export async function savePrivacySettings(next: PrivacySettings): Promise<PrivacySettings> {
  return saveMockPrivacySettings(next);
}

// SEAM: replace with GET /api/hub/privacy/blocked
export async function getBlockedAccounts(): Promise<BlockedAccount[]> {
  return getMockBlockedAccounts();
}

// SEAM: replace with DELETE /api/hub/privacy/blocked/:id
export async function unblockAccount(id: string): Promise<boolean> {
  return unblockMockAccount(id);
}

// SEAM: replace with POST /api/hub/privacy/export
export async function requestDataExport() {
  return requestMockDataExport();
}