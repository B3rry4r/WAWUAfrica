import type { ContentPiece } from "./content";

/** A row in the Settings hub. */
export interface SettingsGroup {
  id: string;
  title: string;
  rows: { title: string; subtitle?: string; icon: string; href?: string; danger?: boolean }[];
}

/**
 * Which /saved filter pill an item belongs to (design: "WAWU Settings States"
 * frame 5 — All / Content / Guides / Products).
 */
export type SavedItemKind = "content" | "guide" | "product";

export interface SavedItem {
  id: string;
  title: string;
  kindLabel: string;
  creator: string;
  savedAt: string;
  /** Wave 4 addition — drives the filter pill row on /saved. */
  kind: SavedItemKind;
  /**
   * Wave 4 addition — the real content piece, so /saved can render the
   * canonical ContentCard (lock state, price chip, type badge) instead of a
   * plain text row. Never carries `fullAssetUrl` for locked pieces.
   */
  content: ContentPiece;
}

export interface NotificationSettings {
  newReplies: boolean;
  newFollowers: boolean;
  dmReminders: boolean;
  refunds: boolean;
  promotions: boolean;
  communityDigest: boolean;
}