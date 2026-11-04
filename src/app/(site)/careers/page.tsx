import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site/site-config";
import { ButtonLink } from "../_components/ButtonLink";
import { Cards } from "../_components/Cards";
import { PageHero } from "../_components/PageHero";
import { SectionHead } from "../_components/SectionHead";
import { Wrap } from "../_components/Wrap";
import { pageMetadata } from "../_lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Careers · Join the WAWUAfrica team",
  description: "Join the WAWUAfrica team. There are no open roles right now, and here is how to write in.",
  path: "/careers",
});

const MAIL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Careers")}`;

const WRITE_IN = [
  { title: "Say who you are.", body: "Your name, where you are, and what you make or do." },
  { title: "Show your work.", body: "A link to something you built, wrote, designed or ran." },
  { title: "Tell us how you would help.", body: "What you would want to build with us, in a few lines." },
] as const;

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title={
          <>
            Join the <span className="text-site-lilac">team.</span>
          </>
        }
        sub="We build apps for everyday people. Come and build them with us."
      >
        <ButtonLink href={MAIL} variant="white" arrow>
          Send your details
        </ButtonLink>
      </PageHero>

      <section className="py-20 sm:py-28">
        <Wrap>
          <SectionHead title="Open roles." lead="There are no open roles right now. If you think you would fit anyway, write to us." />
          <div className="mt-12">
            <h3 className="m-0 mb-6 text-[clamp(1.4rem,3vw,1.9rem)] font-extrabold tracking-[-0.03em] text-site-deep">What to put in your email</h3>
            <Cards items={WRITE_IN} numbered />
          </div>
          <p className="mb-0 mt-10 text-[17px] text-site-mute">
            Write to{" "}
            <a href={MAIL} className="font-bold text-site-purple underline underline-offset-4 hover:text-site-purple-hover">
              {CONTACT_EMAIL}
            </a>{" "}
            with the subject &ldquo;Careers&rdquo;.
          </p>
        </Wrap>
      </section>
    </>
  );
}
