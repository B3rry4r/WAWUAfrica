import type { CourseEntitlementState, LearnCourse, LearnEntitlement, LearnGuide, Playbook } from "@/types/learn";
import { apiFetch, ApiError, isMockModeError } from "./client";
import { sessionStorage } from "@/lib/auth/session-storage";
import { creatorGates } from "@/lib/auth/gates";
import { getMockGuides, getMockPlaybook } from "./mocks/learn";

/** Wire shape of GET /learn/entitlement and the entitlement half of POST /learn/courses/:id/enrol. */
interface LearnEntitlementWire {
  tier: "basic" | "pro" | "pro_max";
  freeCoursesTotal: number;
  freeCoursesUsed: number;
  enrolledCourseIds: string[];
}

/**
 * Backend LearnEntitlementWire → frontend LearnEntitlement. `isCreator` isn't
 * on the wire shape (the backend derives freeCoursesTotal=0 for a non-creator
 * instead of a separate flag) so it still comes from the one real gate,
 * per docs/01_SPEC.md — never a disconnected mock switch.
 *
 * GAP: the backend's LearnEntitlement resource (registry.json) has no
 * per-course progress field — CourseEnrollment.progressPct exists in the
 * Prisma schema but GET /learn/entitlement's service never selects/returns
 * it (verified: `learn-entitlement.service.ts` only returns tier/totals/ids).
 * There is no live source for `progressByCourseId` yet, so it comes back
 * empty on the real path — course rows read as "available"/"enrolled" but
 * never show an in-progress percentage until that field ships backend-side.
 */
function toLearnEntitlement(wire: LearnEntitlementWire): LearnEntitlement {
  // Real signed-in user, not the frozen dev mock session (which reported
  // "creator" for everyone regardless of the entitlement the server returned).
  const gates = creatorGates(sessionStorage.getUser());
  return {
    tier: wire.tier,
    isCreator: gates.isCreator,
    freeCoursesTotal: wire.freeCoursesTotal,
    freeCoursesUsed: wire.freeCoursesUsed,
    freeCoursesRemaining: Math.max(0, wire.freeCoursesTotal - wire.freeCoursesUsed),
    enrolledCourseIds: wire.enrolledCourseIds,
    progressByCourseId: {},
    canDownloadPlaybook: true,
  };
}

export async function getLearnEntitlement(): Promise<LearnEntitlement> {
  const wire = await apiFetch<LearnEntitlementWire>("/api/hub/learn/entitlement", { authed: true });
  return toLearnEntitlement(wire);
}

/** Pure — derives a single course's entitlement state from the entitlement snapshot. */
export function getCourseEntitlementState(courseId: string, entitlement: LearnEntitlement): CourseEntitlementState {
  if (entitlement.enrolledCourseIds.includes(courseId)) {
    const progressPct = entitlement.progressByCourseId[courseId] ?? null;
    return { status: "enrolled", progressPct };
  }
  if (entitlement.freeCoursesRemaining > 0) return { status: "available" };
  return { status: "exhausted" };
}

/**
 * Spends a free-course slot on `courseId`. Enrolling is always allowed — it is
 * the WAWU-tracked entitlement, not the Alison enrolment itself, that is
 * capped. Returns the refreshed entitlement so the caller can update in place.
 *
 * The real response also carries `externalHostUrl` for the just-enrolled
 * course (registry note: "Handoff to externalHostUrl"), but callers already
 * get that from `getCourse`/`getCourses` (LearnCourse.externalHostUrl) — kept
 * out of this return type to leave the LearnEntitlement contract stable.
 */
export async function enrolInCourse(courseId: string): Promise<LearnEntitlement> {
  const wire = await apiFetch<LearnEntitlementWire & { externalHostUrl: string }>(
    `/api/hub/learn/courses/${courseId}/enrol`,
    { method: "POST", authed: true },
  );
  return toLearnEntitlement(wire);
}

/**
 * Alison is an external partner — courses run there, never in-app. This is a
 * fallback only, for a course whose real `externalHostUrl` isn't in hand yet
 * (e.g. still loading) — prefer `course.externalHostUrl` wherever a LearnCourse
 * is already available, since the real per-course URL isn't this predictable
 * pattern (verified against the live backend: seeded courses' externalHostUrl
 * values don't follow `/course/:id`).
 */
export function alisonHandoffUrl(courseId: string): string {
  return `https://alison.com/course/${courseId}`;
}

export async function getCourses(): Promise<LearnCourse[]> {
  return await apiFetch<LearnCourse[]>("/api/hub/learn/courses");
}

export async function getCourse(id: string): Promise<LearnCourse | null> {
  return await apiFetch<LearnCourse>(`/api/hub/learn/courses/${id}`);
}

/**
 * GAP — not wired to the real backend. `GET /learn/playbook` exists and is
 * live (verified via curl, `authed: true` required despite the registry's
 * `roles: ["any"]` note — the controller carries `@UseGuards(WawuAuthGuard)`
 * for the whole resource), but its response shape can't honestly fill this
 * screen's contract:
 *   - Playbook.downloadCount has no backend field at all (Prisma `Playbook`
 *     model has no such column) — the UI renders it as "Downloaded {n} times",
 *     so there is no truthful value to put there yet.
 *   - Chapter.pages here is a display STRING range (e.g. "1–14", rendered as
 *     "Pages {ch.pages}"); the backend's PlaybookChapter is `{title, order:
 *     number}` — a sort key, not a page range. There is no source data to
 *     derive the range from.
 * Wiring this today would either crash (rendering `undefined`) or silently
 * fabricate numbers the backend never sent. Left on mocks until the backend
 * adds `downloadCount` and a real per-chapter page range.
 */
/**
 * GET /api/hub/learn/playbook. The backend model carries everything the
 * screen renders (title, pages, format, description, chapters,
 * readingSections) — the single field it has no column for is the
 * `downloadCount` vanity counter, which is simply omitted rather than
 * fabricated. That one missing number is not a reason to serve an entirely
 * invented playbook, which is what this used to do unconditionally.
 */
interface PlaybookWire {
  id: string;
  title: string;
  author?: string | null;
  pages: number;
  format: string;
  description: string;
  /** The document itself. Null means described but nothing to hand out. */
  fileUrl?: string | null;
  chapters: { title: string; pages: string; section?: string }[];
  readingSections: { heading: string; body: string }[];
}

export async function getPlaybook(): Promise<Playbook | null> {
  try {
    const wire = await apiFetch<PlaybookWire>("/api/hub/learn/playbook", { authed: true });
    return {
      id: wire.id,
      title: wire.title,
      author: wire.author ?? undefined,
      pages: wire.pages,
      format: wire.format,
      description: wire.description,
      // Was dropped on the floor, so the Download button had nothing to hand
      // over even when the backend was holding a file.
      fileUrl: wire.fileUrl ?? null,
      chapters: wire.chapters ?? [],
      readingSections: wire.readingSections ?? [],
      // No backend column for this yet; 0 renders as "no downloads recorded"
      // rather than a made-up figure.
      downloadCount: 0,
    };
  } catch (e) {
    if (isMockModeError(e)) return getMockPlaybook();
    // 404 = no playbook published yet. That is an empty state, not a failure,
    // and must not take the whole Learn screen down with it.
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/**
 * GAP — not wired to the real backend. `GET /learn/guides` exists and is
 * live (verified via curl, public/no-auth), but the Prisma `LearnGuide`
 * model only carries the fields shared across all three kinds (id, kind,
 * title, updated, country, subtitle, readMinutes, sections, fileCount) —
 * every kind-specific content field the UI actually renders is absent
 * server-side:
 *   - CountryGuide: dutyLabel, dutyCaption, borderDaysLabel, borderDaysCaption,
 *     whyFirstHeading, whyFirstBody, whatYouNeed, crossSell — none exist.
 *   - ReferenceArticle: `summary` — absent (only `sections` exists).
 *   - TemplatePack: `description` — absent (only `fileCount` exists).
 * Mapping the real response into these frontend types would mean fabricating
 * copy the backend never sent, which is worse than staying on mocks. Left on
 * mocks until the backend's LearnGuide model carries the rest of the
 * registry's per-kind content (or the frontend type is trimmed to match it).
 */
// SEAM: replace with GET /api/hub/learn/guides
export async function getGuides(): Promise<LearnGuide[]> {
  return getMockGuides();
}
