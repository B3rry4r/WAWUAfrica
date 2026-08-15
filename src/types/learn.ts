export interface LearnCourse {
  id: string;
  title: string;
  category: string;
  lessons: number;
  minutes: number;
  /** Integer Naira; 0 = free. */
  price: number;
  host: { wawuId: string; name: string };
  rating: number;
  students: number;
  overview: string;
  whatYouLearn: string[];
}

export interface Playbook {
  id: string;
  title: string;
  pages: number;
  format: string;
  description: string;
  chapters: { title: string; pages: string }[];
}

export interface LearnGuide {
  id: string;
  country: string;
  title: string;
  pages: number;
}

/** Basic tier → 1 free course; Pro → the full catalogue. Locked split. */
export interface LearnEntitlement {
  tier: "basic" | "pro";
  freeCourses: number;
  totalCourses: number;
  canDownloadPlaybook: boolean;
}