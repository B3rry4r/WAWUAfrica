import type { CacBusinessRecord, PartnerService, ServiceApplication, ServiceApplicationTimeline } from "@/types/services";
import {
  getMockApplication,
  getMockCacBusinessRecord,
  getMockCacTimeline,
  getMockOtherApplications,
  getMockService,
  getMockServices,
  notifyMockComingSoon,
  payMockCacApplication,
  submitMockNepcApplication,
} from "./mocks/services";
import type {
  CacApplicationPayload,
  CacPaymentResponse,
  NepcApplicationPayload,
  NepcSubmitResponse,
} from "./mocks/services";

export type { CacApplicationPayload, CacPaymentResponse, NepcApplicationPayload, NepcSubmitResponse };

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

// SEAM: replace with GET /api/hub/services/applications/:id
export async function getApplication(id: string): Promise<ServiceApplication | null> {
  return getMockApplication(id);
}

// SEAM: replace with GET /api/hub/services/applications?exclude=:id
export async function getOtherApplications(excludeId: string): Promise<ServiceApplication[]> {
  return getMockOtherApplications(excludeId);
}

// SEAM: replace with GET /api/hub/services/cac/business
export async function getCacBusinessRecord(): Promise<CacBusinessRecord | null> {
  return getMockCacBusinessRecord();
}

// SEAM: replace with POST /api/hub/services/cac/apply (name choices, nature of business + payment)
export async function payCacApplication(payload: CacApplicationPayload): Promise<CacPaymentResponse> {
  return payMockCacApplication(payload);
}

// SEAM: replace with POST /api/hub/services/nepc/apply
export async function submitNepcApplication(payload: NepcApplicationPayload): Promise<NepcSubmitResponse> {
  return submitMockNepcApplication(payload);
}
