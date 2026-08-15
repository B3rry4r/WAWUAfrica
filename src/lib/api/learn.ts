import type { LearnCourse, LearnEntitlement, LearnGuide, Playbook } from "@/types/learn";
import {
  getMockCourse,
  getMockCourses,
  getMockGuides,
  getMockLearnEntitlement,
  getMockPlaybook,
} from "./mocks/learn";

export async function getLearnEntitlement(): Promise<LearnEntitlement> {
  return getMockLearnEntitlement();
}

export async function getCourses(): Promise<LearnCourse[]> {
  return getMockCourses();
}

export async function getCourse(id: string): Promise<LearnCourse | null> {
  return getMockCourse(id);
}

export async function getPlaybook(): Promise<Playbook> {
  return getMockPlaybook();
}

export async function getGuides(): Promise<LearnGuide[]> {
  return getMockGuides();
}