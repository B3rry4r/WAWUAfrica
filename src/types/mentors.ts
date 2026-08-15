export interface Mentor {
  id: string;
  name: string;
  handle: string;
  field: string;
  tagline: string;
  bio: string;
  /** Integer Naira for a 45-minute session. */
  rate: number;
  rating: number;
  sessions: number;
  availability: string;
  languages: string[];
}

export interface MentorRequest {
  id: string;
  mentorId: string;
  note: string;
  status: "sent";
  sentAt: string;
}