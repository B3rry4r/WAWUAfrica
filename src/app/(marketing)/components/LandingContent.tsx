import Link from "next/link";
import { AccessBadge } from "@/components/ui/AccessBadge";
import { Button } from "@/components/ui/Button";
import { ComingSoonPill } from "@/components/ui/ComingSoonPill";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { TierBadge } from "@/components/ui/TierBadge";
import { formatNaira } from "@/lib/format";
import { getFeaturedContent } from "@/lib/api/content";
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
  { q: "Do I need to be verified to publish?", a: "Creator access uses the WAWU ID tier you already have. Certified professional or Trusted partner can publish content, turn on paid DMs and host communities." },
  { q: "Does my first upload have to be free?", a: "Yes. Every creator's first piece of content is free — it is how people find out your work is worth paying for. Price everything after that yourself." },
  { q: "What happens if a creator never replies to a paid DM?", a: "The sender is refunded in full after 24 hours and WAWU takes no fee on that refund. Creators who repeatedly miss the window have DMs switched off automatically." },
  { q: "What are WAWU Credits?", a: "Prepaid message units for open communities — one credit sends one message. They are a count, not a cash balance, and they are never converted back to naira." },
];

export async function LandingContent() {
  const toWatch = await getFeaturedContent();

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-3.5 py-3 backdrop-blur">
        <img src="/wawu-logo-white.png" alt="WAWU" className="mr-auto h-[22px] w-auto object-contain" />
        <Button variant="ghost" size="sm" href="/sign-in">Sign in</Button>
        <Button variant="secondary" size="sm" href="/sign-up">Sign up</Button>
        <Button size="sm" href="/sign-up?type=creator">Become a creator</Button>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-start gap-[18px] px-5 pb-9 pt-10">
        <AccessBadge>Keep up to 90% of what you earn</AccessBadge>
        <h1 className="m-0 text-[42px] font-bold leading-[1.05] tracking-[-0.035em] text-text-primary">
          African expertise,
          <br />
          finally paid for.
        </h1>
        <p className="m-0 text-[16.5px] leading-relaxed text-text-secondary">
          You already know something people will pay to learn. Publish it, price it, and let your audience unlock it — in naira, on your terms.
        </p>
        <div className="mt-1 flex w-full flex-col gap-3">
          <Button full size="lg" iconRight="ArrowRight" href="/sign-up?type=creator">
            Start earning today
          </Button>
          <Button full variant="ghost" size="md" href="/sign-up">
            Browse creators first
          </Button>
        </div>
      </section>

      {/* Creators to watch */}
      <CreatorCarousel items={toWatch} />

      {/* Stats */}
      <section className="px-5 pb-12">
        <div className="flex flex-col overflow-hidden rounded-card border border-hairline bg-card">
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
      <section className="px-5 pb-[52px]">
        <SectionHeader caption="Every field" title="One platform" />
        <p className="-mt-1.5 mb-[18px] text-[14.5px] leading-normal text-text-secondary">
          From agriculture to fintech, Nigerians are monetising what they already know.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((field) => (
            <div
              key={field}
              className="relative aspect-square overflow-hidden rounded-media border border-hairline bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,10,13,0.88)_0%,rgba(11,10,13,0.32)_42%,transparent_68%)]" />
              <span className="absolute bottom-3 left-[13px] text-[15px] font-semibold text-text-primary">{field}</span>
            </div>
          ))}
          <div
            className="relative col-span-2 aspect-[2.1/1] overflow-hidden rounded-media border border-hairline bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,10,13,0.88)_0%,rgba(11,10,13,0.32)_42%,transparent_68%)]" />
            <span className="absolute bottom-3 left-[13px] text-[15px] font-semibold text-text-primary">Culture</span>
          </div>
        </div>
      </section>

      {/* How you earn */}
      <section className="px-5 pb-[52px]">
        <SectionHeader caption="Five ways" title="How you earn" />
        <p className="-mt-1.5 mb-[18px] text-[14.5px] leading-normal text-text-secondary">Free to discover. People pay to connect, and pay for value.</p>
        <div className="flex flex-col gap-3">
          {WAYS.map((way) => (
            <div key={way.title} className="flex gap-3.5 rounded-card border border-hairline bg-card p-4">
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

      {/* Earnings calculator */}
      <section className="px-5 pb-[52px]">
        <SectionHeader caption="Earnings calculator" title="What could you make?" />
        <div className="mt-4">
          <EarningsCalculator />
        </div>
      </section>

      {/* More than content */}
      <section className="px-5 pb-[52px]">
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

      {/* Creator tiers */}
      <section className="px-5 pb-[52px]">
        <SectionHeader caption="Creator tiers" title="Go further, keep more" />
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3.5 rounded-card border border-hairline bg-card p-5">
            <TierBadge tier="basic" />
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
            <TierBadge tier="pro" />
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

      {/* Testimonials */}
      <section className="pb-[52px]">
        <div className="px-5">
          <SectionHeader caption="In their words" title="Creators on WAWU" />
        </div>
        <div className="wawu-no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-1 pb-2">
          {[
            { initial: "A", quote: "I was answering the same business questions free on WhatsApp for years. Now the answers are a course and they pay for my rent.", name: "Adaeze Okonkwo", meta: "Business Strategist, Enugu" },
            { initial: "I", quote: "The paid DM changed everything. People are serious when they pay ₦300 to ask, and I reply the same day.", name: "Ifeanyi Nwosu", meta: "Fashion Designer, Aba" },
            { initial: "Z", quote: "I got my CAC certificate and sold my first training pack in the same week, on the same app. That is the difference.", name: "Zainab Bello", meta: "Agribusiness Trainer, Kano" },
          ].map((t) => (
            <div key={t.name} className="flex w-[292px] shrink-0 snap-center flex-col gap-4 rounded-card border border-hairline bg-card p-5">
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

      {/* FAQ */}
      <section className="px-5 pb-[52px]">
        <SectionHeader caption="Before you ask" title="Questions" />
        <div className="mt-4">
          <FaqAccordion items={FAQ} />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-5 mb-10 flex flex-col gap-3.5 rounded-card p-7 bg-[linear-gradient(150deg,_var(--accent-deep)_0%,_var(--accent)_100%)]">
        <h2 className="m-0 text-[26px] font-semibold leading-[1.2] tracking-[-0.025em] text-on-accent">Ready to get paid for what you know?</h2>
        <p className="m-0 text-[14.5px] leading-normal text-[rgba(255,255,255,0.82)]">No entry fee. Publish your first piece free, price the next one yourself.</p>
        <Link
          href="/sign-up?type=creator"
          className="mt-0.5 inline-flex h-[46px] items-center gap-2 self-start rounded-button bg-white px-[22px] text-[15px] font-semibold text-on-light"
        >
          Become a creator
          <Icon name="ArrowRight" size={17} color="var(--text-on-light)" strokeWidth={2.2} />
        </Link>
      </section>

      {/* Newsletter */}
      <section className="px-5 pb-12">
        <div className="flex flex-col gap-3.5 rounded-card border border-hairline bg-card p-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Stay in the loop</span>
          <p className="m-0 text-[15px] leading-normal text-text-secondary">
            Monthly notes on what is selling on WAWU and how creators are pricing it.
          </p>
          <div className="flex h-[52px] items-center gap-2.5 rounded-input border border-hairline bg-input px-4">
            <Icon name="Mail" size={16} color="var(--text-muted)" />
            <input
              type="email"
              placeholder="you@email.com"
              className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-disabled"
              aria-label="Email"
            />
          </div>
          <Button full variant="secondary">Subscribe</Button>
          <span className="text-[12px] text-text-muted">No spam. Leave whenever you like.</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-[26px] border-t border-hairline px-5 pb-[46px] pt-[30px]">
        <img src="/wawu-logo-white.png" alt="WAWU" className="h-[20px] w-auto self-start object-contain opacity-80" />
        <div className="grid grid-cols-2 gap-x-5 gap-y-[26px]">
          {[
            { label: "Creators", links: [["Sign in", "/sign-in"], ["Sign up", "/sign-up"], ["Become a creator", "/sign-up?type=creator"], ["Creator tiers", "/sign-up?type=creator"]] },
            { label: "Services", links: [["CAC registration", "#cac"], ["NEPC registration", "#nepc"], ["Mentors", "#mentors"], ["Learn", "#learn"]] },
            { label: "Marketplace", links: [["WAWUBasket", "#basket"], ["WAWUBeauty", "#beauty"], ["Partners", "#partners"]] },
            { label: "Company", links: [["About", "#about"], ["Help", "#help"], ["Terms", "#terms"], ["Privacy", "#privacy"]] },
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
          {[
            { label: "WhatsApp", icon: "MessageCircle" },
            { label: "Instagram", icon: "Instagram" },
          ].map((s) => (
            <a
              key={s.label}
              href="#social"
              aria-label={s.label}
              className="grid h-[34px] w-[34px] place-items-center rounded-button border border-hairline bg-tag text-text-secondary"
            >
              <Icon name={s.icon as "MessageCircle"} size={16} />
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}