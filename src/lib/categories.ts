/**
 * The WAWU category taxonomy.
 *
 * ONE list, used by every surface that reads or writes a category:
 *  - the publishing wizard (the create entry point for content)
 *  - explore filters and the category index
 *  - creator discovery and search facets
 *  - the backend's create-content validator (mirrored in WAWU-Hub-API's
 *    src/common/categories.ts — keep the two in step)
 *
 * A category with no way to file something under it is a dead filter, so the
 * rule is: anything that can appear in a category must have a create point
 * that offers the same 25 options. `CATEGORY_IDS` is what both ends validate
 * against.
 */

export type CategoryId =
  | "agriculture_food"
  | "trade_commerce"
  | "business_entrepreneurship"
  | "finance"
  | "technology"
  | "education"
  | "healthcare"
  | "employment"
  | "entertainment_creative"
  | "beauty"
  | "family_lifestyle"
  | "culture_heritage"
  | "religion_faith"
  | "travel_tourism"
  | "real_estate"
  | "transport_logistics"
  | "manufacturing"
  | "energy_utilities"
  | "media_communications"
  | "professional_services"
  | "legal_services"
  | "insurance_pensions"
  | "sports_fitness"
  | "government_public"
  | "social_impact";

export interface Category {
  id: CategoryId;
  name: string;
  /** Lucide icon name, used by the explore grid and the wizard's picker. */
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "agriculture_food", name: "Agriculture & Food", icon: "Wheat" },
  { id: "trade_commerce", name: "Trade & Commerce", icon: "ShoppingCart" },
  { id: "business_entrepreneurship", name: "Business & Entrepreneurship", icon: "Briefcase" },
  { id: "finance", name: "Finance & Financial Services", icon: "Landmark" },
  { id: "technology", name: "Technology & Innovation", icon: "Cpu" },
  { id: "education", name: "Education & Training", icon: "GraduationCap" },
  { id: "healthcare", name: "Healthcare & Wellness", icon: "HeartPulse" },
  { id: "employment", name: "Employment & Careers", icon: "UserCheck" },
  { id: "entertainment_creative", name: "Entertainment & Creative Arts", icon: "Music" },
  { id: "beauty", name: "Beauty & Personal Care", icon: "Sparkles" },
  { id: "family_lifestyle", name: "Family & Lifestyle", icon: "Home" },
  { id: "culture_heritage", name: "Culture & Heritage", icon: "Landmark" },
  { id: "religion_faith", name: "Religion & Faith", icon: "Church" },
  { id: "travel_tourism", name: "Travel & Tourism", icon: "Plane" },
  { id: "real_estate", name: "Real Estate & Housing", icon: "Building2" },
  { id: "transport_logistics", name: "Transportation & Logistics", icon: "Truck" },
  { id: "manufacturing", name: "Manufacturing & Industry", icon: "Factory" },
  { id: "energy_utilities", name: "Energy & Utilities", icon: "Zap" },
  { id: "media_communications", name: "Media & Communications", icon: "Radio" },
  { id: "professional_services", name: "Professional Services", icon: "Handshake" },
  { id: "legal_services", name: "Legal Services", icon: "Scale" },
  { id: "insurance_pensions", name: "Insurance & Pensions", icon: "ShieldCheck" },
  { id: "sports_fitness", name: "Sports & Fitness", icon: "Dumbbell" },
  { id: "government_public", name: "Government & Public Services", icon: "Building" },
  { id: "social_impact", name: "Social Impact & Community Development", icon: "Users" },
];

export const CATEGORY_IDS: CategoryId[] = CATEGORIES.map((c) => c.id);

const BY_ID = new Map<string, Category>(CATEGORIES.map((c) => [c.id, c]));

export function categoryName(id: string): string {
  return BY_ID.get(id)?.name ?? id;
}

export function isCategoryId(value: string): value is CategoryId {
  return BY_ID.has(value);
}
