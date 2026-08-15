import type { CourseEntitlementState, LearnCourse, LearnEntitlement, LearnGuide, Playbook } from "@/types/learn";
import { currentSession } from "@/lib/api/mocks/session";
import { creatorGates } from "@/lib/auth/gates";
import {
  enrolInCourseMock,
  getMockCourse,
  getMockCourses,
  getMockCourseUsage,
  getMockGuides,
  getMockPlaybook,
} from "./mocks/learn";

/** Basic tier → 1 free course; Pro tier → up to 3. Never invent a different split. */
function freeCoursesTotalFor(tier: "basic" | "pro"): number {
  return tier === "pro" ? 3 : 1;
}

// SEAM: replace with GET /api/hub/learn/entitlement
export async function getLearnEntitlement(): Promise<LearnEntitlement> {
  // Two independent facts, per docs/01_SPEC.md: the tier comes from the one
  // real gate (creatorGates), never a disconnected mock switch. Usage against
  // that entitlement is the only thing this mock module tracks itself.
  const gates = creatorGates(currentSession);
  const tier = gates.tier ?? "basic";
  const freeCoursesTotal = gates.isCreator ? freeCoursesTotalFor(tier) : 0;

  const usage = await getMockCourseUsage();
  const freeCoursesUsed = Math.min(usage.enrolledCourseIds.length, freeCoursesTotal);

  return {
    tier,
    isCreator: gates.isCreator,
    freeCoursesTotal,
    freeCoursesUsed,
    freeCoursesRemaining: Math.max(0, freeCoursesTotal - freeCoursesUsed),
    enrolledCourseIds: usage.enrolledCourseIds,
    progressByCourseId: usage.progressByCourseId,
    canDownloadPlaybook: true,
  };
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
 */
// SEAM: replace with POST /api/hub/learn/courses/:id/enrol
export async function enrolInCourse(courseId: string): Promise<LearnEntitlement> {
  const gates = creatorGates(currentSession);
  const tier = gates.tier ?? "basic";
  const cap = gates.isCreator ? freeCoursesTotalFor(tier) : 0;
  await enrolInCourseMock(courseId, cap);
  return getLearnEntitlement();
}

/** Alison is an external partner — courses run there, never in-app. */
export function alisonHandoffUrl(courseId: string): string {
  return `https://alison.com/course/${courseId}`;
}

// SEAM: replace with GET /api/hub/learn/courses
export async function getCourses(): Promise<LearnCourse[]> {
  return getMockCourses();
}

// SEAM: replace with GET /api/hub/content/:id
export async function getCourse(id: string): Promise<LearnCourse | null> {
  return getMockCourse(id);
}

// SEAM: replace with GET /api/hub/learn/playbook
export async function getPlaybook(): Promise<Playbook> {
  return getMockPlaybook();
}

// SEAM: replace with GET /api/hub/learn/guides
export async function getGuides(): Promise<LearnGuide[]> {
  return getMockGuides();
}
