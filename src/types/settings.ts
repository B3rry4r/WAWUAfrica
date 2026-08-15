/** A row in the Settings hub. */
export interface SettingsGroup {
  id: string;
  title: string;
  rows: { title: string; subtitle?: string; icon: string; href?: string; danger?: boolean }[];
}

export interface SavedItem {
  id: string;
  title: string;
  kindLabel: string;
  creator: string;
  savedAt: string;
}

export interface NotificationSettings {
  newReplies: boolean;
  newFollowers: boolean;
  dmReminders: boolean;
  refunds: boolean;
  promotions: boolean;
  communityDigest: boolean;
}