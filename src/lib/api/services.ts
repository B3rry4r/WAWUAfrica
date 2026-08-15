import type { PartnerService, ServiceApplicationTimeline } from "@/types/services";
import {
  getMockCacTimeline,
  getMockService,
  getMockServices,
  notifyMockComingSoon,
} from "./mocks/services";

// SEAM: replace with GET /api/hub/services
export async function getServices(): Promise<PartnerService[]> {
  return getMockServices();
}

// SEAM: replace with GET /api/hub/services/:id
export async function getService(id: string): Promise<PartnerService | null> {
  return getMockService(id);
}

// SEAM: replace with GET /api/hub/services/cac/timeline
export async function getCacTimeline(): Promise<ServiceApplicationTimeline[]> {
  return getMockCacTimeline();
}

// SEAM: replace with POST /api/hub/services/:id/notify
export async function notifyComingSoon(id: string): Promise<boolean> {
  return notifyMockComingSoon(id);
}