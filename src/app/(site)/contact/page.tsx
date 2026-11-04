import type { Metadata } from "next";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/site/site-config";
import { ButtonLink } from "../_components/ButtonLink";
import { ChatIcon, MailIcon } from "../_components/Icons";
import { PageHero } from "../_components/PageHero";
import { SectionHead } from "../_components/SectionHead";
import { Wrap } from "../_components/Wrap";
import { pageMetadata } from "../_lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Contact WAWUAfrica · Talk to us",
  description: "Talk to WAWU: email support@wawuafrica.com or message us on WhatsApp.",
  path: "/contact",
});

const MORE = [
  { label: "Partnerships", href: "/partners" },
  { label: "Press and media", href: "/press" },
  { label: "Careers", href: "/careers" },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Talk to <span className="text-site-lilac">us.</span>
          </>
        }
        sub="Write to us by email or on WhatsApp. A person reads every message."
      />

      <section className="py-20 sm:py-28">
        <Wrap>
          <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2">
            <li className="rounded-[32px] border-2 border-site-line bg-white p-8 sm:p-10">
              <span aria-hidden="true" className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-site-purple-tint text-site-purple">
                <MailIcon className="h-7 w-7" />
              </span>
              <h2 className="m-0 text-[clamp(1.6rem,3vw,2.1rem)] font-extrabold tracking-[-0.03em] text-site-deep">Email</h2>
              <p className="mb-6 mt-2 text-[17px] leading-relaxed text-site-mute">For support, questions and anything that needs more than a line.</p>
              <ButtonLink href={`mailto:${CONTACT_EMAIL}`} variant="purple" arrow className="max-w-full break-all">
                {CONTACT_EMAIL}
              </ButtonLink>
            </li>
            <li className="rounded-[32px] border-2 border-site-line bg-white p-8 sm:p-10">
              <span aria-hidden="true" className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-site-purple-tint text-site-purple">
                <ChatIcon className="h-7 w-7" />
              </span>
              <h2 className="m-0 text-[clamp(1.6rem,3vw,2.1rem)] font-extrabold tracking-[-0.03em] text-site-deep">WhatsApp</h2>
              <p className="mb-6 mt-2 text-[17px] leading-relaxed text-site-mute">For a quick question. Message us on {WHATSAPP_DISPLAY}.</p>
              <ButtonLink href={WHATSAPP_URL} variant="purple" arrow external>
                {WHATSAPP_DISPLAY}
              </ButtonLink>
            </li>
          </ul>

          <div className="mt-16">
            <SectionHead title="Looking for something else?" />
            <ul className="m-0 mt-8 flex list-none flex-wrap gap-3 p-0">
              {MORE.map((item) => (
                <li key={item.href}>
                  <ButtonLink href={item.href} variant="outline-dark" arrow>
                    {item.label}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </div>
        </Wrap>
      </section>
    </>
  );
}
