import type { NotificationSettings, SavedItem } from "@/types/settings";
import { CONTENT_TYPE_META } from "@/types/content";
import type { PrivacySettings, BlockedAccount } from "./mocks/settings";
import { apiFetch, apiFetchPaginated, isMockModeError } from "./client";
import { getContent } from "./content";
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
  kindForContentType,
} from "./mocks/settings";
export type { PrivacySettings, BlockedAccount } from "./mocks/settings";

/** Real GET /users/me/saved row shape (saved-item.service.ts `list`). */
interface RealSavedItem {
  id: string;
  userWawuId: string;
  contentId: string;
  savedAt: string;
}

/**
 * GET /api/hub/users/me/saved (saved-item.controller.ts, WawuAuthGuard).
 * GAP: the real response is bare rows — {id, userWawuId, contentId,
 * savedAt} — the backend never joins in the ContentPiece (no `include` in
 * saved-item.service.ts's `list()`, confirmed by reading it). SavedItem
 * needs the full embedded ContentPiece (title, price, lock state, creator,
 * type) to render the /saved feed's cards, so each row is enriched with a
 * follow-up GET /api/hub/content/:id via content.ts's own getContent() —
 * already the canonical, lock-guard-safe way to fetch a single piece. A row
 * whose content lookup fails (e.g. the piece was since deleted) is dropped
 * rather than rendered broken. `kind` (content/guide/product filter pill) is
 * omitted from the request — the backend only ever has content-kind saves
 * (guide/product always resolve to an empty page per the DTO's own doc
 * comment), so requesting unfiltered is equivalent and simpler.
 */
export async function getSavedItems(): Promise<SavedItem[]> {
  try {
    const { data } = await apiFetchPaginated<RealSavedItem>("/api/hub/users/me/saved", { authed: true });
    const items = await Promise.all(
      data.map(async (raw): Promise<SavedItem | null> => {
        try {
          const { content } = await getContent(raw.contentId);
          return {
            id: raw.id,
            title: content.title,
            kindLabel: CONTENT_TYPE_META[content.contentType].label,
            creator: content.creator.fullName,
            savedAt: raw.savedAt,
            kind: kindForContentType(content.contentType),
            content,
          };
        } catch {
          return null;
        }
      }),
    );
    return items.filter((item): item is SavedItem => item !== null);
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/saved
    return getMockSavedItems();
  }
}

/**
 * GET /api/hub/settings/notifications (notification-settings.controller.ts,
 * WawuAuthGuard). Real row shape matches NotificationSettings field-for-
 * field, plus one extra `userWawuId` column the frontend type doesn't
 * declare (harmless — never read).
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    return await apiFetch<NotificationSettings>("/api/hub/settings/notifications", { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/notifications/settings
    return getMockNotificationSettings();
  }
}

/**
 * PATCH /api/hub/settings/notifications — UpdateNotificationSettingsDto is
 * whitelist-validated with forbidNonWhitelisted (main.ts), and the real GET
 * row carries an extra `userWawuId` column the frontend type doesn't declare
 * (see getNotificationSettings's doc comment). `next` is whatever the caller
 * has in state, which — since it originated from a GET response — often
 * still carries that extra field; spreading it straight into the PATCH body
 * used to 400 every single save. The body is rebuilt here from exactly the
 * six DTO fields so nothing outside the whitelist ever goes over the wire.
 */
export async function saveNotificationSettings(next: NotificationSettings): Promise<NotificationSettings> {
  const body: NotificationSettings = {
    newReplies: next.newReplies,
    newFollowers: next.newFollowers,
    dmReminders: next.dmReminders,
    refunds: next.refunds,
    promotions: next.promotions,
    communityDigest: next.communityDigest,
  };
  try {
    return await apiFetch<NotificationSettings>("/api/hub/settings/notifications", {
      method: "PATCH",
      authed: true,
      body,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with PUT /api/hub/notifications/settings
    return saveMockNotificationSettings(next);
  }
}

/** Real DELETE /account response (account.service.ts `deleteAccount`) — a 48h soft-deletion grace period, not immediate erasure. */
interface RealAccountDeletionResponse {
  deletionScheduledAt: string;
}

/**
 * DELETE /api/hub/account (account.controller.ts, WawuAuthGuard) is real —
 * schedules a 48h soft-deletion grace period and orchestrates WAWU ID's own
 * account deletion. Account has no Prisma model of its own (registry note:
 * nothing local to write), so there's nothing more granular to map. Kept
 * the existing boolean contract: any non-throwing response means the
 * deletion was scheduled successfully.
 */
export async function deleteAccount(): Promise<boolean> {
  try {
    await apiFetch<RealAccountDeletionResponse>("/api/hub/account", { method: "DELETE", authed: true });
    return true;
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with DELETE /api/hub/account
    return deleteMockAccount();
  }
}

/** GET /api/hub/settings/privacy (privacy-settings.controller.ts, WawuAuthGuard). Real row shape matches PrivacySettings field-for-field, plus an extra userWawuId. */
export async function getPrivacySettings(): Promise<PrivacySettings> {
  try {
    return await apiFetch<PrivacySettings>("/api/hub/settings/privacy", { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/privacy/settings
    return getMockPrivacySettings();
  }
}

/**
 * PATCH /api/hub/settings/privacy — UpdatePrivacySettingsDto is
 * whitelist-validated with forbidNonWhitelisted (main.ts), and the real GET
 * row carries an extra `userWawuId` column the frontend type doesn't
 * declare (see getPrivacySettings's doc comment). `next` is whatever the
 * caller has in state, which — since it originated from a GET response —
 * often still carries that extra field; spreading it straight into the
 * PATCH body used to 400 every single save. The body is rebuilt here from
 * exactly the four DTO fields so nothing outside the whitelist ever goes
 * over the wire.
 */
export async function savePrivacySettings(next: PrivacySettings): Promise<PrivacySettings> {
  const body: PrivacySettings = {
    showPurchases: next.showPurchases,
    showSavedItems: next.showSavedItems,
    showFollowing: next.showFollowing,
    showInMemberLists: next.showInMemberLists,
  };
  try {
    return await apiFetch<PrivacySettings>("/api/hub/settings/privacy", {
      method: "PATCH",
      authed: true,
      body,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with PUT /api/hub/privacy/settings
    return saveMockPrivacySettings(next);
  }
}

/** Real BlockedAccount row (blocked-account.service.ts) — references the blocked user by wawuId only. */
interface RealBlockedAccount {
  id: string;
  userWawuId: string;
  blockedWawuId: string;
  blockedAt: string;
}

/**
 * GET /api/hub/settings/privacy/blocked (blocked-account.controller.ts,
 * WawuAuthGuard, paginated). GAP: the real row only carries `blockedWawuId`
 * — a bare id reference — never a display name or handle. There is no join
 * to any profile data in blocked-account.service.ts's `list()` (confirmed
 * by reading it), and even UserProfile's own public-profile aggregate has
 * no "name" field to backfill from (see profile.ts's getCreatorProfile gap
 * note) — only `handle`, and only for accounts with a completed onboarding
 * row. Rather than fabricate a plausible-looking fake name, both `name` and
 * `handle` fall back to the raw blockedWawuId so the gap stays visible
 * instead of hidden, until a real display-name source exists for this
 * endpoint.
 */
export async function getBlockedAccounts(): Promise<BlockedAccount[]> {
  try {
    const { data } = await apiFetchPaginated<RealBlockedAccount>("/api/hub/settings/privacy/blocked", {
      authed: true,
    });
    return data.map((row) => ({
      id: row.id,
      name: row.blockedWawuId,
      handle: row.blockedWawuId,
      blockedAt: row.blockedAt,
    }));
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/privacy/blocked
    return getMockBlockedAccounts();
  }
}

/**
 * DELETE /api/hub/settings/privacy/blocked/:id is real (blocked-account
 * .controller.ts) — `:id` is the BlockedAccount row's own id (matches this
 * function's `id` param), not the blocked user's wawuId, per the
 * controller's doc comment.
 */
export async function unblockAccount(id: string): Promise<boolean> {
  try {
    await apiFetch<void>(`/api/hub/settings/privacy/blocked/${id}`, { method: "DELETE", authed: true });
    return true;
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with DELETE /api/hub/privacy/blocked/:id
    return unblockMockAccount(id);
  }
}

/** Real DataExportRequest row (data-export-request.service.ts) — has more fields than the frontend needs; only requestedAt is used. */
interface RealDataExportRequest {
  requestedAt: string;
}

/**
 * POST /api/hub/settings/privacy/export is real (data-export-request
 * .controller.ts, WawuAuthGuard). This is the "download my data" request
 * only — a separate resource/flow from deleteAccount() above (DELETE
 * /account), never to be conflated, per this backend's own module split.
 */
export async function requestDataExport(): Promise<{ requestedAt: string }> {
  try {
    return await apiFetch<RealDataExportRequest>("/api/hub/settings/privacy/export", {
      method: "POST",
      authed: true,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/privacy/export
    return requestMockDataExport();
  }
}
