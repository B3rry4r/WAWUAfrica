import type { Metadata } from "next";
import { REGISTER_HREF } from "@/lib/site/site-config";
import { ButtonLink } from "../_components/ButtonLink";
import { Cards } from "../_components/Cards";
import { Faq } from "../_components/Faq";
import { MicIcon } from "../_components/Icons";
import { PageHero } from "../_components/PageHero";
import { SectionHead } from "../_components/SectionHead";
import { StoreStatus } from "../_components/StoreStatus";
import { WaveBars } from "../_components/WaveBars";
import { Wrap } from "../_components/Wrap";
import { OG_IMAGES, pageMetadata } from "../_lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "VOICES · Everybody gets a voice · WAWU",
  description: "VOICES is a voice-first app by WAWU where everybody gets a voice. Talk, listen, vote and gist.",
  path: "/voices",
  image: OG_IMAGES.voices,
  imageAlt: "VOICES, an app by WAWU",
});

const WHAT_IT_IS = [
  { title: "Talk.", body: "Say what you think in your own voice." },
  { title: "Listen.", body: "Hear what people are saying about the things that matter." },
  { title: "Vote.", body: "Pick a side, see where the conversation is heading, and join in." },
] as const;

const HOW_IT_WORKS = [
  { title: "Pick a topic.", body: "Choose the things you care about." },
  { title: "Speak.", body: "Record your voice. No typing needed." },
  { title: "Discuss and vote.", body: "Hear others, react and vote." },
] as const;

const FAQ = [
  { question: "When does it go live?", answer: "VOICES is coming soon on the App Store and Google Play." },
  { question: "Do I have to type?", answer: "No. You speak. Others can reply with reactions and comments." },
  { question: "Where do I get it?", answer: "On the Google Play Store and the Apple App Store, coming soon." },
] as const;

export default function VoicesPage() {
  return (
    <>
      <PageHero
        tone="green"
        eyebrow="An app by WAWU"
        title="Say it."
        sub={
          <>
            <span className="mb-2 block text-[clamp(1.6rem,3.4vw,2.2rem)] font-extrabold tracking-[-0.02em] text-white">VOICES</span>
            Everybody gets a voice. Talk, listen, vote and gist.
          </>
        }
        aside={
          <div aria-hidden="true" className="mx-auto flex max-w-[460px] flex-col gap-6 rounded-[36px] border border-white/20 bg-white/10 p-7 backdrop-blur-sm sm:p-9">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-site-green">
                <MicIcon className="h-7 w-7" />
              </span>
              <span className="text-[17px] font-bold text-white">Everybody gets a voice.</span>
            </div>
            <WaveBars className="h-[130px]" barClassName="bg-site-mint" />
          </div>
        }
      >
        <ButtonLink href={REGISTER_HREF} variant="green" arrow>
          Register
        </ButtonLink>
        <ButtonLink href="#how" variant="outline-light">
          How it works
        </ButtonLink>
        <StoreStatus app="voices" tone="dark" className="w-full sm:w-auto" />
      </PageHero>

      <section className="py-20 sm:py-28">
        <Wrap>
          <SectionHead
            title="What it is."
            lead="A voice-first place where people talk instead of type. Real voices, real opinions, and everyone gets to join in."
          />
          <Cards items={WHAT_IT_IS} accent="green" className="mt-12" />
        </Wrap>
      </section>

      <section id="how" className="border-y border-site-line bg-white py-20 sm:py-28">
        <Wrap>
          <SectionHead title="How it works." />
          <Cards items={HOW_IT_WORKS} numbered accent="green" className="mt-12" />
        </Wrap>
      </section>

      <section className="py-20 sm:py-28">
        <Wrap>
          <SectionHead title="Questions." />
          <div className="mt-10 max-w-[900px]">
            <Faq items={FAQ} />
          </div>
        </Wrap>
      </section>
    </>
  );
}
