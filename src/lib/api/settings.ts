import type { NotificationSettings, SavedItem } from "@/types/settings";
import {
  deleteMockAccount,
  getMockNotificationSettings,
  getMockSavedItems,
  saveMockNotificationSettings,
} from "./mocks/settings";

export async function getSavedItems(): Promise<SavedItem[]> {
  return getMockSavedItems();
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return getMockNotificationSettings();
}

export async function saveNotificationSettings(next: NotificationSettings): Promise<NotificationSettings> {
  return saveMockNotificationSettings(next);
}

export async function deleteAccount(): Promise<boolean> {
  return deleteMockAccount();
}