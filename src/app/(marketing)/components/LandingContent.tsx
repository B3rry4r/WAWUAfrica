import Link from "next/link";
import { ContentCard } from "@/components/content/ContentCard";
import { AccessBadge } from "@/components/ui/AccessBadge";
import { Button } from "@/components/ui/Button";
import { ComingSoonPill } from "@/components/ui/ComingSoonPill";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { TierBadge } from "@/components/ui/TierBadge";
import { formatNaira } from "@/lib/format";
import { getFeaturedContent } from "@/lib/api/content";
import type { ContentPiece } from "@/types/content";
import { CreatorCarousel } from "./CreatorCarousel";
import { EarningsCalculator } from "./EarningsCalculator";
import { FaqAccordion } from "./FaqAccordion";

const FIELDS = ["Business", "Trade", "Finance", "Entertainment", "Career", "Education", "Agriculture", "Health", "Technology", "Creative Arts", "Culture"];

interface Way {
  icon: IconName;
  title: string;
  keep: string;
  body: string;
  highlight?: boolean;
}

const WAYS: Way[] = [
  { icon: "Play", title: "Sell content", keep: "You keep 85%", body: "Video, courses, audio, books, art and templates. Set a price from ₦100 to ₦5,000 — buyers pay once and keep it forever." },
  { icon: "MessageCircle", title: "Paid DMs", keep: "You keep 85%", body: "Charge ₦50 to ₦500 a message. Reply within 24 hours and it pays — miss it and the sender is refunded in full." },
  { icon: "Users", title: "Community access", keep: "You keep 90%", highlight: true, body: "Host a community and earn on every message sent in it. One credit per message — the best split on the platform." },
  { icon: "HandCoins", title: "Tips", keep: "You keep 85%", body: "Any amount, any time, nothing locked behind it. People support the work because they want to." },
  { icon: "Store", title: "Storefront", keep: "You keep 85%", body: "Sell physical goods and services through WAWUBasket and WAWUBeauty, right from your profile." },
] as const;

const SERVICES = [
  { icon: "Stamp", title: "CAC registration", subtitle: "Register your business properly, in app" },
  { icon: "Ship", title: "NEPC registration", subtitle: "Get certified to export" },
  { icon: "UserRoundSearch", title: "Mentors", subtitle: "Book time with people who have done it" },
  { icon: "GraduationCap", title: "Courses", subtitle: "Partner-delivered training, free on a tier" },
  { icon: "BookOpen", title: "Business playbook", subtitle: "The full guide, free to download" },
] as const;

const FAQ = [
  { q: "What does WAWU take?", a: "You keep 85% of everything you earn — content unlocks, paid DMs, tips and storefront sales. Pro-tier creators keep 90%. There is no listing fee and no monthly platform fee." },
  { q: "Do I need to be verified to publish?", a: "No. Creator is an account type — pick it at signup or upgrade later, then pay a subscription (Basic or Pro) to publish content, turn on paid DMs and host communities. KYC is separate and only gates when you can receive payouts." },
  { q: "Does my first upload have to be free?", a: "Yes. Every creator's first piece of content is free — it is how people find out your work is worth paying for. Price everything after that yourself." },
  { q: "What happens if a creator never replies to a paid DM?", a: "The sender is refunded in full after 24 hours and WAWU takes no fee on that refund. Creators who repeatedly miss the window have DMs switched off automatically." },
  { q: "What are WAWU Credits?", a: "Prepaid message units for open communities — one credit sends one message. They are a count, not a cash balance, and they are never converted back to naira." },
];

export async function LandingContent() {
  // getFeaturedContent() now hits a genuinely public Hub API route (see its
  // doc comment in src/lib/api/content.ts), so this only throws on a real
  // failure (backend down, network). Scoping the try/catch to just this call
  // means a failure here shows a real, visible error for the "Creators to
  // watch" section instead of crashing the entire marketing page.
  let toWatch: ContentPiece[] = [];
  let featuredError = false;
  try {
    toWatch = await getFeaturedContent();
  } catch {
    featuredError = true;
  }

  // Desktop hero collage reuses the same featured items the mobile carousel
  // shows below — no separate mock, just a different arrangement of it.
  const collage = toWatch.length > 0 ? [0, 1, 2, 0].map((i) => toWatch[i % toWatch.length]) : [];

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-3.5 py-3 backdrop-blur dt:gap-[34px] dt:px-14 dt:py-0 dt:h-[74px]">
        <img src="/wawu-logo-white.png" alt="WAWU" className="mr-auto h-[22px] w-auto object-contain dt:mr-0 dt:h-[26px]" />
        <nav className="hidden items-center gap-[26px] dt:flex" aria-label="Marketing">
          {[
            ["For creators", "/sign-up?type=creator"],
            ["Explore", "/explore"],
            ["Learn", "/learn"],
            ["Services", "/services"],
            ["Pricing", "#pricing"],
          ].map(([label, href]) => (
            <a key={label} href={href} className="text-[14.5px] font-medium text-text-secondary hover:text-text-primary">
              {label}
            </a>
          ))}
        </nav>
        <span className="hidden flex-1 dt:block" />
        <Button variant="ghost" size="sm" href="/sign-in">Sign in</Button>
        <Button variant="secondary" size="sm" href="/sign-up" className="dt:hidden">Sign up</Button>
        <Button size="sm" href="/sign-up?type=creator">Become a creator</Button>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-start gap-[18px] px-5 pb-9 pt-10 dt:mx-auto dt:grid dt:w-full dt:max-w-[1440px] dt:grid-cols-[1fr_560px] dt:items-center dt:gap-14 dt:px-14 dt:pb-14 dt:pt-16">
        <div className="flex flex-col items-start gap-[18px] dt:contents">
          <div className="hidden dt:flex dt:w-full dt:flex-col dt:items-start dt:gap-[22px]">
            <AccessBadge>Keep up to 90% of what you earn</AccessBadge>
            <h1 className="m-0 text-[60px] font-bold leading-[1.02] tracking-[-0.035em] text-text-primary">
              Turn your WOW
              <br />
              <span className="text-accent">into income.</span>
            </h1>
            <p className="m-0 max-w-[520px] text-[18px] leading-relaxed text-text-secondary [text-wrap:pretty]">
              You&apos;ve already built something real. Publish it, price it, and let your audience unlock it — in naira, on your terms.
            </p>
            <div className="flex gap-3 pt-1.5">
              <Button size="lg" iconRight="ArrowRight" href="/sign-up?type=creator">
                Start monetizing today
              </Button>
              <Button size="lg" variant="secondary" href="/sign-up">
                Browse creators first
              </Button>
            </div>
            <div className="mt-1.5 flex gap-10 border-t border-hairline pt-[26px]">
              {[
                { value: "10,000+", label: "Creators on WAWU" },
                { value: "₦900M+", label: "Paid to creators" },
                { value: "1.5M+", label: "Fans on the platform" },
              ].map((s) => (
                <StatBlock key={s.label} value={s.value} label={s.label} align="start" size="md" />
              ))}
            </div>
          </div>
          <span className="dt:hidden">
            <AccessBadge>Keep up to 90% of what you earn</AccessBadge>
          </span>
          <h1 className="m-0 text-[42px] font-bold leading-[1.05] tracking-[-0.035em] text-text-primary dt:hidden">
            Turn your WOW
            <br />
            <span className="text-accent">into income.</span>
          </h1>
          <p className="m-0 text-[16.5px] leading-relaxed text-text-secondary dt:hidden">
            You&apos;ve already built something real. Publish it, price it, and let your audience unlock it — in naira, on your terms.
          </p>
          <div className="mt-1 flex w-full flex-col gap-3 dt:hidden">
            <Button full size="lg" iconRight="ArrowRight" href="/sign-up?type=creator">
              Start monetizing today
            </Button>
            <Button full variant="ghost" size="md" href="/sign-up">
              Browse creators first
            </Button>
          </div>
        </div>

        {collage.length === 4 ? (
          <div className="hidden dt:grid dt:grid-cols-2 dt:gap-[18px]">
            <div className="flex flex-col gap-[18px] pt-[34px]">
              <ContentCard content={collage[0]} state="locked" ratio="4 / 5" href="/sign-up" />
              <ContentCard content={collage[1]} state="free" ratio="1 / 1" href="/sign-up" />
            </div>
            <div className="flex flex-col gap-[18px]">
              <ContentCard content={collage[2]} state="locked" ratio="1 / 1" href="/sign-up" />
              <ContentCard content={collage[3]} state="locked" ratio="4 / 5" href="/sign-up" />
            </div>
          </div>
        ) : null}
      </section>

      {/* Value proposition */}
      <section className="px-5 pb-[52px] dt:mx-auto dt:max-w-[1440px] dt:px-14">
        <div className="grid grid-cols-1 gap-3 dt:grid-cols-4 dt:gap-[18px]">
          {[
            { label: "FIND WOW", icon: "Compass" as IconName, body: "Discover Africa's best entrepreneurs, professionals and creators — your front row seat to opportunity." },
            { label: "GET WOW", icon: "Sparkles" as IconName, body: "Unlock premium content, real products and personalised experiences from top creators." },
            { label: "MAKE WOW", icon: "Rocket" as IconName, body: "Turn your expertise, skills and products into income, with tools built for exactly that." },
            { label: "EVERYONE WOW", icon: "Users" as IconName, body: "To turn expertise into income — publish, price, and let people pay for what you know." },
          ].map((v) => (
            <div key={v.label} className="flex flex-col gap-2.5 rounded-card border border-hairline bg-card p-5">
              <span className="grid h-[40px] w-[40px] place-items-center rounded-[13px] border border-accent bg-accent-tint">
                <Icon name={v.icon} size={18} color="var(--accent)" strokeWidth={2} />
              </span>
              <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-accent">{v.label}</span>
              <p className="m-0 text-[13.5px] leading-normal text-text-secondary">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Creators to watch — real failure shows a real error; genuinely no
         content yet (empty backend) shows neither an error nor an empty
         heading, just nothing, same as any other real empty state. */}
      {featuredError ? (
        <section className="px-5 pb-8 dt:mx-auto dt:max-w-[1440px] dt:px-14">
          <ErrorState title="Could not load creators to watch" body="Sign up to see who is live on WAWU right now." />
        </section>
      ) : toWatch.length > 0 ? (
        <CreatorCarousel items={toWatch} />
      ) : null}

      {/* Stats */}
      <section className="px-5 pb-12 dt:mx-auto dt:max-w-[1440px] dt:px-14">
        <div className="flex flex-col overflow-hidden rounded-card border border-hairline bg-card dt:hidden">
          {[
            { value: "10,000+", label: "Creators on WAWU" },
            { value: "₦900M+", label: "Paid to creators" },
            { value: "1.5M+", label: "Fans on the platform" },
          ].map((s, i) => (
            <div key={s.label} className={`px-5 py-[22px] ${i < 2 ? "border-b border-hairline" : ""}`}>
              <StatBlock value={s.value} label={s.label} align="start" size="lg" />
            </div>
          ))}
        </div>
      </section>

      {/* Every field */}
      <section className="px-5 pb-[52px] dt:mx-auto dt:max-w-[1440px] dt:px-14">
        <SectionHeader caption="Find your WOW" title="Every field, one platform" />
        <p className="-mt-1.5 mb-[18px] text-[14.5px] leading-normal text-text-secondary">
          From agriculture to fintech, Nigerians are monetising what they already know.
        </p>
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((field) => (
            <span
              key={field}
              className="inline-flex h-8 items-center rounded-full border border-hairline bg-tag px-[13px] text-[12.5px] font-medium text-text-secondary"
            >
              {field}
            </span>
          ))}
        </div>
      </section>

      {/* WOW Vault */}
      <section className="px-5 pb-[52px] dt:mx-auto dt:max-w-[1440px] dt:px-14">
        <SectionHeader caption="Your content, organised" title="The WOW Vault" />
        <p className="-mt-1.5 mb-[18px] text-[14.5px] leading-normal text-text-secondary">
          Organise and monetise your content. Set prices, lock exclusives, and keep your audience coming back.
        </p>
        <div className="flex flex-col gap-4 dt:grid dt:grid-cols-[1fr_360px] dt:items-start dt:gap-[22px]">
          <div className="rounded-card border border-hairline bg-card p-5">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "PPV from ₦100", icon: "Lock" as IconName },
                { label: "Free first upload", icon: "Gift" as IconName },
                { label: "Audience favourite", icon: "Heart" as IconName },
                { label: "Exclusive", icon: "Star" as IconName },
              ].map((chip) => (
                <span key={chip.label} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-hairline bg-tag px-[13px] text-[12.5px] font-medium text-text-secondary">
                  <Icon name={chip.icon} size={13} color="var(--text-muted)" />
                  {chip.label}
                </span>
              ))}
            </div>
            <p className="m-0 mt-4 text-[13.5px] leading-normal text-text-secondary">
              Video, courses, audio, ebooks, art and templates — priced by you, from ₦100 to ₦5,000, paid once and kept forever by the buyer.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 rounded-card border border-hairline bg-card p-5">
            <div className="flex items-center gap-2">
              <Icon name="Calendar" size={16} color="var(--text-muted)" />
              <span className="text-[14px] font-semibold text-text-primary">Smart scheduler</span>
              <ComingSoonPill>Coming soon</ComingSoonPill>
            </div>
            <p className="m-0 text-[12.5px] leading-normal text-text-muted">
              Plan your content calendar weeks ahead and release steadily to keep your audience engaged.
            </p>
          </div>
        </div>
      </section>

      {/* How you earn */}
      <section className="px-5 pb-[52px] dt:mx-auto dt:max-w-[1440px] dt:px-14">
        <SectionHeader caption="WOW revenue streams" title="Monetize the WOW about you" />
        <p className="-mt-1.5 mb-[18px] text-[14.5px] leading-normal text-text-secondary">Free to discover. People pay to connect, and pay for value.</p>
        <div className="flex flex-col gap-3 dt:grid dt:grid-cols-5 dt:gap-[18px]">
          {WAYS.map((way) => (
            <div key={way.title} className="flex gap-3.5 rounded-card border border-hairline bg-card p-4 dt:flex-col dt:gap-3 dt:p-[22px]">
              <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border border-accent bg-accent-tint">
                <Icon name={way.icon} size={19} color="var(--accent)" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[16px] font-semibold text-text-primary">{way.title}</span>
                  <span
                    className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-full border px-2.5 text-[11px] font-bold ${
                      way.highlight ? "border-accent bg-accent-tint text-text-primary" : "border-hairline bg-tag text-text-secondary"
                    }`}
                  >
                    {way.keep}
                  </span>
                </div>
                <p className="m-0 mt-1.5 text-[13.5px] leading-normal text-text-secondary">{way.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings calculator + More than content: source order keeps the calculator
         first, but dt:order- swaps the visual order so "more than content" leads,
         matching the design's left/right arrangement without reordering the DOM. */}
      <div className="contents dt:grid dt:mx-auto dt:max-w-[1440px] dt:grid-cols-2 dt:gap-[22px] dt:px-14 dt:pb-[52px]">
        <section id="pricing" className="px-5 pb-[52px] dt:order-2 dt:px-0 dt:pb-0">
          <SectionHeader caption="Earnings calculator" title="See your earning potential" />
          <div className="mt-4">
            <EarningsCalculator />
          </div>
        </section>

        {/* More than content */}
        <section className="px-5 pb-[52px] dt:order-1 dt:px-0 dt:pb-0">
          <SectionHeader caption="Only on WAWU" title="More than content" />
          <p className="-mt-1.5 mb-[18px] text-[14.5px] leading-normal text-text-secondary">
            Other platforms sell your content. WAWU also gets your business registered, trained and covered.
          </p>
          <div className="rounded-card border border-hairline bg-card p-1.5">
            {SERVICES.map((s) => (
              <div key={s.title} className="flex items-center gap-3 px-3 py-3">
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-tag text-text-secondary">
                  <Icon name={s.icon} size={18} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold text-text-primary">{s.title}</span>
                  <span className="block truncate text-[12.5px] text-text-muted">{s.subtitle}</span>
                </span>
                <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
              </div>
            ))}
          </div>
          <div className="mt-[18px] flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">On the way</span>
            <div className="flex flex-wrap gap-2">
              {["Health insurance", "Pension", "Banking", "Grants and funding"].map((x) => (
                <ComingSoonPill key={x}>{x}</ComingSoonPill>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Creator tiers */}
      <section className="px-5 pb-[52px] dt:mx-auto dt:max-w-[1440px] dt:px-14">
        <SectionHeader caption="Creator tiers" title="Go further, keep more" />
        <div className="mt-4 flex flex-col gap-3 dt:grid dt:grid-cols-3 dt:gap-[18px]">
          <div className="hidden flex-col gap-3.5 rounded-card border border-hairline bg-card p-5 dt:flex">
            <span className="text-[16px] font-semibold text-text-primary">Free</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[32px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">
                {formatNaira(0)}
              </span>
            </div>
            <p className="m-0 text-[13.5px] leading-normal text-text-secondary">
              Browse and unlock content, message creators, join communities, shop and learn.
            </p>
            <Button full variant="secondary" size="sm" href="/sign-up">
              Join free
            </Button>
          </div>
          <div className="flex flex-col gap-3.5 rounded-card border border-hairline bg-card p-5">
            <span className="self-start"><TierBadge tier="basic" /></span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[32px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">
                {formatNaira(5999)}
              </span>
              <span className="text-[14px] text-text-muted">a year</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {["3 uploads — 1 free, 2 paid", "Host open communities", "1 free course and the business playbook", "Purple badge"].map((perk) => (
                <span key={perk} className="flex items-center gap-2.5 text-[14px] text-text-secondary">
                  <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
                  {perk}
                </span>
              ))}
            </div>
            <Button full variant="secondary" href="/sign-up?type=creator">
              Choose Basic
            </Button>
          </div>

          <div className="flex flex-col gap-3.5 rounded-card border border-accent bg-elevated p-5">
            <span className="self-start"><TierBadge tier="pro" /></span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[32px] font-bold tracking-[-0.03em] [font-feature-settings:var(--font-feature-tabular)]">
                {formatNaira(18999)}
              </span>
              <span className="text-[14px] text-text-muted">a year</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                "Keep 90% instead of 85%",
                "7 uploads — 2 free, 5 paid",
                "Private communities and up to 3 free courses",
                "Priority support, gold badge, recommended deals",
              ].map((perk, i) => (
                <span key={perk} className={`flex items-center gap-2.5 text-[14px] ${i === 0 ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                  <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
                  {perk}
                </span>
              ))}
            </div>
            <Button full href="/sign-up?type=creator">Go Pro</Button>
          </div>
        </div>
      </section>

      {/* Make the switch */}
      <section className="mx-5 mb-[52px] flex flex-col gap-4 rounded-card border border-hairline bg-card p-6 dt:mx-auto dt:max-w-[1440px] dt:flex-row dt:items-center dt:justify-between dt:p-10">
        <div className="flex flex-col gap-3">
          <SectionHeader caption="Own your WOW" title="Ready to build something real?" />
          <p className="m-0 max-w-[520px] text-[14.5px] leading-normal text-text-secondary">
            Join a growing community of professionals, entrepreneurs, artisans and creators earning more with lower fees and better tools, all on WAWU.
          </p>
          <div className="mt-1 flex flex-col gap-2">
            {["85% standard, 90% Pro — best split on the platform", "CAC and NEPC registration, mentors and courses built in", "No entry fee — your first piece is free, you price the rest"].map((b) => (
              <span key={b} className="flex items-center gap-2.5 text-[13.5px] text-text-secondary">
                <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
                {b}
              </span>
            ))}
          </div>
        </div>
        <Button size="lg" iconRight="ArrowRight" href="/sign-up?type=creator" className="shrink-0">
          Join the Movement Free
        </Button>
      </section>

      {/* Testimonials */}
      <section className="pb-[52px] dt:mx-auto dt:max-w-[1440px]">
        <div className="px-5 dt:px-14">
          <SectionHeader caption="In their words" title="Creators on WAWU" />
        </div>
        <div className="wawu-no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-1 pb-2 dt:grid dt:grid-cols-3 dt:overflow-visible dt:px-14 dt:pb-0">
          {[
            { initial: "A", quote: "I was answering the same business questions free on WhatsApp for years. Now the answers are a course and they pay for my rent.", name: "Adaeze Okonkwo", meta: "Business Strategist, Enugu" },
            { initial: "I", quote: "The paid DM changed everything. People are serious when they pay ₦300 to ask, and I reply the same day.", name: "Ifeanyi Nwosu", meta: "Fashion Designer, Aba" },
            { initial: "Z", quote: "I got my CAC certificate and sold my first training pack in the same week, on the same app. That is the difference.", name: "Zainab Bello", meta: "Agribusiness Trainer, Kano" },
          ].map((t) => (
            <div key={t.name} className="flex w-[292px] shrink-0 snap-center flex-col gap-4 rounded-card border border-hairline bg-card p-5 dt:w-auto">
              <p className="m-0 text-[15px] leading-normal text-text-primary">“{t.quote}”</p>
              <div className="mt-auto flex items-center gap-2.5">
                <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-accent-tint text-[15px] font-semibold text-accent-hover">{t.initial}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-text-primary">{t.name}</span>
                  <span className="text-[12.5px] text-text-muted">{t.meta}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Strategic ally */}
      <section className="px-5 pb-[52px] dt:mx-auto dt:max-w-[1440px] dt:px-14">
        <SectionHeader caption="Your strategic ally" title="We WOW you every step of the way" />
        <p className="-mt-1.5 mb-[18px] max-w-[620px] text-[14.5px] leading-normal text-text-secondary">
          We don&apos;t just give you tools — from your first upload to your first payout, someone real is on the other end.
        </p>
        <div className="grid grid-cols-1 gap-3 dt:grid-cols-4 dt:gap-[18px]">
          {[
            { icon: "UserCheck" as IconName, title: "Manual, human review", body: "Every KYC submission is reviewed by a real person. Never automated, never charged for." },
            { icon: "PieChart" as IconName, title: "Transparent split", body: "85% standard, 90% Pro — shown before you publish, never a hidden fee." },
            { icon: "Landmark" as IconName, title: "Your own payout", body: "Earnings are paid out to your own bank account once KYC clears — never held in a platform wallet." },
            { icon: "TrendingUp" as IconName, title: "EVG score", body: "See which of your content is actually driving revenue, so you know what to make more of." },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-2.5 rounded-card border border-hairline bg-card p-5">
              <span className="grid h-[40px] w-[40px] place-items-center rounded-[13px] border border-accent bg-accent-tint">
                <Icon name={f.icon} size={18} color="var(--accent)" strokeWidth={2} />
              </span>
              <span className="text-[14.5px] font-semibold text-text-primary">{f.title}</span>
              <p className="m-0 text-[13px] leading-normal text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 pb-[52px] dt:mx-auto dt:max-w-[1440px] dt:px-14">
        <SectionHeader caption="Questions and concerns?" title="Frequently asked questions" />
        <p className="-mt-1.5 mb-[18px] text-[14.5px] leading-normal text-text-secondary">Everything you need to know about joining WAWU.</p>
        <div className="mt-4 dt:mx-auto dt:max-w-[760px]">
          <FaqAccordion items={FAQ} />
        </div>
      </section>

      {/* Community */}
      <section className="px-5 pb-[52px] text-center dt:mx-auto dt:max-w-[760px] dt:px-14">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">The community</span>
        <h2 className="m-0 mt-1.5 text-[24px] font-semibold leading-snug tracking-[-0.02em] text-text-primary dt:text-[30px]">
          Professionals, entrepreneurs, artisans and creatives
        </h2>
        <p className="m-0 mt-2.5 text-[14.5px] leading-normal text-text-secondary">
          10,000+ creators and 1.5M+ fans are already building for real, in naira, on WAWU.
        </p>
      </section>

      {/* CTA */}
      <section className="mx-5 mb-10 flex flex-col gap-3.5 rounded-card py-7 px-[22px] bg-[linear-gradient(150deg,_var(--accent-deep)_0%,_var(--accent)_100%)] dt:mx-auto dt:mb-14 dt:max-w-[1440px] dt:flex-row dt:items-center dt:justify-between dt:px-14 dt:py-12">
        <div className="flex flex-col gap-3.5 dt:gap-2">
          <h2 className="m-0 text-[26px] font-semibold leading-[1.2] tracking-[-0.025em] text-on-accent dt:text-[32px]">Own your WOW. Get paid for it.</h2>
          <p className="m-0 text-[14.5px] leading-normal text-[rgba(255,255,255,0.82)] dt:text-[15px]">No entry fee. Publish your first piece free, price the next one yourself.</p>
        </div>
        <Link
          href="/sign-up?type=creator"
          className="mt-0.5 inline-flex h-[46px] shrink-0 items-center gap-2 self-start rounded-button bg-white px-[22px] text-[15px] font-semibold text-on-light dt:mt-0 dt:h-[52px] dt:self-auto"
        >
          Become a creator
          <Icon name="ArrowRight" size={17} color="var(--text-on-light)" strokeWidth={2.2} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-[26px] border-t border-hairline px-5 pb-[46px] pt-[30px] dt:mx-auto dt:max-w-[1440px] dt:px-14">
        <img src="/wawu-logo-white.png" alt="WAWU" className="h-[20px] w-auto self-start object-contain opacity-80" />
        <div className="grid grid-cols-2 gap-x-5 gap-y-[26px] dt:grid-cols-4">
          {[
            { label: "Creators", links: [["Sign in", "/sign-in"], ["Sign up", "/sign-up"], ["Become a creator", "/sign-up?type=creator"], ["Creator tiers", "#pricing"]] },
            { label: "Services", links: [["CAC registration", "/services/cac"], ["NEPC registration", "/services/nepc"], ["Mentors", "/services/mentors"], ["Learn", "/learn"]] },
            { label: "Company", links: [["Terms", "/terms"], ["Privacy", "/privacy/policy"]] },
          ].map((col) => (
            <div key={col.label} className="flex flex-col gap-[11px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">{col.label}</span>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} className="text-[13.5px] text-text-secondary">
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