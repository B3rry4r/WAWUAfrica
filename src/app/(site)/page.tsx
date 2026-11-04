import type { Metadata } from "next";
import Link from "next/link";
import { REGISTER_HREF, SITE_URL } from "@/lib/site/site-config";
import { AppTiles } from "./_components/AppTiles";
import { ButtonLink } from "./_components/ButtonLink";
import { Cards } from "./_components/Cards";
import { ConferenceBand } from "./_components/ConferenceBand";
import { HeroScreens } from "./_components/HeroScreens";
import { ArrowIcon, CoinIcon, MicIcon, TagIcon } from "./_components/Icons";
import { LogoWall } from "./_components/LogoWall";
import { Marquee } from "./_components/Marquee";
import { RotatingWord } from "./_components/RotatingWord";
import { SectionHead } from "./_components/SectionHead";
import { Wrap } from "./_components/Wrap";
import { pageMetadata } from "./_lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "WAWUAfrica · Apps that give people a name, a voice and a way to earn",
  description:
    "WAWU builds apps for everyday people: WHO MADE THIS? to put your name on your work and get paid, and VOICES, where everybody gets a voice.",
  path: "/",
});

const KNOWN_FOR = [
  { title: "Be named.", body: "Your name belongs on your work. WHO MADE THIS? makes sure it stays there.", icon: <TagIcon className="h-6 w-6" /> },
  { title: "Be heard.", body: "Everybody has something to say. VOICES lets you say it out loud.", icon: <MicIcon className="h-6 w-6" /> },
  { title: "Be paid.", body: "Skills and voices should earn. We build the ways people get rewarded for what they do.", icon: <CoinIcon className="h-6 w-6" /> },
] as const;

const HOW_WE_BUILD = [
  { title: "Make it yours.", body: "Your name, your work, your rules." },
  { title: "Keep it simple.", body: "If it needs a manual, we redo it." },
  { title: "Own your work.", body: "What you build belongs to you." },
] as const;

const BUILD_WITH = [
  { title: "Partner with us", body: "Bring your people. Grow together.", href: "/partners", cta: "Partner with us" },
  { title: "Join the team", body: "Careers at WAWU.", href: "/careers", cta: "See careers" },
  { title: "Press and media", body: "Logos, facts and a contact.", href: "/press", cta: "Press page" },
] as const;

const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WAWUAfrica",
  legalName: "WAWU Technology Ltd",
  url: SITE_URL,
  logo: `${SITE_URL}/wawu-brand-wordmark-colour.png`,
  email: "support@wawuafrica.com",
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WAWUAfrica",
  alternateName: ["WAWU Africa", "WAWU"],
  url: `${SITE_URL}/`,
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE) }} />

      <section className="on-dark relative isolate overflow-hidden bg-site-deep text-white">
        <div aria-hidden="true" className="site-hero-gradient pointer-events-none absolute inset-0 -z-10" />
        <Wrap className="grid items-center gap-10 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6 lg:pb-24 lg:pt-20">
          <div className="min-w-0">
            <p className="site-rise m-0 mb-6 text-[13px] font-bold uppercase tracking-[0.16em] text-site-lilac">Built in Africa. Open to the world.</p>
            <h1 className="site-rise site-rise-2 m-0 text-[clamp(3.6rem,12.5vw,8.6rem)] font-extrabold leading-[0.9] tracking-[-0.05em]">
              One WAWU.
              <br />
              <RotatingWord />
            </h1>
            <p className="site-rise site-rise-3 mb-0 mt-8 max-w-[36ch] text-[clamp(1.15rem,2.6vw,1.5rem)] leading-snug text-white/90">
              Apps that give everyday people a name, a voice and a way to earn.
            </p>
            <div className="site-rise site-rise-4 mt-9 flex flex-wrap gap-3">
              <ButtonLink href={REGISTER_HREF} variant="white" arrow>
                Register
              </ButtonLink>
              <ButtonLink href="#apps" variant="outline-light">
                See the apps
              </ButtonLink>
            </div>
          </div>
          <div className="site-rise site-rise-3">
            <HeroScreens />
          </div>
        </Wrap>
      </section>

      <Marquee />

      <section className="py-20 sm:py-28">
        <Wrap>
          <SectionHead title="What WAWU is known for." lead="Giving everyday people a place to be seen, heard and paid." />
          <Cards items={KNOWN_FOR} className="mt-12" />
        </Wrap>
      </section>

      <section id="apps" className="pb-20 sm:pb-28">
        <Wrap>
          <SectionHead eyebrow="Two apps, one WAWU" title="The apps." />
          <div className="mt-12">
            <AppTiles />
          </div>
        </Wrap>
      </section>

      <ConferenceBand />

      <section className="py-20 sm:py-28">
        <Wrap>
          <SectionHead title="How we build." />
          <Cards items={HOW_WE_BUILD} numbered className="mt-12" />
        </Wrap>
      </section>

      <section className="border-y border-site-line bg-white py-16 sm:py-20">
        <Wrap>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead title="Built with good company." lead="Hubs, institutions, brands and platforms that build with WAWU." />
            <Link href="/partners" className="inline-flex shrink-0 items-center gap-2 text-[16px] font-bold text-site-purple hover:text-site-purple-hover">
              Meet our partners
              <ArrowIcon className="h-[18px] w-[18px]" />
            </Link>
          </div>
          <LogoWall compact className="mt-10" />
        </Wrap>
      </section>

      <section className="on-dark bg-site-ink py-20 text-white sm:py-28">
        <Wrap>
          <SectionHead tone="dark" title="Build with WAWU." lead="Hubs, brands, institutions and talent: come and build something with us." />
          <Cards items={BUILD_WITH} tone="dark" className="mt-12" />
        </Wrap>
      </section>
    </>
  );
}
