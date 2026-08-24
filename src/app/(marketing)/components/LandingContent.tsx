import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LandingAuthCta } from "./LandingAuthCta";
import type { IconName } from "@/components/ui/Icon";
import { TierBadge } from "@/components/ui/TierBadge";
import { formatNaira } from "@/lib/format";
import { EarningsCalculator } from "./EarningsCalculator";
import { FaqAccordion } from "./FaqAccordion";
import { HeroRotatingWord } from "./HeroRotatingWord";
import { SmartScheduler } from "./SmartScheduler";

/**
 * What the ecosystem gives access to. Rendered in the hero's "Access to" card
 * and again as the journey strip further down.
 *
 * Two items from the requested list are held back deliberately, because
 * docs/01_SPEC.md forbids both by name and that doc is the tiebreaker:
 *   - "Jobs": spec line 120 cuts jobs/gigs/recruiting entirely, "including
 *     the word 'gigs' anywhere in copy".
 *   - "Wallets": spec section 3 exists specifically to keep Credits from
 *     drifting into wallet territory, and warns that the wallet problem tends
 *     to reappear "under a different name".
 * Both are one word away from going in if that call gets reversed.
 */
const PIPELINE = ["Training", "Payments", "Banking", "Healthcare", "Legal", "Travel"];

/**
 * Exemplary showcase cards for the hero collage. The database has no creators
 * or content yet, so these illustrated tiles are the visual fallback; when
 * real featured content exists, its title/creator/price replace the sample
 * copy while the illustration stays until content carries its own preview.
 */

const FIELDS: { name: string; icon: IconName; bg: string }[] = [
  { name: "Business", icon: "Briefcase", bg: "bg-[linear-gradient(150deg,var(--accent-deep),var(--accent))]" },
  { name: "Trade", icon: "Ship", bg: "bg-[linear-gradient(150deg,rgba(11,10,13,0.35),var(--brand-aqua))]" },
  { name: "Finance", icon: "Landmark", bg: "bg-[linear-gradient(150deg,rgba(11,10,13,0.55),var(--accent-deep))]" },
  { name: "Entertainment", icon: "Music", bg: "bg-[linear-gradient(150deg,rgba(11,10,13,0.35),var(--brand-coral))]" },
  { name: "Career", icon: "Rocket", bg: "bg-[linear-gradient(150deg,var(--accent-deep),rgba(148,17,201,0.5))]" },
  { name: "Education", icon: "GraduationCap", bg: "bg-[linear-gradient(150deg,rgba(11,10,13,0.4),var(--brand-yellow))]" },
  { name: "Agriculture", icon: "Sprout", bg: "bg-[linear-gradient(150deg,rgba(11,10,13,0.4),var(--brand-lime))]" },
  { name: "Health", icon: "HeartPulse", bg: "bg-[linear-gradient(150deg,rgba(11,10,13,0.35),var(--brand-coral))]" },
  { name: "Technology", icon: "Cpu", bg: "bg-[linear-gradient(150deg,var(--accent-deep),var(--accent))]" },
  { name: "Creative Arts", icon: "Palette", bg: "bg-[linear-gradient(150deg,rgba(11,10,13,0.35),var(--brand-aqua))]" },
  { name: "Culture", icon: "Globe", bg: "bg-[linear-gradient(150deg,rgba(11,10,13,0.4),var(--brand-yellow))]" },
];

/**
 * Quick Services — the white-labelled utilities that sit alongside the
 * creator product. Each is a real destination in the app; `soon` marks the
 * ones whose partner API has not landed yet, and those deliberately do not
 * link anywhere rather than opening a dead screen.
 */
/**
 * The services strip. Every icon shares one colour, Electric Lilac from the
 * brand sheet, rather than one colour per service: a row of seven different
 * colours competed with itself, and this is a directory, not a chart.
 */
/**
 * The services strip.
 *
 * Telemedicine is named but not yet openable. Grants and Travel are held back
 * entirely until they are ready to announce.
 *
 * Basket and Beauty are separate products with their own marks and brand
 * colours, so they carry a logo rather than an icon.
 */
const QUICK_SERVICES: {
  brand: string;
  label: string;
  blurb: string;
  icon: IconName;
  href?: string;
  soon?: boolean;
  /**
   * A storefront with its own mark. When present the chip shows this image
   * instead of a lucide glyph, and `tint` colours the chip — the one place
   * another brand's colour is allowed on this page.
   */
  mark?: string;
  tint?: string;
}[] = [
  {
    brand: "Bills Payment",
    label: "Airtime, power, cable",
    blurb: "Pay any bill in seconds.",
    icon: "CreditCard",
    href: "/services/pay",
  },
  {
    brand: "Legal",
    label: "Filings and lawyers",
    blurb: "CAC and tax filings, or book a lawyer.",
    icon: "Scale",
    href: "/services/legal",
  },
  {
    brand: "Loans/EasyBuy",
    label: "Instalments",
    blurb: "Spread the cost over monthly payments.",
    icon: "Smartphone",
    href: "/services/loans/apply",
  },
  {
    brand: "Telemedicine",
    label: "Health cover",
    blurb: "See a doctor and get covered.",
    icon: "Stethoscope",
    soon: true,
  },
  {
    brand: "Pensions",
    label: "Retirement",
    blurb: "Save for later on irregular income.",
    icon: "PiggyBank",
    href: "/services/pension/apply",
  },
  {
    brand: "WAWUBasket",
    label: "Market and groceries",
    blurb: "Fresh market, groceries and restaurants, delivered.",
    icon: "ShoppingBasket",
    mark: "/wawubasket-icon.png",
    tint: "var(--brand-basket)",
    href: "/marketplace/basket",
  },
  {
    brand: "WAWUBeauty",
    label: "Beauty and textiles",
    blurb: "Beauty products and services, textiles, shoes and art.",
    icon: "Sparkles",
    mark: "/wawubeauty-icon.png",
    tint: "var(--brand-beauty)",
    href: "/marketplace/beauty",
  },
];

/**
 * The two storefronts, as ordinary entries in the services directory.
 *
 * They used to get their own oversized row below — a gradient card each,
 * tinted in their brand colour, carrying a wordmark and a strip of category
 * tags. That made two of WAWU's smaller surfaces the loudest thing in the
 * hero, and it left the services grid above them sitting with empty cells.
 *
 * They are the same shape as everything else now: a chip, a name, one row.
 * The ONLY thing that stays branded is the mark inside the chip — Basket's
 * green and Beauty's pink are how somebody recognises them at a glance, and
 * they are the icon alone, not the logo lockup, because a wordmark cannot be
 * read at 22px and a second name beside the label is a stutter.
 */
const STREAMS: { icon: IconName; title: string; blurb: string }[] = [
  { icon: "Palette", title: "Creative Works", blurb: "Sell what you make" },
  { icon: "ShoppingBag", title: "Basket, Beauty & Commerce", blurb: "Products, right from your profile" },
  { icon: "MessageCircle", title: "Premium Messaging", blurb: "Cash in on your WOW" },
  { icon: "UserRoundSearch", title: "Training & Consultations", blurb: "Turn expertise into income" },
  { icon: "Landmark", title: "Lifestyle Services", blurb: "Legal, health, payments and more" },
  { icon: "Users", title: "Group Chats", blurb: "Earn on every message" },
];

interface CompareRow {
  feature: string;
  wawu: string | boolean;
  others: (string | boolean)[];
}

const COMPARE_ROWS: CompareRow[] = [
  { feature: "Platform Fees", wawu: "10-15% (85-90% keep)", others: ["10-20% + /txn", "20%", "20%"] },
  { feature: "Ecosystem Reach", wawu: "10M+ users", others: ["1.5M+ fans", "2M+", "N/A"] },
  { feature: "Training & Upskilling", wawu: "Training included for members", others: [false, false, false] },
  { feature: "Government Partnerships", wawu: "Federal Government-approved", others: [false, false, false] },
  { feature: "Device & Equipment Financing", wawu: "Partnerships", others: [false, false, false] },
  { feature: "Faith & Community Approach", wawu: true, others: [false, false, false] },
  { feature: "Content Types", wawu: "Videos, Articles, Audio, Courses, Products", others: ["Videos (up to 10GB), Photos, Audio, PDFs", "Videos, Photos, Audio, PDFs", "Videos & Photos"] },
  { feature: "Lifetime Memberships", wawu: true, others: [true, false, false] },
  { feature: "Membership Trials & Promo Codes", wawu: true, others: [true, false, false] },
  { feature: "Paid DMs", wawu: true, others: [true, false, true] },
  { feature: "Marketplace", wawu: "WAWUBasket & Beauty", others: [true, false, false] },
  { feature: "1-on-1 Calls", wawu: true, others: [true, false, false] },
  { feature: "Group Chats", wawu: true, others: [true, false, false] },
  { feature: "Analytics per post & message", wawu: true, others: [true, false, false] },
  { feature: "Smart Vault", wawu: true, others: [true, false, false] },
  { feature: "Instant Payouts", wawu: true, others: [true, false, false] },
  { feature: "Scheduler", wawu: true, others: [true, false, false] },
  { feature: "Membership Tiers", wawu: true, others: [true, true, true] },
  { feature: "Subscriptions", wawu: true, others: [true, true, true] },
];

const FAQ = [
  { q: "What % of earnings does the platform take?", a: "WAWUAfrica takes 15% as standard and 10% on Pro. You keep 85% of everything you earn, content unlocks, paid DMs, tips and storefront sales, and 90% on every stream once you go Pro. There is no listing fee and no monthly platform fee." },
  { q: "Do I need to be verified to publish?", a: "No. Creator is an account type, pick it at signup or upgrade later, then pay a subscription (Basic or Pro) to publish content, turn on paid DMs and host communities. KYC is separate and only gates when you can receive payouts." },
  { q: "How quickly can I get paid out?", a: "Earnings are paid to your own bank account once KYC clears, never held in a platform wallet. No stories." },
  { q: "Is there a minimum follower count to join?", a: "No. Whether you are just starting or an established creator ready to scale, you can join today and start publishing. Your first piece goes out at no charge, you price everything after that." },
  { q: "What happens if a creator never replies to a paid DM?", a: "The sender is refunded in full after 24 hours and WAWU takes no fee on that refund. Creators who repeatedly miss the window have DMs switched off automatically." },
  { q: "What are WAWU Credits?", a: "Prepaid message units for open communities, one credit sends one message. They are a count, not a cash balance, and they are never converted back to naira." },
];

function CaptionPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[32px] items-center gap-2 rounded-full border border-hairline bg-[rgba(255,255,255,0.05)] px-4 text-[11.5px] font-bold uppercase tracking-[0.12em] text-text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </span>
  );
}

function WhitePill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-[54px] items-center gap-2 rounded-button bg-white px-8 text-[15px] font-semibold text-on-light shadow-float transition-transform duration-200 hover:scale-[1.03]"
    >
      {children}
      <Icon name="ArrowRight" size={16} color="var(--text-on-light)" strokeWidth={2.2} />
    </Link>
  );
}

function CheckOrX({ value, accent }: { value: string | boolean; accent?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Icon name="Check" size={17} color="var(--success)" strokeWidth={2.6} />
    ) : (
      <Icon name="X" size={16} color={accent ? "var(--text-secondary)" : "var(--danger)"} strokeWidth={2.2} />
    );
  }
  return <span className={`text-[13px] leading-snug ${accent ? "font-semibold text-text-primary" : "text-text-secondary"}`}>{value}</span>;
}

export async function LandingContent() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-page">
      <div className="wawu-gridlines" aria-hidden="true" />

      {/* Floating pill nav */}
      <header className="fixed left-1/2 top-3.5 z-50 flex w-[min(1240px,calc(100%-24px))] -translate-x-1/2 items-center gap-2 rounded-full border border-hairline bg-[rgba(19,19,22,0.78)] py-2 pl-5 pr-2 backdrop-blur-xl dt:top-5 dt:gap-8 dt:py-2.5 dt:pl-7 dt:pr-2.5">
        <img src="/wawu-logo-white.png" alt="WAWU" className="h-[22px] w-auto object-contain dt:h-[24px]" />
        <nav className="hidden items-center gap-7 dt:flex" aria-label="Marketing">
          <a href="/explore" className="text-[14px] font-medium text-text-secondary hover:text-text-primary">Creators</a>
          <a href="/learn" className="text-[14px] font-medium text-text-secondary hover:text-text-primary">Resources</a>
        </nav>
        <span className="flex-1" />
        <LandingAuthCta />
      </header>

      <main className="relative z-10">
        {/* ============ HERO ============ */}
        <section className="relative px-5 pb-16 pt-[120px] dt:pb-24 dt:pt-[190px]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_55%_45%_at_50%_18%,var(--accent-tint-strong),transparent_70%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-[1080px] flex-col items-center text-center">
            <span className="inline-flex min-h-[34px] items-center gap-2.5 rounded-full border border-accent bg-[rgba(11,10,13,0.6)] px-4 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-accent-hover shadow-[0_0_24px_var(--accent-tint-strong)] dt:px-5 dt:text-[12px] dt:tracking-[0.14em]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="dt:hidden">Keep up to 90% of what you earn</span>
              <span className="hidden dt:inline">Keep up to 90% of everything you earn, best in Africa</span>
            </span>
            <h1 className="m-0 mt-7 text-[46px] font-bold leading-[1.02] tracking-[-0.04em] text-text-primary dt:text-[88px]">
              Turn Your WOW
              <br />
              <HeroRotatingWord className="text-accent-hover [text-shadow:0_0_60px_var(--accent-tint-strong)]" />
            </h1>
            <p className="m-0 mt-6 max-w-[540px] text-[17px] leading-relaxed text-text-secondary dt:text-[19px]">
              Build. Earn. Grow. Thrive. All in one place.
            </p>
            <div className="mt-9">
              <WhitePill href="/sign-up?type=creator">Join the Movement</WhitePill>
            </div>
          </div>

          {/* Social proof: collage + stat cards (showcase images stand in until real content exists) */}
          <div className="mx-auto mt-10 grid max-w-[1240px] grid-cols-1 gap-4 dt:mt-12 dt:grid-cols-[minmax(0,1fr)_300px] dt:gap-5 2xl:grid-cols-[minmax(0,1fr)_360px] 2xl:gap-6">
            <div className="flex flex-col gap-4 dt:gap-5">
              {/*
                A 16:9 slot for the product video. It replaces two sample
                content cards that were standing in for a database with nothing
                in it yet — placeholder content pretending to be real content.
                An empty frame that says what it is beats fake data.
              */}
              <div className="relative aspect-video w-full overflow-hidden rounded-card border border-hairline bg-[linear-gradient(150deg,var(--accent-deep),var(--surface-card))]">
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-[68px] w-[68px] place-items-center rounded-full border border-[rgba(255,255,255,0.35)] bg-[rgba(11,10,13,0.4)] backdrop-blur transition-transform duration-300 hover:scale-105 dt:h-[84px] dt:w-[84px]">
                    <Icon
                      name="Play"
                      size={30}
                      color="var(--text-on-accent)"
                      strokeWidth={1.8}
                      className="translate-x-0.5 drop-shadow-[0_0_20px_rgba(255,255,255,0.45)]"
                    />
                  </span>
                </span>
              </div>

              {/*
                The services used to be their own full section further down the
                page, which meant nobody saw them without scrolling past the
                whole hero. They sit in the hero now, deliberately small: this
                is a directory of what the app can do, not a feature pitch.
              */}
              {/*
                Flex-wrap rather than a grid, so the last row absorbs the space
                left over. An auto-fit grid holds its column width, and seven
                entries in four columns left a ragged hole on the second row
                that read as a missing card.
              */}
              <div className="flex flex-1 flex-wrap gap-2.5">
                {QUICK_SERVICES.map((service) => {
                  // A storefront's chip carries its own mark and its own
                  // colour; everything else is the shared lilac. That is the
                  // whole of the brand presence here — no wordmark, no tint on
                  // the card, no tags.
                  const chipStyle = service.tint
                    ? {
                        borderColor: `color-mix(in srgb, ${service.tint} 45%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${service.tint} 16%, transparent)`,
                      }
                    : undefined;
                  const inner = (
                    <>
                      <span
                        className={
                          service.tint
                            ? "grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border"
                            : "grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-[color-mix(in_srgb,var(--wawu-lilac)_45%,transparent)] bg-[color-mix(in_srgb,var(--wawu-lilac)_16%,transparent)]"
                        }
                        style={chipStyle}
                      >
                        {service.mark ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={service.mark}
                            alt=""
                            aria-hidden="true"
                            className="h-[22px] w-[22px] object-contain"
                          />
                        ) : (
                          <Icon name={service.icon} size={22} color="var(--wawu-lilac)" strokeWidth={2.2} />
                        )}
                      </span>
                      {/*
                        Name only. The second line repeated what the name
                        already said ("Pensions / Retirement") and turned a
                        clean directory into noise. Anything not open yet is
                        dimmed instead of captioned.
                      */}
                      <span className="min-w-0 text-[15px] font-bold leading-[1.2] tracking-[-0.01em] text-text-primary dt:text-[16px]">
                        {service.brand}
                      </span>
                    </>
                  );
                  const shell =
                    "flex min-w-[200px] flex-1 items-center gap-3 rounded-[14px] border border-hairline bg-[rgba(19,19,22,0.8)] px-3.5 py-3 backdrop-blur";
                  return service.href ? (
                    <Link
                      key={service.brand}
                      href={service.href}
                      className={`${shell} no-underline transition-colors duration-200 hover:border-strong`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={service.brand} className={`${shell} opacity-60`}>
                      {inner}
                    </div>
                  );
                })}
              </div>

            </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-card border border-hairline bg-[rgba(19,19,22,0.8)] p-4 backdrop-blur">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[color-mix(in_srgb,var(--wawu-sky)_13%,transparent)]">
                    <Icon name="Users" size={16} color="var(--wawu-sky)" strokeWidth={2.1} />
                  </span>
                  <span className="mt-2 block text-[20px] font-bold tracking-[-0.03em] text-text-primary [font-feature-settings:var(--font-feature-tabular)]">10M+</span>
                  <span className="text-[12px] leading-snug text-text-secondary">Professionals, Entrepreneurs, Artisans on WAWUAfrica</span>
                </div>
                <div className="rounded-card border border-hairline bg-[rgba(19,19,22,0.8)] p-4 backdrop-blur">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[color-mix(in_srgb,var(--wawu-lilac)_13%,transparent)]">
                    <Icon name="Route" size={16} color="var(--wawu-lilac)" strokeWidth={2.1} />
                  </span>
                  {/* White and bold like the figures beside it, not a small
                      purple caption, but not headline-sized either. */}
                  <span className="mt-2 block text-[20px] font-bold tracking-[-0.03em] text-text-primary">Access to</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-text-secondary">
                    {PIPELINE.join(" → ")}
                  </span>
                </div>
                <div className="rounded-card border border-hairline bg-[rgba(19,19,22,0.8)] p-4 backdrop-blur">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[color-mix(in_srgb,var(--wawu-green)_13%,transparent)]">
                    <Icon name="Globe" size={16} color="var(--wawu-green)" strokeWidth={2.1} />
                  </span>
                  <span className="mt-2 block text-[20px] font-bold tracking-[-0.03em] text-text-primary [font-feature-settings:var(--font-feature-tabular)]">1.5M+</span>
                  <span className="text-[12px] leading-snug text-text-secondary">Fans, plus access to Pan-African ecosystems, communities, governments and institutions</span>
                </div>
              </div>
            </div>
        </section>

        {/* ============ VALUE PROPOSITION (4-column) ============ */}
        <section className="px-5 py-14 dt:py-20">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-4 dt:grid-cols-4 dt:gap-5">
            {[
              // One hue each, straight off the WAWU COLORS brand sheet and its
              // stated meanings — discovery, energy, growth, connection. Four
              // identical purple tiles was the thing that made the page read
              // as a single-colour app.
              { label: "FIND WOW", icon: "Compass" as IconName, hue: "var(--wawu-lemon)", tile: "bg-[color-mix(in_srgb,var(--wawu-lemon)_13%,transparent)] border-[color-mix(in_srgb,var(--wawu-lemon)_32%,transparent)]", body: "Discover Africa's best entrepreneurs, professionals, and creators. Your front row seat to opportunity." },
              { label: "GET WOW", icon: "Sparkles" as IconName, hue: "var(--wawu-pink)", tile: "bg-[color-mix(in_srgb,var(--wawu-pink)_13%,transparent)] border-[color-mix(in_srgb,var(--wawu-pink)_32%,transparent)]", body: "Unlock premium content, exclusive products, and personalized experiences from top creators." },
              { label: "MAKE WOW", icon: "Rocket" as IconName, hue: "var(--wawu-green)", tile: "bg-[color-mix(in_srgb,var(--wawu-green)_13%,transparent)] border-[color-mix(in_srgb,var(--wawu-green)_32%,transparent)]", body: "Turn your expertise, skills, and products into income. Build your business with tools designed for you." },
              { label: "FOR EVERYONE", icon: "Users" as IconName, hue: "var(--wawu-sky)", tile: "bg-[color-mix(in_srgb,var(--wawu-sky)_13%,transparent)] border-[color-mix(in_srgb,var(--wawu-sky)_32%,transparent)]", body: "To turn expertise into income. Build. Earn. Grow. Thrive." },
            ].map((v) => (
              <div
                key={v.label}
                className="group flex flex-col gap-3 rounded-card border border-hairline bg-card p-6 transition-colors duration-200 hover:border-strong"
              >
                <span className={`grid h-[46px] w-[46px] place-items-center rounded-[14px] border ${v.tile}`}>
                  <Icon name={v.icon} size={20} color={v.hue} strokeWidth={2} />
                </span>
                <span className="text-[13.5px] font-bold uppercase tracking-[0.08em] text-text-primary">{v.label}</span>
                <p className="m-0 text-[14px] leading-normal text-text-secondary">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ ONE PROFILE MARQUEE ============ */}
        <section className="py-14 dt:py-20">
          <div className="mx-auto max-w-[1240px] px-5 text-center">
            <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">Find WOW. Get WOW. Make WOW.</span>
            <h2 className="m-0 mt-3 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary dt:text-[64px]">
              Every Industry.
              <br />
              <span className="text-accent-hover">One Profile.</span>
            </h2>
          </div>
          <div className="mt-10 flex flex-col gap-4 overflow-hidden dt:mt-14">
            {[0, 1].map((row) => (
              <div key={row} className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
                <div
                  className={`flex w-max gap-4 pr-4 ${row === 0 ? "animate-[wawuMarquee_42s_linear_infinite]" : "animate-[wawuMarqueeRev_48s_linear_infinite]"}`}
                >
                  {[...FIELDS, ...FIELDS].map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className={`relative h-[140px] w-[220px] shrink-0 overflow-hidden rounded-media ${f.bg} dt:h-[170px] dt:w-[270px]`}
                    >
                      <span className="absolute -bottom-4 -right-4 opacity-25">
                        <Icon name={f.icon} size={110} color="var(--text-on-accent)" strokeWidth={1.2} />
                      </span>
                      <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(11,10,13,0.75),transparent)] px-4 pb-3 pt-8 text-[15px] font-bold text-white">
                        {f.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ WOW EXPERIENCE BENTO (dashboard) ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">Giving the WOW Experience</span>
              <h2 className="m-0 mt-3 text-[36px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[58px]">
                YES, You Too Can <span className="text-accent-hover">Make It Big.</span>
              </h2>
              <p className="m-0 mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-text-secondary dt:text-[17px]">
                Treat your WOW like a business and get paid when you give value.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 dt:mt-14 dt:grid-cols-[380px_1fr]">
              {/* Mass Messaging panel */}
              <div className="flex flex-col overflow-hidden rounded-card border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(165deg,var(--accent),var(--accent-deep))] p-6 dt:p-7">
                <div className="grid min-h-[170px] flex-1 place-items-center py-6" aria-hidden="true">
                  <span className="animate-[wawuFloat_6.5s_ease-in-out_infinite]">
                    <Icon name="Send" size={84} color="rgba(255,255,255,0.9)" strokeWidth={1.1} className="drop-shadow-[0_0_30px_rgba(255,255,255,0.35)]" />
                  </span>
                </div>
                <span className="text-[19px] font-bold text-white">Mass Messaging</span>
                <p className="m-0 mt-1.5 text-[13.5px] leading-normal text-[rgba(255,255,255,0.78)]">
                  Reach thousands of followers instantly with targeted messages and promotions.
                </p>
              </div>

              {/* Real-Time Earnings panel with animated notifications */}
              <div className="flex flex-col gap-5 overflow-hidden rounded-card border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--wawu-green)_38%,var(--wawu-ink)),var(--wawu-ink))] p-6 dt:flex-row dt:items-center dt:p-8">
                <div className="dt:flex-1">
                  <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-[rgba(255,255,255,0.14)]">
                    <Icon name="Zap" size={19} color="var(--text-on-accent)" strokeWidth={2} />
                  </span>
                  <span className="mt-4 block text-[21px] font-bold text-white">Real-Time Earnings</span>
                  <p className="m-0 mt-2 max-w-[340px] text-[14px] leading-normal text-[rgba(255,255,255,0.78)]">
                    Watch your income grow with subscriptions, tips, PPV sales, commerce, and more.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2.5 dt:w-[340px]">
                  {[
                    { icon: "Crown" as IconName, label: "New Subscription", meta: "Lemuel joined PRO", amount: "+₦4,999", delay: "0s" },
                    { icon: "UserPlus" as IconName, label: "New Subscriber", meta: "Ella joined", amount: "+₦999", delay: "1.3s" },
                    { icon: "Lock" as IconName, label: "PPV Unlocked", meta: "Exclusive content", amount: "+₦2,000", delay: "2.6s" },
                    { icon: "HandCoins" as IconName, label: "Tip Received", meta: "Marcus sent a tip", amount: "+₦500", delay: "3.9s" },
                  ].map((n) => (
                    <div
                      key={n.label}
                      className="flex items-center gap-3 rounded-input border border-[rgba(255,255,255,0.14)] bg-[rgba(11,10,13,0.45)] px-3.5 py-2.5 backdrop-blur animate-[wawuNotifPulse_5.2s_ease-in-out_infinite]"
                      style={{ animationDelay: n.delay }}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[rgba(255,255,255,0.12)]">
                        <Icon name={n.icon} size={14} color="var(--text-on-accent)" strokeWidth={2.1} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-white">{n.label}</span>
                        <span className="block truncate text-[11px] text-[rgba(255,255,255,0.6)]">{n.meta}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-bold text-success [font-feature-settings:var(--font-feature-tabular)]">{n.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WOW Vault panel */}
              <div className="flex flex-col rounded-card border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--wawu-pink)_48%,var(--wawu-ink)),var(--wawu-ink))] p-6 dt:col-span-1 dt:p-7">
                <span className="flex items-center gap-2.5 text-[19px] font-bold text-white">
                  <Icon name="Vault" size={19} color="var(--text-on-accent)" strokeWidth={2} />
                  WOW Vault
                </span>
                <p className="m-0 mt-2 text-[13.5px] leading-normal text-[rgba(255,255,255,0.78)]">
                  Organize, schedule, and monetize your content, products, and services. Set prices, lock exclusives, and release steadily to keep your audience engaged.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {[
                    { label: "PPV", icon: "Lock" as IconName },
                    { label: "Scheduled", icon: "Clock" as IconName },
                    { label: "Audience Favorite", icon: "Heart" as IconName },
                    { label: "Exclusive Behind-the-Scenes", icon: "Clapperboard" as IconName },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      className="flex flex-col items-center gap-2 rounded-media border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.09)] px-3 py-4 text-center text-[11.5px] font-semibold text-white backdrop-blur"
                    >
                      <Icon name={chip.icon} size={18} color="var(--text-on-accent)" strokeWidth={2} />
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Smart Scheduler panel: the real, interactive widget */}
              <div className="rounded-card border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--wawu-sky)_42%,var(--wawu-ink)),var(--wawu-ink))] p-6 dt:p-7">
                <SmartScheduler />
              </div>
            </div>
          </div>
        </section>

        {/* ============ WOW REVENUE STREAMS ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">WOW Revenue Streams</span>
              <h2 className="m-0 mt-3 text-[36px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[58px]">
                Monetize The WOW <span className="text-accent-hover">About You</span>
              </h2>
              <p className="m-0 mt-4 max-w-[640px] text-[15.5px] leading-relaxed text-text-secondary dt:text-[17px]">
                God has given you everything that pertains to Life. Stop leaving Greatness in Your Neighborhood. The world wants more ways to support you.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 dt:mt-14 dt:grid-cols-[420px_1fr] dt:gap-5">
              {/* Featured: Membership */}
              <div className="relative flex flex-col overflow-hidden rounded-card border border-hairline bg-card p-7">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_38%,var(--accent-tint-strong),transparent_72%)]" aria-hidden="true" />
                <div className="relative grid min-h-[220px] flex-1 place-items-center py-8 dt:min-h-0">
                  <span className="animate-[wawuFloat_6.5s_ease-in-out_infinite]" aria-hidden="true">
                    <Icon name="Ticket" size={130} color="var(--accent-hover)" strokeWidth={1.1} className="drop-shadow-[0_0_34px_var(--accent)]" />
                  </span>
                </div>
                <div className="relative">
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-text-secondary">● Memberships</span>
                  <span className="mt-2 block text-[24px] font-bold tracking-[-0.02em] text-text-primary">Recurring income from your biggest supporters</span>
                  <p className="m-0 mt-2 text-[14px] leading-normal text-text-secondary">
                    Yearly creator tiers, membership trials and promo codes. Steady, predictable, yours.
                  </p>
                </div>
              </div>

              {/* Icon tile grid */}
              <div className="grid grid-cols-2 gap-4 dt:grid-cols-3 dt:gap-5">
                {STREAMS.map((s) => (
                  <div key={s.title} className="group flex flex-col rounded-card border border-hairline bg-card p-4 transition-colors duration-200 hover:border-strong dt:p-5">
                    <span className="grid aspect-[4/3] place-items-center rounded-media bg-[radial-gradient(ellipse_at_center,var(--accent-tint),transparent_75%)]">
                      <Icon
                        name={s.icon}
                        size={44}
                        color="var(--accent-hover)"
                        strokeWidth={1.4}
                        className="drop-shadow-[0_0_20px_var(--accent)] transition-transform duration-300 group-hover:scale-110"
                      />
                    </span>
                    <span className="mt-3 text-[15px] font-bold leading-snug text-text-primary">{s.title}</span>
                    <span className="mt-1 text-[12.5px] text-text-muted">{s.blurb}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-1 gap-y-2" aria-label="The WAWU pipeline">
              {PIPELINE.map((step, i) => (
                <span key={step} className="flex items-center">
                  <span className="inline-flex h-8 items-center rounded-full border border-hairline bg-tag px-3 text-[12px] font-medium text-text-secondary">{step}</span>
                  {i < PIPELINE.length - 1 ? <Icon name="ChevronRight" size={14} color="var(--text-muted)" /> : null}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3.5">
              <WhitePill href="/sign-up?type=creator">Cash in on your WOW</WhitePill>
              <Button size="lg" variant="secondary" href="#pricing">Turn WOW into income</Button>
            </div>
          </div>
        </section>

        {/* ============ EARNING POTENTIAL ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 rounded-[28px] border border-hairline bg-[linear-gradient(150deg,var(--surface-card),rgba(71,20,113,0.28))] p-6 dt:grid-cols-2 dt:gap-14 dt:p-12">
            <div className="flex flex-col items-start">
              <CaptionPill>Creator Earnings</CaptionPill>
              <h2 className="m-0 mt-5 text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary dt:text-[54px]">
                See Your
                <br />
                <span className="text-accent-hover">Earning Potential</span>
              </h2>
              <p className="m-0 mt-4 max-w-[420px] text-[15px] leading-relaxed text-text-secondary">
                Calculate how much you could earn on WAWU with your audience.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
                {[
                  { big: "85-90%", small: "You Keep" },
                  { big: "No Hassle", small: "Payouts" },
                  { big: "No Hidden", small: "Fees" },
                ].map((s) => (
                  <span key={s.small} className="flex flex-col">
                    <span className="text-[22px] font-bold tracking-[-0.02em] text-text-primary">{s.big}</span>
                    <span className="text-[12.5px] text-text-muted">{s.small}</span>
                  </span>
                ))}
              </div>
              <div className="mt-9">
                <WhitePill href="/sign-up?type=creator">Start monetizing today</WhitePill>
              </div>
            </div>
            <EarningsCalculator />
          </div>
        </section>

        {/* ============ CREATOR TIERS ============ */}
        <section id="pricing" className="relative px-5 py-14 dt:py-20">
          <div className="relative mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">Creator Tiers</span>
              <h2 className="m-0 mt-3 text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[48px]">
                Go further, <span className="text-accent-hover">keep more</span>
              </h2>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 dt:grid-cols-3 dt:gap-5">
              <div className="hidden flex-col gap-4 rounded-card border border-hairline bg-card p-6 dt:flex">
                <span className="text-[16px] font-semibold text-text-primary">Starter</span>
                <span className="text-[34px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(0)}</span>
                <div className="flex flex-col gap-2.5">
                  {[
                    "Browse and unlock content",
                    "Message creators",
                    "Join open communities",
                    "Shop the marketplace",
                    "Learn with our guides",
                  ].map((perk) => (
                    <span key={perk} className="flex items-center gap-2.5 text-[14px] text-text-secondary">
                      <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
                      {perk}
                    </span>
                  ))}
                </div>
                <Button full variant="secondary" size="sm" href="/sign-up" className="mt-auto">Join now</Button>
              </div>
              <div className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-6">
                <span className="self-start"><TierBadge tier="basic" /></span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[34px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(5999)}</span>
                  <span className="text-[14px] text-text-muted">a year</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {[
                    "6 uploads, 1 included and 5 paid",
                    "Unlimited messages",
                    "Join and host open communities",
                    "1 course of your choice, included",
                    "Business playbook included",
                    "Personal pension registration",
                  ].map((perk) => (
                    <span key={perk} className="flex items-center gap-2.5 text-[14px] text-text-secondary">
                      <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
                      {perk}
                    </span>
                  ))}
                </div>
                <Button full variant="secondary" href="/sign-up?type=creator" className="mt-auto">Choose Basic</Button>
              </div>
              <div className="flex flex-col gap-4 rounded-card border border-accent bg-elevated p-6 shadow-[0_0_60px_var(--accent-tint)]">
                <span className="self-start"><TierBadge tier="pro" /></span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[34px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">{formatNaira(18999)}</span>
                  <span className="text-[14px] text-text-muted">a year</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {[
                    "Keep 90% instead of 85%",
                    "15 uploads, 2 included and 13 paid",
                    "Unlimited messages",
                    "Open and private communities",
                    "Up to 3 courses of your choice, included",
                    "Business playbook included",
                    "Priority support",
                    "1 month of health insurance included",
                    "Personal pension registration",
                    "Recommended deals",
                  ].map((perk, i) => (
                    <span key={perk} className={`flex items-center gap-2.5 text-[14px] ${i === 0 ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                      <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
                      {perk}
                    </span>
                  ))}
                </div>
                <Button full href="/sign-up?type=creator" className="mt-auto">Go Pro</Button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ WOW FRAMEWORK: insights + chart ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 dt:grid-cols-[1fr_1.1fr] dt:gap-16">
            <div className="flex flex-col items-start">
              <CaptionPill>Your WOW Framework</CaptionPill>
              <h2 className="m-0 mt-5 text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary dt:text-[54px]">
                M&amp;E Insights.
                <br />
                <span className="text-accent-hover">Instant Payouts.</span>
              </h2>
              <p className="m-0 mt-4 max-w-[440px] text-[15px] leading-relaxed text-text-secondary">
                Know exactly which WOW about you drives revenue. Get paid when you want with instant payouts. No stories.
              </p>
              <div className="mt-9 flex gap-12">
                <span className="flex flex-col">
                  <span className="text-[30px] font-bold tracking-[-0.02em] text-text-primary [font-feature-settings:var(--font-feature-tabular)]">₦2.4M</span>
                  <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">Avg Monthly Revenue</span>
                </span>
                <span className="flex flex-col">
                  <span className="text-[30px] font-bold tracking-[-0.02em] text-text-primary [font-feature-settings:var(--font-feature-tabular)]">₦860k</span>
                  <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">Last Instant Payout</span>
                </span>
              </div>
            </div>

            <div className="rounded-card border border-hairline bg-card p-5 dt:p-7">
              <div className="flex items-start justify-between">
                <span className="flex flex-col">
                  <span className="text-[15.5px] font-semibold text-text-primary">Monthly Revenue</span>
                  <span className="text-[12.5px] text-text-muted">Real-time Growth</span>
                </span>
                <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-[rgba(184,232,62,0.4)] bg-success-tint px-2.5 text-[12px] font-bold text-success">
                  <Icon name="TrendingUp" size={12} color="var(--success)" strokeWidth={2.4} />
                  +124% YoY
                </span>
              </div>
              <svg viewBox="0 0 480 230" className="mt-4 w-full" role="img" aria-label="Monthly revenue growth chart, up 124% year on year">
                <defs>
                  <linearGradient id="wawuArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((i) => (
                  <line key={i} x1="36" x2="480" y1={30 + i * 50} y2={30 + i * 50} stroke="var(--border-hairline)" strokeWidth="1" />
                ))}
                {["₦16M", "₦12M", "₦8M", "₦4M"].map((label, i) => (
                  <text key={label} x="0" y={34 + i * 50} fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-sans)">
                    {label}
                  </text>
                ))}
                <path
                  d="M36,196 C80,190 110,184 148,172 C186,160 214,152 252,134 C290,116 318,108 356,86 C394,64 428,46 480,24 L480,214 L36,214 Z"
                  fill="url(#wawuArea)"
                />
                <path
                  d="M36,196 C80,190 110,184 148,172 C186,160 214,152 252,134 C290,116 318,108 356,86 C394,64 428,46 480,24"
                  fill="none"
                  stroke="var(--accent-hover)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((m, i) => (
                  <text key={m} x={40 + i * 60} y="228" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-sans)">
                    {m}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </section>

        {/* ============ COMPARE BANNER ============ */}
        <section className="px-5 py-10 dt:py-14">
          <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 rounded-[28px] bg-[linear-gradient(120deg,var(--accent-deep),var(--accent))] p-8 dt:flex-row dt:items-center dt:justify-between dt:p-12">
            <div>
              <h2 className="m-0 text-[28px] font-bold tracking-[-0.02em] text-white dt:text-[34px]">See How We WOW You</h2>
              <p className="m-0 mt-2 max-w-[560px] text-[14.5px] leading-normal text-[rgba(255,255,255,0.82)]">
                FIND WOW. GET WOW. MAKE WOW. See why as a creator switching to WAWU makes absolute sense.
              </p>
            </div>
            <a
              href="#comparison"
              className="inline-flex h-[52px] shrink-0 items-center rounded-button bg-white px-8 text-[15px] font-semibold text-on-light transition-transform duration-200 hover:scale-[1.03]"
            >
              See the difference
            </a>
          </div>
        </section>

        {/* ============ WOW COMPARISON ============ */}
        <section id="comparison" className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">WOW Comparison</span>
              <h2 className="m-0 mt-3 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-text-primary dt:text-[52px]">
                Choosing between <span className="text-accent-hover">WAWU</span>
                <br className="hidden dt:block" /> and the neighborhood
              </h2>
              <p className="m-0 mt-4 max-w-[560px] text-[15px] leading-relaxed text-text-secondary">
                See how WAWU stacks up, and find out why creators are switching.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3.5">
                <WhitePill href="/sign-up?type=creator">Get access</WhitePill>
                <Button size="lg" variant="secondary" href="/learn">Learn more</Button>
              </div>
            </div>

            <div className="wawu-no-scrollbar mt-12 overflow-x-auto rounded-card border border-hairline bg-card">
              <div className="grid min-w-[960px] grid-cols-[220px_1.25fr_1fr_1fr_1fr]">
                {/* Header */}
                <div className="border-b border-hairline p-4 text-[11.5px] font-bold uppercase tracking-[0.06em] text-text-muted">Feature</div>
                <div className="relative border-b border-l border-hairline bg-accent-tint-strong p-4">
                  <span className="block text-[14px] font-bold text-text-primary">WAWUAfrica</span>
                  <span className="mt-0.5 inline-flex h-[18px] items-center rounded-full bg-accent px-2 text-[9.5px] font-bold uppercase tracking-[0.04em] text-on-accent">
                    Best in Africa
                  </span>
                </div>
                {["The Neighborhood", "The Neighborhood", "The Neighborhood"].map((n, i) => (
                  <div key={i} className="border-b border-l border-hairline p-4 text-[13px] font-semibold text-text-muted">
                    {n}
                  </div>
                ))}
                {/* Rows */}
                {COMPARE_ROWS.map((row, ri) => (
                  <div key={row.feature} className="contents">
                    <div className={`flex items-center p-4 text-[13.5px] font-medium text-text-primary ${ri > 0 ? "border-t border-hairline" : ""}`}>
                      {row.feature}
                    </div>
                    <div className={`flex items-center border-l border-hairline bg-accent-tint p-4 ${ri > 0 ? "border-t" : ""}`}>
                      <CheckOrX value={row.wawu} accent />
                    </div>
                    {row.others.map((val, ci) => (
                      <div key={ci} className={`flex items-center border-l border-hairline p-4 ${ri > 0 ? "border-t" : ""}`}>
                        <CheckOrX value={val} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {/* Ecosystem, partnerships, unique advantages */}
            <div className="mt-8 grid grid-cols-1 gap-4 dt:grid-cols-3 dt:gap-5">
              <div className="rounded-card border border-hairline bg-card p-6">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent">Ecosystem &amp; Reach</span>
                <div className="mt-4 flex flex-col gap-3.5">
                  <span className="flex flex-col">
                    <span className="text-[24px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">10M+</span>
                    <span className="text-[12.5px] text-text-muted">Active users</span>
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[24px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">109M+</span>
                    <span className="text-[12.5px] text-text-muted">Reach across Africa</span>
                  </span>
                </div>
              </div>
              <div className="rounded-card border border-hairline bg-card p-6">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent">Partnerships &amp; Endorsements</span>
                <div className="mt-4 flex flex-col gap-2.5">
                  {["Governments across Africa", "International Bodies", "Nigerian Federal Ministries", "Professional Bodies", "Device Financing"].map((p) => (
                    <span key={p} className="flex items-center gap-2.5 text-[13.5px] text-text-secondary">
                      <Icon name="Check" size={15} color="var(--success)" strokeWidth={2.4} />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-card border border-hairline bg-card p-6">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-accent">Unique Advantages</span>
                <div className="mt-4 flex flex-col gap-2.5">
                  {[
                    "Integrated ecosystem: learn, earn, grow, collaborate",
                    "Skills development: training included",
                    "Financial inclusion: device financing",
                    "Faith-based approach",
                    "Pan-African focus: designed for Africa & global",
                    "85-90% revenue share, best in Africa",
                  ].map((p) => (
                    <span key={p} className="flex items-center gap-2.5 text-[13.5px] text-text-secondary">
                      <Icon name="Check" size={15} color="var(--success)" strokeWidth={2.4} />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ MAKE THE SWITCH ============ */}
        <section className="px-5 py-14 dt:py-20">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[28px] border border-hairline bg-card px-6 py-14 text-center dt:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,var(--accent-tint-strong),transparent_70%)]" aria-hidden="true" />
            <div className="relative mx-auto flex max-w-[720px] flex-col items-center">
              <CaptionPill>Own Your WOW. Join WAWUAfrica.</CaptionPill>
              <h2 className="m-0 mt-5 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-text-primary dt:text-[52px]">
                Ready to Build Something Real?
              </h2>
              <p className="m-0 mt-4 text-[15px] leading-relaxed text-text-secondary">
                Join a growing community of Professionals, Entrepreneurs, Artisans, Creators and start earning more with lower fees, better tools, instant payouts, and training included all on WAWUAfrica.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2.5">
                {["85-90% revenue share, best in Africa", "More features + Training + Financial Inclusion + Government partnerships", "Instant payouts"].map((b) => (
                  <span key={b} className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <Icon name="Check" size={14} color="var(--success)" strokeWidth={2.6} />
                    {b}
                  </span>
                ))}
              </div>
              <div className="mt-9 flex flex-wrap justify-center gap-3.5">
                <WhitePill href="/sign-up?type=creator">Join the Movement</WhitePill>
                <Button size="lg" variant="secondary" href="/learn">Learn more</Button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ THE COMMUNITY ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-primary">The Community</span>
              <h2 className="m-0 mt-3 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-text-primary dt:text-[52px]">
                Professionals, Entrepreneurs,
                <br className="hidden dt:block" /> Artisans and <span className="text-accent-hover">Creatives</span>
              </h2>
              <p className="m-0 mt-4 max-w-[520px] text-[15px] leading-relaxed text-text-secondary">
                Join Millions who are building for socioeconomic impact and real communities on WAWUAfrica.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 dt:grid-cols-3 dt:gap-5">
              {[
                { handle: "@adaeze.biz", quote: "I was answering the same business questions for nothing on WhatsApp for years. Now the answers are a course and they pay for my rent.", name: "Adaeze Okonkwo", meta: "Business Strategist, Enugu" },
                { handle: "@ifeanyi.stitches", quote: "The paid DM changed everything. People are serious when they pay ₦300 to ask, and I reply the same day.", name: "Ifeanyi Nwosu", meta: "Fashion Designer, Aba" },
                { handle: "@zainab.agro", quote: "I got my CAC certificate and sold my first training pack in the same week, on the same app. That is the difference.", name: "Zainab Bello", meta: "Agribusiness Trainer, Kano" },
              ].map((t) => (
                <div key={t.name} className="flex flex-col gap-5 rounded-card border border-hairline bg-card p-6 transition-colors duration-200 hover:border-strong">
                  <p className="m-0 text-[15.5px] leading-relaxed text-text-primary">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-auto flex items-center gap-3">
                    <span className="grid h-[42px] w-[42px] place-items-center rounded-full bg-accent-tint text-[16px] font-bold text-accent-hover">
                      {t.name.charAt(0)}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-semibold text-text-primary">{t.name} <span className="font-normal text-text-muted">{t.handle}</span></span>
                      <span className="text-[12.5px] text-text-muted">{t.meta}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ STRATEGIC ALLY ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 dt:grid-cols-[420px_1fr] dt:gap-16">
            <div className="rounded-card border border-hairline bg-card p-6 shadow-[0_0_90px_var(--accent-tint)] dt:p-7">
              <div className="grid grid-cols-[1fr_72px_72px] items-center gap-y-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">Feature</span>
                <span className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-accent">WAWU</span>
                <span className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">Others</span>
                {["FIND WOW", "GET WOW", "MAKE WOW", "EVERYONE WOW"].map((f) => (
                  <div key={f} className="contents">
                    <span className="border-t border-hairline pt-4 text-[14px] font-semibold text-text-primary">{f}</span>
                    <span className="grid place-items-center border-t border-hairline pt-4">
                      <Icon name="Check" size={17} color="var(--success)" strokeWidth={2.6} />
                    </span>
                    <span className="grid place-items-center border-t border-hairline pt-4">
                      <Icon name="X" size={15} color="var(--text-muted)" strokeWidth={2.2} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <CaptionPill>Your Strategic Ally</CaptionPill>
              <h2 className="m-0 mt-5 text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[50px]">
                We WOW You Every
                <br />
                <span className="text-accent-hover">Step of the Way.</span>
              </h2>
              <div className="mt-5 flex flex-wrap items-center gap-y-2">
                {PIPELINE.map((step, i) => (
                  <span key={step} className="flex items-center">
                    <span className="inline-flex h-[30px] items-center rounded-full border border-hairline bg-tag px-3 text-[12px] font-medium text-text-secondary">{step}</span>
                    {i < PIPELINE.length - 1 ? <Icon name="ChevronRight" size={13} color="var(--text-muted)" /> : null}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <WhitePill href="/sign-up?type=creator">Join the Movement</WhitePill>
                <Button size="lg" variant="secondary" href="#comparison">See the difference</Button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="px-5 py-14 dt:py-24">
          <div className="mx-auto max-w-[820px]">
            <div className="flex flex-col items-center text-center">
              <CaptionPill>Got questions?</CaptionPill>
              <h2 className="m-0 mt-5 text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-text-primary dt:text-[56px]">
                Frequently Asked Questions
              </h2>
              <p className="m-0 mt-4 text-[15px] leading-relaxed text-text-secondary">
                Everything you need to know about joining WAWUAfrica.
              </p>
            </div>
            <div className="mt-10">
              <FaqAccordion items={FAQ} />
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="px-5 pb-20 pt-10 dt:pb-28">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[28px] border border-hairline bg-[linear-gradient(170deg,var(--surface-card),var(--accent-deep))] px-6 py-16 text-center dt:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_100%,var(--accent-tint-strong),transparent_70%)]" aria-hidden="true" />
            <div className="relative mx-auto flex max-w-[760px] flex-col items-center">
              <CaptionPill>Make the Move</CaptionPill>
              <span className="mt-6 text-[13px] font-bold uppercase tracking-[0.2em] text-accent-hover dt:text-[15px]">
                Find WOW. Get WOW. Make WOW.
              </span>
              <h2 className="m-0 mt-3 text-[44px] font-bold leading-[1.02] tracking-[-0.035em] text-text-primary dt:text-[76px]">
                Own Your WOW
              </h2>
              <div className="mt-9 flex flex-wrap justify-center gap-3.5">
                <WhitePill href="/sign-up?type=creator">Join WAWU</WhitePill>
                <Button size="lg" variant="secondary" href="/learn">Learn more</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col gap-7 border-t border-hairline px-5 pb-12 pt-9 dt:mx-auto dt:max-w-[1240px] dt:px-0">
        <img src="/wawu-logo-white.png" alt="WAWU" className="h-[20px] w-auto self-start object-contain opacity-80" />
        <div className="grid grid-cols-2 gap-x-5 gap-y-7 dt:grid-cols-4">
          {[
            { label: "Creators", links: [["Sign in", "/sign-in"], ["Sign up", "/sign-up"], ["Join the Movement", "/sign-up?type=creator"], ["Creator tiers", "#pricing"]] },
            { label: "Resources", links: [["Explore", "/explore"], ["Learn", "/learn"], ["Services", "/services"], ["Mentors", "/services/mentors"]] },
            { label: "Company", links: [["Terms", "/terms"], ["Privacy", "/privacy/policy"]] },
          ].map((col) => (
            <div key={col.label} className="flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">{col.label}</span>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} className="text-[13.5px] text-text-secondary hover:text-text-primary">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3.5 border-t border-hairline pt-5">
          <span className="flex-1 text-[12px] text-text-muted">© 2026 WAWUAfrica</span>
        </div>
      </footer>
    </div>
  );
}
