/**
 * Tests for the Role -> TaxonomyCategory -> Specialization taxonomy.
 *
 * There is no test runner configured in this repo (no vitest, no jest, no
 * ts-node) and no existing test file to match a convention against, so this
 * file carries a tiny describe/it/expect harness and runs itself on Node 22+:
 *
 *   node --experimental-strip-types \
 *     --import 'data:text/javascript,import{register}from"node:module";register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){return await n(s+\".ts\",c)}}",import.meta.url);' \
 *     src/lib/taxonomy/taxonomy.test.ts
 *
 * The resolve hook is only there because the import below is extensionless, as
 * the rest of the repo's imports are; Node's type stripping wants the ".ts".
 * Adding the extension here instead would break `npm run typecheck`.
 *
 * The test bodies are written in ordinary Vitest/Jest idiom. When a real runner
 * is added, delete the harness block and its run() call at the bottom, add one
 * import, and drop the hook from the command; nothing else here changes.
 *
 * What these tests are for: catching a TRANSCRIPTION error in taxonomy.ts.
 * Every downstream screen reads that data, and a silently dropped or mistyped
 * specialization is invisible in review. Hence the exact per-category counts
 * below, which were taken from section C1 of the build brief. If a count here
 * disagrees with the data, one of the two is wrong, and the brief wins.
 */

import {
  CATEGORIES,
  CATEGORIES_BY_ROLE,
  CATEGORY_COUNT,
  CATEGORY_COUNT_BY_ROLE,
  CROSS_LISTED_SLUG_COUNT,
  ROLES,
  SPECIALIZATIONS,
  SPECIALIZATION_COUNT,
  SPECIALIZATION_SLUG_COUNT,
  categoriesForRole,
  getCategory,
  getSpecialization,
  getSpecializations,
  isCrossListed,
  placementsOfSlug,
  roleHasCategories,
  searchSpecializations,
  specializationsForCategory,
  type Role,
} from "./taxonomy";

/* -------------------------------------------------------------------------- */
/* Minimal harness. Delete this block, and its run() call at the bottom of    */
/* this file, when a real test runner lands.                                 */
/* -------------------------------------------------------------------------- */



type TestFn = () => void;

interface Suite {
  readonly name: string;
  readonly tests: ReadonlyArray<{ readonly name: string; readonly fn: TestFn }>;
}

let currentSuite: (Suite & { tests: Array<{ name: string; fn: TestFn }> }) | undefined;
const suites: Suite[] = [];

function describe(name: string, body: () => void): void {
  const suite: Suite & { tests: Array<{ name: string; fn: TestFn }> } = { name, tests: [] };
  currentSuite = suite;
  body();
  currentSuite = undefined;
  suites.push(suite);
}

function it(name: string, fn: TestFn): void {
  if (!currentSuite) throw new Error(`it("${name}") called outside describe()`);
  currentSuite.tests.push({ name, fn });
}

function show(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(show).join(", ")}]`;
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (!Object.is(actual, expected)) {
        throw new Error(`expected ${show(expected)}, received ${show(actual)}`);
      }
    },
    toEqual(expected: unknown) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) throw new Error(`expected ${b}, received ${a}`);
    },
    toHaveLength(expected: number) {
      const length = (actual as { length?: number } | null)?.length;
      if (length !== expected) throw new Error(`expected length ${expected}, received ${show(length)}`);
    },
    toBeGreaterThan(expected: number) {
      if (!(typeof actual === "number" && actual > expected)) {
        throw new Error(`expected ${show(actual)} to be greater than ${expected}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) throw new Error("expected a value, received undefined");
    },
    toBeUndefined() {
      if (actual !== undefined) throw new Error(`expected undefined, received ${show(actual)}`);
    },
  };
}

function run(): void {
  let passed = 0;
  const failures: string[] = [];
  for (const suite of suites) {
    for (const test of suite.tests) {
      try {
        test.fn();
        passed += 1;
      } catch (error) {
        failures.push(`${suite.name} > ${test.name}\n    ${(error as Error).message}`);
      }
    }
  }
  console.log(`${passed} passed, ${failures.length} failed`);
  for (const failure of failures) console.error(`FAIL ${failure}`);
  if (failures.length > 0) process.exitCode = 1;
}

/** Per-category specialization counts, read off section C1 of the build brief. */
const EXPECTED_CREATOR_COUNTS: ReadonlyArray<readonly [string, number]> = [
  ["music-audio", 21],
  ["film-video", 18],
  ["art-design", 17],
  ["photography", 15],
  ["fashion-beauty", 20],
  ["writing-publishing", 18],
  ["media-content", 18],
  ["gaming-esports", 14],
  ["sports-fitness", 16],
  ["education-knowledge", 18],
  ["business-finance", 18],
  ["technology", 17],
  ["food-lifestyle", 18],
  ["travel-adventure", 15],
  ["faith-spirituality", 21],
];

const EXPECTED_PROFESSIONAL_COUNTS: ReadonlyArray<readonly [string, number]> = [
  ["legal-compliance", 16],
  ["accounting-tax", 11],
  ["finance-investment", 14],
  ["business-consulting", 14],
  ["technology-it", 20],
  ["engineering", 15],
  ["architecture-construction", 14],
  ["healthcare-medicine", 19],
  ["education-training", 16],
  ["marketing-communications", 16],
  ["design-creative-services", 15],
  ["media-entertainment", 16],
  ["human-resources-careers", 12],
  ["real-estate-property", 12],
  ["science-research", 14],
  ["agriculture-agribusiness", 12],
  ["beauty-personal-care", 11],
  ["travel-hospitality", 11],
  ["logistics-transportation", 11],
  ["professional-personal-services", 12],
  ["faith-ministry", 12],
];

const EXPECTED_TOTAL_PLACEMENTS =
  [...EXPECTED_CREATOR_COUNTS, ...EXPECTED_PROFESSIONAL_COUNTS].reduce((sum, [, n]) => sum + n, 0);

describe("roles", () => {
  it("has creator, professional and buyer", () => {
    expect(ROLES.map((role) => role.id)).toEqual(["creator", "professional", "buyer"]);
  });

  it("marks buyer as holding no categories, and the other two as holding some", () => {
    expect(ROLES.find((role) => role.id === "buyer")?.hasCategories).toBe(false);
    expect(ROLES.find((role) => role.id === "creator")?.hasCategories).toBe(true);
    expect(ROLES.find((role) => role.id === "professional")?.hasCategories).toBe(true);
  });

  it("narrows a runtime role with roleHasCategories", () => {
    const buyer: Role = "buyer";
    expect(roleHasCategories(buyer)).toBe(false);
    expect(roleHasCategories("creator")).toBe(true);
    expect(categoriesForRole(buyer)).toHaveLength(0);
  });
});

describe("category counts", () => {
  it("has 15 creator categories", () => {
    expect(CATEGORY_COUNT_BY_ROLE.creator).toBe(15);
    expect(CATEGORIES_BY_ROLE.creator).toHaveLength(15);
  });

  it("has 21 professional categories", () => {
    expect(CATEGORY_COUNT_BY_ROLE.professional).toBe(21);
    expect(CATEGORIES_BY_ROLE.professional).toHaveLength(21);
  });

  it("has 36 categories in total", () => {
    expect(CATEGORY_COUNT).toBe(36);
    expect(CATEGORIES).toHaveLength(36);
  });

  it("lists creator categories in brief order", () => {
    expect(CATEGORIES_BY_ROLE.creator.map((c) => c.id)).toEqual(
      EXPECTED_CREATOR_COUNTS.map(([id]) => id),
    );
  });

  it("lists professional categories in brief order", () => {
    expect(CATEGORIES_BY_ROLE.professional.map((c) => c.id)).toEqual(
      EXPECTED_PROFESSIONAL_COUNTS.map(([id]) => id),
    );
  });
});

describe("specialization counts", () => {
  it("matches the brief count for every single category", () => {
    for (const [categoryId, expected] of [
      ...EXPECTED_CREATOR_COUNTS,
      ...EXPECTED_PROFESSIONAL_COUNTS,
    ]) {
      const actual = specializationsForCategory(categoryId).length;
      expect(`${categoryId}=${actual}`).toBe(`${categoryId}=${expected}`);
    }
  });

  it("has the expected total number of placements", () => {
    expect(SPECIALIZATION_COUNT).toBe(EXPECTED_TOTAL_PLACEMENTS);
    expect(SPECIALIZATION_COUNT).toBe(557);
    expect(SPECIALIZATIONS).toHaveLength(557);
  });

  it("has fewer distinct job titles than placements, because of cross-listing", () => {
    expect(SPECIALIZATION_SLUG_COUNT).toBe(512);
    expect(CROSS_LISTED_SLUG_COUNT).toBe(44);
  });

  it("accounts for every extra placement with a cross-listing", () => {
    const extra = SPECIALIZATIONS.reduce((sum, spec) => sum + (placementsOfSlug(spec.slug).length - 1), 0);
    // Each cross-listed slug with n placements contributes n*(n-1) to that sum.
    const fromPlacements = SPECIALIZATION_COUNT - SPECIALIZATION_SLUG_COUNT;
    expect(fromPlacements).toBe(45);
    expect(extra).toBeGreaterThan(0);
  });
});

describe("ids", () => {
  it("has no duplicate category ids", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate specialization ids", () => {
    const ids = SPECIALIZATIONS.map((s) => s.id);
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes).toEqual([]);
    expect(seen.size).toBe(SPECIALIZATION_COUNT);
  });

  it("composes every specialization id as categoryId.slug", () => {
    for (const spec of SPECIALIZATIONS) {
      expect(spec.id).toBe(`${spec.categoryId}.${spec.slug}`);
    }
  });

  it("uses only lowercase slug characters in every id", () => {
    for (const spec of SPECIALIZATIONS) {
      expect(/^[a-z0-9]+(-[a-z0-9]+)*\.[a-z0-9]+(-[a-z0-9]+)*$/.test(spec.id)).toBe(true);
    }
    for (const category of CATEGORIES) {
      expect(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(category.id)).toBe(true);
    }
  });

  it("has no duplicate labels inside a single category", () => {
    for (const category of CATEGORIES) {
      const labels = category.specializations.map((s) => s.label);
      expect(`${category.id}:${new Set(labels).size}`).toBe(`${category.id}:${labels.length}`);
    }
  });
});

describe("reachability", () => {
  it("resolves every specialization by id back to itself", () => {
    for (const spec of SPECIALIZATIONS) {
      expect(getSpecialization(spec.id)).toBe(spec);
    }
  });

  it("reaches every specialization from its own category", () => {
    for (const spec of SPECIALIZATIONS) {
      const category = getCategory(spec.categoryId);
      expect(category).toBeDefined();
      expect(category?.specializations.includes(spec)).toBe(true);
      expect(category?.label).toBe(spec.categoryLabel);
      expect(category?.role).toBe(spec.role);
    }
  });

  it("reaches every category from its role", () => {
    for (const category of CATEGORIES) {
      expect(categoriesForRole(category.role).includes(category)).toBe(true);
    }
  });

  it("returns empty rather than throwing for unknown ids", () => {
    expect(getCategory("not-a-category")).toBeUndefined();
    expect(getSpecialization("not-a-category.not-a-spec")).toBeUndefined();
    expect(specializationsForCategory("not-a-category")).toHaveLength(0);
    expect(placementsOfSlug("not-a-slug")).toHaveLength(0);
  });

  it("drops unknown ids when resolving a persisted set", () => {
    const resolved = getSpecializations([
      "music-audio.music-artist",
      "music-audio.does-not-exist",
      "photography.fashion-photographer",
    ]);
    expect(resolved.map((s) => s.id)).toEqual([
      "music-audio.music-artist",
      "photography.fashion-photographer",
    ]);
  });
});

describe("cross-listed specializations", () => {
  it("places Fashion Photographer under both Photography and Fashion & Beauty", () => {
    const placements = placementsOfSlug("fashion-photographer");
    expect(placements.map((s) => s.categoryId)).toEqual(["photography", "fashion-beauty"]);
    expect(placements.map((s) => s.id)).toEqual([
      "photography.fashion-photographer",
      "fashion-beauty.fashion-photographer",
    ]);
    for (const spec of placements) expect(spec.label).toBe("Fashion Photographer");
    expect(isCrossListed("fashion-photographer")).toBe(true);
  });

  it("places Gospel Artist under both Music & Audio and Faith & Spirituality", () => {
    const placements = placementsOfSlug("gospel-artist");
    expect(placements.map((s) => s.categoryId)).toEqual(["music-audio", "faith-spirituality"]);
    for (const spec of placements) expect(spec.role).toBe("creator");
  });

  it("places Software Engineer under three categories across two roles", () => {
    const placements = placementsOfSlug("software-engineer");
    expect(placements.map((s) => s.id)).toEqual([
      "technology.software-engineer",
      "technology-it.software-engineer",
      "engineering.software-engineer",
    ]);
    expect(placements.map((s) => s.role)).toEqual(["creator", "professional", "professional"]);
  });

  it("keeps cross-listed placements distinct rather than deduped", () => {
    const ids = placementsOfSlug("makeup-artist").map((s) => s.id);
    expect(ids).toEqual(["fashion-beauty.makeup-artist", "beauty-personal-care.makeup-artist"]);
    expect(new Set(ids).size).toBe(2);
  });

  it("reports a single-placement specialization as not cross-listed", () => {
    expect(isCrossListed("rapper")).toBe(false);
    expect(placementsOfSlug("rapper")).toHaveLength(1);
  });
});

describe("label transcription spot checks", () => {
  const cases: ReadonlyArray<readonly [string, string]> = [
    ["music-audio.musician-instrumentalist", "Musician/Instrumentalist"],
    ["music-audio.choir-music-group", "Choir/Music Group"],
    ["music-audio.radio-audio-creator", "Radio/Audio Creator"],
    ["music-audio.mixing-mastering-engineer", "Mixing & Mastering Engineer"],
    ["writing-publishing.childrens-author", "Children's Author"],
    ["art-design.nft-digital-artist", "NFT/Digital Artist"],
    ["art-design.ui-ux-designer", "UI/UX Designer"],
    ["technology-it.ux-ui-professional", "UX/UI Professional"],
    ["technology-it.full-stack-developer", "Full-Stack Developer"],
    ["technology-it.front-end-developer", "Front-End Developer"],
    ["sports-fitness.yoga-wellness-instructor", "Yoga/Wellness Instructor"],
    ["faith-spirituality.pastor-minister", "Pastor/Minister"],
    ["faith-spirituality.faith-based-designer", "Faith-Based Designer"],
    ["logistics-transportation.import-export-specialist", "Import/Export Specialist"],
    ["education-training.learning-development-specialist", "Learning & Development Specialist"],
    ["accounting-tax.risk-compliance-accountant", "Risk & Compliance Accountant"],
    ["food-lifestyle.home-living-creator", "Home & Living Creator"],
  ];

  it("keeps punctuation and casing exactly as the brief wrote it", () => {
    for (const [id, label] of cases) {
      expect(getSpecialization(id)?.label).toBe(label);
    }
  });

  it("keeps the first and last entry of each role's first category", () => {
    const music = getCategory("music-audio");
    expect(music?.label).toBe("Music & Audio");
    expect(music?.specializations[0]?.label).toBe("Music Artist");
    expect(music?.specializations[music.specializations.length - 1]?.label).toBe("Music Educator");

    const legal = getCategory("legal-compliance");
    expect(legal?.label).toBe("Legal & Compliance");
    expect(legal?.specializations[0]?.label).toBe("Lawyer");
    expect(legal?.specializations[legal.specializations.length - 1]?.label).toBe("Company Secretary");
  });

  it("names the creator technology category Technology, not Technology & IT", () => {
    expect(getCategory("technology")?.label).toBe("Technology");
    expect(getCategory("technology")?.role).toBe("creator");
    expect(getCategory("technology-it")?.label).toBe("Technology & IT");
    expect(getCategory("technology-it")?.role).toBe("professional");
  });

  it("uses no em-dash in any user-visible label", () => {
    const offenders = [
      ...CATEGORIES.filter((c) => c.label.includes("\u2014")).map((c) => c.id),
      ...SPECIALIZATIONS.filter((s) => s.label.includes("\u2014")).map((s) => s.id),
      ...ROLES.filter((r) => r.label.includes("\u2014")).map((r) => r.id),
    ];
    expect(offenders).toEqual([]);
  });

  it("has a non-empty label for everything", () => {
    for (const category of CATEGORIES) expect(category.label.trim().length > 0).toBe(true);
    for (const spec of SPECIALIZATIONS) expect(spec.label.trim().length > 0).toBe(true);
  });
});

describe("search", () => {
  it("finds an exact label first", () => {
    const results = searchSpecializations("Music Artist");
    expect(results[0]?.specialization.id).toBe("music-audio.music-artist");
    expect(results[0]?.rank).toBe(0);
  });

  it("is case-insensitive", () => {
    const lower = searchSpecializations("photographer").map((r) => r.specialization.id);
    const upper = searchSpecializations("PHOTOGRAPHER").map((r) => r.specialization.id);
    const mixed = searchSpecializations("PhOtOgRaPhEr").map((r) => r.specialization.id);
    expect(upper).toEqual(lower);
    expect(mixed).toEqual(lower);
    expect(lower.length > 1).toBe(true);
  });

  it("is accent-insensitive", () => {
    expect(searchSpecializations("Cin\u00e9matographer").map((r) => r.specialization.id)).toEqual(
      searchSpecializations("Cinematographer").map((r) => r.specialization.id),
    );
    expect(searchSpecializations("d\u00e9veloper").length > 0).toBe(true);
  });

  it("treats punctuation as a separator so slashed labels are reachable", () => {
    const bySlash = searchSpecializations("UI/UX").map((r) => r.specialization.id);
    const bySpace = searchSpecializations("ui ux").map((r) => r.specialization.id);
    expect(bySlash).toEqual(bySpace);
    expect(bySlash.includes("art-design.ui-ux-designer")).toBe(true);
  });

  it("ranks a prefix above a mid-word substring", () => {
    const results = searchSpecializations("photo");
    const prefixIndex = results.findIndex((r) => r.specialization.label === "Photographer");
    const wordIndex = results.findIndex((r) => r.specialization.label === "Portrait Photographer");
    expect(prefixIndex >= 0).toBe(true);
    expect(wordIndex >= 0).toBe(true);
    expect(prefixIndex < wordIndex).toBe(true);
  });

  it("returns both placements of a cross-listed label", () => {
    const ids = searchSpecializations("Fashion Photographer").map((r) => r.specialization.id);
    expect(ids.includes("photography.fashion-photographer")).toBe(true);
    expect(ids.includes("fashion-beauty.fashion-photographer")).toBe(true);
  });

  it("filters by role", () => {
    const creatorOnly = searchSpecializations("software engineer", { role: "creator" });
    expect(creatorOnly.map((r) => r.specialization.id)).toEqual(["technology.software-engineer"]);

    const professionalOnly = searchSpecializations("software engineer", { role: "professional" });
    expect(professionalOnly.map((r) => r.specialization.id)).toEqual([
      "technology-it.software-engineer",
      "engineering.software-engineer",
    ]);
  });

  it("returns nothing for a role that holds no categories", () => {
    expect(searchSpecializations("lawyer", { role: "buyer" })).toHaveLength(0);
  });

  it("filters by category", () => {
    const results = searchSpecializations("designer", { categoryId: "design-creative-services" });
    expect(results.length > 0).toBe(true);
    for (const result of results) {
      expect(result.specialization.categoryId).toBe("design-creative-services");
    }
  });

  it("honours the limit and defaults to 50", () => {
    expect(searchSpecializations("e", { limit: 5 })).toHaveLength(5);
    expect(searchSpecializations("", { limit: 3 })).toHaveLength(3);
    expect(searchSpecializations("e").length <= 50).toBe(true);
    expect(searchSpecializations("", { limit: Infinity })).toHaveLength(SPECIALIZATION_COUNT);
  });

  it("returns an empty list for a term that is not in the taxonomy", () => {
    expect(searchSpecializations("zzzzz-not-a-job")).toHaveLength(0);
  });

  it("matches a category label only when asked to", () => {
    // "personal care" is in the Beauty & Personal Care category label and in no
    // specialization label anywhere, so it isolates the opt-in cleanly.
    const labelOnly = searchSpecializations("personal care", { limit: Infinity });
    const withCategory = searchSpecializations("personal care", {
      includeCategoryLabel: true,
      limit: Infinity,
    });
    expect(labelOnly).toHaveLength(0);
    expect(withCategory).toHaveLength(specializationsForCategory("beauty-personal-care").length);
    for (const result of withCategory) {
      expect(result.specialization.categoryId).toBe("beauty-personal-care");
      expect(result.rank).toBe(4);
    }
  });

  it("still prefers a label match over a category match", () => {
    // "agribusiness" hits both "Agribusiness Consultant" and its category label.
    const results = searchSpecializations("agribusiness", {
      includeCategoryLabel: true,
      limit: Infinity,
    });
    expect(results[0]?.specialization.label).toBe("Agribusiness Consultant");
    expect(results.length).toBeGreaterThan(1);
  });

  it("keeps taxonomy order inside one rank", () => {
    const ids = searchSpecializations("gospel", { limit: Infinity }).map((r) => r.specialization.id);
    const taxonomyOrder = SPECIALIZATIONS.filter((s) => ids.includes(s.id)).map((s) => s.id);
    const byRank = [0, 1, 2, 3, 4].flatMap((rank) =>
      searchSpecializations("gospel", { limit: Infinity })
        .filter((r) => r.rank === rank)
        .map((r) => r.specialization.id),
    );
    expect(ids).toEqual(byRank);
    expect(taxonomyOrder.length).toBe(ids.length);
  });
});

describe("immutability", () => {
  it("freezes the exported collections", () => {
    expect(Object.isFrozen(CATEGORIES)).toBe(true);
    expect(Object.isFrozen(SPECIALIZATIONS)).toBe(true);
    expect(Object.isFrozen(CATEGORIES_BY_ROLE)).toBe(true);
    expect(Object.isFrozen(CATEGORIES[0])).toBe(true);
    expect(Object.isFrozen(SPECIALIZATIONS[0])).toBe(true);
  });
});

run();
