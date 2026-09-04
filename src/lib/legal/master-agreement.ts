/**
 * THE MASTER TERMS, PRIVACY & PLATFORM POLICY, as supplied by the product
 * owner (4 Sep 2026). Effective 2 February 2026.
 *
 * This replaces what was there before, which announced itself as "a
 * plain-language placeholder" on the page a user is required to accept at
 * sign-up. Agreeing to a placeholder is not agreeing to anything.
 *
 * ONE SOURCE, TWO PAGES. /terms renders the whole agreement; /privacy/policy
 * renders the privacy and data sections of it. They are not two documents
 * that can drift apart - the privacy page is a view of this same list,
 * selected by `privacy: true`, so editing a clause changes both.
 *
 * House rule: no em-dashes in anything a user reads. The supplied text
 * carries none; keep it that way when amending.
 */

export const LEGAL_EFFECTIVE_DATE = "2 February 2026";
export const LEGAL_UPDATED_DATE = "2 February 2026";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "sub"; title: string; text: string };

export interface LegalSection {
  n: number;
  title: string;
  /** Also shown on /privacy/policy. */
  privacy?: boolean;
  blocks: Block[];
}

const p = (text: string): Block => ({ kind: "p", text });
const list = (...items: string[]): Block => ({ kind: "list", items });
const sub = (title: string, text: string): Block => ({ kind: "sub", title, text });

export const IMPORTANT_NOTICE = [
  "Please read this Agreement carefully before accessing or using WAWUAfrica.",
  "By creating an account, accessing, browsing or using any WAWUAfrica website, mobile application, platform, product, service or ecosystem feature, you acknowledge that you have read, understood and agreed to be bound by this Agreement.",
  "If you do not agree with these terms, you should not use the WAWUAfrica Platform.",
];

export const ACCEPTANCE = {
  intro:
    'By selecting "Create Account", "Sign Up", "Accept", "Continue", or otherwise accessing or using WAWUAfrica, you confirm that:',
  items: [
    "You have read and understood this Agreement.",
    "You agree to these Terms.",
    "You consent to the processing of your information as described in the Privacy provisions, subject to applicable law.",
    "You agree to comply with applicable laws and WAWU's Platform standards.",
  ],
};

export const MASTER_SECTIONS: LegalSection[] = [
  {
    n: 1,
    title: "About WAWUAfrica",
    blocks: [
      p('WAWUAfrica ("WAWU", "WAWUAfrica", "we", "us" or "our") is a Christocentric lifestyle, creator and socioeconomic ecosystem connecting people, creators, entrepreneurs, businesses and institutions to opportunities across training, certification, employment, market access, financial inclusion and ownership.'),
      p("WAWU enables people to build skills, access jobs and markets, grow businesses, monetise creativity, access financial services and participate meaningfully in Africa's emerging digital economy."),
      p("WAWU may operate directly or through subsidiaries, affiliates, technology providers, financial institutions, educational institutions, employers, merchants, creators, businesses, government entities and other strategic partners."),
      p("This Agreement governs your relationship with WAWU across the ecosystem."),
    ],
  },
  {
    n: 2,
    title: "Definitions",
    blocks: [
      p("For purposes of this Agreement:"),
      sub("Platform", "WAWUAfrica's websites, applications, digital infrastructure, products, services, portals, marketplaces and related technology."),
      sub("User", "Any individual or organisation accessing or using WAWU."),
      sub("Creator", "An individual or organisation creating, publishing, selling or monetising creative or professional work through WAWU."),
      sub("Merchant", "A person or business offering products or services through WAWU."),
      sub("Professional", "An individual offering skills, expertise or professional services."),
      sub("Partner", "An organisation working with WAWU to provide opportunities, products, services or ecosystem benefits."),
      sub("Wallet", "A WAWU-enabled digital wallet or wallet functionality provided directly or through an authorised financial-service provider."),
      sub("Content", "Text, photographs, videos, music, audio, artwork, designs, documents, profiles, comments, messages, listings and other material submitted to WAWU."),
      sub("Transaction", "A purchase, sale, payment, transfer, gift, tip, booking, commission or other financial interaction facilitated through the Platform."),
    ],
  },
  {
    n: 3,
    title: "Acceptance of this Agreement",
    blocks: [
      p("By using WAWU, you agree to:"),
      list(
        "comply with this Agreement;",
        "comply with applicable laws and regulations;",
        "provide truthful and accurate information;",
        "maintain the security of your account;",
        "respect other users;",
        "use the Platform lawfully; and",
        "accept that certain services may have additional terms, disclosures or requirements.",
      ),
      p("This Agreement applies whether you use WAWU as a consumer, creator, professional, merchant, entrepreneur, business, institution, partner or other participant."),
    ],
  },
  {
    n: 4,
    title: "Eligibility and account registration",
    blocks: [
      p("You may be required to create an account to access certain services."),
      p("You agree that information supplied during registration, verification or onboarding will be accurate, complete and current."),
      p("You must not:"),
      list(
        "impersonate another person;",
        "create an account using another person's information without authority;",
        "create fraudulent accounts;",
        "misrepresent your qualifications or business;",
        "provide false KYC information; or",
        "maintain accounts for unlawful purposes.",
      ),
      p("WAWU may require identity, business or professional verification before allowing access to certain services."),
    ],
  },
  {
    n: 5,
    title: "Identity verification and KYC",
    privacy: true,
    blocks: [
      p("To provide certain services and comply with applicable laws, WAWU and/or its authorised partners may request information including:"),
      list(
        "full name;",
        "date of birth;",
        "telephone number;",
        "email address;",
        "residential information;",
        "government-issued identification;",
        "business registration information;",
        "bank account information;",
        "payment information;",
        "tax information where applicable; and",
        "other information reasonably required for verification.",
      ),
      p("You authorise WAWU and relevant authorised partners to verify information you provide."),
      p("Failure to complete required verification may prevent you from accessing certain services."),
    ],
  },
  {
    n: 6,
    title: "The WAWU ecosystem",
    blocks: [
      p("WAWU may provide or facilitate access to:"),
      sub("Learning", "Training, courses, certifications, masterclasses, educational resources and skills development."),
      sub("Work", "Employment opportunities, freelance work, professional opportunities, internships, commissions and career services."),
      sub("Commerce", "Marketplaces, product discovery, merchant services, creator commerce and buying and selling."),
      sub("Creator economy", "Creator profiles, content publishing, audience engagement, monetisation, gifts, tips, sales, bookings and professional opportunities."),
      sub("Financial inclusion", "Wallets, payments and access to financial products and services provided by WAWU or authorised third parties."),
      sub("Business growth", "Business tools, market access, partnerships, technology, mentorship and commercial opportunities."),
      sub("Events", "Events, activations, ticketing, registrations, competitions and community experiences."),
      sub("Rewards", "Eligible promotions, incentives, benefits, loyalty programmes and other rewards."),
      p("WAWU may add, modify, suspend or discontinue services as the ecosystem evolves."),
    ],
  },
  {
    n: 7,
    title: "Creator and professional economy",
    blocks: [
      p("WAWU may allow creators and professionals to showcase and monetise:"),
      list(
        "music;", "film;", "photography;", "writing;", "design;", "fashion;", "artwork;",
        "digital content;", "professional services;", "consulting;", "products;", "events;",
        "bookings;", "courses;", "creative works; and", "other eligible products or services.",
      ),
      p("Creators and professionals are solely responsible for ensuring that their offerings are accurate, lawful and appropriately licensed."),
      p("WAWU does not guarantee that a creator or professional will receive a particular number of customers, followers, sales, engagements, bookings or income."),
    ],
  },
  {
    n: 8,
    title: "WAWU Wallet and receiving money",
    blocks: [
      p("Where available, WAWU Wallets may allow eligible users to receive and manage money generated through their activities within the ecosystem."),
      p("This may include:"),
      list(
        "product sales;", "service payments;", "creator revenue;", "gifts;", "tips;",
        "commissions;", "bookings;", "event proceeds;", "brand collaborations;",
        "professional engagements; and", "other eligible payments.",
      ),
      p("For example, a creator may communicate with a customer through WAWU, agree on a service or product, receive payment and have the proceeds credited to the creator's eligible wallet."),
      p("Wallet functionality may be provided directly by WAWU or by an authorised financial institution or payment service provider."),
      p("WAWU does not represent that it is a bank, deposit-taking institution, payment institution or other regulated financial institution unless expressly stated."),
      p("Where a regulated partner provides a financial service, that service may be governed by additional terms and applicable regulatory requirements."),
    ],
  },
  {
    n: 9,
    title: "Payments and transactions",
    blocks: [
      p("Users agree to provide accurate transaction information."),
      p("Transactions may be subject to:"),
      list(
        "processing fees;", "commissions;", "payment-provider charges;", "taxes;",
        "transaction limits;", "verification requirements;", "settlement periods; and",
        "fraud and compliance checks.",
      ),
      p("WAWU may delay, reject, reverse or suspend a transaction where reasonably necessary to:"),
      list(
        "prevent fraud;", "comply with law;", "investigate suspicious activity;",
        "protect users;", "correct an error; or", "satisfy regulatory requirements.",
      ),
    ],
  },
  {
    n: 10,
    title: "Gifts, tips and creator support",
    blocks: [
      p("Where enabled, users may send gifts, tips or other monetary support to creators."),
      p("Creators acknowledge that:"),
      list(
        "gifts and tips may be subject to fees;",
        "transactions may be reviewed for fraud;",
        "funds may be subject to applicable settlement rules;",
        "certain transactions may be reversed where fraudulent or unauthorised; and",
        "tax obligations may apply to income received.",
      ),
      p("WAWU does not guarantee the availability or amount of gifts, tips or creator earnings."),
    ],
  },
  {
    n: 11,
    title: "Marketplace",
    blocks: [
      p("Where WAWU facilitates commerce, merchants remain responsible for:"),
      list(
        "product authenticity;", "descriptions;", "pricing;", "availability;", "quality;",
        "fulfilment;", "delivery;", "applicable warranties; and",
        "compliance with applicable laws.",
      ),
      p("Users must not sell prohibited, counterfeit, stolen or unlawful goods or services."),
      p("WAWU may remove listings or restrict merchants where necessary."),
    ],
  },
  {
    n: 12,
    title: "Buyer responsibilities",
    blocks: [
      p("Before completing a transaction, buyers should review:"),
      list(
        "product or service descriptions;", "price;", "quantity;", "delivery arrangements;",
        "cancellation terms; and", "any other relevant information.",
      ),
      p("WAWU may facilitate transactions but does not necessarily own or supply products listed by independent merchants."),
    ],
  },
  {
    n: 13,
    title: "Jobs and professional opportunities",
    blocks: [
      p("WAWU may connect users with employers, organisations and opportunity providers."),
      p("WAWU does not guarantee:"),
      list("employment;", "acceptance;", "compensation;", "promotion;", "funding;", "grants; or", "selection for an opportunity."),
      p("Employers and opportunity providers are responsible for their own recruitment and selection decisions."),
      p("Users must provide truthful information concerning their qualifications, experience and professional history."),
    ],
  },
  {
    n: 14,
    title: "Training and certification",
    blocks: [
      p("WAWU may provide training directly or through third-party educational partners."),
      p("Completion of a course does not necessarily guarantee employment, promotion, professional licensing or income."),
      p("Where certification is provided by a third party, that certification remains subject to the third party's terms and requirements."),
    ],
  },
  {
    n: 15,
    title: "Content",
    blocks: [
      p("Users retain ownership of original intellectual property they lawfully own."),
      p("By submitting Content to WAWU, you grant WAWU a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, display, distribute, communicate and otherwise use that Content as reasonably necessary to operate, improve, market and provide the Platform."),
      p("You remain responsible for your Content."),
      p("You represent that you have the rights, permissions and licences necessary to submit it."),
    ],
  },
  {
    n: 16,
    title: "Music and creative rights",
    blocks: [
      p("Creators uploading music, film, photography, artwork or other creative works must have the necessary rights."),
      p("You must not upload:"),
      list(
        "copyrighted material without permission;", "stolen works;", "unauthorised recordings;",
        "content containing unlicensed samples;", "content that infringes another person's rights; or",
        "fraudulent ownership claims.",
      ),
      p("WAWU may remove or restrict disputed content."),
      p("Where WAWU integrates with third-party distribution or monetisation services, those services may impose additional rights and licensing requirements."),
    ],
  },
  {
    n: 17,
    title: "User interactions and communication",
    privacy: true,
    blocks: [
      p("WAWU may enable users to communicate, collaborate, transact and interact."),
      p("Users must not use communication features to:"),
      list("harass;", "threaten;", "defraud;", "exploit;", "spam;", "impersonate;", "solicit unlawful activities; or", "distribute malicious content."),
      p("Where necessary for safety, fraud prevention, dispute resolution or compliance, WAWU may review or process communications and associated metadata in accordance with applicable law and this Privacy Policy."),
    ],
  },
  {
    n: 18,
    title: "Community standards",
    blocks: [
      p("WAWU seeks to maintain a safe, respectful and constructive ecosystem."),
      p("Users must not upload or distribute unlawful, fraudulent, abusive, hateful, exploitative or harmful content."),
      p("WAWU may remove Content, restrict accounts or take other appropriate action where necessary."),
    ],
  },
  {
    n: 19,
    title: "Christocentric positioning",
    blocks: [
      p("WAWUAfrica is a Christocentric ecosystem."),
      p("This positioning informs our values, culture and approach to community, leadership, creativity, service and socioeconomic development."),
      p("Participation in WAWU does not, however, automatically constitute endorsement of every religious, commercial, political or personal opinion expressed by another user."),
      p("Users are expected to interact respectfully and lawfully."),
    ],
  },
  {
    n: 20,
    title: "Partners and third-party services",
    blocks: [
      p("WAWU may integrate with third parties including:"),
      list(
        "banks;", "payment providers;", "pension providers;", "insurance companies;",
        "educational institutions;", "employers;", "technology providers;", "marketplaces;",
        "brands;", "government institutions;", "NGOs;", "international organisations; and",
        "other ecosystem partners.",
      ),
      p("Third-party services may be subject to separate agreements."),
      p("WAWU is not responsible for services independently provided by third parties."),
    ],
  },
  {
    n: 21,
    title: "Financial services",
    blocks: [
      p("Where WAWU provides access to financial products through licensed or regulated partners, the relevant partner may be responsible for:"),
      list(
        "account opening;", "KYC;", "financial product approval;", "custody of funds;",
        "payment processing;", "pension administration;", "insurance;", "lending;",
        "investment products; or", "other regulated activities.",
      ),
      p("WAWU does not guarantee approval for any financial product."),
      p("Users should review the relevant financial institution's terms before participating."),
    ],
  },
  {
    n: 22,
    title: "AML, CFT, CPF and sanctions",
    blocks: [
      p("WAWU maintains a zero-tolerance approach to the use of its ecosystem for:"),
      list(
        "money laundering;", "terrorist financing;", "proliferation financing;",
        "sanctions evasion;", "fraud;", "corruption;", "identity theft; or",
        "other financial crime.",
      ),
      p("WAWU may conduct transaction monitoring, screening, enhanced due diligence and other compliance activities."),
      p("Where required by law, WAWU may report suspicious activities to competent authorities."),
      p("WAWU may freeze, restrict or terminate accounts or transactions where required or reasonably necessary for compliance."),
    ],
  },
  {
    n: 23,
    title: "Anti-bribery and corruption",
    blocks: [
      p("Users, partners, merchants and other ecosystem participants must not use WAWU to offer, solicit, promise or facilitate bribes, kickbacks or other improper payments."),
      p("WAWU may terminate relationships involving bribery, corruption or unethical conduct."),
    ],
  },
  {
    n: 24,
    title: "Privacy and data protection",
    privacy: true,
    blocks: [
      p("WAWU collects and processes personal information necessary to operate the ecosystem."),
      p("This may include:"),
      sub("Identity", "Name, date of birth, identification information and verification data."),
      sub("Contact", "Telephone number, email and address."),
      sub("Professional", "Skills, qualifications, employment history, business information and creator profiles."),
      sub("Financial", "Payment, transaction and wallet information where required."),
      sub("Technical", "Device information, IP address, logs, cookies, usage information and similar data."),
      sub("Content", "Information and materials submitted by users."),
    ],
  },
  {
    n: 25,
    title: "Purposes for processing data",
    privacy: true,
    blocks: [
      p("WAWU may process information to:"),
      list(
        "provide services;", "create accounts;", "verify identity;", "facilitate payments;",
        "facilitate transactions;", "provide training;", "connect users to jobs and opportunities;",
        "enable creator monetisation;", "prevent fraud;", "comply with law;", "improve services;",
        "communicate with users;", "conduct analytics;", "personalise experiences; and",
        "develop new products and services.",
      ),
    ],
  },
  {
    n: 26,
    title: "Data sharing",
    privacy: true,
    blocks: [
      p("WAWU may share information with authorised parties where necessary, including:"),
      list(
        "payment providers;", "financial institutions;", "educational partners;", "employers;",
        "merchants;", "technology providers;", "professional advisers;", "regulators;",
        "government authorities where legally required; and",
        "other service providers or partners necessary to provide requested services.",
      ),
      p("WAWU does not sell users' personal information to advertisers."),
    ],
  },
  {
    n: 27,
    title: "Data security",
    privacy: true,
    blocks: [
      p("WAWU uses reasonable technical and organisational safeguards designed to protect personal information."),
      p("However, no technology platform can guarantee absolute security."),
      p("Users are responsible for protecting their passwords, authentication credentials and devices."),
    ],
  },
  {
    n: 28,
    title: "Data retention",
    privacy: true,
    blocks: [
      p("WAWU may retain information for as long as reasonably necessary to:"),
      list(
        "provide services;", "maintain accounts;", "fulfil contractual obligations;",
        "comply with legal requirements;", "satisfy regulatory obligations;", "prevent fraud;",
        "resolve disputes; and", "protect legitimate business interests.",
      ),
    ],
  },
  {
    n: 29,
    title: "User privacy rights",
    privacy: true,
    blocks: [
      p("Subject to applicable law, users may have rights to:"),
      list(
        "access personal information;", "correct inaccurate information;", "request deletion;",
        "withdraw consent;", "object to certain processing;", "request restriction of processing; and",
        "lodge complaints with the appropriate data-protection authority.",
      ),
      p("Privacy requests may be sent to support@wawuafrica.com."),
    ],
  },
  {
    n: 30,
    title: "Cookies and technologies",
    privacy: true,
    blocks: [
      p("WAWU may use cookies, pixels, SDKs, analytics tools and similar technologies to operate and improve the Platform."),
      p("These technologies may be used for:"),
      list("authentication;", "preferences;", "security;", "analytics;", "performance;", "personalisation; and", "campaign measurement."),
    ],
  },
  {
    n: 31,
    title: "Intellectual property",
    blocks: [
      p("WAWU's name, platform, software, design, branding, databases, technology, text, graphics and other proprietary materials are owned by or licensed to WAWU unless otherwise stated."),
      p("Users may not:"),
      list("copy;", "reverse engineer;", "reproduce;", "distribute;", "modify;", "commercially exploit; or", "create derivative works from WAWU's proprietary technology or materials without permission."),
    ],
  },
  {
    n: 32,
    title: "Fraud and platform abuse",
    blocks: [
      p("WAWU may investigate suspicious activity."),
      p("Examples include:"),
      list(
        "fake accounts;", "fake transactions;", "fraudulent sales;", "payment manipulation;",
        "identity fraud;", "artificial engagement;", "referral abuse;", "promotion abuse;",
        "account farming;", "chargeback abuse; and",
        "attempts to circumvent Platform controls.",
      ),
      p("WAWU may suspend accounts, withhold transactions or take other lawful action."),
    ],
  },
  {
    n: 33,
    title: "Referrals, rewards and promotions",
    blocks: [
      p("WAWU may operate referral programmes, incentives, rewards, competitions and promotional campaigns."),
      p("Each programme may have specific rules."),
      p("WAWU may cancel rewards obtained through fraud, manipulation or violation of applicable programme rules."),
    ],
  },
  {
    n: 34,
    title: "Taxes",
    blocks: [
      p("Users are responsible for determining and fulfilling their own tax obligations arising from income, sales, transactions, employment, business activity or other participation in WAWU."),
      p("WAWU may provide information to tax authorities where legally required."),
    ],
  },
  {
    n: 35,
    title: "Refunds and cancellations",
    blocks: [
      p("Refunds, cancellations and reversals may depend on the nature of the transaction and the applicable service."),
      p("Where WAWU facilitates a third-party transaction, the third party's refund terms may apply."),
      p("Nothing in this Agreement limits mandatory consumer rights under applicable law."),
    ],
  },
  {
    n: 36,
    title: "Disputes between users",
    blocks: [
      p("WAWU encourages users to resolve commercial or personal disputes directly where appropriate."),
      p("Where WAWU facilitates the relevant transaction, we may provide reasonable support or dispute mechanisms."),
      p("WAWU is not necessarily a party to contracts independently entered into between users."),
    ],
  },
  {
    n: 37,
    title: "Platform availability",
    blocks: [
      p("WAWU will make reasonable efforts to maintain Platform availability but does not guarantee uninterrupted access."),
      p("The Platform may occasionally be unavailable because of:"),
      list(
        "maintenance;", "upgrades;", "security incidents;", "technical failures;",
        "telecommunications problems;", "third-party outages;", "regulatory requirements; or",
        "circumstances outside WAWU's reasonable control.",
      ),
    ],
  },
  {
    n: 38,
    title: "Disclaimer of warranties",
    blocks: [
      p('To the maximum extent permitted by law, WAWU provides the Platform on an "as available" and "as is" basis.'),
      p("WAWU does not guarantee that:"),
      list(
        "the Platform will always be available;", "information will always be accurate;",
        "opportunities will remain available;", "creators will generate income;",
        "products will sell;", "users will obtain employment;",
        "financial products will be approved; or", "particular business outcomes will be achieved.",
      ),
    ],
  },
  {
    n: 39,
    title: "Limitation of liability",
    blocks: [
      p("To the maximum extent permitted by applicable law, WAWU shall not be liable for indirect, incidental, consequential or special losses arising from use of the Platform."),
      p("Nothing in this Agreement excludes or limits liability that cannot lawfully be excluded or limited."),
    ],
  },
  {
    n: 40,
    title: "Indemnity",
    blocks: [
      p("To the extent permitted by law, you agree to indemnify and hold WAWU and its directors, officers, employees, affiliates and authorised representatives harmless from claims, losses, liabilities and expenses arising from:"),
      list(
        "your breach of this Agreement;", "your unlawful conduct;", "your Content;",
        "infringement of third-party rights;", "fraudulent activity; or",
        "misuse of the Platform.",
      ),
    ],
  },
  {
    n: 41,
    title: "Suspension and termination",
    blocks: [
      p("WAWU may suspend, restrict or terminate access where reasonably necessary because of:"),
      list(
        "breach of this Agreement;", "fraud;", "financial crime;", "unlawful activity;",
        "security concerns;", "regulatory requirements;", "abuse of other users;",
        "infringement of intellectual property; or", "other serious misuse of the Platform.",
      ),
      p("WAWU may also discontinue particular products or services."),
    ],
  },
  {
    n: 42,
    title: "Effect of termination",
    blocks: [
      p("Termination does not automatically extinguish:"),
      list(
        "outstanding payment obligations;", "intellectual-property rights;",
        "dispute obligations;", "compliance obligations;", "legally required records; or",
        "provisions that by their nature should survive termination.",
      ),
    ],
  },
  {
    n: 43,
    title: "Changes to WAWU",
    blocks: [
      p("WAWU is an evolving ecosystem."),
      p("We may introduce:"),
      list(
        "new products;", "new marketplaces;", "new creator tools;",
        "new financial integrations;", "new partnerships;", "new opportunities; and",
        "new features.",
      ),
      p("We may modify or discontinue existing features where reasonably necessary."),
    ],
  },
  {
    n: 44,
    title: "Changes to this Agreement",
    blocks: [
      p("We may update this Agreement from time to time."),
      p("Where material changes are made, we will provide reasonable notice where required."),
      p("Your continued use of WAWU following the effective date of the revised Agreement constitutes acceptance of the updated terms, subject to applicable law."),
    ],
  },
  {
    n: 45,
    title: "Governing law",
    blocks: [
      p("This Agreement shall be governed primarily by the laws of the Federal Republic of Nigeria, subject to any mandatory laws applicable to a particular service or transaction."),
      p("Where a service is provided through a regulated partner, additional jurisdiction-specific terms may apply."),
    ],
  },
  {
    n: 46,
    title: "Dispute resolution",
    blocks: [
      p("The parties shall first attempt to resolve disputes through good-faith discussions."),
      p("Where appropriate, disputes may be referred to mediation or other alternative dispute-resolution mechanisms before litigation."),
      p("Nothing prevents a party from seeking urgent legal or regulatory relief where necessary."),
    ],
  },
  {
    n: 47,
    title: "Severability",
    blocks: [
      p("If any provision of this Agreement is determined to be invalid or unenforceable, the remaining provisions shall continue in effect to the extent permitted by law."),
    ],
  },
  {
    n: 48,
    title: "No waiver",
    blocks: [
      p("Failure by WAWU to enforce any provision of this Agreement does not constitute a waiver of its right to enforce that provision later."),
    ],
  },
  {
    n: 49,
    title: "Entire agreement",
    blocks: [
      p("This Agreement constitutes the principal agreement between you and WAWU concerning your use of the Platform, together with any additional terms expressly incorporated into a particular service."),
    ],
  },
  {
    n: 50,
    title: "Contact",
    privacy: true,
    blocks: [
      p("For questions, complaints, privacy requests, legal notices or other enquiries:"),
      p("WAWUAfrica"),
      p("Email: support@wawuafrica.com"),
    ],
  },
];

export const PRIVACY_SECTIONS = MASTER_SECTIONS.filter((s) => s.privacy);
