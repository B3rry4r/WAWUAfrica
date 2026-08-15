import type { PartnerService, ServiceApplicationTimeline } from "@/types/services";
import {
  getMockCacTimeline,
  getMockService,
  getMockServices,
  notifyMockComingSoon,
} from "./mocks/services";

export async function getServices(): Promise<PartnerService[]> {
  return getMockServices();
}

export async function getService(id: string): Promise<PartnerService | null> {
  return getMockService(id);
}

export async function getCacTimeline(): Promise<ServiceApplicationTimeline[]> {
  return getMockCacTimeline();
}

export async function notifyComingSoon(id: string): Promise<boolean> {
  return notifyMockComingSoon(id);
}