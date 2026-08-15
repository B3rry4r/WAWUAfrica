import type { LearnCourse, LearnEntitlement, LearnGuide, Playbook } from "@/types/learn";
import {
  getMockCourse,
  getMockCourses,
  getMockGuides,
  getMockLearnEntitlement,
  getMockPlaybook,
} from "./mocks/learn";

// SEAM: replace with GET /api/hub/learn/entitlement
export async function getLearnEntitlement(): Promise<LearnEntitlement> {
  return getMockLearnEntitlement();
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