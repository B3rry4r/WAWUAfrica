import Image from "next/image";
import { CheckIcon } from "./Icons";

const FOR_DREAMAXHQ = [
  { title: "Build your professional identity", body: "Professional and creator profiles." },
  { title: "Create and showcase", body: "Creative tools and a portfolio." },
  { title: "Monetize your work", body: "Turn content, skills and services into income." },
  { title: "Get paid", body: "Receive earnings directly into your WAWU wallet." },
  { title: "Sell your work", body: "Your own page for content and services." },
  { title: "Go beyond creation", body: "Access WAWU's financial services ecosystem." },
] as const;

const FOR_WAWU = [
  { title: "Learn from experts", body: "Access DreamaxHQ training." },
  { title: "Build creative skills", body: "Practical creative and professional development." },
  { title: "Grow your career", body: "Turn skills into real-world capability." },
  { title: "Access opportunity", body: "Move from learning, to creating, to earning." },
] as const;

function Benefits({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-5 p-0">
      {items.map((item) => (
        <li key={item.title} className="flex gap-4">
          <span aria-hidden="true" className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-site-purple text-white">
            <CheckIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="m-0 text-[17px] font-bold leading-snug text-white">{item.title}</p>
            <p className="m-0 mt-0.5 text-[15.5px] leading-snug text-white/75">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * The Dreamax x WAWU partnership (owner's Dreamax slides, 2 Nov 2026), in
 * text and design rather than the slide pictures: what each community gets.
 */
export function DreamaxFeature() {
  return (
    <section aria-labelledby="dreamax-title" className="on-dark relative isolate overflow-hidden rounded-[40px] bg-site-deep text-white">
      <div aria-hidden="true" className="site-glow pointer-events-none absolute -left-40 -top-40 -z-10 h-[560px] w-[560px] rounded-full opacity-70" />
      <div aria-hidden="true" className="site-dots pointer-events-none absolute inset-0 -z-10" />
      <div className="p-7 sm:p-12 lg:p-16">
        <p className="m-0 text-[13px] font-bold uppercase tracking-[0.16em] text-site-lilac">Featured partnership</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-4 sm:gap-x-6">
          <Image src="/wawu-partner-dreamax-white.png" alt="Dreamax" width={170} height={32} unoptimized className="h-auto w-[104px] sm:w-[170px]" />
          <span aria-hidden="true" className="text-[28px] font-extrabold text-site-lilac">
            ×
          </span>
          <Image src="/wawu-brand-wordmark-white.svg" alt="WAWU" width={629} height={144} className="h-auto w-[112px] sm:w-[160px]" />
        </div>
        <h2 id="dreamax-title" className="m-0 mt-8 max-w-[16ch] text-[clamp(2.4rem,6.6vw,4.8rem)] font-extrabold leading-[0.96] tracking-[-0.04em]">
          Two ecosystems. One bigger <span className="text-site-lilac">opportunity.</span>
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-[28px] border border-white/15 bg-white/[0.06] p-7 sm:p-9">
            <h3 className="m-0 mb-7 text-[clamp(1.4rem,2.6vw,1.8rem)] font-extrabold tracking-[-0.025em]">
              For the <span className="text-site-lilac">DreamaxHQ</span> community
            </h3>
            <Benefits items={FOR_DREAMAXHQ} />
          </div>
          <div className="rounded-[28px] border border-white/15 bg-white/[0.06] p-7 sm:p-9">
            <h3 className="m-0 mb-7 text-[clamp(1.4rem,2.6vw,1.8rem)] font-extrabold tracking-[-0.025em]">
              For the <span className="text-site-lilac">WAWU</span> community
            </h3>
            <Benefits items={FOR_WAWU} />
          </div>
        </div>

        <p className="m-0 mt-12 text-[clamp(1.4rem,3.6vw,2.4rem)] font-extrabold uppercase leading-tight tracking-[-0.02em]">
          Learn. Create. Monetize. Grow.
        </p>
      </div>
    </section>
  );
}
