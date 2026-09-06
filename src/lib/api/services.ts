import type {
  ApplicationStatus,
  ApplicationTimelineStep,
  CacBusinessRecord,
  PartnerService,
  ServiceApplication,
  ServiceApplicationTimeline,
} from "@/types/services";
import { apiFetch, apiFetchPaginated, isMockModeError } from "./client";
import {
  getMockCacBusinessRecord,
  getMockCacTimeline,
  getMockOtherApplications,
  getMockService,
  getMockServices,
  notifyMockComingSoon,
} from "./mocks/services";
import type {
  CacApplicationPayload,
  CacPaymentResponse,
  NepcApplicationPayload,
  NepcSubmitResponse,
} from "./mocks/services";
import { openFlutterwaveCheckout, checkoutCustomerFromSession } from "@/lib/flutterwave";
import { sessionStorage } from "@/lib/auth/session-storage";

export type { CacApplicationPayload, CacPaymentResponse, NepcApplicationPayload, NepcSubmitResponse };

/** Server-priced CAC fee (service-application.service.ts CAC_FEE_NAIRA) — mirrored here as a display fallback only, never sent to the server. */
const CAC_FEE_NAIRA = 25_000;

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── real backend wire shapes ────────────────────────────────────────────────
// Prisma model IS the wire shape (partner-service.type.ts: "thin re-export").
// `cta` does not exist on this model at all — see mapPartnerService below.
type RealPartnerService = Omit<PartnerService, "cta">;

/** service-application.type.ts ServiceApplicationTimelineEntry — stored as Json, not the frontend's {stage,status,date,note} shape. */
interface RealTimelineEntry {
  label: string;
  occurredAt: string;
  note?: string;
}

/** Prisma ServiceApplication model (service-application.type.ts) as it comes over the wire. */
interface RealServiceApplication {
  id: string;
  applicantWawuId: string;
  kind: "cac" | "nepc" | "mentor-request";
  title: string;
  reference: string;
  appliedDate: string;
  status: string;
  statusLabel: string;
  amountPaid: number | null;
  certificateExpectedBy: string | null;
  timeline: RealTimelineEntry[];
  rejection: string | null;
}

/**
 * `cta` (the primary action button on a live service tile — label + href
 * into a hand-built flow page) has no backend column; PartnerService is
 * reference/seed data with no such field (prisma/schema.prisma `model
 * PartnerService`, verified). The only two "live" rows the seed defines are
 * CAC and NEPC (prisma/seed.ts) — matched here by name to route into the
 * existing hand-built `/services/cac/apply` and `/services/nepc/apply`
 * flows, same destinations the mock data pointed to. Any other live service
 * the backend ever adds falls back to `/services/:id`, which today only
 * renders the coming-soon template (see `/services/[id]/page.tsx`) — a real
 * gap for a future live service beyond these two, not something guessable
 * from this layer.
 */
/**
 * The CTA now comes from the row itself. It used to be inferred by matching on
 * the service name, which only ever handled CAC and NEPC: every other service
 * silently rendered with no way to act on it.
 */
function deriveCta(real: RealPartnerService): PartnerService["cta"] {
  if (real.ctaHref) {
    return { label: real.ctaLabel ?? "Open", href: real.ctaHref };
  }
  // Older rows written before ctaHref existed.
  const name = real.name.toLowerCase();
  if (name.includes("cac")) return { label: "Apply now", href: "/services/cac/apply" };
  // NEPC has no application form of its own any more: export certification is
  // a legal matter and goes through the legal desk's intake.
  if (name.includes("nepc")) {
    return { label: "Talk to the legal desk", href: "/services/legal/intake?matter=cross_border" };
  }
  return undefined;
}

function mapPartnerService(real: RealPartnerService): PartnerService {
  return { ...real, cta: real.status === "live" ? deriveCta(real) : undefined };
}

/**
 * Backend statuses (`status`) are free-text (schema comment: "no enumerated
 * value set given in the registry") — `applyCac`/`applyNepc` only ever
 * produce "awaiting_payment" / "submitted" today; nothing in
 * service-application.service.ts ever transitions a row to an
 * approved/rejected state (that's presumably a later admin-review resource,
 * not built yet). Mapped onto the frontend's closed `ApplicationStatus`
 * union so `STATUS_KIND` lookups in the applications UI never miss.
 */
function mapApplicationStatus(raw: string): ApplicationStatus {
  const s = raw.toLowerCase();
  if (s.includes("reject")) return "rejected";
  if (s.includes("approv") || s.includes("issued") || s.includes("ready")) return "approved";
  if (s.includes("await")) return "pending";
  return "under_review";
}

/**
 * Backend timeline entries ({label, occurredAt, note}) are a flat history
 * log — every entry already happened, so there is no backend concept of the
 * frontend's "current"/"upcoming" preview steps (ApplicationTimelineStep).
 * Real applications therefore only ever render "done" steps; the design's
 * forward-looking preview rows (e.g. "Certificate ready" shown greyed out
 * before it happens) have no backing data yet.
 */
function mapTimeline(entries: RealTimelineEntry[]): ApplicationTimelineStep[] {
  return entries.map((e) => ({
    stage: e.label,
    status: "done",
    date: formatShortDate(e.occurredAt),
    note: e.note ?? "",
  }));
}

function mapServiceApplication(raw: RealServiceApplication): ServiceApplication {
  return {
    id: raw.id,
    kind: raw.kind === "mentor-request" ? "mentor" : raw.kind,
    title: raw.title,
    reference: raw.reference,
    appliedDate: formatLongDate(raw.appliedDate),
    status: mapApplicationStatus(raw.status),
    statusLabel: raw.statusLabel,
    amountPaid: raw.amountPaid ?? undefined,
    // GAP: neither applyCac nor verifyCac ever sets certificateExpectedBy on
    // the real backend (service-application.service.ts) — always null today.
    certificateExpectedBy: raw.certificateExpectedBy ? formatLongDate(raw.certificateExpectedBy) : undefined,
    timeline: mapTimeline(raw.timeline),
    // GAP: backend `rejection` is a bare note string with no `refunded` flag
    // (no code path sets either today — rejection/refund is unimplemented on
    // this backend). Refund is assumed true to match the CAC product promise
    // (mock data / docs: name conflicts are auto-refunded in full) since a
    // rejected row could only exist that way — flagged, not verified live.
    rejection: raw.rejection ? { note: raw.rejection, refunded: true } : undefined,
  };
}

// SEAM: replace with GET /api/hub/services
export async function getServices(): Promise<PartnerService[]> {
  try {
    const services = await apiFetch<RealPartnerService[]>("/api/hub/services", { authed: true });
    return services.map(mapPartnerService);
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockServices();
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The real endpoint is keyed by UUID (ParseUUIDPipe) and the seeded rows use
 * fixed UUID ids (prisma/seed.ts), but this app routes services by slug in
 * several places — the hand-routed `/services/cac` and `/services/nepc`
 * pages, and `/services/[id]` whenever it is reached from mock-shaped data
 * ("mentors", "pension", …). A slug request always 400s against the real
 * backend, so resolve slugs against the real list by name (the same name
 * match `deriveCta` already relies on) instead of erroring or masking it
 * with mock data.
 */
async function resolveServiceBySlug(slug: string): Promise<PartnerService | null> {
  const services = await getServices();
  // Rows now carry a real slug, so this is an exact lookup rather than a
  // fuzzy name match.
  const exact = services.find((s) => s.slug === slug);
  if (exact) return exact;

  const needle = slug.toLowerCase().replace(/[-_]/g, " ");
  return (
    services.find((s) => s.id === slug) ??
    services.find((s) => s.name.toLowerCase().includes(needle)) ??
    // Slugs are frequently a leading word of the name ("grants-funding" →
    // "Grants and funding"), so fall back to a first-token match.
    services.find((s) => s.name.toLowerCase().includes(needle.split(" ")[0])) ??
    null
  );
}

// SEAM: replace with GET /api/hub/services/:id
export async function getService(id: string): Promise<PartnerService | null> {
  // Never send a slug to a UUID-only route — it is a guaranteed 400.
  // getServices() already falls back to the mocks when no backend is
  // configured, so this path covers mock mode too.
  if (!UUID_RE.test(id)) return resolveServiceBySlug(id);
  try {
    const service = await apiFetch<RealPartnerService>(`/api/hub/services/${id}`, { authed: true });
    return mapPartnerService(service);
  } catch (e) {
    if (isMockModeError(e)) return getMockService(id);
    throw e;
  }
}

/**
 * No real endpoint backs this — it is static "what happens after you apply"
 * marketing copy shown before applying, not a data-modeled resource
 * (nothing under service-application/ or partner-service/ serves a
 * "/services/cac/timeline" route). Stays mock-only; there is nothing to SEAM.
 */
export async function getCacTimeline(): Promise<ServiceApplicationTimeline[]> {
  return getMockCacTimeline();
}

// SEAM: replace with POST /api/hub/services/:id/notify-me
export async function notifyComingSoon(id: string): Promise<boolean> {
  try {
    const res = await apiFetch<{ success: true }>(`/api/hub/services/${id}/notify-me`, {
      method: "POST",
      authed: true,
    });
    return res.success;
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return notifyMockComingSoon(id);
  }
}

// SEAM: replace with GET /api/hub/services/applications/:id
export async function getApplication(id: string): Promise<ServiceApplication | null> {
  const application = await apiFetch<RealServiceApplication>(`/api/hub/services/applications/${id}`, {
    authed: true,
  });
  return mapServiceApplication(application);
}

/**
 * SEAM: replace with GET /api/hub/services/applications — the real endpoint
 * (service-application.controller.ts) scopes to the caller's own
 * applications and is paginated (page/perPage), with no `exclude` filter.
 * Filters the excluded id out client-side; `perPage: 50` is a practical
 * single-page cap, not a contracted page size.
 */
export async function getOtherApplications(excludeId: string): Promise<ServiceApplication[]> {
  try {
    const res = await apiFetchPaginated<RealServiceApplication>("/api/hub/services/applications?perPage=50", {
      authed: true,
    });
    return res.data.filter((a) => a.id !== excludeId).map(mapServiceApplication);
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockOtherApplications(excludeId);
  }
}

/**
 * No real endpoint backs this. The applicant's registered business
 * name/RC-number has no home on the real backend at all: `ApplyCacDto` only
 * ever takes three *candidate* names (not the one CAC eventually approves),
 * `ServiceApplication` stores no `businessName`/`rcNumber` columns, and
 * nothing else in service-application/ or partner-service/ persists them.
 * NEPC's own apply form (`ApplyNepcDto.rcNumber`) has the applicant retype
 * it by hand for the same reason. Stays mock-only until that's modeled.
 */
export async function getCacBusinessRecord(): Promise<CacBusinessRecord | null> {
  return getMockCacBusinessRecord();
}

/**
 * SEAM: replace with POST /api/hub/services/cac/apply then POST
 * /api/hub/services/cac/apply/verify. The real flow is genuinely two calls
 * with a client-side Flutterwave charge in between (service-application
 * .service.ts: `applyCac` returns a `flutterwaveConfig` to charge against;
 * `verifyCac` re-checks the charge with Flutterwave before marking the
 * application submitted) — the old mock's single round trip doesn't exist
 * on the real contract. No inline-checkout SDK is wired into this UI yet
 * (same interim state as `content.ts`'s unlock flow), so — exactly like
 * `initiateUnlock`/`verifyUnlock` there — this synthesizes a transaction id
 * and verifies immediately after apply rather than waiting on a real charge
 * UI. Real Flutterwave test-mode keys aren't configured in this sandbox
 * either (service-application module comment), so the backend itself runs
 * on MockFlutterwaveAdapter, which treats any non-magic transaction id as a
 * successful charge.
 *
 * A real Flutterwave decline (verifyCac's 400) is a real payment failure and
 * must reach the caller as a thrown error — never silently substituted with
 * an always-succeeding mock. `payCacApplication`'s own caller
 * (`/services/cac/apply`) already turns any thrown error here into its
 * visible "your bank didn't confirm the payment" failure state.
 */
export async function payCacApplication(payload: CacApplicationPayload): Promise<CacPaymentResponse> {
  const applied = await apiFetch<{ flutterwaveConfig: { txRef: string; amount: number; currency: string; publicKey: string } }>(
    "/api/hub/services/cac/apply",
    { method: "POST", authed: true, body: payload },
  );

  const customer = checkoutCustomerFromSession(sessionStorage.getUser());
  if (!customer) throw new Error("You need to be signed in with a valid email to pay.");

  const charge = await openFlutterwaveCheckout(applied.flutterwaveConfig, customer, {
    title: "CAC registration",
    description: "Business name registration fee",
    }, {
      verifyPath: "/api/hub/services/cac/apply/verify",
      successPath: "/services/applications",
      label: "Your application",
    });

  const verified = await apiFetch<RealServiceApplication>("/api/hub/services/cac/apply/verify", {
    method: "POST",
    authed: true,
    body: { transaction_id: charge.transaction_id, tx_ref: charge.tx_ref },
  });
  return {
    result: "success",
    applicationId: verified.id,
    reference: verified.reference,
    amountPaid: verified.amountPaid ?? applied.flutterwaveConfig.amount ?? CAC_FEE_NAIRA,
    certificateExpectedBy: verified.certificateExpectedBy ? formatLongDate(verified.certificateExpectedBy) : "",
  };
}

// SEAM: replace with POST /api/hub/services/nepc/apply
export async function submitNepcApplication(payload: NepcApplicationPayload): Promise<NepcSubmitResponse> {
  const created = await apiFetch<RealServiceApplication>("/api/hub/services/nepc/apply", {
    method: "POST",
    authed: true,
    body: payload,
  });
  return { applicationId: created.id, reference: created.reference };
}
