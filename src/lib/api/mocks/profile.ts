import type { CreatorProfile } from "@/types/profile";
import { delay } from "../client";

/**
 * Mock follow state shared across every surface (explore rows, profile headers).
 * Persisted under its own localStorage key so it survives a reload — the seed
 * alone reset on every page load, so a profile the user stopped following
 * yesterday was back to "Following" this morning, and the two call sites
 * rendering the same profile drifted apart. Hydrated once at module load on
 * the client; `wawu-zainab` stays in the seed because the explore mock's
 * own creator rows hardcode her row, so a fresh profile still has one
 * credible follow to demo with.
 */
const FOLLOW_STORAGE_KEY = "wawu-web-following";

function readStoredFollowing(): Set<string> {
  const seed = new Set(["wawu-zainab"]);
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(FOLLOW_STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return seed;
    parsed.forEach((id) => {
      if (typeof id === "string") seed.add(id);
    });
    return seed;
  } catch {
    // Corrupt/unavailable storage — behave as a fresh profile rather than throw.
    return seed;
  }
}

export const MOCK_PROFILE_FOLLOWING: Set<string> = readStoredFollowing();

function persistFollowing(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify([...MOCK_PROFILE_FOLLOWING]));
  } catch {
    // Storage unavailable (private-mode quota, etc.) — the in-memory set still
    // keeps this session consistent; it just won't survive the reload.
  }
}

// SEAM: replace with GET /api/hub/creators/:wawuId/follow
export async function getMockProfileFollowing(wawuId: string): Promise<boolean> {
  await delay(80);
  return MOCK_PROFILE_FOLLOWING.has(wawuId);
}

// SEAM: replace with POST /api/hub/creators/:wawuId/follow
export async function toggleMockProfileFollow(wawuId: string): Promise<boolean> {
  await delay(150);
  if (MOCK_PROFILE_FOLLOWING.has(wawuId)) {
    MOCK_PROFILE_FOLLOWING.delete(wawuId);
    persistFollowing();
    return false;
  }
  MOCK_PROFILE_FOLLOWING.add(wawuId);
  persistFollowing();
  return true;
}

/**
 * Sync point for a REAL POST/DELETE /api/hub/creators/:wawuId/follow write
 * (see profile.ts toggleFollowProfile) — keeps this local state consistent
 * after a real write succeeds, since isFollowing has no real backend
 * equivalent to re-check against (follow-relationship.controller.ts only
 * exposes the two write endpoints, no GET).
 */
export function setMockProfileFollowing(wawuId: string, following: boolean): void {
  if (following) MOCK_PROFILE_FOLLOWING.add(wawuId);
  else MOCK_PROFILE_FOLLOWING.delete(wawuId);
  persistFollowing();
}

export const MOCK_PROFILES: Record<string, CreatorProfile> = {
  "wawu-adaeze": {
    wawuId: "wawu-adaeze",
    name: "Adaeze Okonkwo",
    handle: "adaezeokonkwo",
    bio: "I turn market traders into registered businesses. CAC, pricing, bookkeeping, plain and practical.",
    verification: "certified_professional",
    plan: "pro",
    stats: { followers: "2.4k", piecesLabel: "Pieces", pieces: 4, evg: 1240 },
    dmEnabled: true,
    dmPrice: 300,
    dmResponseHours: 24,
    location: "Enugu, Nigeria",
    memberSince: "March 2025",
    replyTime: "Usually replies within 6 hours",
    categories: ["Business", "Trade", "Finance"],
    socials: { instagram: "adaezeokonkwo", website: "adaezeokonkwo.com" },
    content: [
      { id: "adaeze-cac7", title: "CAC in 7 days", kindLabel: "Course · 6 lessons", price: 2500, locked: true },
      { id: "adaeze-pricing", title: "Stall pricing", kindLabel: "Video · 12 min", price: 0, locked: false },
      { id: "adaeze-sheet", title: "Market pricing sheet", kindLabel: "PDF · 8 pages", price: 2500, locked: true },
    ],
    communities: [
      { id: "adaeze-ogbete", name: "Traders of Ogbete", memberCount: 2140, kind: "open", joined: true },
      { id: "adaeze-circle", name: "Adaeze's inner circle", memberCount: 180, kind: "private", joined: false },
    ],
    products: [
      { id: "adaeze-playbook", name: "Playbook, printed", price: 7500, platform: "basket" },
      { id: "adaeze-ledger", name: "Ledger notebook", price: 3200, platform: "basket" },
      { id: "adaeze-folder", name: "Filing folder set", price: 2000, platform: "basket" },
    ],
  },
  "wawu-chidi": {
    wawuId: "wawu-chidi",
    name: "Chidi Umeh",
    handle: "chidiumeh",
    bio: "New creator sharing what I learn about local farming and food markets.",
    verification: "basic",
    plan: "basic",
    stats: { followers: "12", piecesLabel: "Pieces", pieces: 0, evg: 4 },
    dmEnabled: false,
    dmPrice: 0,
    dmResponseHours: 72,
    categories: ["Agriculture"],
    socials: {},
    content: [],
    communities: [],
    products: [],
  },
  "wawu-funmi": {
    wawuId: "wawu-funmi",
    name: "Funmi Adeyemi",
    handle: "funmiadeyemi",
    bio: "Accountant. Small-business books, taxes, and the numbers that keep you afloat.",
    verification: "certified_professional",
    plan: "basic",
    stats: { followers: "980", piecesLabel: "Pieces", pieces: 6, evg: 820 },
    dmEnabled: true,
    dmPrice: 200,
    dmResponseHours: 48,
    location: "Lagos, Nigeria",
    memberSince: "January 2025",
    replyTime: "Usually replies within 2 hours",
    categories: ["Finance", "Business"],
    socials: { website: "funmiadeyemi.com" },
    content: [
      { id: "funmi-basics", title: "Bookkeeping basics", kindLabel: "Course · 10 lessons", price: 1500, locked: true },
      { id: "funmi-tax", title: "TVA in plain words", kindLabel: "Video · 9 min", price: 0, locked: false },
    ],
    communities: [{ id: "funmi-books", name: "Small-business books", memberCount: 540, kind: "open", joined: true }],
    products: [{ id: "funmi-template", name: "Expense tracker template", price: 1200, platform: "basket" }],
  },
  "wawu-zainab": {
    wawuId: "wawu-zainab",
    name: "Zainab Bello",
    handle: "zainabbello",
    bio: "Agribusiness trainer. From plot to profit, drip farming, records, and market timing.",
    verification: "verified_business",
    plan: "basic",
    stats: { followers: "1.6k", piecesLabel: "Pieces", pieces: 3, evg: 540 },
    dmEnabled: true,
    dmPrice: 150,
    dmResponseHours: 168,
    location: "Kano, Nigeria",
    memberSince: "May 2025",
    replyTime: "Usually replies within 1 day",
    categories: ["Agriculture", "Trade"],
    socials: { instagram: "zainabagro" },
    content: [
      { id: "zainab-drip", title: "Drip farming setup", kindLabel: "Video · 14 min", price: 1000, locked: true },
      { id: "zainab-plan", title: "Seasonal planting plan", kindLabel: "PDF · 6 pages", price: 0, locked: false },
    ],
    communities: [{ id: "zainab-farmers", name: "Young farmers network", memberCount: 3200, kind: "open", joined: true }],
    products: [],
  },
  "wawu-musa": {
    wawuId: "wawu-musa",
    name: "Musa Danladi",
    handle: "musadanladi",
    bio: "Welder and trainer. Teaching the trade that feeds the whole block.",
    verification: "basic",
    plan: "basic",
    stats: { followers: "410", piecesLabel: "Pieces", pieces: 3, evg: 210 },
    dmEnabled: false,
    dmPrice: 0,
    dmResponseHours: 24,
    location: "Kaduna, Nigeria",
    memberSince: "July 2025",
    replyTime: "Usually replies within 3 days",
    categories: ["Trade", "Career"],
    socials: {},
    content: [{ id: "musa-weld", title: "First welds", kindLabel: "Video · 11 min", price: 0, locked: false }],
    communities: [],
    products: [],
  },
  "wawu-ifeanyi": {
    wawuId: "wawu-ifeanyi",
    name: "Ifeanyi Nwosu",
    handle: "ifeanyinwosu",
    bio: "Fashion designer. Patterns, finishing, and turning a customer's idea into a sale.",
    verification: "verified_business",
    plan: "pro",
    stats: { followers: "3.1k", piecesLabel: "Pieces", pieces: 5, evg: 1980 },
    dmEnabled: true,
    dmPrice: 500,
    dmResponseHours: 72,
    location: "Aba, Nigeria",
    memberSince: "February 2025",
    replyTime: "Usually replies within 4 hours",
    categories: ["Creative arts", "Trade"],
    socials: { instagram: "ifeanyi.aba" },
    content: [
      { id: "ifeanyi-pattern", title: "Pattern drafting 101", kindLabel: "Course · 8 lessons", price: 3000, locked: true },
      { id: "ifeanyi-finish", title: "Clean finishing", kindLabel: "Video · 18 min", price: 0, locked: false },
    ],
    communities: [{ id: "ifeanyi-tailors", name: "Aba tailors circle", memberCount: 760, kind: "private", joined: false }],
    products: [
      { id: "ifeanyi-tape", name: "Measuring tape kit", price: 1500, platform: "basket" },
      { id: "ifeanyi-book", name: "Pattern paper pads", price: 800, platform: "beauty" },
    ],
  },
};

// SEAM: replace with GET /api/hub/creators/:wawuId
export async function getMockCreatorProfile(wawuId: string): Promise<CreatorProfile> {
  await delay(350);
  const profile = MOCK_PROFILES[wawuId];
  if (!profile) throw new Error(`Creator not found: ${wawuId}`);
  return profile;
}

/** Join state per community is mocked in-memory so buttons stay interactive. */
const MOCK_JOINED = new Set<string>();

// SEAM: replace with POST /api/hub/communities/:id/join
export async function toggleMockCommunityJoin(wawuId: string, communityId: string): Promise<boolean> {
  await delay(150);
  const key = `${wawuId}:${communityId}`;
  if (MOCK_JOINED.has(key)) {
    MOCK_JOINED.delete(key);
    return false;
  }
  MOCK_JOINED.add(key);
  return true;
}

// SEAM: replace with GET /api/hub/communities/:id/joined
export function isMockCommunityJoined(wawuId: string, communityId: string): boolean {
  return MOCK_JOINED.has(`${wawuId}:${communityId}`);
}

/**
 * Sync point for a REAL POST /api/hub/communities/:id/join write (see
 * profile.ts toggleCommunityJoin) — keeps this local state consistent after
 * a real join succeeds. There is no equivalent for leaving: the real
 * Community contract (community.controller.ts) has no DELETE/unjoin
 * endpoint at all, so that direction stays mock-only indefinitely until one
 * exists.
 */
export function setMockCommunityJoined(wawuId: string, communityId: string, joined: boolean): void {
  const key = `${wawuId}:${communityId}`;
  if (joined) MOCK_JOINED.add(key);
  else MOCK_JOINED.delete(key);
}