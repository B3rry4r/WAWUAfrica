import type { Metadata } from "next";
import { REGISTER_HREF } from "@/lib/site/site-config";
import { ButtonLink } from "../_components/ButtonLink";
import { Cards } from "../_components/Cards";
import { ConferenceBand } from "../_components/ConferenceBand";
import { Faq } from "../_components/Faq";
import { PageHero } from "../_components/PageHero";
import { ScreenGallery } from "../_components/ScreenGallery";
import { ScreenTile } from "../_components/ScreenTile";
import { SectionHead } from "../_components/SectionHead";
import { StoreStatus } from "../_components/StoreStatus";
import { Wrap } from "../_components/Wrap";
import { OG_IMAGES, pageMetadata } from "../_lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "WHO MADE THIS? · Put your name on it · WAWU",
  description: "WHO MADE THIS? is the creators and professionals platform by WAWU. Show your work, get verified and get paid.",
  path: "/who-made-this",
  image: OG_IMAGES.whoMadeThis,
  imageAlt: "WHO MADE THIS?, an app by WAWU",
});

const WHAT_IT_IS = [
  { title: "Show your work.", body: "Build a profile with your content and services, with your name on all of it." },
  { title: "Get verified.", body: "A verified tick tells people you are real, and lifts your upload limits." },
  { title: "Get paid.", body: "Sell what you make, offer your services, and be rewarded for what you do." },
] as const;

const HOW_IT_WORKS = [
  { title: "Sign up.", body: "Your name, your craft. Two minutes, and it costs nothing." },
  { title: "Add your work.", body: "Upload what you make and set the price in naira, or share it at no charge." },
  { title: "Share and earn.", body: "Share your page. What you earn goes to your WAWU wallet." },
] as const;

const FAQ = [
  { question: "Does it cost anything to join?", answer: "Signing up costs nothing. A verified tick is a paid extra: it shows people you are real and lifts your upload limits." },
  { question: "When does it open?", answer: "Soon. WHO MADE THIS? is coming to the App Store and Google Play, and this page will carry the store links the day it opens." },
  { question: "Who is it for?", answer: "Creators, professionals, founders, artists and builders: anyone with something to show or sell." },
  { question: "Where do I get it?", answer: "On the App Store and Google Play. Register now and you will be first to know." },
] as const;

export default function WhoMadeThisPage() {
  return (
    <>
      <PageHero
        eyebrow="An app by WAWU"
        title="Make it."
        sub={
          <>
            <span className="mb-2 block text-[clamp(1.6rem,3.4vw,2.2rem)] font-extrabold tracking-[-0.02em] text-white">WHO MADE THIS?</span>
            Put your name on it. Show your work, get verified and get paid.
          </>
        }
        aside={
          <div aria-hidden="true" className="relative mx-auto h-[320px] w-full max-w-[340px] sm:h-[470px] sm:max-w-[420px] lg:h-[470px]">
            <div className="absolute left-0 top-8 w-[56%] -rotate-[5deg]">
              <ScreenTile id="unlock" sizes="(min-width: 1024px) 250px, 200px" />
            </div>
            <div className="site-float absolute right-0 top-0 w-[56%] rotate-[4deg] [--site-tilt:4deg]">
              <ScreenTile id="feed" sizes="(min-width: 1024px) 250px, 200px" />
            </div>
          </div>
        }
      >
        <ButtonLink href={REGISTER_HREF} variant="white" arrow>
          Register
        </ButtonLink>
        <ButtonLink href="#how" variant="outline-light">
          How it works
        </ButtonLink>
        <StoreStatus app="who-made-this" tone="dark" className="w-full sm:w-auto" />
      </PageHero>

      <section className="py-20 sm:py-28">
        <Wrap>
          <SectionHead title="What it is." lead="The creators and professionals platform. One place for your name, your work, your verified profile and your money." />
          <Cards items={WHAT_IT_IS} className="mt-12" />
        </Wrap>
      </section>

      <section aria-labelledby="screens-title" className="border-y border-site-line bg-white py-20 sm:py-28">
        <Wrap>
          <SectionHead eyebrow="In the app" title={<span id="screens-title">See it.</span>} lead="Five screens from WHO MADE THIS?: your wallet, your profile, the feed, creators and paid work." />
          <div className="mt-12">
            <ScreenGallery />
          </div>
        </Wrap>
      </section>

      <section id="how" className="py-20 sm:py-28">
        <Wrap>
          <SectionHead title="How it works." />
          <Cards items={HOW_IT_WORKS} numbered className="mt-12" />
        </Wrap>
      </section>

      <ConferenceBand />

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
