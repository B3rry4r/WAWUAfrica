import { apiFetch } from "./client";
import { mockNotifications } from "./mocks/mockNotifications";
import type { NotificationsResponse } from "@/types/notification";

export async function getNotifications(): Promise<NotificationsResponse> {
  try {
    return await apiFetch<NotificationsResponse>("/api/hub/notifications", { authed: true });
  } catch {
    // SEAM: replace with GET /api/hub/notifications
    return mockNotifications;
  }
}

export async function markAllRead(): Promise<void> {
  try {
    await apiFetch<void>("/api/hub/notifications/read-all", { method: "POST", authed: true });
  } catch {
    return;
  }
}