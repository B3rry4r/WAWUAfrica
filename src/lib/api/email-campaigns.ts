import { apiFetch, apiFetchPaginated } from "./client";
import { getAdminToken } from "./notifications";

/**
 * The admin email campaign tool (EMAIL-01). Every call needs the admin token
 * from /admin/auth/login; the Hub refuses anything else. There are no mocks:
 * this tool only makes sense against the live Hub (sending is superadmin only
 * on the server, which answers 403 to anyone else).
 */

const BASE = "/api/hub/admin/notifications/email";
const opts = () => ({ token: getAdminToken() ?? undefined });

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  body: string;
  version: number;
  updatedAt: string;
}

export interface EmailTemplateInput {
  name: string;
  subject: string;
  previewText: string;
  body: string;
  /** The version the editor loaded; a save over a newer one is refused. */
  version?: number;
}

export interface EmailPreviewInput {
  subject: string;
  previewText: string;
  body: string;
  firstName?: string;
}

export interface EmailPreview {
  subject: string;
  html: string;
  text: string;
}

export type RegistrantFilter = "all" | "paid" | "not_paid" | "opted_in";

export interface EmailAudienceCount {
  matching: number;
  willSend: number;
  unsubscribed: number;
}

export type EmailCampaignStatus = "ready" | "sending" | "sent";

export interface EmailCampaign {
  id: string;
  templateName: string;
  subject: string;
  audienceKind: "csv" | "registrants";
  audienceNote: string;
  status: EmailCampaignStatus;
  totalCount: number;
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  unsubscribedCount: number;
  invalidCount: number;
  duplicateCount: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export type EmailRecipientStatus = "queued" | "sent" | "failed" | "skipped";

export interface EmailRecipient {
  id: string;
  email: string;
  firstName: string | null;
  status: EmailRecipientStatus;
  error: string | null;
  sentAt: string | null;
}

export function listEmailTemplates(): Promise<EmailTemplate[]> {
  return apiFetch<EmailTemplate[]>(`${BASE}/templates`, opts());
}

export function createEmailTemplate(input: EmailTemplateInput): Promise<EmailTemplate> {
  return apiFetch<EmailTemplate>(`${BASE}/templates`, { ...opts(), method: "POST", body: input });
}

export function updateEmailTemplate(id: string, input: EmailTemplateInput): Promise<EmailTemplate> {
  return apiFetch<EmailTemplate>(`${BASE}/templates/${id}`, { ...opts(), method: "PATCH", body: input });
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  await apiFetch<unknown>(`${BASE}/templates/${id}`, { ...opts(), method: "DELETE" });
}

/** The final HTML and text, as a recipient would get them. */
export function previewEmail(input: EmailPreviewInput): Promise<EmailPreview> {
  return apiFetch<EmailPreview>(`${BASE}/preview`, { ...opts(), method: "POST", body: input });
}

export async function sendTestEmail(input: EmailPreviewInput & { to: string }): Promise<void> {
  await apiFetch<unknown>(`${BASE}/test-send`, { ...opts(), method: "POST", body: input });
}

export function countRegistrants(filter: RegistrantFilter, limit?: number): Promise<EmailAudienceCount> {
  const q = new URLSearchParams({ filter });
  if (limit) q.set("limit", String(limit));
  return apiFetch<EmailAudienceCount>(`${BASE}/audiences/registrants?${q.toString()}`, opts());
}

export function createRegistrantCampaign(
  templateId: string,
  filter: RegistrantFilter,
  limit?: number,
): Promise<EmailCampaign> {
  return apiFetch<EmailCampaign>(`${BASE}/campaigns/registrants`, {
    ...opts(),
    method: "POST",
    body: { templateId, filter, ...(limit ? { limit } : {}) },
  });
}

export function createCsvCampaign(templateId: string, file: File, limit?: number): Promise<EmailCampaign> {
  const form = new FormData();
  form.append("templateId", templateId);
  if (limit) form.append("limit", String(limit));
  form.append("file", file, file.name);
  return apiFetch<EmailCampaign>(`${BASE}/campaigns/csv`, { ...opts(), method: "POST", body: form });
}

export function startEmailCampaign(id: string): Promise<EmailCampaign> {
  return apiFetch<EmailCampaign>(`${BASE}/campaigns/${id}/start`, { ...opts(), method: "POST", body: {} });
}

export function getEmailCampaign(id: string): Promise<EmailCampaign> {
  return apiFetch<EmailCampaign>(`${BASE}/campaigns/${id}`, opts());
}

export async function listEmailCampaigns(page = 1, perPage = 20): Promise<{ items: EmailCampaign[]; total: number }> {
  const res = await apiFetchPaginated<EmailCampaign>(`${BASE}/campaigns?page=${page}&perPage=${perPage}`, opts());
  return { items: res.data, total: res.pagination.total };
}

export async function listEmailRecipients(
  id: string,
  page: number,
  status?: EmailRecipientStatus,
  perPage = 25,
): Promise<{ items: EmailRecipient[]; total: number }> {
  const q = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (status) q.set("status", status);
  const res = await apiFetchPaginated<EmailRecipient>(`${BASE}/campaigns/${id}/recipients?${q.toString()}`, opts());
  return { items: res.data, total: res.pagination.total };
}
