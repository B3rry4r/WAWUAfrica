import { ApiError, apiFetch, isMockModeError } from "./client";

/**
 * The legal documents the Hub publishes (owner, 26 Oct 2026): nine of them,
 * read by anyone, signed in or not. The words are the owner's and live on the
 * Hub; this module and the pages built on it hold none. What is here is only
 * the NAME of each slug, so the index can say which documents exist and which
 * have not been published yet.
 *
 *   GET /api/hub/policies          slug, title, effectiveDate of what is published
 *   GET /api/hub/policies/:slug    one document: title, effectiveDate, sections
 *
 * Both are public routes. The pages that read them are rendered on the server
 * (the app stores' crawlers read the HTML, not a script's output), so these
 * calls carry no token and are never cached: a document the owner has just
 * published is what the next visitor reads.
 */

/** The nine, in the owner's order. `name` is used only until the Hub gives a title. */
export const POLICY_DOCS = [
  { slug: "privacy", name: "Privacy Policy" },
  { slug: "terms", name: "Terms of Service" },
  { slug: "cookies", name: "Cookie Policy" },
  { slug: "creator-monetization", name: "Creator Monetization Agreement" },
  { slug: "verification-refund", name: "Verification and Refund Policy" },
  { slug: "acceptable-use", name: "Acceptable Use Policy" },
  { slug: "partner-dpa", name: "Data Processing Agreement for Partners" },
  { slug: "community-guidelines", name: "Community Guidelines" },
  { slug: "disclaimer", name: "Disclaimer" },
] as const;

export type PolicySlug = (typeof POLICY_DOCS)[number]["slug"];

export function isPolicySlug(slug: string): slug is PolicySlug {
  return POLICY_DOCS.some((d) => d.slug === slug);
}

export function policyName(slug: PolicySlug): string {
  return POLICY_DOCS.find((d) => d.slug === slug)?.name ?? slug;
}

/** One heading and its text. Paragraphs in `body` are separated by a blank line. */
export interface PolicySection {
  heading: string;
  body: string;
}

/** A published document. A document the Hub has not published is `null`, never a half-filled one. */
export interface PolicyDocument {
  slug: PolicySlug;
  title: string;
  /** YYYY-MM-DD. */
  effectiveDate: string | null;
  sections: PolicySection[];
}

/** One row of the index: a published document's title and date. */
export interface PolicySummary {
  slug: PolicySlug;
  title: string;
  effectiveDate: string | null;
}

/** The Hub's `PolicyView` (src/about/about-view.type.ts). `available` is false until the owner publishes. */
interface RealPolicyView {
  slug?: unknown;
  available?: unknown;
  title?: unknown;
  effectiveDate?: unknown;
  sections?: unknown;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function sectionsOf(raw: unknown): PolicySection[] {
  if (!Array.isArray(raw)) return [];
  const out: PolicySection[] = [];
  for (const item of raw) {
    const s = item as { heading?: unknown; body?: unknown } | null;
    if (s && typeof s.heading === "string" && typeof s.body === "string") {
      out.push({ heading: s.heading, body: s.body });
    }
  }
  return out;
}

/**
 * One document, or `null` when the Hub has not published it (it answers 404,
 * or answers `available: false`, or sends no text). Any other failure throws,
 * so the page can say "could not load" and not "not published yet".
 */
export async function getPolicy(slug: PolicySlug): Promise<PolicyDocument | null> {
  try {
    const view = await apiFetch<RealPolicyView>(`/api/hub/policies/${slug}`, { cache: "no-store" });
    const title = text(view?.title);
    const sections = sectionsOf(view?.sections);
    if (view?.available === false || !title || sections.length === 0) return null;
    return { slug, title, effectiveDate: text(view.effectiveDate), sections };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    // SEAM: no backend configured (local mock mode). Nothing is published; no legal text is invented.
    if (isMockModeError(e)) return null;
    throw e;
  }
}

/** The index rows may arrive as a bare list or inside an object; either way only the nine known slugs are kept. */
function rowsOf(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    for (const key of ["policies", "documents", "items", "data"]) {
      const inner = (raw as Record<string, unknown>)[key];
      if (Array.isArray(inner)) return inner;
    }
  }
  return [];
}

/**
 * What is published, for the index. A row with no title is a document that is
 * not published, so it is left out. A Hub that does not have the list route
 * (404) is a Hub that publishes none of them.
 */
export async function listPolicies(): Promise<PolicySummary[]> {
  try {
    const raw = await apiFetch<unknown>("/api/hub/policies", { cache: "no-store" });
    const out: PolicySummary[] = [];
    for (const row of rowsOf(raw)) {
      const r = row as { slug?: unknown; title?: unknown; effectiveDate?: unknown; available?: unknown } | null;
      const slug = typeof r?.slug === "string" ? r.slug : "";
      const title = text(r?.title);
      if (!isPolicySlug(slug) || !title || r?.available === false) continue;
      out.push({ slug, title, effectiveDate: text(r?.effectiveDate) });
    }
    return out;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return [];
    // SEAM: no backend configured (local mock mode). Nothing is published.
    if (isMockModeError(e)) return [];
    throw e;
  }
}
