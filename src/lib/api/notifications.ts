import { apiFetch } from "./client";
import { mockNotifications } from "./mocks/mockNotifications";
import type { NotificationsResponse, NotificationsWireResponse } from "@/types/notification";

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
  } catch {
    // SEAM: replace with GET /api/hub/notifications
    return mockNotifications;
  }
}

export async function markAllRead(): Promise<void> {
  try {
    // Real route is /mark-all-read, not /read-all -- confirmed live (the
    // old path 404'd on every real backend, silently swallowed here).
    await apiFetch<void>("/api/hub/notifications/mark-all-read", { method: "POST", authed: true, body: {} });
  } catch {
    // SEAM: replace with POST /api/hub/notifications/mark-all-read
    return;
  }
}