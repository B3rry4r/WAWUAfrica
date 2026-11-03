import Link from "next/link";
import {
  COMPANY,
  CONTACT_EMAIL,
  FOOTER_APPS,
  FOOTER_COMPANY,
  FOOTER_LEGAL,
  REGISTER_HREF,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/site/site-config";
import { ButtonLink } from "./ButtonLink";
import { SiteLogo } from "./SiteLogo";
import { Wrap } from "./Wrap";

const linkClass = "text-[15px] text-white/80 underline-offset-4 hover:text-white hover:underline";
const headClass = "m-0 mb-4 text-[13px] font-bold uppercase tracking-[0.12em] text-site-lilac";

export function SiteFooter() {
  return (
    <footer className="on-dark bg-site-deep text-white">
      <Wrap className="pb-8 pt-14 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
          <div>
            <Link href="/" aria-label="WAWU home" className="inline-flex">
              <SiteLogo className="w-[132px]" />
            </Link>
            <p className="mb-6 mt-5 max-w-[34ch] text-[16px] leading-relaxed text-white/80">
              Apps that give everyday people a name, a voice and a way to earn. Built in Africa. Open to the world.
            </p>
            <ButtonLink href={REGISTER_HREF} variant="white" arrow>
              Register
            </ButtonLink>
          </div>

          <nav aria-label="The apps">
            <h2 className={headClass}>The apps</h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {FOOTER_APPS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mb-0 mt-4 max-w-[22ch] text-[14px] leading-snug text-white/65">Coming soon on the App Store and Google Play.</p>
          </nav>

          <nav aria-label="WAWU">
            <h2 className={headClass}>WAWU</h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {FOOTER_COMPANY.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/sign-in" className={linkClass}>
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className={headClass}>Talk to us</h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} className={linkClass}>
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 text-[14px] text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">© 2026 {COMPANY}</p>
          <nav aria-label="Legal">
            <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
              {FOOTER_LEGAL.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="underline-offset-4 hover:text-white hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Wrap>
    </footer>
  );
}
