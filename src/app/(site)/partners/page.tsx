import type { Metadata } from "next";
import { CONTACT_EMAIL, WHATSAPP_URL } from "@/lib/site/site-config";
import { ButtonLink } from "../_components/ButtonLink";
import { Cards } from "../_components/Cards";
import { DreamaxFeature } from "../_components/DreamaxFeature";
import { LogoWall } from "../_components/LogoWall";
import { PageHero } from "../_components/PageHero";
import { SectionHead } from "../_components/SectionHead";
import { Wrap } from "../_components/Wrap";
import { pageMetadata } from "../_lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Partner with WAWUAfrica · Hubs, brands, institutions and talent",
  description: "Hubs, brands, institutions and talent: partner with WAWU. Meet the organisations building with us, including the Dreamax x WAWU partnership.",
  path: "/partners",
});

const WHO = [
  { title: "Hubs and institutions", body: "Bring your members to WAWU apps." },
  { title: "Brands and sponsors", body: "Reach creators and professionals across Nigeria." },
  { title: "Creators and talent", body: "Make things with us and be paid for it." },
] as const;

const MAIL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Partnership enquiry")}`;

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Partner with us"
        title={
          <>
            Build with <span className="text-site-lilac">WAWU.</span>
          </>
        }
        sub="Hubs, brands, institutions and talent: come and build something with us."
      >
        <ButtonLink href={MAIL} variant="white" arrow>
          Email us
        </ButtonLink>
        <ButtonLink href={WHATSAPP_URL} variant="outline-light" external>
          WhatsApp
        </ButtonLink>
      </PageHero>

      <section className="py-20 sm:py-28">
        <Wrap>
          <SectionHead title="Who we work with." />
          <Cards items={WHO} className="mt-12" />
        </Wrap>
      </section>

      <section className="pb-20 sm:pb-28">
        <Wrap>
          <DreamaxFeature />
        </Wrap>
      </section>

      <section className="border-y border-site-line bg-white py-20 sm:py-28">
        <Wrap>
          <SectionHead title="Our partners." lead="The hubs, institutions, companies and platforms building with WAWU." />
          <LogoWall className="mt-12" />
        </Wrap>
      </section>

      <section className="on-dark bg-site-purple py-16 text-white sm:py-24">
        <Wrap className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="m-0 text-[clamp(2rem,5vw,3.6rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">Tell us what you have in mind.</h2>
            <p className="mb-0 mt-4 max-w-[48ch] text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed">Say who you are and what you want to build. A person reads every message.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={MAIL} variant="white" arrow>
              Email us
            </ButtonLink>
            <ButtonLink href={WHATSAPP_URL} variant="outline-light" external>
              WhatsApp
            </ButtonLink>
          </div>
        </Wrap>
      </section>
    </>
  );
}
