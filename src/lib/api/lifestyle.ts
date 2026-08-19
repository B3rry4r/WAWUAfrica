import { apiFetch } from "./client";

/**
 * Lifestyle Services: Bills Payment, Telemedicine, Legal, and the partner
 * services (Loans/EasyBuy, Pensions, Grants).
 *
 * All three share the same payment shape, and it is deliberately a two-call
 * flow: `init` records the intent and returns a Flutterwave config, the user
 * pays in Flutterwave's own modal, then `verify` confirms the payment
 * server-side and only then does WAWU fulfil. The client never decides that
 * something has been paid for.
 *
 * SEAM: replace with GET/POST /api/hub/{bills,care,legal}/... once the
 * services are live in every environment.
 */

export interface FlutterwaveConfig {
  txRef: string;
  amount: number;
  currency: string;
  publicKey: string;
}

/* ---------------------------- Bills Payment ----------------------------- */

export interface BillCategory {
  id: number;
  name: string;
  biller_code?: string;
  item_code?: string;
}

export interface Biller {
  id: number;
  name: string;
  biller_code: string;
}

export interface BillItem {
  id: number;
  biller_code: string;
  name: string;
  item_code: string;
  amount: number;
  fee?: number;
  /** "Meter Number", "SmartCard Number", "Phone Number". */
  label_name?: string;
}

export interface BillRecord {
  id: string;
  category: string;
  billerName: string;
  customerRef: string;
  amount: number;
  fee: number;
  status: "pending" | "paid" | "delivered" | "failed" | "refunded";
  providerReference: string | null;
  failureReason: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

export const getBillCategories = () =>
  apiFetch<BillCategory[]>("/api/hub/bills/categories", { authed: true });

export const getBillers = (category: string) =>
  apiFetch<Biller[]>(`/api/hub/bills/categories/${encodeURIComponent(category)}/billers`, {
    authed: true,
  });

export const getBillItems = (billerCode: string) =>
  apiFetch<BillItem[]>(`/api/hub/bills/billers/${encodeURIComponent(billerCode)}/items`, {
    authed: true,
  });

export const validateBillCustomer = (itemCode: string, customer: string) =>
  apiFetch<{ customer: string; name: string | null; fee: number; minimum: number; maximum: number }>(
    "/api/hub/bills/validate",
    { method: "POST", authed: true, body: { itemCode, customer } },
  );

export const initBillPayment = (body: {
  category: string;
  billerCode: string;
  itemCode: string;
  billerName: string;
  customerRef: string;
  amount: number;
}) =>
  apiFetch<{ billPaymentId: string; flutterwaveConfig: FlutterwaveConfig }>(
    "/api/hub/bills/init",
    { method: "POST", authed: true, body },
  );

export const verifyBillPayment = (id: string, transactionId: string) =>
  apiFetch<BillRecord>(`/api/hub/bills/${id}/verify`, {
    method: "POST",
    authed: true,
    body: { transactionId },
  });

export const getMyBills = () =>
  apiFetch<{ items: BillRecord[] }>("/api/hub/bills/mine", { authed: true });

/* ----------------------------- Telemedicine ----------------------------- */

export interface HealthPlan {
  planName: string;
  planCode: string;
  price: number;
  dependants?: number;
  numberOfMonths?: number;
  paymentPlan?: string;
  planBenefits?: string[];
}

export interface HealthSubscription {
  id: string;
  planCode: string;
  planName: string;
  price: number;
  phoneNumber: string;
  status: "pending" | "paid" | "delivered" | "failed" | "refunded";
  policyNumber: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export const getHealthPlans = () =>
  apiFetch<HealthPlan[]>("/api/hub/care/plans", { authed: true });

export const initHealthSubscription = (body: {
  planCode: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  email?: string;
}) =>
  apiFetch<{
    subscriptionId: string;
    plan: { code: string; name: string; price: number };
    flutterwaveConfig: FlutterwaveConfig;
  }>("/api/hub/care/subscriptions/init", { method: "POST", authed: true, body });

export const verifyHealthSubscription = (id: string, transactionId: string) =>
  apiFetch<HealthSubscription>(`/api/hub/care/subscriptions/${id}/verify`, {
    method: "POST",
    authed: true,
    body: { transactionId },
  });

export const getMyHealthSubscriptions = () =>
  apiFetch<HealthSubscription[]>("/api/hub/care/subscriptions", { authed: true });

/* --------------------------------- Legal -------------------------------- */

export interface LegalServiceItem {
  code: string;
  name: string;
  category: string;
  path: "simple" | "consultation";
  blurb: string;
  priceNaira: number | null;
  requiresDocuments?: boolean;
}

export interface ConsultationOption {
  medium: "chat" | "zoom" | "physical";
  label: string;
  minutes: number | null;
  feeNaira: number | null;
}

export interface LegalCatalogue {
  categories: string[];
  consultationOptions: ConsultationOption[];
  services: LegalServiceItem[];
}

export interface LegalRequest {
  id: string;
  serviceCode: string;
  serviceName: string;
  category: string;
  path: "simple" | "consultation";
  status: string;
  documents: string[];
  consultationMedium: string | null;
  consultationFee: number | null;
  consultationPaidAt: string | null;
  scheduledFor: string | null;
  quoteAmount: number | null;
  quoteNote: string | null;
  contractSigned: boolean;
  contractSignedAs: string | null;
  contractSignedAt: string | null;
  servicePaidAt: string | null;
  deliverableUrl: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export const getLegalCatalogue = () =>
  apiFetch<LegalCatalogue>("/api/hub/legal/catalogue", { authed: true });

export const createLegalRequest = (body: {
  serviceCode: string;
  details?: Record<string, unknown>;
  documents?: string[];
}) => apiFetch<LegalRequest>("/api/hub/legal/requests", { method: "POST", authed: true, body });

export const getMyLegalRequests = () =>
  apiFetch<LegalRequest[]>("/api/hub/legal/requests", { authed: true });

export const getLegalRequest = (id: string) =>
  apiFetch<LegalRequest>(`/api/hub/legal/requests/${id}`, { authed: true });

export const bookLegalConsultation = (id: string, medium: "chat" | "zoom" | "physical") =>
  apiFetch<{
    request: LegalRequest;
    flutterwaveConfig: FlutterwaveConfig | null;
    message: string | null;
  }>(`/api/hub/legal/requests/${id}/consultation`, {
    method: "POST",
    authed: true,
    body: { medium },
  });

export const verifyLegalConsultation = (id: string, transactionId: string) =>
  apiFetch<LegalRequest>(`/api/hub/legal/requests/${id}/consultation/verify`, {
    method: "POST",
    authed: true,
    body: { transactionId },
  });

export const getLegalContract = (id: string) =>
  apiFetch<{ contractText: string; amountNaira: number; alreadySigned: boolean }>(
    `/api/hub/legal/requests/${id}/contract`,
    { authed: true },
  );

export const signLegalContract = (id: string, fullName: string) =>
  apiFetch<LegalRequest>(`/api/hub/legal/requests/${id}/contract/sign`, {
    method: "POST",
    authed: true,
    body: { fullName },
  });

export const initLegalPayment = (id: string) =>
  apiFetch<{ request: LegalRequest; flutterwaveConfig: FlutterwaveConfig }>(
    `/api/hub/legal/requests/${id}/payment/init`,
    { method: "POST", authed: true },
  );

export const verifyLegalPayment = (id: string, transactionId: string) =>
  apiFetch<LegalRequest>(`/api/hub/legal/requests/${id}/payment/verify`, {
    method: "POST",
    authed: true,
    body: { transactionId },
  });

/* --------------------- Carried-over partner services --------------------- */

export type PartnerServiceKind = "loans" | "pension" | "grants";

/**
 * The short request used for Loans/EasyBuy, Pensions and Grants: say what you need, attach anything relevant, partner reviews it.
 * No payment is taken; onboarding happens with the partner.
 */
export const applyForPartnerService = (body: {
  kind: PartnerServiceKind;
  note: string;
  documents?: string[];
}) =>
  apiFetch<{ id: string; reference: string; title: string; statusLabel: string }>(
    "/api/hub/service-applications/partner/apply",
    { method: "POST", authed: true, body },
  );
