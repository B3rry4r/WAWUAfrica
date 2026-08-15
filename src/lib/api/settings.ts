import type { NotificationSettings, SavedItem } from "@/types/settings";
import {
  deleteMockAccount,
  getMockNotificationSettings,
  getMockSavedItems,
  saveMockNotificationSettings,
} from "./mocks/settings";

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