import { CONFERENCE_CITIES, WMT_HREF } from "@/lib/site/site-config";
import { ButtonLink } from "./ButtonLink";
import { Wrap } from "./Wrap";

/** "Put your name on it": the conference, with the button that opens Who Made This (usewmt.com). */
export function ConferenceBand() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-site-purple text-white">
      <div aria-hidden="true" className="site-dots pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <Wrap className="py-16 sm:py-24">
        <p className="m-0 mb-5 text-[13px] font-bold uppercase tracking-[0.16em] text-white">The conference</p>
        <h2 className="m-0 text-[clamp(2.6rem,9vw,6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.045em]">
          Put your{" "}
          <span className="inline-block -rotate-[1.5deg] rounded-[0.14em] bg-white px-[0.14em] pb-[0.04em] text-site-deep">name</span>{" "}
          on it.
        </h2>
        <ul className="m-0 mb-7 mt-8 flex list-none flex-wrap gap-3 p-0">
          {CONFERENCE_CITIES.map((city) => (
            <li key={city} className="rounded-full border-2 border-white px-5 py-2 text-[16px] font-bold">
              {city}
            </li>
          ))}
        </ul>
        <p className="m-0 mb-9 max-w-[46ch] text-[clamp(1.1rem,2.2vw,1.3rem)] leading-snug text-white">
          One question. One stage. One challenge. For creators, founders, artists, innovators, builders and culture makers.
        </p>
        <ButtonLink href={WMT_HREF} variant="white" arrow>
          Join Who Made This
        </ButtonLink>
      </Wrap>
    </section>
  );
}
