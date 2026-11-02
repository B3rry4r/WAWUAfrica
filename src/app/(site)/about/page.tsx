import type { Metadata } from "next";
import { COMPANY, CONTACT_EMAIL } from "@/lib/site/site-config";
import { AppTiles } from "../_components/AppTiles";
import { ButtonLink } from "../_components/ButtonLink";
import { Cards } from "../_components/Cards";
import { PageHero } from "../_components/PageHero";
import { SectionHead } from "../_components/SectionHead";
import { Wrap } from "../_components/Wrap";
import { pageMetadata } from "../_lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "About WAWU · Built in Africa, open to the world",
  description: "WAWU builds apps that give everyday people a name, a voice and a way to earn. Built in Africa, open to the world.",
  path: "/about",
});

const HOW_WE_BUILD = [
  { title: "Make it yours.", body: "Your name, your work, your rules." },
  { title: "Keep it simple.", body: "If it needs a manual, we redo it." },
  { title: "Own your work.", body: "What you build belongs to you." },
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About WAWU"
        title={
          <>
            Built in Africa.
            <br />
            <span className="text-site-lilac">Open to the world.</span>
          </>
        }
      />

      <section className="py-20 sm:py-28">
        <Wrap className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="m-0 mb-5 text-[clamp(1.9rem,4vw,2.8rem)] font-extrabold leading-[1] tracking-[-0.035em] text-site-deep">What we do.</h2>
            <p className="m-0 max-w-[52ch] text-[clamp(1.1rem,2vw,1.3rem)] leading-relaxed text-site-body">
              WAWU builds apps for everyday people. Each app has one clear job: put your name on your work, give you a voice, and help you earn from what you do.
            </p>
          </div>
          <div>
            <h2 className="m-0 mb-5 text-[clamp(1.9rem,4vw,2.8rem)] font-extrabold leading-[1] tracking-[-0.035em] text-site-deep">What we want to be known for.</h2>
            <p className="m-0 max-w-[52ch] text-[clamp(1.1rem,2vw,1.3rem)] leading-relaxed text-site-body">
              Giving everyday people a place to be seen, heard and paid.
            </p>
          </div>
        </Wrap>
      </section>

      <section className="border-y border-site-line bg-white py-20 sm:py-28">
        <Wrap>
          <SectionHead title="How we build." />
          <Cards items={HOW_WE_BUILD} numbered className="mt-12" />
        </Wrap>
      </section>

      <section className="py-20 sm:py-28">
        <Wrap>
          <SectionHead eyebrow="What we have built" title="Our apps." />
          <div className="mt-12">
            <AppTiles />
          </div>
        </Wrap>
      </section>

      <section className="on-dark bg-site-deep py-16 text-white sm:py-20">
        <Wrap className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="m-0 mb-3 text-[13px] font-bold uppercase tracking-[0.16em] text-site-lilac">The company</p>
            <p className="m-0 text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold tracking-[-0.03em]">{COMPANY}</p>
            <p className="mb-0 mt-3 max-w-[48ch] text-[17px] leading-relaxed text-white/80">Questions about WAWU, the apps or working with us? Write to us and a person will reply.</p>
          </div>
          <ButtonLink href={`mailto:${CONTACT_EMAIL}`} variant="white" arrow>
            {CONTACT_EMAIL}
          </ButtonLink>
        </Wrap>
      </section>
    </>
  );
}
