import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ListRow } from "@/components/ui/ListRow";

export const metadata = {
  title: "About WAWUAfrica",
};

/**
 * The company's own description of itself, supplied by the product owner
 * (4 Sep 2026). It replaces a page that described WAWU only as a Nigerian
 * content marketplace and led with the revenue split, which is one product
 * inside the ecosystem rather than what the company is.
 *
 * The mechanics that used to be the whole page (credits, no wallet,
 * Nigeria-first) are kept below the description: they are still true, and a
 * member reading About is often looking for exactly those answers.
 */
export default function AboutPage() {
  return (
    <div className="flex flex-col gap-[16px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:p-[30px_28px_64px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          About WAWUAfrica
        </span>
      </div>

      <p className="m-0 text-[14.5px] leading-[1.6] text-[var(--text-primary)]">
        WAWUAfrica is a Christocentric lifestyle, creator and socioeconomic ecosystem built to
        connect people, creators, entrepreneurs, businesses and institutions to opportunities
        that enable them to learn, create, work, trade, earn and grow.
      </p>
      <p className="m-0 text-[13.5px] leading-[1.6] text-[var(--text-secondary)]">
        We are building an interconnected ecosystem around the journey from training and
        certification to employment, market access, financial inclusion and ownership, helping
        individuals develop relevant skills, access opportunities, build businesses, monetise
        their creativity, participate in commerce and access financial services.
      </p>
      <p className="m-0 text-[13.5px] leading-[1.6] text-[var(--text-secondary)]">
        Through technology, strategic partnerships and community-driven networks, WAWUAfrica
        connects talent to opportunity, businesses to markets, creators to audiences, and people
        to the tools and services they need to thrive.
      </p>
      <p className="m-0 text-[13.5px] leading-[1.6] text-[var(--text-secondary)]">
        Our vision is to contribute to a more inclusive, productive and opportunity-driven
        African digital economy, where people are not only participants but also creators,
        entrepreneurs, earners and owners of value.
      </p>

      <div className="flex flex-col gap-[6px] rounded-[var(--radius-card)] border border-decor bg-decor-tint p-[16px_15px]">
        <span className="text-[15px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          WAWUAfrica
        </span>
        <span className="text-[13.5px] font-semibold leading-[1.5] text-[var(--accent)]">
          Learn. Create. Work. Trade. Earn. Grow. Own.
        </span>
      </div>

      <span className="pt-[4px] text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        How things work here
      </span>
      <Section
        title="What creators earn"
        body="Creators price their own work in naira. On a sale, 85% goes to the creator and WAWU keeps 15%, or 90/10 on the Pro and Pro Max tiers."
      />
      <Section
        title="Credits, never cash"
        body="WAWU Credits are a count used for paid messages, community posts and tips. They cannot be withdrawn or converted to cash."
      />
      <Section
        title="Nigeria-first"
        body="Prices are in naira. Verification uses BVN and NIN in Nigeria, national IDs elsewhere, and every review is done by a person."
      />

      <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
        <ListRow title="Privacy policy" icon="FileText" href="/privacy/policy" />
        <ListRow title="Terms of service" icon="Scale" href="/terms" />
        <ListRow title="Contact us" subtitle="support@wawuafrica.com" icon="Mail" href="mailto:support@wawuafrica.com" />
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-col gap-[5px]">
      <span className="text-[15px] font-bold text-[var(--text-primary)]">{title}</span>
      <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">{body}</span>
    </section>
  );
}
