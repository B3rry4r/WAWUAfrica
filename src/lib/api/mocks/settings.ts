import type { NotificationSettings, SavedItem } from "@/types/settings";
import { delay } from "../client";

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

export async function getMockSavedItems(): Promise<SavedItem[]> {
  await delay(280);
  return MOCK_SAVED_ITEMS;
}

export async function getMockNotificationSettings(): Promise<NotificationSettings> {
  await delay(250);
  return { ...MOCK_NOTIFICATION_SETTINGS };
}

export async function saveMockNotificationSettings(next: NotificationSettings): Promise<NotificationSettings> {
  await delay(250);
  Object.assign(MOCK_NOTIFICATION_SETTINGS, next);
  return { ...MOCK_NOTIFICATION_SETTINGS };
}

export async function deleteMockAccount(): Promise<boolean> {
  await delay(500);
  return true;
}