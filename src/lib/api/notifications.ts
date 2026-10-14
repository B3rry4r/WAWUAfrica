import { apiFetch, isMockModeError } from "./client";
import { adminRoleFromToken } from "@/lib/admin-role";
import { mockNotifications, mockCampaignAudiences, mockCampaignDestinations, mockCampaigns, recordMockCampaign, dispatchMockCampaign } from "./mocks/mockNotifications";
import type { NotificationsResponse, NotificationsWireResponse } from "@/types/notification";
import type {
  CampaignAudience,
  CampaignDestination,
  CampaignDraft,
  CampaignDispatchResult,
  NotificationCampaign,
} from "@/types/notification";

/**
 * The real GET /notifications response nests a full envelope inside
 * `items` (registry.json's own documented shape, see NotificationsWireResponse's
 * doc comment) -- reading `res.items` as a bare array crashed this page on
 * every load (`items.filter is not a function`), confirmed live.
 */
export async function getNotifications(): Promise<NotificationsResponse> {
  try {
    const res = await apiFetch<NotificationsWireResponse>("/api/hub/notifications", { authed: true });
    return { unreadCount: res.unreadCount, items: res.items.data };
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/notifications
    return mockNotifications;
  }
}

export async function markAllRead(): Promise<void> {
  try {
    // Real route is /mark-all-read, not /read-all -- confirmed live (the
    // old path 404'd on every real backend, silently swallowed here).
    await apiFetch<void>("/api/hub/notifications/mark-all-read", { method: "POST", authed: true, body: {} });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/notifications/mark-all-read
    return;
  }
}

/**
 * Mark ONE notification read, which is what opening it does.
 *
 * Before this existed the only way to clear an unread dot was "Mark all
 * read": opening a notification navigated away and left its dot lit, so the
 * badge in the header counted things the user had already dealt with. The
 * dot is a claim about what you have seen, and nothing was making it true.
 */
export async function markRead(id: string): Promise<void> {
  try {
    await apiFetch<void>(`/api/hub/notifications/${id}/read`, { method: "POST", authed: true, body: {} });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/notifications/:id/read
    return;
  }
}

/* ───────────────────────── admin: campaigns (build brief C8) ─────────────────
 *
 * The admin surface signs in against a DIFFERENT token from the app: the Hub
 * issues an HS256 admin token from POST /admin/auth/login, and a WAWU ID user
 * token cannot satisfy it (different key, different algorithm). It is kept in
 * its own storage slot so an admin session can never be mistaken for a user
 * one, or the reverse.
 */

const ADMIN_TOKEN_KEY = "wawu-admin-session";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** The role of the admin who is signed in (superadmin, finance, support, reviewer), or null. Decides what a page draws; the Hub still checks every call. */
export function getAdminRole(): string | null {
  return adminRoleFromToken(getAdminToken());
}

export function setAdminToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token === null) window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    else window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // A browser with storage blocked keeps the session in memory only, which
    // means a reload asks for the password again. That is the correct
    // failure for an admin session.
  }
}

export async function adminSignIn(email: string, password: string): Promise<string> {
  const res = await apiFetch<{ accessToken: string }>("/api/hub/admin/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setAdminToken(res.accessToken);
  return res.accessToken;
}

/** Every segment with the LIVE size the backend measured, never a stored figure. */
export async function getCampaignAudiences(): Promise<CampaignAudience[]> {
  try {
    return await apiFetch<CampaignAudience[]>("/api/hub/admin/notifications/audiences", {
      token: getAdminToken() ?? undefined,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/admin/notifications/audiences
    return mockCampaignAudiences;
  }
}

/**
 * The allowlist of in-app destinations a campaign button may point at. Served
 * by the backend rather than hard-coded here so the composer can never offer
 * a destination the backend will refuse.
 */
export async function getCampaignDestinations(): Promise<CampaignDestination[]> {
  try {
    return await apiFetch<CampaignDestination[]>("/api/hub/admin/notifications/destinations", {
      token: getAdminToken() ?? undefined,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/admin/notifications/destinations
    return mockCampaignDestinations;
  }
}

export async function getCampaigns(): Promise<NotificationCampaign[]> {
  try {
    return await apiFetch<NotificationCampaign[]>("/api/hub/admin/notifications/campaigns", {
      token: getAdminToken() ?? undefined,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/admin/notifications/campaigns
    return mockCampaigns();
  }
}

export async function composeCampaign(draft: CampaignDraft): Promise<NotificationCampaign> {
  try {
    return await apiFetch<NotificationCampaign>("/api/hub/admin/notifications/campaigns", {
      method: "POST",
      token: getAdminToken() ?? undefined,
      body: draft,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/admin/notifications/campaigns
    return recordMockCampaign(draft);
  }
}

/**
 * Send it. Irreversible, and the backend refuses a second dispatch of the
 * same campaign, so the confirm step in the composer is the last chance to
 * stop rather than a formality.
 */
export async function dispatchCampaign(id: string): Promise<CampaignDispatchResult> {
  try {
    return await apiFetch<CampaignDispatchResult>(
      `/api/hub/admin/notifications/campaigns/${id}/dispatch`,
      { method: "POST", token: getAdminToken() ?? undefined, body: {} },
    );
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/admin/notifications/campaigns/:id/dispatch
    return dispatchMockCampaign(id);
  }
}
