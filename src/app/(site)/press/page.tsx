import type { Metadata } from "next";
import Image from "next/image";
import { PRESS_ASSETS } from "@/lib/site/press-assets";
import { COMPANY, CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/site/site-config";
import { ButtonLink } from "../_components/ButtonLink";
import { DownloadIcon, MailIcon, ChatIcon } from "../_components/Icons";
import { PageHero } from "../_components/PageHero";
import { SectionHead } from "../_components/SectionHead";
import { Wrap } from "../_components/Wrap";
import { pageMetadata } from "../_lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Press and media · WAWU",
  description: "Press and media information for WAWU: what WAWU is, the logo files to download, and who to contact.",
  path: "/press",
});

export default function PressPage() {
  return (
    <>
      <PageHero eyebrow="Press and media" title="Press." sub="What WAWU is, the logo files and who to talk to." />

      <section className="py-20 sm:py-28">
        <Wrap className="grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <div>
            <h2 className="m-0 mb-5 text-[clamp(1.9rem,4vw,2.8rem)] font-extrabold leading-[1] tracking-[-0.035em] text-site-deep">About WAWU</h2>
            <p className="m-0 max-w-[56ch] text-[clamp(1.1rem,2vw,1.3rem)] leading-relaxed text-site-body">
              WAWU builds apps that give everyday people a name, a voice and a way to earn. Its apps include WHO MADE THIS?, the creators and professionals platform, and VOICES, where everybody gets a voice. Built in Africa. Open to the world.
            </p>
            <p className="mb-0 mt-5 text-[16px] text-site-mute">Company: {COMPANY}</p>
          </div>
          <div id="contact" className="rounded-[28px] border-2 border-site-line bg-white p-7 sm:p-8">
            <h2 className="m-0 mb-5 text-[clamp(1.5rem,3vw,2rem)] font-extrabold tracking-[-0.03em] text-site-deep">Media contact</h2>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Press enquiry")}`} className="inline-flex items-center gap-3 text-[17px] font-bold text-site-purple underline-offset-4 hover:text-site-purple-hover hover:underline">
                  <MailIcon className="h-5 w-5" />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} className="inline-flex items-center gap-3 text-[17px] font-bold text-site-purple underline-offset-4 hover:text-site-purple-hover hover:underline">
                  <ChatIcon className="h-5 w-5" />
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
            </ul>
          </div>
        </Wrap>
      </section>

      <section id="logos" className="border-t border-site-line bg-white py-20 sm:py-28">
        <Wrap>
          <SectionHead title="The WAWU logo." lead="Six files, each as an SVG and as a PNG with a clear background. Use them as they are: do not recolour, stretch or add effects." />
          <ul className="m-0 mt-12 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {PRESS_ASSETS.map((asset) => (
              <li key={asset.id} className="overflow-hidden rounded-[28px] border-2 border-site-line bg-white">
                <div
                  className={
                    asset.surface === "dark"
                      ? "grid h-[190px] place-items-center bg-site-deep"
                      : "grid h-[190px] place-items-center bg-site-paper"
                  }
                >
                  <Image
                    src={asset.svg}
                    alt={asset.title}
                    width={asset.width}
                    height={asset.height}
                    className={asset.kind === "wordmark" ? "h-auto w-[210px] max-w-[80%]" : "h-auto w-[104px]"}
                  />
                </div>
                <div className="p-6">
                  <h3 className="m-0 text-[19px] font-extrabold tracking-[-0.02em] text-site-deep">{asset.title}</h3>
                  <p className="mb-5 mt-1 text-[15px] text-site-mute">{asset.note}</p>
                  <div className="flex flex-wrap gap-2.5">
                    <ButtonLink href={asset.svg} variant="outline-dark" download className="min-h-[44px] px-5 text-[15px]" ariaLabel={`Download ${asset.title} as SVG`}>
                      <DownloadIcon className="h-4 w-4" />
                      SVG
                    </ButtonLink>
                    <ButtonLink href={asset.png} variant="outline-dark" download className="min-h-[44px] px-5 text-[15px]" ariaLabel={`Download ${asset.title} as PNG`}>
                      <DownloadIcon className="h-4 w-4" />
                      PNG
                    </ButtonLink>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Wrap>
      </section>
    </>
  );
}
