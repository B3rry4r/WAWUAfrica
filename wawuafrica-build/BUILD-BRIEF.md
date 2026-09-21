# WAWUAfrica — Build Brief

You are working on **WAWUAfrica**, a Nigerian creator + professional marketplace (live at wawuafrica.com). It ships on web and mobile. Dark UI.

This is **not a greenfield build**. The app is shipped and in trouble: screens exist that were reported done and are not, taxonomies are wrong, several surfaces look unprofessional, and at least one upload path is silently broken. This brief replaces all previous scope.

Read the entire brief before writing any code. Do not start with whatever is easiest.

---

## PART A — HOW YOU WILL WORK

### A1. Use the installed skills — at the scope given here, not wholesale

This repo's owner maintains skills that already encode the failure modes this project has suffered. **Load and follow them.** Do not paraphrase them, do not build parallel versions of their tooling, do not decide a mandatory phase is unnecessary.

But they were each written for a specific shape of job, and this job is not a clean match for all of them. **The scope column below is binding — it overrides the skills' own default assumptions about what runs.**

| Skill | Scope here | Why, and what to skip |
|---|---|---|
| `legacy-app-repair` | **Phase 0 only**, plus its core laws throughout. | Phase 0 makes the truth measurable before you form an impression. **Skip Phase 1 entirely** — it ranks a *family* of repos to decide where to spend a day. There is one repo and it is already chosen. Its Phases 2–4 are absorbed by the harness and the build order below. |
| `verification-harness` | **Full. No caveats.** | This one fits exactly. Install the gates, the render harness and the live gate. Every rule in this brief that matters is enforced by an exit code, not by this document. |
| `design-change-adoption` | **Core laws 1–3 and the templates only.** | Take: the authority declaration (`DECISIONS.md`), canvas-authoritative-for-design-not-for-fact, committing the references into the repo, `SCREEN-AGENT-BRIEF.md`, `SHARED-CHANGES.md` and its four queues, and the halt conditions. **Do NOT run `canvas_inventory.py`, `canvas_diff.py`, `coverage.py` or `build_rulings.py`.** They parse `.dc.html` artboards with ids and structure hashes. The references here are JPG screenshots — there is nothing to parse. Do not adapt the regexes, do not invent artboard ids, and above all **do not fabricate an inventory to satisfy a phase.** Pair references to screens by hand, in a plain table. |
| `frontend-surface-build` | **Full, with Phase 2 conditional.** | Phase 5 (measure in a real browser) is mandatory and is the point of the skill. **Phase 2 assumes an API contract exists to generate types from.** If this repo has no frozen contract, establishing one is the first task and no screen agent starts until it exists — do not let a screen agent hand-write a response shape as a workaround. That is exactly what law 4 forbids. |
| `qa-audit` | **Full, authored by an agent that built nothing in scope.** | See the note on Phase 4 in A4 below — the references are already pictures, so the design-render step does not apply and must not be reported as a failure. |

### A1b. The pipeline serves the build, not the reverse

These skills create artifacts: `.pipeline-ui/`, `.qa-audit/`, `.legacy-repair/`, `DECISIONS.md`, `SHARED-CHANGES.md`, `invariants.md`, `surface-map.json`. Those exist to make the work checkable. They are not the work.

**If at the end of a run you have produced scaffolding, inventories and reports but no working screens, you have failed.** Proportion the effort accordingly: the artifacts should be a thin, honest record of real building, never a substitute for it. A phase that produces a file and no change to the product is a phase you did wrong.

Equally: do not skip an artifact because it feels like overhead. The record is what makes "done" checkable by someone other than you, and someone other than you *will* check.

### A1c. The laws that this project will test hardest

Restated so you cannot claim you did not see them:

- **A law that is not an exit code is not a law.** Where a gate exists, the gate is what holds. Do not edit a gate to stop it firing on your change. Fix the code, or baseline it with a real owner and a real reason.
- **Check `files scanned: N` on the first gate run.** A clean report over an unexamined directory is the exact failure the harness exists to catch. Exit code `2` is inconclusive, not a pass.
- **Assert capability, never the absence of errors.** "The screen renders" and "no error view present" are not verification. "A user can create a listing, set a price, and see it appear on their public store link" is.
- **Measured, not eyeballed.** Every claim about layout, colour, contrast, spacing or interaction is read from computed values in a real browser. "It looks right" and "the class is there" are not evidence.
- **Compare pictures with pictures.** Never a screenshot against source code.
- **A figure with no writer is a fake.** Before shipping any screen that shows a number or makes a promise, name what writes it. If nothing does, that is the finding — do not substitute a plausible value.
- **Report what ran, not what you hoped ran.** An unrun check is reported as unrun. "I could not verify this here, and why" is a complete, valid result. Silence reads as a pass, and that is how this project got here.

### A2. Known-hostile context — read this before you start

Industry data on AI-built software in 2026 describes precisely the failure pattern this repo already exhibits. You are not exempt from it:

- 74% of organisations report at least a quarter of AI-generated code needs significant post-deployment rework; 82% suffered a major production failure from AI code within six months. Code that *reads* well is not code that *runs* right.
- Addy Osmani's "80% problem": agents get to a plausible 80% fast, and the remaining 20% — error handling, retry logic, auth edges, real data, observability — is a distinct category of work that decides whether the thing survives contact with users. Assume you are being asked for the 20%, not the 80%.
- The single most expensive documented pattern in this codebase's own history: **the agent that wrote a screen certified that screen**. 188 self-certified "matches the design, element by element" claims, and the owner found ten defects in an hour, including a third of the product that had never been rendered at all because it lived behind a modal and no route-walk could reach it.

The owner of this project has been burned by exactly this. He will open the app and check. Build accordingly.

### A3. Ground yourself in UX before you design anything

Do not design from instinct or from what the current app happens to do. Before Part C, **research and write down** the principles you will apply, then apply them consistently:

- Mobile-first information architecture for marketplaces — how discovery, identity, and transaction surfaces relate on small screens.
- Nielsen's heuristics, WCAG 2.2 AA (contrast, target size, focus visibility, motion), and touch-target minimums.
- Established patterns for: multi-step onboarding with taxonomy selection, two-sided marketplace profiles, storefront pages reached from a shared link by a logged-out visitor, and verification/trust badging.
- Progressive disclosure for long taxonomies. You are about to build a selector over ~530 specializations. Naive rendering of that is the single biggest UX risk in this brief.

**Every screen and every design decision must have a stated reason.** Record them in `DECISIONS.md` as you go: what you chose, what you rejected, and why — in terms of user outcome, not preference. A screen with no recorded reasoning is not finished. If you cannot articulate why a control is where it is, it is in the wrong place.

**UX must be seamless.** No dead ends, no screens that leave a user stuck, no flows that require going back to a previous screen to proceed. Every state a user can reach must have an exit. Every error must say what to do next.

### A4. The reference screens are templates, not decoration

The reference screens ship with this brief in the **`refs/` folder beside this file**. They are NOT all design targets — five are captures of the current, rejected app, two are bug evidence, and two are marketing infographics. **Each filename is prefixed with its class (`target-`, `spec-`, `reject-`, `bug-`, `annotated-`), and A4b below states what each one is. Read it before you open any of them.** **These are the design targets, explicitly given by the owner as templates to follow.** Copy the `refs/` folder into the repo under a stable path and commit it — do not paraphrase them into a spec document that will go stale.

**They are already pictures.** This matters for `qa-audit` Phase 4: there is no design-render step to run, `render_design.py` does not apply, and a missing canvas is **not** a reason to mark screens `conformance: unverified`. Put the reference JPGs directly into `design_shots/` and compare app captures against them. Two practical notes:

- **The composite sets contain six phone screens in one image.** Crop them into individual screens so each pairs 1:1 with a built screen. A composite cannot be compared against a single capture.
- **Name each cropped reference after the screen it depicts** (`profile_desktop`, `explore_mobile_learning`), so a later audit can pair render to reference without re-deriving anything.

Three things about the references themselves:

1. **They are authoritative for structure, layout, flow and copy tone.** Where the backend does not serve what a reference needs, that is a written change request against the backend — not a quietly reshaped screen. This inversion is the whole reason `design-change-adoption` is in scope: the correct instinct in a shipped codebase is "don't break the working thing," and applying it here is exactly how this goes wrong.
2. **They are NOT authoritative for fact.** Prices, fees, and legal text in a drawing are a drawing. Where a reference disagrees with the figures in Part B, Part B wins. Where something is genuinely ambiguous, halt and ask — adopt neither side silently.
3. **They must be improved, not merely copied, and they must work at both ends.** The desktop references do not translate directly to mobile; the owner has said so himself. Produce a design that is correct at the smallest supported desktop width *and* on mobile, deriving the responsive behaviour deliberately rather than letting a desktop layout squash. Measure at the smallest supported desktop width first, per `frontend-surface-build` law 8. "It looks like a stretched mobile view" has been the complaint five times already.

### A4b. Reference manifest — which image is which

**Do not guess which image is a target.** Six of the supplied images are captures of the *current, rejected* app. Rebuilding toward one of those would reproduce the exact thing this brief exists to replace. Every image is classified below. Treat this table as authoritative; if a file is not in it, ask before using it.

| File (in `refs/`) | Class | What it is | Drives |
|---|---|---|---|
| `target-profile-desktop.jpg` | **TARGET** | Desktop profile layout — left sidebar nav, cover, avatar, verified tick, role line, location, specialization chips, Overview/Content/Products/Events/Services tabs, Featured Content strip, About, Social Links, Skills & Expertise, right rail with Creator Tools / tier / Profile Strength / Opportunities. | **C2** — the primary profile reference |
| `target-explore-desktop-structure.jpg` | **TARGET** | Desktop Explore — category chip row (All, Music, Film & Video, Art & Design, Sports, Fashion, Writing, More), Featured Creators, Upcoming Events, Professional Services, **Learning & Growth**. | **C4** — take the **overall page structure** from this. It already contains the Learning & Growth section C4 asks for |
| `target-explore-desktop-tiles.jpg` | **TARGET** | Desktop Explore, alternative — hero carousel, then a 12-tile service icon grid (Pay Bills, Events & Tickets, Find Professionals, Find Creators, Book Consultation, Advertise, Shop, Legal, Loans, Pensions, Travel, Telemedicine), Featured This Week, Top Services. | **C4** — take the **service tile grid treatment** from this and combine it with the structure above |
| `target-mobile-set-1.jpg` · `target-mobile-set-2.jpg` · `target-mobile-set-3.jpg` | **TARGET (composite)** | Three renderings of the same six-screen mobile set: Home, Profile, Services, Events, Learning, Marketplace. Sets 2 and 3 are higher-fidelity variants of set 1; prefer them where they differ. | **C2, C4, C9** — mobile derivation. **Crop each into six named single screens before use** (A4) |
| `target-home-mobile.jpg` | **TARGET** | Mobile Home — TGIF card, "What would you like to do today?" action row, Trending Activities. The owner's note: *"I sent how the Home Screen should look but with our icons and brand. Not so busy."* | **C9** — follow the structure, substitute WAWU's own icons, and **reduce the visual density relative to this image** |
| `spec-upload-categories.jpg` | **SPEC** | Product Upload Categories infographic — eight listing types, a six-step upload flow, and the plan split (Free Creator: 5 active listings). Contains the "Select Specialties (multiple)" step. | **B2, C1** — upload flow logic. **Not a UI target**; it is a marketing diagram, do not build screens that look like it |
| `spec-platform-journey.jpg` | **SPEC** | Platform journey infographic — sign up → verify → choose role (Creator / Professional / Buyer, multiple allowed) → explore → discover → purchase → fulfilment. | **C1, B3** — confirms one account may hold several roles. **Not a UI target** |
| `reject-explore-mobile.jpg` | CURRENT — **reject** | Live mobile Explore: flat text rows. The owner's words: *"this what we have is boring."* | **C4** — the "before". Do not reproduce it |
| `reject-profile-mobile.jpg` | CURRENT — **reject** | Live profile: BASIC badge, 0 Published, Creator dashboard row, ₦0, no cover, no tabs, no chips, no featured content. | **C2** — the "before" |
| `reject-bills-payment.jpg` | CURRENT — **reject** | Live Bills Payment: full-width purple/teal/red/amber colour-block tiles, scrolls endlessly on desktop. | **C6, A5** — the "before", and the clearest violation of the palette rule |
| `reject-offer-services-pillwall.jpg` | CURRENT — **reject** | Live "Offer your services": vertical wall of rounded category pills. Copy reads *"They pay to send the first message."* | **C5** — the "before", and the pill wall to eliminate |
| `reject-category-pillwall.jpg` | CURRENT — **reject** | Live category selector: the deprecated flat 25-category list, as a pill wall. Includes Travel & Tourism. | **C1, C5** — the deprecated taxonomy and the pattern to kill |
| `bug-edit-profile-broken-images.jpg` | CURRENT — **bug evidence** | Edit Profile with avatar and cover both rendering as broken-image placeholders. | **C2** — this is the upload bug, not a design note |
| `bug-notifications-plain.jpg` | CURRENT — **bug evidence** | Notifications: plain text rows. Also shows a live WAWU Credits trial state. | **C8** — the "before". Raise the Credits system as an open question rather than building around it |
| `annotated-bills-payment-circled.jpg` | **ANNOTATED** | Live Explore with **Bills Payment circled twice in red by the owner**. The only image he marked by hand. | **C6** — his single most explicit pointer; treat the circled element as priority |

**How to use this table:**

1. A `TARGET` image is what the screen should become. Compare built captures against it in `qa-audit` Phase 4.
2. A `CURRENT — reject` image is what the screen looks like now. It is the **before**, supplied so you can see what is being replaced and confirm you have actually replaced it. **Never pair a built capture against one of these as though it were a design.** They are useful in exactly one way: a built screen that still resembles its reject image has not been rebuilt.
3. A `SPEC` image carries product logic, not visual direction. Read the flow out of it; do not imitate its styling.
4. `ANNOTATED` marks carry the owner's direct instruction and outrank inference.

Where a screen in Part C has **no** reference image — the taxonomy/specialization selector (C1), the shareable store link landing view (C3), the wallet balance / earnings / withdrawal screens (C7), the admin push composer (C8), and the cross-sell blocks that C10 places across existing screens — there is no template, and you design it from the principles in A3 and A5, recording your reasoning in `DECISIONS.md`. **Do not borrow the styling of a `CURRENT — reject` image to fill that gap.** An undesigned screen is designed fresh, against the same visual language as the targets.

### A5. Visual language — purple is an accent, not a wash

The brand is purple and lilac. **The current app overuses it.** Correct this deliberately:

- **Purple/lilac is an accent colour**, carrying emphasis, brand moments, active states, and the creator verification tick. It is not the default fill for every surface, card, button and tile.
- **White, near-white, and neutral greys are permitted and encouraged** — for primary buttons, text, surfaces, borders, and controls. A white primary button on dark is correct and should be used where it serves hierarchy better than a purple one.
- **The only other permitted colours are semantic**: green for the professional verification tick, red for destructive actions, amber for warnings. Nothing else.
- **Kill the multi-colour tile pattern.** The current Bills Payment screen runs purple, teal, red and amber colour-block tiles side by side. That is the clearest violation of the brand rule and it goes.
- **All colour lives in the token layer.** No raw hex outside it — `verification-harness`'s `hardcoded_signals` gate enforces this.

Restraint is the instruction. Let one thing per screen be the emphatic thing and keep everything around it quiet.

### A6. Component and interaction floor

- **Never fork a component.** A variant is a prop. A second copy is a second truth that drifts.
- **Never hand-type a wire shape.** Types come from the API contract.
- **Every interactive element is interactive**: hover, focus-visible, active, disabled — each measured, each with a visible computed change. A hover state below ~1.3:1 contrast against its surface is invisible and is a defect even though the class is present. Confirm `cursor: pointer`. Confirm keyboard focus is reachable.
- **Every designed state must be reachable**, and each records the condition that enters it. An unreachable state is a finding, not an omission.

---

## PART B — WHAT THE PRODUCT IS

### B1. Monetisation

There is **no subscription tier**. Registration, profile creation and listing are free. Revenue comes from discrete paid actions:

| Action | Price | Notes |
|---|---|---|
| Creator verification | ₦4,999 / year | **Purple tick** |
| Professional verification | ₦9,999 / year | **Green tick** |
| Pay to be featured | TBC — build configurable | Featured placement for the week on Explore |
| Pay to advertise | TBC — build configurable | Promoted placement |
| Community chat tokens | TBC — build configurable | Joining a community is free; sending messages costs tokens |

Remove the ₦5,000 verification listing from the website footer. Remove all subscription UI. Do not gate uploads behind payment.

Where a price is TBC: build the mechanism, make the amount configurable, and mark it with `verification-harness`'s `PROVISIONAL` marker with a real owner and reason. **Do not invent a naira figure.**

**Verification is the primary upsell. Build it as a first-class system, not a badge:**
- Unverified creators and professionals receive persistent, recurring prompts to verify, and each prompt states the concrete benefits of verifying.
- The two ticks are visually distinct and render **everywhere a user appears** — profile, cards, search results, carousels, comments, listings.
- Verification state is server-authoritative and drives real permissions (see B3).

### B2. Upload rules

- **Maximum 5 items per account** (products, content or services). Hard cap, enforced server-side.
- **No free content.** Every listing carries a price. The platform is strictly for sales and consultation. Do not build or retain any free-upload path.
- Moderation on every upload before it goes live.
- Listing types: digital content, physical products, events & tickets, services, consultations & bookings, courses & learning.

### B3. Permissions

| Capability | Buyer | Unverified creator/professional | Verified creator/professional |
|---|---|---|---|
| Browse, buy, book | Yes | Yes | Yes |
| Create profile, list up to 5 items | No | Yes | Yes |
| **Host an event** | **No** | **No** | **Yes** |
| Get featured / advertise | No | Paid | Paid |

Event hosting is verified-only. A buyer cannot host under any circumstance — they must register as a creator or professional, then verify.

**Enforce server-side, not by hiding a button.** And where an ineligible user encounters the control, it must explain what they need to do to become eligible — never fail silently, never simply disappear. That explanation is a conversion surface, not an error.

---

## PART C — WHAT TO BUILD

### C1. Taxonomy: Role → Category → Specialization

The largest missing piece, and the dependency for everything else. Build it first.

The app currently has **one flat list of 25 mixed categories** shared by everyone, doing double duty as both browse-filter and identity. Replace it.

**Model:**
- A user may hold multiple roles: **Creator**, **Professional**, **Buyer**.
- Each role has its own **Category** list (tier 1). Category determines where a user appears when someone browses Explore.
- Each Category has a **Specialization** list (tier 2). Specialization is the user's actual identity — rendered as chips on their profile, and used for search, filtering and matching.
- Users select one or more categories, then one or more specializations within them.

**Where it surfaces:** onboarding (role → category → specialization); profile chips with an add affordance; the service/consultation upload flow as a "select specialties (multiple)" step; Explore browse placement; and "Find a professional" matching.

**UX warning.** This is ~530 specializations across 36 categories. A flat scrolling list is unusable, and a wall of rounded pills is what the owner has already rejected as unprofessional. Design this properly: searchable, progressively disclosed, grouped, with the selected set always visible and removable. Research the pattern before you build it and record your reasoning.

#### Creator categories (15)

Music & Audio · Film & Video · Art & Design · Photography · Fashion & Beauty · Writing & Publishing · Media & Content · Gaming & Esports · Sports & Fitness · Education & Knowledge · Business & Finance · Technology · Food & Lifestyle · Travel & Adventure · Faith & Spirituality

**Creator specializations:**

*Music & Audio:* Music Artist, Singer, Songwriter, Rapper, Worship Leader, Gospel Artist, Music Producer, Beat Maker, DJ, Composer, Musician/Instrumentalist, Choir/Music Group, Audio Engineer, Mixing & Mastering Engineer, Vocal Coach, Voice Artist, Podcaster, Radio/Audio Creator, Audiobook Creator, Sound Designer, Music Educator

*Film & Video:* Filmmaker, Film Director, Film Producer, Actor, Cinematographer, Videographer, Video Creator, YouTuber, Streamer, Documentary Creator, Short Film Creator, Screenwriter, Video Editor, Animator, VFX Creator, Motion Picture Creator, Film Educator, Production Creator

*Art & Design:* Visual Artist, Painter, Illustrator, Digital Artist, Concept Artist, 3D Artist, Sculptor, Art Director, Graphic Designer, Brand Designer, UI/UX Designer, Product Designer, Motion Designer, Creative Director, NFT/Digital Artist, Art Educator, Craft Artist

*Photography:* Photographer, Portrait Photographer, Fashion Photographer, Wedding Photographer, Event Photographer, Commercial Photographer, Product Photographer, Lifestyle Photographer, Sports Photographer, Travel Photographer, Food Photographer, Photojournalist, Visual Storyteller, Photo Editor, Photography Educator

*Fashion & Beauty:* Fashion Designer, Fashion Creator, Fashion Influencer, Stylist, Personal Stylist, Model, Fashion Blogger, Fashion Photographer, Tailor, Clothing Creator, Clothing Brand, Makeup Artist, Hair Creator, Barber, Nail Artist, Beauty Creator, Skincare Creator, Beauty Influencer, Fragrance Creator, Beauty Brand

*Writing & Publishing:* Author, Writer, Blogger, Poet, Copywriter, Screenwriter, Novelist, Journalist, Essayist, Newsletter Creator, Devotional Writer, Children's Author, Technical Writer, Research Writer, Publisher, Digital Publisher, Editor, Writing Educator

*Media & Content:* Content Creator, Influencer, Social Media Creator, UGC Creator, Lifestyle Creator, Digital Personality, News Creator, Media Personality, Broadcaster, TV Host, Radio Host, Commentator, Podcaster, Interviewer, Vlogger, Meme Creator, Community Storyteller, Digital Media Brand

*Gaming & Esports:* Gamer, Gaming Creator, Gaming Streamer, Esports Player, Esports Team, Gaming Commentator, Gaming Analyst, Game Developer, Game Designer, Game Artist, Game Reviewer, Gaming Influencer, Gaming Educator, Game Content Creator

*Sports & Fitness:* Athlete, Sports Creator, Sports Influencer, Sports Commentator, Sports Analyst, Sports Journalist, Sports Coach, Personal Trainer, Fitness Creator, Fitness Coach, Sports Educator, Sports Team, Sports Club, Dancer, Choreographer, Yoga/Wellness Instructor

*Education & Knowledge:* Educator, Teacher, Tutor, Course Creator, Online Educator, Trainer, Coach, Mentor, Academic Creator, Educational Content Creator, Researcher, Academic Writer, Skills Educator, Language Educator, Career Educator, Business Educator, Personal Development Creator, Knowledge Creator

*Business & Finance:* Entrepreneur, Founder, Business Creator, Business Influencer, Business Educator, Business Coach, Consultant, Speaker, Leadership Creator, Startup Creator, Finance Creator, Financial Educator, Investment Creator, Personal Finance Creator, Fintech Creator, Economics Creator, Career Creator, Productivity Creator

*Technology:* Tech Creator, Technology Influencer, Developer, Software Engineer, Web Developer, App Developer, AI Creator, AI Educator, Data Creator, Cybersecurity Creator, Product Builder, Tech Reviewer, Coding Educator, Blockchain Creator, Startup Tech Creator, Gadget Creator, Technology Educator

*Food & Lifestyle:* Chef, Food Creator, Food Blogger, Food Influencer, Recipe Creator, Baker, Pastry Creator, Restaurant Creator, Culinary Educator, Food Photographer, Food Reviewer, Beverage Creator, Home Cook, Lifestyle Creator, Home & Living Creator, Parenting Creator, Personal Development Creator, Luxury Lifestyle Creator

*Travel & Adventure:* Travel Creator, Travel Blogger, Travel Vlogger, Travel Influencer, Travel Photographer, Adventure Creator, Tour Creator, Destination Creator, Tourism Creator, Travel Reviewer, Travel Educator, Outdoor Creator, Camping Creator, Exploration Creator, Cultural Travel Creator

*Faith & Spirituality:* Gospel Artist, Gospel Musician, Worship Leader, Christian Music Producer, Christian Filmmaker, Christian Actor, Christian Writer, Christian Author, Christian Podcaster, Christian Speaker, Pastor/Minister, Bible Teacher, Faith Educator, Christian Influencer, Gospel Content Creator, Gospel Event Creator, Faith-Based Designer, Christian Publisher, Christian Coach, Christian Lifestyle Creator, Christian Media Creator

#### Professional categories (21)

Legal & Compliance · Accounting & Tax · Finance & Investment · Business & Consulting · Technology & IT · Engineering · Architecture & Construction · Healthcare & Medicine · Education & Training · Marketing & Communications · Design & Creative Services · Media & Entertainment · Human Resources & Careers · Real Estate & Property · Science & Research · Agriculture & Agribusiness · Beauty & Personal Care · Travel & Hospitality · Logistics & Transportation · Professional & Personal Services · Faith & Ministry

**Professional specializations:**

*Legal & Compliance:* Lawyer, Corporate Lawyer, Commercial Lawyer, Intellectual Property Lawyer, Contract Lawyer, Employment Lawyer, Immigration Lawyer, Tax Lawyer, Family Lawyer, Litigation Lawyer, Compliance Specialist, Legal Consultant, Mediator, Arbitrator, Notary, Company Secretary

*Accounting & Tax:* Accountant, Chartered Accountant, Auditor, Tax Consultant, Tax Advisor, Bookkeeper, Financial Reporting Specialist, Forensic Accountant, Payroll Specialist, Internal Auditor, Risk & Compliance Accountant

*Finance & Investment:* Financial Advisor, Investment Advisor, Investment Analyst, Financial Analyst, Portfolio Manager, Wealth Manager, Asset Manager, Insurance Advisor, Mortgage Advisor, Credit Specialist, Banking Professional, Fintech Specialist, Economist, Investment Banker

*Business & Consulting:* Business Consultant, Management Consultant, Strategy Consultant, Business Analyst, Management Professional, Operations Consultant, Project Manager, Product Manager, Business Development Specialist, Marketing Consultant, Sales Consultant, Startup Advisor, Executive Coach, Leadership Consultant

*Technology & IT:* Software Developer, Software Engineer, Web Developer, Mobile App Developer, Full-Stack Developer, Front-End Developer, Back-End Developer, AI Specialist, Machine Learning Engineer, Data Scientist, Data Analyst, Cybersecurity Specialist, Cloud Engineer, DevOps Engineer, IT Consultant, Systems Administrator, Network Engineer, Blockchain Developer, Database Administrator, UX/UI Professional

*Engineering:* Civil Engineer, Mechanical Engineer, Electrical Engineer, Electronics Engineer, Chemical Engineer, Petroleum Engineer, Structural Engineer, Environmental Engineer, Industrial Engineer, Biomedical Engineer, Telecommunications Engineer, Software Engineer, Agricultural Engineer, Marine Engineer, Engineering Consultant

*Architecture & Construction:* Architect, Landscape Architect, Quantity Surveyor, Building Surveyor, Urban Planner, Town Planner, Construction Manager, Site Engineer, Project Manager, Interior Architect, Interior Designer, Contractor, Builder, Property Development Professional

*Healthcare & Medicine:* Doctor, General Practitioner, Specialist Physician, Surgeon, Dentist, Pharmacist, Nurse, Midwife, Physiotherapist, Psychologist, Nutritionist, Dietitian, Optometrist, Medical Laboratory Scientist, Radiographer, Occupational Therapist, Public Health Specialist, Health Consultant, Healthcare Administrator

*Education & Training:* Teacher, Lecturer, Professor, Tutor, Academic Advisor, Educational Consultant, Career Counselor, Corporate Trainer, Skills Trainer, Instructional Designer, Learning & Development Specialist, Education Consultant, Academic Researcher, Language Teacher, Special Education Professional, Admissions Consultant

*Marketing & Communications:* Marketing Specialist, Marketing Consultant, Digital Marketer, Social Media Manager, SEO Specialist, Content Strategist, Brand Strategist, Public Relations Specialist, Communications Specialist, Copywriter, Advertising Specialist, Media Planner, Growth Marketer, Email Marketing Specialist, Community Manager, Publicist

*Design & Creative Services:* Graphic Designer, Brand Designer, UI/UX Designer, Product Designer, Motion Designer, 3D Designer, Art Director, Creative Director, Interior Designer, Fashion Designer, Illustrator, Animator, Presentation Designer, Packaging Designer, Creative Consultant

*Media & Entertainment:* Film Producer, Film Director, Cinematographer, Video Producer, Video Editor, Photographer, Journalist, Broadcaster, Radio Presenter, TV Presenter, Media Consultant, Talent Manager, Entertainment Manager, Casting Director, Production Manager, Scriptwriter

*Human Resources & Careers:* HR Professional, HR Consultant, Recruitment Specialist, Talent Acquisition Specialist, Career Coach, Career Consultant, Executive Recruiter, Compensation Specialist, Learning & Development Specialist, Employee Relations Specialist, Organizational Development Consultant, Workplace Consultant

*Real Estate & Property:* Real Estate Agent, Realtor, Property Consultant, Property Manager, Real Estate Developer, Real Estate Investment Advisor, Valuer, Quantity Surveyor, Facilities Manager, Property Lawyer, Mortgage Consultant, Real Estate Analyst

*Science & Research:* Scientist, Researcher, Research Analyst, Data Researcher, Environmental Scientist, Biologist, Chemist, Physicist, Geologist, Agricultural Scientist, Social Scientist, Statistician, Laboratory Scientist, Research Consultant

*Agriculture & Agribusiness:* Agronomist, Agricultural Consultant, Farmer, Farm Manager, Agricultural Economist, Livestock Specialist, Veterinary Professional, Fisheries Specialist, Agribusiness Consultant, Agricultural Engineer, Food Scientist, Agricultural Extension Specialist

*Beauty & Personal Care:* Makeup Artist, Hair Stylist, Barber, Nail Technician, Beauty Therapist, Esthetician, Skincare Specialist, Cosmetologist, Personal Stylist, Image Consultant, Beauty Consultant

*Travel & Hospitality:* Travel Consultant, Travel Agent, Tour Operator, Tour Guide, Destination Specialist, Hospitality Manager, Hotel Manager, Event Planner, Concierge, Travel Advisor, Tourism Consultant

*Logistics & Transportation:* Logistics Consultant, Supply Chain Specialist, Procurement Specialist, Freight Forwarder, Customs Broker, Fleet Manager, Transport Manager, Warehouse Manager, Distribution Specialist, Import/Export Specialist, Delivery Coordinator

*Professional & Personal Services:* Virtual Assistant, Translator, Interpreter, Business Administrator, Personal Assistant, Project Coordinator, Research Consultant, Technical Consultant, Customer Experience Specialist, Executive Assistant, Personal Organizer, Professional Coach

*Faith & Ministry:* Pastor, Minister, Bible Teacher, Theologian, Ministry Consultant, Church Administrator, Ministry Strategist, Christian Counselor, Faith-Based Coach, Chaplain, Christian Educator, Ministry Event Professional

**Migration.** The flat 25-category list is deprecated. Map existing users onto the new taxonomy where an obvious equivalent exists; prompt the rest to re-select on next login, with a path that does not block them out of the app. Record the mapping as a decision. Remove "Travel & Hotels" from the services grid; that slot becomes Courses.

### C2. Profile page — rebuild

Build to the desktop reference, then derive the mobile layout deliberately.

**Main column:** cover image · avatar · name with verification tick · role line · location · store link occupying the website field when the user has no external site · specialization chips with an add affordance · stat row · tab bar.

**Tabs:** Overview · Content · Products · Events · Services. Each lists that category's items **with prices**.

**Featured section:** the user's featured content, products and services, with prices.

**Side panel (desktop) / stacked section (mobile):** Social Links · Skills & Expertise · About.

**Owner vs visitor:** the same page. The only difference is that the owner sees an Edit control. **Do not build two templates** — a forked profile screen will drift, and `verification-harness`'s `forks` gate will fail it.

**The profile is a storefront, and a storefront is an entry point.** Beyond the user's own listings, a profile must also surface platform-wide entry points: bills payment, events, trainings available, shop — plus a call to join. A visitor arriving from a shared link must be able to reach the rest of the platform from there.

**Bug:** profile picture and cover photo uploads currently render as broken-image placeholders on the Edit Profile screen. Both are broken. Fix the upload and the rendering, and verify with a real file against the real backend — not a fixture.

### C3. Shareable store links

- Every user gets a copyable profile link in the form `wawu/their-name`.
- Opening it goes **straight to their store**. No login wall, no registration prompt, no interstitial.
- Registration is required **only at checkout**.
- The landing view carries the cross-sell surfaces from C2 and a clear call to join.

This flow must be walked end to end as a logged-out visitor, per `qa-audit`'s actor × entry-state × branch enumeration. A logged-out visitor is a distinct actor, not an afterthought.

### C4. Explore page — rebuild

Current Explore is flat text rows and is unacceptable. Rebuild on the category-first structure, taking the service tile treatment from the icon-grid reference:

1. Hero carousel
2. Category chips for browsing
3. Service tile grid — icon tiles, restrained palette, responsive grid, **not** full-width stacked rows
4. Featured Creators
5. **Featured This Week** — creators, professionals, events and services in one carousel. This is the paid featured placement from B1.
6. Upcoming Events
7. Professional Services
8. **Learning & Growth** — courses (music production, filmmaking, content creation, music business)

Remove: **People You May Like** (redundant against Featured This Week) and **Travel & Hotels** from the services grid.

Tapping any person anywhere opens their full profile.

### C5. "Apply to be listed" / "Offer your own services" — rebuild

Both are currently vertical walls of rounded category pills. This is the specific thing the owner has called unprofessional, and it is the pattern to eliminate everywhere.

**Rebuild both on the Professionals screen pattern**: icon tile, title, one-line description, chevron, grouped under section headers. Apply the same treatment to the C1 category and specialization selectors, and to **anywhere else in the app a user picks from a taxonomy**. A pill wall is a build failure, not a style preference — add it to `invariants.md` as an executable check so it cannot be reintroduced by later code.

### C6. Bills Payment UI

The Flutterwave integration and bills payment backend **are already resolved. Do not re-investigate them.** The interface is the problem.

- Replace the full-width multi-coloured tiles. They stretch too tall on desktop and scroll endlessly.
- Responsive icon grid, restrained palette, matching the landing page icon style.
- Same treatment anywhere else that tile pattern appears.

### C7. Wallet

Also already provisioned at the Flutterwave level. What remains is that **the creator wallet must be properly implemented and correctly surfaced in the UI**:

- Auto-provision a wallet on registration for creators and professionals.
- Balance, earnings and transaction history render **accurately and visibly** — not zeroes or empty states where data exists.
- Withdrawal flow works end to end.
- **Verify against the live backend through the real auth flow, asserting a value that exists only on the server** — per `verification-harness`'s level-of-evidence ladder. A passing unit test against a mock adapter is level 2 of 4. Do not report this done at level 2.

### C8. Notifications — rebuild

Currently plain text rows. It becomes an experiential surface:

- Rich notifications carrying images and detail.
- It doubles as the **push notification and promotion channel** — announcing features, promoting products, running brand campaigns to the whole user base or a segment.
- It carries the recurring verification prompts from B1.
- Build the admin side: composing a rich notification with an image and dispatching it to all users or a segment.

A notification that promises a future act to the user must have a mechanism behind it. `verification-harness`'s `unbacked_promises` gate will fail copy like "we'll notify you when you're verified" if nothing implements it.

### C9. Home screen

Rebuild toward the reference layout using WAWU's own icons and brand. Explicit instruction from the owner: **not so busy.** Reduce visual noise relative to the reference. This is a restraint exercise — fewer competing emphases, clearer primary action.

### C10. Universal cross-sell

Wherever a user enters the app — home, profile, store link, Explore, a shared listing — they must be able to reach bills payments, events, trainings available, and shop, plus a call to join. **No screen is a dead end.**

---

## PART D — ORDER AND EXIT

### Build order

1. `legacy-app-repair` **Phase 0 only** → opening damage number, test suite status (skip its Phase 1 family triage)
2. `verification-harness` installed, gates green via deliberate baseline, `files scanned` sanity-checked
3. `design-change-adoption` **laws + templates only** — `DECISIONS.md` written, reference screens committed and cropped, reference↔screen pairing table built by hand (no canvas scripts)
4. UX research and design principles recorded (A3)
5. **C1 taxonomy** — model, migration, selector UX. Everything downstream depends on it
6. **C7 wallet** correctness
7. **C2 profile** rebuild + image upload bug
8. **B1/B3** verification, ticks, permissions, gating
9. **C3** shareable store links
10. **C4** Explore rebuild
11. **C5** pill-wall elimination + **C6** Bills Payment UI
12. **C8** notifications + admin push
13. **C9** home screen
14. **C10** cross-sell sweep
15. `frontend-surface-build` Phase 5 measurement pass on the whole tree
16. `qa-audit` — independent pass, **different author**, findings only

### Exit criteria — all of them, none waived

- [ ] Gates green. `files scanned` is a plausible denominator. Every baseline entry has a real owner and a real reason.
- [ ] Zero forked components. Zero hand-typed wire shapes.
- [ ] Every interactive element has a **measured**, visible hover and a reachable focus state.
- [ ] Every route measured at every breakpoint, **smallest supported desktop first**, with no flagged layout defect and no horizontal body overflow.
- [ ] Every designed state reachable, each with its entering condition recorded.
- [ ] Zero console errors on every route.
- [ ] Screenshots captured for every screen at every breakpoint, including states behind interaction (modals, tabs, error paths) — **route-walks alone are not coverage**.
- [ ] Design conformance compared **picture against picture**, by an agent that built nothing in scope.
- [ ] Live gate green: real login, real backend, a value that exists only on the server, visible.
- [ ] Every screen has a recorded design reason in `DECISIONS.md`.
- [ ] No figure on any screen without a named writer. No promise without a named mechanism.
- [ ] Release-artifact check run, or reported `NOT RUN — [reason]` as a first-class result.
- [ ] Working screens exist and function. Scaffolding without shipped behaviour is a failed run (A1b).
- [ ] Every rebuilt screen compared against its **TARGET** reference from A4b — and demonstrably no longer resembling its `CURRENT — reject` image.

### Rules of engagement

- **Do not mark anything complete because the code path exists.** Verify behaviour against live data through the real flow.
- **Do not substitute mock or fixture data on a live path**, ever, not even temporarily.
- **Do not self-certify conformance.** Report progress; let the independent pass report done.
- **Do not edit a gate to make it stop firing on your change.**
- **Do not invent a value** — a price, a rate, a limit, a figure — to make a screen look finished.
- **If a requirement here conflicts with the codebase or with a reference screen, halt and flag it.** Do not resolve it silently in whichever direction is easier that day.
- **Report what ran, not what you hoped ran.** An unrun check is named as unrun.
