/**
 * Role -> TaxonomyCategory -> Specialization taxonomy.
 *
 * Source of truth: section C1 of `wawuafrica-build/BUILD-BRIEF.md`. Labels here
 * are transcribed verbatim from that section, including its own capitalisation
 * and its own slashes ("Musician/Instrumentalist", "UI/UX Designer"). Do not
 * "tidy" a label to make the set look consistent; if a label is genuinely
 * wrong, change it in the brief first and re-transcribe.
 *
 * This replaces the deprecated flat 25-category list in `src/lib/categories.ts`.
 *
 * ---------------------------------------------------------------------------
 * IDS ARE A WIRE AND DATABASE CONTRACT
 * ---------------------------------------------------------------------------
 * Every id in this file is a literal, not something computed from the label at
 * runtime. The ids were derived from the labels ONCE, by slugging them, and are
 * frozen from that point on. They are persisted against user rows and sent over
 * the wire, so re-wording a display label must NEVER change the id it carries:
 * edit the label string and leave the id alone. A slug that no longer matches
 * its label is correct behaviour here, not drift.
 *
 * A specialization's full id is `<categoryId>.<specializationSlug>`, e.g.
 * `music-audio.music-artist`. The dot is URL-safe and unreserved, and a slug
 * never contains one, so the id splits unambiguously. The category prefix is
 * load-bearing, see the note on cross-listing below.
 *
 * ---------------------------------------------------------------------------
 * CROSS-LISTED SPECIALIZATIONS ARE NOT DUPLICATES
 * ---------------------------------------------------------------------------
 * The brief deliberately places some specializations under more than one
 * category: "Fashion Photographer" under both Photography and Fashion & Beauty,
 * "Gospel Artist" under both Music & Audio and Faith & Spirituality, "Software
 * Engineer" under Technology (creator) and under both Technology & IT and
 * Engineering (professional). These are different placements of the same job
 * title, and a user picking one of them is saying something different from a
 * user picking the other, including which Explore surface they appear on.
 *
 * So: do not dedupe by label. Identity is the (category, specialization) pair,
 * which is exactly what the composite id encodes. Two placements of one label
 * have two distinct ids and are two distinct entries in the model. The shared
 * `slug` is what makes them recognisably the same job title, and
 * `placementsOfSlug()` is how you walk from one placement to the others.
 */

export type SpecializationSlug = string;
export type TaxonomyCategoryId = string;
export type SpecializationId = string;

/**
 * Every role a user may hold. A user may hold several at once.
 *
 * `buyer` is a real role and appears here, but it is NOT a `TaxonomyRole`: a
 * buyer browses and buys, so there is nothing for them to be categorised as and
 * nothing to place them under on Explore. Giving buyer a category list that
 * happens to be empty would read as an unfinished transcription, and every call
 * site would then have to guess whether the emptiness was meaningful. Instead
 * the type system says it outright: `CATEGORIES_BY_ROLE` is keyed by
 * `TaxonomyRole`, so `CATEGORIES_BY_ROLE.buyer` does not typecheck at all.
 * Use `roleHasCategories()` when a role arrives as runtime data.
 */
export type Role = "creator" | "professional" | "buyer";

/** The roles that own a category list. Deliberately excludes `buyer`. */
export type TaxonomyRole = "creator" | "professional";

export interface Specialization {
  /** `<categoryId>.<slug>`. Stable, persisted, unique across the taxonomy. */
  readonly id: SpecializationId;
  /** Stable slug, shared by every placement of the same job title. */
  readonly slug: SpecializationSlug;
  readonly label: string;
  readonly categoryId: TaxonomyCategoryId;
  readonly categoryLabel: string;
  readonly role: TaxonomyRole;
}

export interface TaxonomyCategory {
  readonly id: TaxonomyCategoryId;
  readonly label: string;
  readonly role: TaxonomyRole;
  readonly specializations: readonly Specialization[];
}

export interface RoleInfo {
  readonly id: Role;
  readonly label: string;
  /**
   * Whether this role is categorised at all. `false` for buyer, and that is a
   * product fact rather than missing data.
   */
  readonly hasCategories: boolean;
}

/** `[slug, label]`. */
type RawSpecialization = readonly [string, string];
/** `[categoryId, categoryLabel, specializations]`. */
type RawCategory = readonly [string, string, readonly RawSpecialization[]];

const RAW_CREATOR: readonly RawCategory[] = [
  ["music-audio", "Music & Audio", [
    ["music-artist", "Music Artist"],
    ["singer", "Singer"],
    ["songwriter", "Songwriter"],
    ["rapper", "Rapper"],
    ["worship-leader", "Worship Leader"],
    ["gospel-artist", "Gospel Artist"],
    ["music-producer", "Music Producer"],
    ["beat-maker", "Beat Maker"],
    ["dj", "DJ"],
    ["composer", "Composer"],
    ["musician-instrumentalist", "Musician/Instrumentalist"],
    ["choir-music-group", "Choir/Music Group"],
    ["audio-engineer", "Audio Engineer"],
    ["mixing-mastering-engineer", "Mixing & Mastering Engineer"],
    ["vocal-coach", "Vocal Coach"],
    ["voice-artist", "Voice Artist"],
    ["podcaster", "Podcaster"],
    ["radio-audio-creator", "Radio/Audio Creator"],
    ["audiobook-creator", "Audiobook Creator"],
    ["sound-designer", "Sound Designer"],
    ["music-educator", "Music Educator"],
  ]],
  ["film-video", "Film & Video", [
    ["filmmaker", "Filmmaker"],
    ["film-director", "Film Director"],
    ["film-producer", "Film Producer"],
    ["actor", "Actor"],
    ["cinematographer", "Cinematographer"],
    ["videographer", "Videographer"],
    ["video-creator", "Video Creator"],
    ["youtuber", "YouTuber"],
    ["streamer", "Streamer"],
    ["documentary-creator", "Documentary Creator"],
    ["short-film-creator", "Short Film Creator"],
    ["screenwriter", "Screenwriter"],
    ["video-editor", "Video Editor"],
    ["animator", "Animator"],
    ["vfx-creator", "VFX Creator"],
    ["motion-picture-creator", "Motion Picture Creator"],
    ["film-educator", "Film Educator"],
    ["production-creator", "Production Creator"],
  ]],
  ["art-design", "Art & Design", [
    ["visual-artist", "Visual Artist"],
    ["painter", "Painter"],
    ["illustrator", "Illustrator"],
    ["digital-artist", "Digital Artist"],
    ["concept-artist", "Concept Artist"],
    ["3d-artist", "3D Artist"],
    ["sculptor", "Sculptor"],
    ["art-director", "Art Director"],
    ["graphic-designer", "Graphic Designer"],
    ["brand-designer", "Brand Designer"],
    ["ui-ux-designer", "UI/UX Designer"],
    ["product-designer", "Product Designer"],
    ["motion-designer", "Motion Designer"],
    ["creative-director", "Creative Director"],
    ["nft-digital-artist", "NFT/Digital Artist"],
    ["art-educator", "Art Educator"],
    ["craft-artist", "Craft Artist"],
  ]],
  ["photography", "Photography", [
    ["photographer", "Photographer"],
    ["portrait-photographer", "Portrait Photographer"],
    ["fashion-photographer", "Fashion Photographer"],
    ["wedding-photographer", "Wedding Photographer"],
    ["event-photographer", "Event Photographer"],
    ["commercial-photographer", "Commercial Photographer"],
    ["product-photographer", "Product Photographer"],
    ["lifestyle-photographer", "Lifestyle Photographer"],
    ["sports-photographer", "Sports Photographer"],
    ["travel-photographer", "Travel Photographer"],
    ["food-photographer", "Food Photographer"],
    ["photojournalist", "Photojournalist"],
    ["visual-storyteller", "Visual Storyteller"],
    ["photo-editor", "Photo Editor"],
    ["photography-educator", "Photography Educator"],
  ]],
  ["fashion-beauty", "Fashion & Beauty", [
    ["fashion-designer", "Fashion Designer"],
    ["fashion-creator", "Fashion Creator"],
    ["fashion-influencer", "Fashion Influencer"],
    ["stylist", "Stylist"],
    ["personal-stylist", "Personal Stylist"],
    ["model", "Model"],
    ["fashion-blogger", "Fashion Blogger"],
    ["fashion-photographer", "Fashion Photographer"],
    ["tailor", "Tailor"],
    ["clothing-creator", "Clothing Creator"],
    ["clothing-brand", "Clothing Brand"],
    ["makeup-artist", "Makeup Artist"],
    ["hair-creator", "Hair Creator"],
    ["barber", "Barber"],
    ["nail-artist", "Nail Artist"],
    ["beauty-creator", "Beauty Creator"],
    ["skincare-creator", "Skincare Creator"],
    ["beauty-influencer", "Beauty Influencer"],
    ["fragrance-creator", "Fragrance Creator"],
    ["beauty-brand", "Beauty Brand"],
  ]],
  ["writing-publishing", "Writing & Publishing", [
    ["author", "Author"],
    ["writer", "Writer"],
    ["blogger", "Blogger"],
    ["poet", "Poet"],
    ["copywriter", "Copywriter"],
    ["screenwriter", "Screenwriter"],
    ["novelist", "Novelist"],
    ["journalist", "Journalist"],
    ["essayist", "Essayist"],
    ["newsletter-creator", "Newsletter Creator"],
    ["devotional-writer", "Devotional Writer"],
    ["childrens-author", "Children's Author"],
    ["technical-writer", "Technical Writer"],
    ["research-writer", "Research Writer"],
    ["publisher", "Publisher"],
    ["digital-publisher", "Digital Publisher"],
    ["editor", "Editor"],
    ["writing-educator", "Writing Educator"],
  ]],
  ["media-content", "Media & Content", [
    ["content-creator", "Content Creator"],
    ["influencer", "Influencer"],
    ["social-media-creator", "Social Media Creator"],
    ["ugc-creator", "UGC Creator"],
    ["lifestyle-creator", "Lifestyle Creator"],
    ["digital-personality", "Digital Personality"],
    ["news-creator", "News Creator"],
    ["media-personality", "Media Personality"],
    ["broadcaster", "Broadcaster"],
    ["tv-host", "TV Host"],
    ["radio-host", "Radio Host"],
    ["commentator", "Commentator"],
    ["podcaster", "Podcaster"],
    ["interviewer", "Interviewer"],
    ["vlogger", "Vlogger"],
    ["meme-creator", "Meme Creator"],
    ["community-storyteller", "Community Storyteller"],
    ["digital-media-brand", "Digital Media Brand"],
  ]],
  ["gaming-esports", "Gaming & Esports", [
    ["gamer", "Gamer"],
    ["gaming-creator", "Gaming Creator"],
    ["gaming-streamer", "Gaming Streamer"],
    ["esports-player", "Esports Player"],
    ["esports-team", "Esports Team"],
    ["gaming-commentator", "Gaming Commentator"],
    ["gaming-analyst", "Gaming Analyst"],
    ["game-developer", "Game Developer"],
    ["game-designer", "Game Designer"],
    ["game-artist", "Game Artist"],
    ["game-reviewer", "Game Reviewer"],
    ["gaming-influencer", "Gaming Influencer"],
    ["gaming-educator", "Gaming Educator"],
    ["game-content-creator", "Game Content Creator"],
  ]],
  ["sports-fitness", "Sports & Fitness", [
    ["athlete", "Athlete"],
    ["sports-creator", "Sports Creator"],
    ["sports-influencer", "Sports Influencer"],
    ["sports-commentator", "Sports Commentator"],
    ["sports-analyst", "Sports Analyst"],
    ["sports-journalist", "Sports Journalist"],
    ["sports-coach", "Sports Coach"],
    ["personal-trainer", "Personal Trainer"],
    ["fitness-creator", "Fitness Creator"],
    ["fitness-coach", "Fitness Coach"],
    ["sports-educator", "Sports Educator"],
    ["sports-team", "Sports Team"],
    ["sports-club", "Sports Club"],
    ["dancer", "Dancer"],
    ["choreographer", "Choreographer"],
    ["yoga-wellness-instructor", "Yoga/Wellness Instructor"],
  ]],
  ["education-knowledge", "Education & Knowledge", [
    ["educator", "Educator"],
    ["teacher", "Teacher"],
    ["tutor", "Tutor"],
    ["course-creator", "Course Creator"],
    ["online-educator", "Online Educator"],
    ["trainer", "Trainer"],
    ["coach", "Coach"],
    ["mentor", "Mentor"],
    ["academic-creator", "Academic Creator"],
    ["educational-content-creator", "Educational Content Creator"],
    ["researcher", "Researcher"],
    ["academic-writer", "Academic Writer"],
    ["skills-educator", "Skills Educator"],
    ["language-educator", "Language Educator"],
    ["career-educator", "Career Educator"],
    ["business-educator", "Business Educator"],
    ["personal-development-creator", "Personal Development Creator"],
    ["knowledge-creator", "Knowledge Creator"],
  ]],
  ["business-finance", "Business & Finance", [
    ["entrepreneur", "Entrepreneur"],
    ["founder", "Founder"],
    ["business-creator", "Business Creator"],
    ["business-influencer", "Business Influencer"],
    ["business-educator", "Business Educator"],
    ["business-coach", "Business Coach"],
    ["consultant", "Consultant"],
    ["speaker", "Speaker"],
    ["leadership-creator", "Leadership Creator"],
    ["startup-creator", "Startup Creator"],
    ["finance-creator", "Finance Creator"],
    ["financial-educator", "Financial Educator"],
    ["investment-creator", "Investment Creator"],
    ["personal-finance-creator", "Personal Finance Creator"],
    ["fintech-creator", "Fintech Creator"],
    ["economics-creator", "Economics Creator"],
    ["career-creator", "Career Creator"],
    ["productivity-creator", "Productivity Creator"],
  ]],
  ["technology", "Technology", [
    ["tech-creator", "Tech Creator"],
    ["technology-influencer", "Technology Influencer"],
    ["developer", "Developer"],
    ["software-engineer", "Software Engineer"],
    ["web-developer", "Web Developer"],
    ["app-developer", "App Developer"],
    ["ai-creator", "AI Creator"],
    ["ai-educator", "AI Educator"],
    ["data-creator", "Data Creator"],
    ["cybersecurity-creator", "Cybersecurity Creator"],
    ["product-builder", "Product Builder"],
    ["tech-reviewer", "Tech Reviewer"],
    ["coding-educator", "Coding Educator"],
    ["blockchain-creator", "Blockchain Creator"],
    ["startup-tech-creator", "Startup Tech Creator"],
    ["gadget-creator", "Gadget Creator"],
    ["technology-educator", "Technology Educator"],
  ]],
  ["food-lifestyle", "Food & Lifestyle", [
    ["chef", "Chef"],
    ["food-creator", "Food Creator"],
    ["food-blogger", "Food Blogger"],
    ["food-influencer", "Food Influencer"],
    ["recipe-creator", "Recipe Creator"],
    ["baker", "Baker"],
    ["pastry-creator", "Pastry Creator"],
    ["restaurant-creator", "Restaurant Creator"],
    ["culinary-educator", "Culinary Educator"],
    ["food-photographer", "Food Photographer"],
    ["food-reviewer", "Food Reviewer"],
    ["beverage-creator", "Beverage Creator"],
    ["home-cook", "Home Cook"],
    ["lifestyle-creator", "Lifestyle Creator"],
    ["home-living-creator", "Home & Living Creator"],
    ["parenting-creator", "Parenting Creator"],
    ["personal-development-creator", "Personal Development Creator"],
    ["luxury-lifestyle-creator", "Luxury Lifestyle Creator"],
  ]],
  ["travel-adventure", "Travel & Adventure", [
    ["travel-creator", "Travel Creator"],
    ["travel-blogger", "Travel Blogger"],
    ["travel-vlogger", "Travel Vlogger"],
    ["travel-influencer", "Travel Influencer"],
    ["travel-photographer", "Travel Photographer"],
    ["adventure-creator", "Adventure Creator"],
    ["tour-creator", "Tour Creator"],
    ["destination-creator", "Destination Creator"],
    ["tourism-creator", "Tourism Creator"],
    ["travel-reviewer", "Travel Reviewer"],
    ["travel-educator", "Travel Educator"],
    ["outdoor-creator", "Outdoor Creator"],
    ["camping-creator", "Camping Creator"],
    ["exploration-creator", "Exploration Creator"],
    ["cultural-travel-creator", "Cultural Travel Creator"],
  ]],
  ["faith-spirituality", "Faith & Spirituality", [
    ["gospel-artist", "Gospel Artist"],
    ["gospel-musician", "Gospel Musician"],
    ["worship-leader", "Worship Leader"],
    ["christian-music-producer", "Christian Music Producer"],
    ["christian-filmmaker", "Christian Filmmaker"],
    ["christian-actor", "Christian Actor"],
    ["christian-writer", "Christian Writer"],
    ["christian-author", "Christian Author"],
    ["christian-podcaster", "Christian Podcaster"],
    ["christian-speaker", "Christian Speaker"],
    ["pastor-minister", "Pastor/Minister"],
    ["bible-teacher", "Bible Teacher"],
    ["faith-educator", "Faith Educator"],
    ["christian-influencer", "Christian Influencer"],
    ["gospel-content-creator", "Gospel Content Creator"],
    ["gospel-event-creator", "Gospel Event Creator"],
    ["faith-based-designer", "Faith-Based Designer"],
    ["christian-publisher", "Christian Publisher"],
    ["christian-coach", "Christian Coach"],
    ["christian-lifestyle-creator", "Christian Lifestyle Creator"],
    ["christian-media-creator", "Christian Media Creator"],
  ]],
];

const RAW_PROFESSIONAL: readonly RawCategory[] = [
  ["legal-compliance", "Legal & Compliance", [
    ["lawyer", "Lawyer"],
    ["corporate-lawyer", "Corporate Lawyer"],
    ["commercial-lawyer", "Commercial Lawyer"],
    ["intellectual-property-lawyer", "Intellectual Property Lawyer"],
    ["contract-lawyer", "Contract Lawyer"],
    ["employment-lawyer", "Employment Lawyer"],
    ["immigration-lawyer", "Immigration Lawyer"],
    ["tax-lawyer", "Tax Lawyer"],
    ["family-lawyer", "Family Lawyer"],
    ["litigation-lawyer", "Litigation Lawyer"],
    ["compliance-specialist", "Compliance Specialist"],
    ["legal-consultant", "Legal Consultant"],
    ["mediator", "Mediator"],
    ["arbitrator", "Arbitrator"],
    ["notary", "Notary"],
    ["company-secretary", "Company Secretary"],
  ]],
  ["accounting-tax", "Accounting & Tax", [
    ["accountant", "Accountant"],
    ["chartered-accountant", "Chartered Accountant"],
    ["auditor", "Auditor"],
    ["tax-consultant", "Tax Consultant"],
    ["tax-advisor", "Tax Advisor"],
    ["bookkeeper", "Bookkeeper"],
    ["financial-reporting-specialist", "Financial Reporting Specialist"],
    ["forensic-accountant", "Forensic Accountant"],
    ["payroll-specialist", "Payroll Specialist"],
    ["internal-auditor", "Internal Auditor"],
    ["risk-compliance-accountant", "Risk & Compliance Accountant"],
  ]],
  ["finance-investment", "Finance & Investment", [
    ["financial-advisor", "Financial Advisor"],
    ["investment-advisor", "Investment Advisor"],
    ["investment-analyst", "Investment Analyst"],
    ["financial-analyst", "Financial Analyst"],
    ["portfolio-manager", "Portfolio Manager"],
    ["wealth-manager", "Wealth Manager"],
    ["asset-manager", "Asset Manager"],
    ["insurance-advisor", "Insurance Advisor"],
    ["mortgage-advisor", "Mortgage Advisor"],
    ["credit-specialist", "Credit Specialist"],
    ["banking-professional", "Banking Professional"],
    ["fintech-specialist", "Fintech Specialist"],
    ["economist", "Economist"],
    ["investment-banker", "Investment Banker"],
  ]],
  ["business-consulting", "Business & Consulting", [
    ["business-consultant", "Business Consultant"],
    ["management-consultant", "Management Consultant"],
    ["strategy-consultant", "Strategy Consultant"],
    ["business-analyst", "Business Analyst"],
    ["management-professional", "Management Professional"],
    ["operations-consultant", "Operations Consultant"],
    ["project-manager", "Project Manager"],
    ["product-manager", "Product Manager"],
    ["business-development-specialist", "Business Development Specialist"],
    ["marketing-consultant", "Marketing Consultant"],
    ["sales-consultant", "Sales Consultant"],
    ["startup-advisor", "Startup Advisor"],
    ["executive-coach", "Executive Coach"],
    ["leadership-consultant", "Leadership Consultant"],
  ]],
  ["technology-it", "Technology & IT", [
    ["software-developer", "Software Developer"],
    ["software-engineer", "Software Engineer"],
    ["web-developer", "Web Developer"],
    ["mobile-app-developer", "Mobile App Developer"],
    ["full-stack-developer", "Full-Stack Developer"],
    ["front-end-developer", "Front-End Developer"],
    ["back-end-developer", "Back-End Developer"],
    ["ai-specialist", "AI Specialist"],
    ["machine-learning-engineer", "Machine Learning Engineer"],
    ["data-scientist", "Data Scientist"],
    ["data-analyst", "Data Analyst"],
    ["cybersecurity-specialist", "Cybersecurity Specialist"],
    ["cloud-engineer", "Cloud Engineer"],
    ["devops-engineer", "DevOps Engineer"],
    ["it-consultant", "IT Consultant"],
    ["systems-administrator", "Systems Administrator"],
    ["network-engineer", "Network Engineer"],
    ["blockchain-developer", "Blockchain Developer"],
    ["database-administrator", "Database Administrator"],
    ["ux-ui-professional", "UX/UI Professional"],
  ]],
  ["engineering", "Engineering", [
    ["civil-engineer", "Civil Engineer"],
    ["mechanical-engineer", "Mechanical Engineer"],
    ["electrical-engineer", "Electrical Engineer"],
    ["electronics-engineer", "Electronics Engineer"],
    ["chemical-engineer", "Chemical Engineer"],
    ["petroleum-engineer", "Petroleum Engineer"],
    ["structural-engineer", "Structural Engineer"],
    ["environmental-engineer", "Environmental Engineer"],
    ["industrial-engineer", "Industrial Engineer"],
    ["biomedical-engineer", "Biomedical Engineer"],
    ["telecommunications-engineer", "Telecommunications Engineer"],
    ["software-engineer", "Software Engineer"],
    ["agricultural-engineer", "Agricultural Engineer"],
    ["marine-engineer", "Marine Engineer"],
    ["engineering-consultant", "Engineering Consultant"],
  ]],
  ["architecture-construction", "Architecture & Construction", [
    ["architect", "Architect"],
    ["landscape-architect", "Landscape Architect"],
    ["quantity-surveyor", "Quantity Surveyor"],
    ["building-surveyor", "Building Surveyor"],
    ["urban-planner", "Urban Planner"],
    ["town-planner", "Town Planner"],
    ["construction-manager", "Construction Manager"],
    ["site-engineer", "Site Engineer"],
    ["project-manager", "Project Manager"],
    ["interior-architect", "Interior Architect"],
    ["interior-designer", "Interior Designer"],
    ["contractor", "Contractor"],
    ["builder", "Builder"],
    ["property-development-professional", "Property Development Professional"],
  ]],
  ["healthcare-medicine", "Healthcare & Medicine", [
    ["doctor", "Doctor"],
    ["general-practitioner", "General Practitioner"],
    ["specialist-physician", "Specialist Physician"],
    ["surgeon", "Surgeon"],
    ["dentist", "Dentist"],
    ["pharmacist", "Pharmacist"],
    ["nurse", "Nurse"],
    ["midwife", "Midwife"],
    ["physiotherapist", "Physiotherapist"],
    ["psychologist", "Psychologist"],
    ["nutritionist", "Nutritionist"],
    ["dietitian", "Dietitian"],
    ["optometrist", "Optometrist"],
    ["medical-laboratory-scientist", "Medical Laboratory Scientist"],
    ["radiographer", "Radiographer"],
    ["occupational-therapist", "Occupational Therapist"],
    ["public-health-specialist", "Public Health Specialist"],
    ["health-consultant", "Health Consultant"],
    ["healthcare-administrator", "Healthcare Administrator"],
  ]],
  ["education-training", "Education & Training", [
    ["teacher", "Teacher"],
    ["lecturer", "Lecturer"],
    ["professor", "Professor"],
    ["tutor", "Tutor"],
    ["academic-advisor", "Academic Advisor"],
    ["educational-consultant", "Educational Consultant"],
    ["career-counselor", "Career Counselor"],
    ["corporate-trainer", "Corporate Trainer"],
    ["skills-trainer", "Skills Trainer"],
    ["instructional-designer", "Instructional Designer"],
    ["learning-development-specialist", "Learning & Development Specialist"],
    ["education-consultant", "Education Consultant"],
    ["academic-researcher", "Academic Researcher"],
    ["language-teacher", "Language Teacher"],
    ["special-education-professional", "Special Education Professional"],
    ["admissions-consultant", "Admissions Consultant"],
  ]],
  ["marketing-communications", "Marketing & Communications", [
    ["marketing-specialist", "Marketing Specialist"],
    ["marketing-consultant", "Marketing Consultant"],
    ["digital-marketer", "Digital Marketer"],
    ["social-media-manager", "Social Media Manager"],
    ["seo-specialist", "SEO Specialist"],
    ["content-strategist", "Content Strategist"],
    ["brand-strategist", "Brand Strategist"],
    ["public-relations-specialist", "Public Relations Specialist"],
    ["communications-specialist", "Communications Specialist"],
    ["copywriter", "Copywriter"],
    ["advertising-specialist", "Advertising Specialist"],
    ["media-planner", "Media Planner"],
    ["growth-marketer", "Growth Marketer"],
    ["email-marketing-specialist", "Email Marketing Specialist"],
    ["community-manager", "Community Manager"],
    ["publicist", "Publicist"],
  ]],
  ["design-creative-services", "Design & Creative Services", [
    ["graphic-designer", "Graphic Designer"],
    ["brand-designer", "Brand Designer"],
    ["ui-ux-designer", "UI/UX Designer"],
    ["product-designer", "Product Designer"],
    ["motion-designer", "Motion Designer"],
    ["3d-designer", "3D Designer"],
    ["art-director", "Art Director"],
    ["creative-director", "Creative Director"],
    ["interior-designer", "Interior Designer"],
    ["fashion-designer", "Fashion Designer"],
    ["illustrator", "Illustrator"],
    ["animator", "Animator"],
    ["presentation-designer", "Presentation Designer"],
    ["packaging-designer", "Packaging Designer"],
    ["creative-consultant", "Creative Consultant"],
  ]],
  ["media-entertainment", "Media & Entertainment", [
    ["film-producer", "Film Producer"],
    ["film-director", "Film Director"],
    ["cinematographer", "Cinematographer"],
    ["video-producer", "Video Producer"],
    ["video-editor", "Video Editor"],
    ["photographer", "Photographer"],
    ["journalist", "Journalist"],
    ["broadcaster", "Broadcaster"],
    ["radio-presenter", "Radio Presenter"],
    ["tv-presenter", "TV Presenter"],
    ["media-consultant", "Media Consultant"],
    ["talent-manager", "Talent Manager"],
    ["entertainment-manager", "Entertainment Manager"],
    ["casting-director", "Casting Director"],
    ["production-manager", "Production Manager"],
    ["scriptwriter", "Scriptwriter"],
  ]],
  ["human-resources-careers", "Human Resources & Careers", [
    ["hr-professional", "HR Professional"],
    ["hr-consultant", "HR Consultant"],
    ["recruitment-specialist", "Recruitment Specialist"],
    ["talent-acquisition-specialist", "Talent Acquisition Specialist"],
    ["career-coach", "Career Coach"],
    ["career-consultant", "Career Consultant"],
    ["executive-recruiter", "Executive Recruiter"],
    ["compensation-specialist", "Compensation Specialist"],
    ["learning-development-specialist", "Learning & Development Specialist"],
    ["employee-relations-specialist", "Employee Relations Specialist"],
    ["organizational-development-consultant", "Organizational Development Consultant"],
    ["workplace-consultant", "Workplace Consultant"],
  ]],
  ["real-estate-property", "Real Estate & Property", [
    ["real-estate-agent", "Real Estate Agent"],
    ["realtor", "Realtor"],
    ["property-consultant", "Property Consultant"],
    ["property-manager", "Property Manager"],
    ["real-estate-developer", "Real Estate Developer"],
    ["real-estate-investment-advisor", "Real Estate Investment Advisor"],
    ["valuer", "Valuer"],
    ["quantity-surveyor", "Quantity Surveyor"],
    ["facilities-manager", "Facilities Manager"],
    ["property-lawyer", "Property Lawyer"],
    ["mortgage-consultant", "Mortgage Consultant"],
    ["real-estate-analyst", "Real Estate Analyst"],
  ]],
  ["science-research", "Science & Research", [
    ["scientist", "Scientist"],
    ["researcher", "Researcher"],
    ["research-analyst", "Research Analyst"],
    ["data-researcher", "Data Researcher"],
    ["environmental-scientist", "Environmental Scientist"],
    ["biologist", "Biologist"],
    ["chemist", "Chemist"],
    ["physicist", "Physicist"],
    ["geologist", "Geologist"],
    ["agricultural-scientist", "Agricultural Scientist"],
    ["social-scientist", "Social Scientist"],
    ["statistician", "Statistician"],
    ["laboratory-scientist", "Laboratory Scientist"],
    ["research-consultant", "Research Consultant"],
  ]],
  ["agriculture-agribusiness", "Agriculture & Agribusiness", [
    ["agronomist", "Agronomist"],
    ["agricultural-consultant", "Agricultural Consultant"],
    ["farmer", "Farmer"],
    ["farm-manager", "Farm Manager"],
    ["agricultural-economist", "Agricultural Economist"],
    ["livestock-specialist", "Livestock Specialist"],
    ["veterinary-professional", "Veterinary Professional"],
    ["fisheries-specialist", "Fisheries Specialist"],
    ["agribusiness-consultant", "Agribusiness Consultant"],
    ["agricultural-engineer", "Agricultural Engineer"],
    ["food-scientist", "Food Scientist"],
    ["agricultural-extension-specialist", "Agricultural Extension Specialist"],
  ]],
  ["beauty-personal-care", "Beauty & Personal Care", [
    ["makeup-artist", "Makeup Artist"],
    ["hair-stylist", "Hair Stylist"],
    ["barber", "Barber"],
    ["nail-technician", "Nail Technician"],
    ["beauty-therapist", "Beauty Therapist"],
    ["esthetician", "Esthetician"],
    ["skincare-specialist", "Skincare Specialist"],
    ["cosmetologist", "Cosmetologist"],
    ["personal-stylist", "Personal Stylist"],
    ["image-consultant", "Image Consultant"],
    ["beauty-consultant", "Beauty Consultant"],
  ]],
  ["travel-hospitality", "Travel & Hospitality", [
    ["travel-consultant", "Travel Consultant"],
    ["travel-agent", "Travel Agent"],
    ["tour-operator", "Tour Operator"],
    ["tour-guide", "Tour Guide"],
    ["destination-specialist", "Destination Specialist"],
    ["hospitality-manager", "Hospitality Manager"],
    ["hotel-manager", "Hotel Manager"],
    ["event-planner", "Event Planner"],
    ["concierge", "Concierge"],
    ["travel-advisor", "Travel Advisor"],
    ["tourism-consultant", "Tourism Consultant"],
  ]],
  ["logistics-transportation", "Logistics & Transportation", [
    ["logistics-consultant", "Logistics Consultant"],
    ["supply-chain-specialist", "Supply Chain Specialist"],
    ["procurement-specialist", "Procurement Specialist"],
    ["freight-forwarder", "Freight Forwarder"],
    ["customs-broker", "Customs Broker"],
    ["fleet-manager", "Fleet Manager"],
    ["transport-manager", "Transport Manager"],
    ["warehouse-manager", "Warehouse Manager"],
    ["distribution-specialist", "Distribution Specialist"],
    ["import-export-specialist", "Import/Export Specialist"],
    ["delivery-coordinator", "Delivery Coordinator"],
  ]],
  ["professional-personal-services", "Professional & Personal Services", [
    ["virtual-assistant", "Virtual Assistant"],
    ["translator", "Translator"],
    ["interpreter", "Interpreter"],
    ["business-administrator", "Business Administrator"],
    ["personal-assistant", "Personal Assistant"],
    ["project-coordinator", "Project Coordinator"],
    ["research-consultant", "Research Consultant"],
    ["technical-consultant", "Technical Consultant"],
    ["customer-experience-specialist", "Customer Experience Specialist"],
    ["executive-assistant", "Executive Assistant"],
    ["personal-organizer", "Personal Organizer"],
    ["professional-coach", "Professional Coach"],
  ]],
  ["faith-ministry", "Faith & Ministry", [
    ["pastor", "Pastor"],
    ["minister", "Minister"],
    ["bible-teacher", "Bible Teacher"],
    ["theologian", "Theologian"],
    ["ministry-consultant", "Ministry Consultant"],
    ["church-administrator", "Church Administrator"],
    ["ministry-strategist", "Ministry Strategist"],
    ["christian-counselor", "Christian Counselor"],
    ["faith-based-coach", "Faith-Based Coach"],
    ["chaplain", "Chaplain"],
    ["christian-educator", "Christian Educator"],
    ["ministry-event-professional", "Ministry Event Professional"],
  ]],
];

/* -------------------------------------------------------------------------- */
/* Derivation                                                                 */
/* -------------------------------------------------------------------------- */

function buildCategories(raw: readonly RawCategory[], role: TaxonomyRole): readonly TaxonomyCategory[] {
  return Object.freeze(
    raw.map(([categoryId, categoryLabel, specs]) =>
      Object.freeze<TaxonomyCategory>({
        id: categoryId,
        label: categoryLabel,
        role,
        specializations: Object.freeze(
          specs.map(([slug, label]) =>
            Object.freeze<Specialization>({
              id: `${categoryId}.${slug}`,
              slug,
              label,
              categoryId,
              categoryLabel,
              role,
            }),
          ),
        ),
      }),
    ),
  );
}

export const ROLES: readonly RoleInfo[] = Object.freeze([
  Object.freeze<RoleInfo>({ id: "creator", label: "Creator", hasCategories: true }),
  Object.freeze<RoleInfo>({ id: "professional", label: "Professional", hasCategories: true }),
  Object.freeze<RoleInfo>({ id: "buyer", label: "Buyer", hasCategories: false }),
]);

/**
 * Categories per categorised role, in brief order. Keyed by `TaxonomyRole`, so
 * there is no `.buyer` key to read by mistake.
 */
export const CATEGORIES_BY_ROLE: Readonly<Record<TaxonomyRole, readonly TaxonomyCategory[]>> = Object.freeze({
  creator: buildCategories(RAW_CREATOR, "creator"),
  professional: buildCategories(RAW_PROFESSIONAL, "professional"),
});

/** Every category, creator first then professional, each in brief order. */
export const CATEGORIES: readonly TaxonomyCategory[] = Object.freeze([
  ...CATEGORIES_BY_ROLE.creator,
  ...CATEGORIES_BY_ROLE.professional,
]);

/**
 * Every specialization placement, flattened. One entry per (category, label)
 * pair, so a cross-listed label appears here once per placement.
 */
export const SPECIALIZATIONS: readonly Specialization[] = Object.freeze(
  CATEGORIES.flatMap((category) => [...category.specializations]),
);

/* -------------------------------------------------------------------------- */
/* Indexes, built once at module load so no call site re-derives them          */
/* -------------------------------------------------------------------------- */

const CATEGORY_BY_ID = new Map<string, TaxonomyCategory>(CATEGORIES.map((c) => [c.id, c]));
const SPECIALIZATION_BY_ID = new Map<string, Specialization>(SPECIALIZATIONS.map((s) => [s.id, s]));

const PLACEMENTS_BY_SLUG = ((): ReadonlyMap<string, readonly Specialization[]> => {
  const map = new Map<string, Specialization[]>();
  for (const spec of SPECIALIZATIONS) {
    const bucket = map.get(spec.slug);
    if (bucket) bucket.push(spec);
    else map.set(spec.slug, [spec]);
  }
  for (const [slug, bucket] of map) map.set(slug, Object.freeze(bucket) as Specialization[]);
  return map;
})();

/* -------------------------------------------------------------------------- */
/* Counts, all computed from the data. Never hand-write one of these.          */
/* -------------------------------------------------------------------------- */

export const CATEGORY_COUNT_BY_ROLE: Readonly<Record<TaxonomyRole, number>> = Object.freeze({
  creator: CATEGORIES_BY_ROLE.creator.length,
  professional: CATEGORIES_BY_ROLE.professional.length,
});

export const CATEGORY_COUNT = CATEGORIES.length;

/** Placements, i.e. (category, specialization) pairs. Cross-listings counted once each. */
export const SPECIALIZATION_COUNT = SPECIALIZATIONS.length;

/** Distinct job titles, counting a cross-listed label only once. */
export const SPECIALIZATION_SLUG_COUNT = PLACEMENTS_BY_SLUG.size;

/** How many job titles sit under more than one category. */
export const CROSS_LISTED_SLUG_COUNT = [...PLACEMENTS_BY_SLUG.values()].filter(
  (placements) => placements.length > 1,
).length;

/* -------------------------------------------------------------------------- */
/* Lookups                                                                     */
/* -------------------------------------------------------------------------- */

const EMPTY_CATEGORIES: readonly TaxonomyCategory[] = Object.freeze([]);
const EMPTY_SPECIALIZATIONS: readonly Specialization[] = Object.freeze([]);

export function roleHasCategories(role: Role): role is TaxonomyRole {
  return role === "creator" || role === "professional";
}

export function getRole(id: string): RoleInfo | undefined {
  return ROLES.find((role) => role.id === id);
}

export function categoriesForRole(role: Role): readonly TaxonomyCategory[] {
  return roleHasCategories(role) ? CATEGORIES_BY_ROLE[role] : EMPTY_CATEGORIES;
}

export function getCategory(id: string): TaxonomyCategory | undefined {
  return CATEGORY_BY_ID.get(id);
}

/**
 * Resolve a persisted specialization id back to its full context: the
 * specialization carries its `categoryId`, `categoryLabel` and `role`, so a
 * profile chip renders from one lookup with nothing else to join against.
 */
export function getSpecialization(id: string): Specialization | undefined {
  return SPECIALIZATION_BY_ID.get(id);
}

export function specializationsForCategory(categoryId: string): readonly Specialization[] {
  return CATEGORY_BY_ID.get(categoryId)?.specializations ?? EMPTY_SPECIALIZATIONS;
}

/**
 * Every placement of one job title. For a cross-listed slug this returns more
 * than one entry, which is the point: it is how a caller offers "you are also
 * listed under Fashion & Beauty" without scanning the whole taxonomy.
 */
export function placementsOfSlug(slug: string): readonly Specialization[] {
  return PLACEMENTS_BY_SLUG.get(slug) ?? EMPTY_SPECIALIZATIONS;
}

export function isCrossListed(slug: string): boolean {
  return placementsOfSlug(slug).length > 1;
}

/** Resolve many persisted ids at once, dropping any the taxonomy no longer has. */
export function getSpecializations(ids: readonly string[]): readonly Specialization[] {
  const out: Specialization[] = [];
  for (const id of ids) {
    const spec = SPECIALIZATION_BY_ID.get(id);
    if (spec) out.push(spec);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Search                                                                      */
/* -------------------------------------------------------------------------- */

const COMBINING_MARKS = /[̀-ͯ]/g;
const SEPARATORS = /[^a-z0-9]+/g;

/**
 * Lowercase, strip accents, collapse punctuation to single spaces. Applied to
 * both the index and the query, so "UI/UX Designer" is reachable by typing
 * "ui ux", "ui/ux" or "uiux"-adjacent fragments like "ux designer", and an
 * accented query still matches an unaccented label.
 */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(SEPARATORS, " ")
    .trim();
}

interface IndexEntry {
  readonly spec: Specialization;
  readonly haystack: string;
  /** `haystack` with word boundaries padded, so a word-start test is one indexOf. */
  readonly padded: string;
  readonly categoryHaystack: string;
}

/**
 * Built once at module load: 557 normalize() calls happen here, never on a
 * keystroke. A keystroke then costs one normalize() plus a linear scan of
 * precomputed strings, which is well under a frame at this size.
 */
const SEARCH_INDEX: readonly IndexEntry[] = Object.freeze(
  SPECIALIZATIONS.map((spec) => {
    const haystack = normalize(spec.label);
    return Object.freeze<IndexEntry>({
      spec,
      haystack,
      padded: ` ${haystack} `,
      categoryHaystack: normalize(spec.categoryLabel),
    });
  }),
);

export interface SearchOptions {
  /** Restrict to one role. Omit to search creator and professional together. */
  readonly role?: Role;
  /** Restrict to one category. */
  readonly categoryId?: string;
  /** Also match on the category label, so "beauty" surfaces that category's entries. */
  readonly includeCategoryLabel?: boolean;
  /** Default 50. Pass `Infinity` for everything. */
  readonly limit?: number;
}

export interface SearchResult {
  readonly specialization: Specialization;
  /** Lower is better. 0 exact label, 1 label prefix, 2 word start, 3 substring, 4 category label. */
  readonly rank: number;
}

/**
 * Free-text search over every specialization placement. Case- and
 * accent-insensitive, matched on the display label.
 *
 * Results keep taxonomy order within a rank, so the list does not reshuffle
 * unpredictably as the query grows.
 */
export function searchSpecializations(query: string, options: SearchOptions = {}): readonly SearchResult[] {
  const { role, categoryId, includeCategoryLabel = false, limit = 50 } = options;

  const needle = normalize(query);
  const passesFilters = (entry: IndexEntry): boolean =>
    (role === undefined || entry.spec.role === role) &&
    (categoryId === undefined || entry.spec.categoryId === categoryId);

  if (needle === "") {
    const all: SearchResult[] = [];
    for (const entry of SEARCH_INDEX) {
      if (!passesFilters(entry)) continue;
      all.push({ specialization: entry.spec, rank: 3 });
      if (all.length >= limit) break;
    }
    return all;
  }

  // One bucket per rank, so ordering is a concat rather than a sort.
  const buckets: SearchResult[][] = [[], [], [], [], []];

  for (const entry of SEARCH_INDEX) {
    if (!passesFilters(entry)) continue;

    let rank = -1;
    if (entry.haystack === needle) rank = 0;
    else if (entry.haystack.startsWith(needle)) rank = 1;
    else if (entry.padded.includes(` ${needle}`)) rank = 2;
    else if (entry.haystack.includes(needle)) rank = 3;
    else if (includeCategoryLabel && entry.categoryHaystack.includes(needle)) rank = 4;

    if (rank >= 0) buckets[rank].push({ specialization: entry.spec, rank });
  }

  const results: SearchResult[] = [];
  for (const bucket of buckets) {
    for (const result of bucket) {
      if (results.length >= limit) return results;
      results.push(result);
    }
  }
  return results;
}

/** Search convenience for call sites that only want the specializations. */
export function searchSpecializationLabels(
  query: string,
  options: SearchOptions = {},
): readonly Specialization[] {
  return searchSpecializations(query, options).map((result) => result.specialization);
}
