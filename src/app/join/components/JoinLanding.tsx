"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button, Icon } from "@/components/ui";
import { SlashedPrice } from "./SlashedPrice";
import { StickyBar } from "./StickyBar";
import { TypedCredit } from "./TypedCredit";
import {
  BENEFITS,
  CONFERENCE_CITIES,
  FORM_ID,
  HERO_IMAGE,
  ONLINE,
  SPONSOR_MESSAGE,
  STEPS,
  WAS_PRICE,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
  WHO,
} from "./join-content";

interface JoinLandingProps {
  /** The fee as the API sent it ("₦2,000"), or `null` while the offer loads. */
  price: string | null;
  /** The registration form (or its skeleton). It is drawn inside the form section. */
  form: ReactNode;
  /** Bring the form into view when the page opens (a notice is waiting in it, after a cancelled payment). */
  scrollToForm?: boolean;
}

const WIDTH = "mx-auto w-full max-w-[1120px] px-4 dt:px-8";
const H2 = "m-0 text-[32px] font-extrabold leading-[1.02] tracking-[-0.03em] text-text-primary dt:text-[48px]";
const LABEL = "m-0 text-[12px] font-bold uppercase tracking-[0.14em] text-accent-soft";

/**
 * The whole /join page around the form (owner's redesign, 12 Oct 2026), dark
 * only, in the Who Made This brand: the hero, the conference locations, the
 * offer and the form, "One question. One stage. One challenge.", how it
 * works, who it is for, the questions, the sponsor band and the footer.
 *
 * Every call to action leads to the form, and the form leads to payment.
 * There is no date anywhere and no free route.
 */
export function JoinLanding({ price, form, scrollToForm = false }: JoinLandingProps) {
  const formRef = useRef<HTMLElement>(null);

  // Call-to-action links glide to the form (see globals.css); put back on the way out.
  useEffect(() => {
    document.documentElement.classList.add("join-smooth");
    return () => document.documentElement.classList.remove("join-smooth");
  }, []);

  useEffect(() => {
    if (scrollToForm) formRef.current?.scrollIntoView({ block: "start" });
  }, [scrollToForm]);

  return (
    <div className="relative overflow-x-clip bg-page text-text-primary">
      <Hero price={price} />
      <Locations />
      <section ref={formRef} id={FORM_ID} className="scroll-mt-4 border-y border-hairline bg-card py-12 dt:py-20">
        <div className={`${WIDTH} grid gap-10 dt:grid-cols-[1fr_minmax(0,520px)] dt:items-start dt:gap-16`}>
          <Offer price={price} />
          <div>{form}</div>
        </div>
      </section>
      <OneStage />
      <HowItWorks />
      <Who />
      <Questions price={price} />
      <Sponsor />
      <Footer />
      <StickyBar price={price} watch={FORM_ID} />
    </div>
  );
}

// ── hero ────────────────────────────────────────────────────────────────────

function Hero({ price }: { price: string | null }) {
  return (
    <header className="relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute -right-[20%] -top-[30%] -z-10 h-[620px] w-[900px] bg-[radial-gradient(closest-side,var(--accent-tint-strong),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-[30%] -left-[25%] -z-10 h-[520px] w-[700px] bg-[radial-gradient(closest-side,var(--accent-tint),transparent)]"
        aria-hidden="true"
      />
      <div className={WIDTH}>
        <div className="flex items-center justify-between gap-3 py-4 dt:py-6">
          <img
            src="/who-made-this-white.png"
            alt="Who Made This"
            width={1009}
            height={295}
            className="h-[44px] w-auto object-contain dt:h-[54px]"
          />
          <Button href={`#${FORM_ID}`} variant="secondary" size="sm" className="rounded-full">
            Pre-registration open
          </Button>
        </div>

        <div className="grid items-center gap-10 pb-12 pt-6 dt:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] dt:gap-12 dt:pb-24 dt:pt-14">
          <div className="flex flex-col items-start gap-5">
            <p className={LABEL}>The conference · The platform · Launching this October</p>
            <h1
              aria-label="Put your Name on it."
              className="m-0 text-[clamp(3.4rem,17vw,6.6rem)] font-black uppercase leading-[0.88] tracking-[-0.045em] text-text-primary"
            >
              <span className="block" aria-hidden="true">
                Put your
              </span>
              <span
                aria-hidden="true"
                className="my-[0.06em] inline-block -rotate-[1.5deg] bg-text-primary px-[0.12em] pb-[0.06em] pt-[0.02em] text-on-light"
              >
                Name
              </span>
              <span className="block" aria-hidden="true">
                on it.
              </span>
            </h1>
            <TypedCredit />
            <p className="m-0 max-w-[34ch] text-[18px] leading-[1.5] text-text-secondary dt:text-[21px]">
              One question. One stage. One challenge. Pre-register once for the conference and the platform that pays you.
            </p>
            <div className="flex flex-col items-start gap-2.5 pt-2">
              <Button href={`#${FORM_ID}`} size="lg" iconRight="ArrowRight" className="text-[16px]">
                Pre-register{price ? <> for <SlashedPrice price={price} /></> : null}
              </Button>
              <p className="m-0 text-[13.5px] text-text-secondary">Pay once. Price goes to {WAS_PRICE} after launch.</p>
            </div>
          </div>
          <HeroSlot />
        </div>
      </div>
    </header>
  );
}

/**
 * The slot for the owner's picture (`HERO_IMAGE` in join-content.ts). Empty,
 * it is a soft glowing frame with nothing drawn in it, shown from the desktop
 * width up; with the picture set, it shows at every width.
 */
function HeroSlot() {
  return (
    <div
      data-slot="hero-image"
      className={`relative aspect-[4/5] w-full max-w-[460px] overflow-hidden rounded-[28px] border border-hairline bg-[radial-gradient(120%_90%_at_70%_0%,var(--accent-tint-strong),transparent_70%)] dt:ml-auto ${HERO_IMAGE ? "" : "hidden dt:block"}`}
    >
      {HERO_IMAGE ? (
        <img
          src={HERO_IMAGE.src}
          alt={HERO_IMAGE.alt}
          width={HERO_IMAGE.width}
          height={HERO_IMAGE.height}
          className="h-full w-full object-cover"
        />
      ) : null}
    </div>
  );
}

// ── conference locations ────────────────────────────────────────────────────

function Locations() {
  return (
    <section aria-labelledby="locations-title" className="border-t border-hairline py-10 dt:py-14">
      <div className={WIDTH}>
        <div className="flex flex-col gap-1.5 dt:flex-row dt:items-end dt:justify-between">
          <h2 id="locations-title" className={LABEL}>
            Conference locations
          </h2>
          <p className="m-0 text-[15px] text-text-secondary">Four cities on the ground, and online from anywhere.</p>
        </div>
        <ul className="m-0 mt-5 grid list-none grid-cols-2 gap-3 p-0 dt:grid-cols-5 dt:gap-4">
          {[...CONFERENCE_CITIES, ONLINE].map((city, i) => (
            <li
              key={city}
              className={`flex flex-col justify-between gap-6 rounded-card border border-hairline bg-card p-4 dt:min-h-[150px] dt:p-5 ${
                i === CONFERENCE_CITIES.length ? "col-span-2 dt:col-span-1" : ""
              }`}
            >
              <span className="flex items-center justify-between text-text-muted">
                <span className="text-[12px] font-bold tracking-[0.14em]">{String(i + 1).padStart(2, "0")}</span>
                <Icon name={city === ONLINE ? "Globe" : "MapPin"} size={18} />
              </span>
              <span className="text-[22px] font-extrabold leading-[1.05] tracking-[-0.02em] text-text-primary dt:text-[26px]">
                {city}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── the offer (beside the form) ─────────────────────────────────────────────

function Offer({ price }: { price: string | null }) {
  return (
    <div className="flex flex-col gap-5 dt:sticky dt:top-8">
      <h2 className={H2}>Lock your spot before the doors open.</h2>
      <p className="m-0 max-w-[44ch] text-[16.5px] leading-[1.55] text-text-secondary">
        Pre-register now and your verified profile is waiting the moment the app goes live. Same phone number, nothing to
        set up.
      </p>
      <div className="flex flex-col gap-3 rounded-card border border-accent bg-accent-tint p-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          {price ? (
            <SlashedPrice price={price} size="hero" />
          ) : (
            <span aria-hidden="true" className="h-[56px] w-[220px] animate-pulse rounded-input bg-tag dt:h-[68px]" />
          )}
          <span className="inline-flex h-[26px] items-center rounded-full bg-tag px-3 text-[12.5px] font-bold text-text-primary">
            once
          </span>
        </div>
        <p className="m-0 text-[15px] leading-[1.5] text-text-secondary">
          Slashed from {WAS_PRICE}{price ? ` to ${price}` : ""}. After launch it goes back to {WAS_PRICE}, without founding
          member status.
        </p>
        <p className="m-0 flex items-start gap-2.5 text-[15px] font-semibold leading-[1.45] text-text-primary">
          <Icon name="BadgeCheck" size={20} className="mt-[1px] flex-none text-accent-soft" />
          {price ? `Your ${price}` : "Your payment"} covers your verification.
        </p>
      </div>
      <ul className="m-0 grid list-none gap-3 p-0">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-3 text-[16px] font-semibold leading-[1.35] text-text-primary">
            <span className="mt-[1px] grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-accent text-on-accent">
              <Icon name="Check" size={14} strokeWidth={3} />
            </span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── one question, one stage, one challenge ──────────────────────────────────

function OneStage() {
  const items: Array<[string, string]> = [
    ["The question", "Who made this?"],
    ["The stage", [...CONFERENCE_CITIES, ONLINE].map((c) => `${c}.`).join(" ")],
    ["The challenge", "Put your name on it."],
  ];
  return (
    <section className="py-14 dt:py-24">
      <div className={WIDTH}>
        <h2 className={H2}>
          One question.
          <br />
          One stage.
          <br />
          One challenge.
        </h2>
        <ul className="m-0 mt-7 grid list-none gap-3 p-0 dt:grid-cols-3 dt:gap-4">
          {items.map(([label, text]) => (
            <li key={label} className="flex flex-col gap-2 rounded-card border border-hairline bg-card p-5 dt:p-6">
              <span className={LABEL}>{label}</span>
              <span className="text-[28px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-text-primary dt:text-[34px]">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="pb-14 dt:pb-24">
      <div className={WIDTH}>
        <h2 className={H2}>How it works</h2>
        <ol className="m-0 mt-7 grid list-none gap-3 p-0 dt:grid-cols-4 dt:gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-2 rounded-card border border-hairline bg-card p-5">
              <span className="mb-1 grid h-[34px] w-[34px] place-items-center rounded-full bg-accent text-[15px] font-extrabold text-on-accent">
                {i + 1}
              </span>
              <b className="text-[19px] font-extrabold tracking-[-0.01em] text-text-primary">{step.title}</b>
              <span className="text-[15px] leading-[1.5] text-text-secondary">{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Who() {
  return (
    <section className="pb-14 dt:pb-24">
      <div className={WIDTH}>
        <h2 className={H2}>Built for people who make things.</h2>
        <ul className="m-0 mt-6 flex list-none flex-wrap gap-2.5 p-0">
          {WHO.map((w) => (
            <li
              key={w}
              className="rounded-full bg-text-primary px-[18px] py-2.5 text-[16px] font-extrabold text-on-light dt:text-[18px]"
            >
              {w}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── questions ───────────────────────────────────────────────────────────────

function Questions({ price }: { price: string | null }) {
  const items: Array<{ q: ReactNode; a: ReactNode }> = [
    {
      q: "Is the app live yet?",
      a: "Not yet. WHO MADE THIS? goes live this October. Pre-register now and we will message you on WhatsApp the moment it opens.",
    },
    {
      q: price ? `What do I get for ${price}?` : "What do I get for my payment?",
      a: (
        <>
          One payment{price ? <> of <SlashedPrice price={price} /></> : null} gives you conference access, early access to the
          platform, a verified profile for a year, founding member status, WAWU Creative Studio AI tools, global payments,
          free training in Arts, Tech, Business and Finance, and access to creative hubs.
        </>
      ),
    },
    {
      q: "Do I have to pay to join the waitlist?",
      a: (
        <>
          Yes. The {price ? `${price} ` : ""}pre-registration is the waitlist, and it covers your verification. It gets you the
          launch alert and conference updates, and locks your founding price. After launch the price goes back to {WAS_PRICE}.
        </>
      ),
    },
    {
      q: "Where and when is the conference?",
      a: "PUT YOUR NAME ON IT comes to Lagos, Abuja, Port Harcourt and Enugu, and you can join online. Dates and venues go to pre-registered members first.",
    },
    {
      q: "What does “verified” mean?",
      a: "A verified profile shows that you are who you say you are, and unlocks uploading and getting paid on WHO MADE THIS?.",
    },
    { q: "I want to sponsor or partner.", a: `Message us on WhatsApp: ${WHATSAPP_DISPLAY}.` },
  ];
  return (
    <section className="border-t border-hairline bg-card py-14 dt:py-24">
      <div className={`${WIDTH} grid gap-8 dt:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] dt:gap-16`}>
        <h2 className={H2}>Questions</h2>
        <div className="border-t border-hairline">
          {items.map((item, i) => (
            <details key={i} className="group border-b border-hairline">
              <summary className="flex min-h-[56px] list-none items-center justify-between gap-4 py-4 text-[17px] font-bold leading-[1.3] text-text-primary [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <Icon
                  name="Plus"
                  size={22}
                  className="flex-none text-accent-soft transition-transform group-open:rotate-45 motion-reduce:transition-none"
                />
              </summary>
              <p className="m-0 max-w-[62ch] pb-5 text-[15.5px] leading-[1.6] text-text-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── sponsor and footer ──────────────────────────────────────────────────────

function Sponsor() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(SPONSOR_MESSAGE)}`;
  return (
    <section className="bg-accent py-14 text-center text-on-accent dt:py-20">
      <div className={`${WIDTH} flex flex-col items-center gap-4`}>
        <h2 className="m-0 text-[34px] font-extrabold leading-[1.02] tracking-[-0.03em] dt:text-[52px]">Sponsor the stage.</h2>
        <p className="m-0 max-w-[46ch] text-[17px] leading-[1.5] opacity-90">
          Put your brand in front of Nigeria’s creators, founders and builders in four cities.
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="mt-2 inline-flex h-[56px] items-center justify-center gap-2 rounded-button bg-text-primary px-7 text-[15px] font-bold text-on-light transition-colors hover:bg-text-secondary active:scale-[0.98]"
        >
          <Icon name="MessageCircle" size={18} strokeWidth={2.2} />
          Chat with us on WhatsApp
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 pb-28 text-[13.5px] text-text-secondary dt:pb-10">
      <div className={`${WIDTH} flex flex-wrap items-center justify-between gap-x-6 gap-y-2`}>
        <span>© 2026 WHO MADE THIS? · By WAWU</span>
        <span>The creators and professionals platform</span>
      </div>
    </footer>
  );
}
