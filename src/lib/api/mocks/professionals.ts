import type { ProfessionalListing } from "@/types/professional";
import type { CategoryId } from "@/lib/categories";
import { delay } from "../client";
import { mockVerification } from "./verification";

/**
 * The professional directory, for the fixture build.
 *
 * WHY THIS EXISTS. `listProfessionals` was live-only, so in a fixture build
 * the directory was empty, Explore's professional rail had nothing, and - the
 * reason it was noticed - a PROFESSIONAL's profile could not be seen at all.
 * The Services tab and the "Listed professional" block on Overview are both
 * driven off this call, so with it throwing, the professional account type
 * rendered exactly like a creator with one tab missing.
 *
 * Keyed to the explore creator fixtures ON PURPOSE. A professional account is
 * the same person as a creator account here - one WAWU ID, possibly both
 * roles (spec-platform-journey.jpg: "choose role... multiple allowed"). So
 * Adaeze is a creator who is ALSO a listed Business Strategist, and opening
 * her profile shows both her content and her services, which is the case the
 * profile screen has to get right and the one a separate fixture set would
 * never produce.
 *
 * Reached ONLY through the mock-mode fallback.
 */
const LISTINGS: ProfessionalListing[] = [
  {
    id: "pro-adaeze",
    wawuId: "wawu-adaeze",
    name: "Adaeze Okonkwo",
    handle: "adaezeokonkwo",
    avatarUrl: "/mock/creators/p1.jpg",
    category: "business_entrepreneurship" as CategoryId,
    headline: "Business strategist, 15 years with small traders",
    services: ["Business registration", "Growth planning", "Pitch review"],
    verification: mockVerification(["professional"]),
    pieceCount: 4,
    dmEnabled: true,
    dmPrice: 5000,
    dmResponseHours: 24,
  },
  {
    id: "pro-funmi",
    wawuId: "wawu-funmi",
    name: "Funmi Adeyemi",
    handle: "funmiadeyemi",
    avatarUrl: "/mock/creators/p2.jpg",
    category: "finance" as CategoryId,
    headline: "Chartered accountant for shops and market traders",
    services: ["Bookkeeping", "Tax filing", "Payroll"],
    verification: mockVerification(["professional"]),
    pieceCount: 6,
    dmEnabled: true,
    dmPrice: 7500,
    dmResponseHours: 48,
  },
  {
    id: "pro-zainab",
    wawuId: "wawu-zainab",
    name: "Zainab Bello",
    handle: "zainabbello",
    avatarUrl: "/mock/creators/p3.jpg",
    category: "agriculture_food" as CategoryId,
    headline: "Agribusiness trainer, post-harvest and pricing",
    services: ["Storage planning", "Pricing", "Cooperative setup"],
    verification: mockVerification(["professional"]),
    pieceCount: 3,
    // Listed, but not taking paid messages. The profile has to render this
    // without inventing a rate for somebody who has not set one.
    dmEnabled: false,
    dmPrice: null,
    dmResponseHours: 24,
  },
];

// SEAM: replace with GET /api/hub/professionals
export async function getMockProfessionals(category?: CategoryId): Promise<ProfessionalListing[]> {
  await delay(220);
  return category ? LISTINGS.filter((p) => p.category === category) : [...LISTINGS];
}
