import type { VerificationState } from "@/types/verification";
import { mockVerification } from "./verification";

export interface MockComment {
  name: string;
  /** The author's ticks. Rendered beside their name, same as everywhere else. */
  verification: VerificationState;
  avatarUrl: string | null;
  time: string;
  text: string;
  likes: number;
  author: boolean;
  /** Server comment id — undefined only on the optimistic row before the POST settles. */
  id?: string;
  /** Whether the signed-in caller liked this comment. Defaults to false. */
  likedByMe?: boolean;
}

/** Stand-in comment thread until comments are served by the backend. */
export const mockComments: MockComment[] = [
  { name: "Emeka Obi", verification: mockVerification([]), avatarUrl: null, time: "3h", text: "Page 19 alone paid for this. I have been pricing my tomatoes wrong for two years.", likes: 12, author: false },
  { name: "Zainab Bello", verification: mockVerification(["professional"]), avatarUrl: null, time: "3h", text: "That page took the longest to write. Glad it landed.", likes: 4, author: true },
  { name: "Musa Danladi", verification: mockVerification(["creator"]), avatarUrl: null, time: "1d", text: "Does the margin sheet work for services too, or only goods?", likes: 2, author: false },
];