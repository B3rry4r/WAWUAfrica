import Link from "next/link";
import { ArrowIcon } from "./Icons";
import { ScreenTile } from "./ScreenTile";
import { StoreStatus } from "./StoreStatus";
import { WaveBars } from "./WaveBars";

/**
 * The two apps as two large tiles. WHO MADE THIS? is purple with a phone
 * screen; VOICES is green (its colour, and the only green on the site) with a
 * sound wave, because there is no approved VOICES screen picture yet.
 */
export function AppTiles() {
  return (
    <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2">
      <li>
        <Link
          href="/who-made-this"
          className="on-dark group relative isolate flex min-h-[560px] flex-col overflow-hidden rounded-[36px] bg-site-purple p-7 text-white transition duration-300 hover:-translate-y-1.5 hover:shadow-site-tile-purple motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-10 md:min-h-[640px]"
        >
          <div aria-hidden="true" className="site-dots pointer-events-none absolute inset-0 -z-10" />
          <StoreStatus app="who-made-this" tone="dark" linkless className="self-start text-[13px]" />
          <p className="m-0 mt-8 text-[clamp(3.4rem,8vw,5.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em]">Make it.</p>
          <p className="m-0 mt-3 text-[18px] font-bold tracking-[0.02em]">WHO MADE THIS?</p>
          <p className="m-0 mt-2 max-w-[24ch] text-[17px] leading-snug text-white/90">Put your name on it. Show your work, get verified and get paid.</p>
          <span className="relative z-10 mt-6 inline-flex items-center gap-2 text-[16px] font-bold">
            See the app
            <ArrowIcon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
          </span>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-4 w-[56%] max-w-[300px] rotate-[7deg] transition-transform duration-500 group-hover:rotate-[4deg] motion-reduce:transition-none sm:right-6 sm:w-[44%]">
            <ScreenTile id="unlock" sizes="(min-width: 768px) 260px, 50vw" className="shadow-site-phone" />
          </div>
        </Link>
      </li>
      <li>
        <Link
          href="/voices"
          className="on-dark group relative isolate flex min-h-[560px] flex-col overflow-hidden rounded-[36px] bg-site-green-deep p-7 text-white transition duration-300 hover:-translate-y-1.5 hover:shadow-site-tile-green motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-10 md:min-h-[640px]"
        >
          <div aria-hidden="true" className="site-bars pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(transparent_30%,black)]" />
          <StoreStatus app="voices" tone="dark" linkless className="self-start text-[13px]" />
          <p className="m-0 mt-8 text-[clamp(3.4rem,8vw,5.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em]">Say it.</p>
          <p className="m-0 mt-3 text-[18px] font-bold tracking-[0.02em]">VOICES</p>
          <p className="m-0 mt-2 max-w-[24ch] text-[17px] leading-snug text-white/90">Everybody gets a voice. Talk, listen, vote and gist.</p>
          <span className="relative z-10 mt-6 inline-flex items-center gap-2 text-[16px] font-bold">
            See the app
            <ArrowIcon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
          </span>
          <WaveBars className="absolute inset-x-7 bottom-8 h-[150px] opacity-90 sm:inset-x-10 sm:h-[190px]" barClassName="bg-site-mint" />
        </Link>
      </li>
    </ul>
  );
}
