import { SparkIcon } from "./Icons";

const WORDS = ["Make it", "Say it", "Earn it", "Own it"];

function Run() {
  return (
    <>
      {[0, 1, 2].flatMap((round) =>
        WORDS.map((word) => (
          <span key={`${round}-${word}`} className="inline-flex items-center gap-6 pr-6 sm:gap-8 sm:pr-8">
            {word}
            <SparkIcon className="h-[0.55em] w-[0.55em] text-site-lilac" />
          </span>
        )),
      )}
    </>
  );
}

/**
 * The scrolling strip under the home hero. Decorative (the words are already
 * in the headline), so it is hidden from screen readers. It pauses on hover.
 * With "reduce motion" on it does not move: one still row of the four words
 * is drawn instead.
 */
export function Marquee() {
  return (
    <div
      aria-hidden="true"
      className="site-marquee overflow-hidden whitespace-nowrap bg-site-purple py-4 text-[clamp(1.4rem,3.4vw,2.4rem)] font-extrabold uppercase leading-none tracking-[-0.02em] text-white sm:py-5"
    >
      <div className="site-marquee-track inline-flex motion-reduce:hidden">
        <div className="inline-flex">
          <Run />
        </div>
        <div className="inline-flex">
          <Run />
        </div>
      </div>
      <div className="hidden flex-wrap justify-center gap-x-8 gap-y-2 motion-reduce:flex">
        {WORDS.map((word) => (
          <span key={word} className="inline-flex items-center gap-6">
            {word}
            <SparkIcon className="h-[0.55em] w-[0.55em] text-site-lilac" />
          </span>
        ))}
      </div>
    </div>
  );
}
