"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSession } from "@/lib/auth/session-provider";
import { getTgifEntry, personalise, firstNameOf, type TgifEntry } from "@/lib/api/tgif";

/**
 * TGIF: one scripture and one prayer, read a card at a time.
 *
 * The devotional is 365 entries keyed to the DATE, not to a counter that
 * starts when somebody installs the app: on 5 September everybody who opens
 * this reads the same thing, the way a printed devotional works. That is also
 * what makes the loop honest. There is no progress to lose, nothing to catch
 * up on, and no day that can be "missed", so the screen never has to nag.
 *
 * WHY A STORY AND NOT A PAGE. The first build put all five parts down one
 * scroll. Everything was there, and it read as a wall: the verse, four
 * headings, and a scrollbar. The parts are actually a sequence, written to be
 * taken in that order - the verse, then what it means, then the line to carry,
 * then the prayer, then the one thing to do - so they are dealt out one at a
 * time and you tap through them. Reading it becomes a minute you spend rather
 * than a block you skim.
 *
 * Nothing here is stored or sent anywhere. The reader's name comes from the
 * session they are already in, the date comes from their own device, and the
 * text ships with the app.
 */

/*
  A DIFFERENT COLOUR EVERY DAY.

  Picked from the date rather than from Math.random(), which matters twice
  over: it stays put while you tap back and forth through the cards instead of
  repainting under you, and everybody opening the app on the same day gets the
  same one, so it is something two people can actually mention to each other.
  The date is hashed rather than taken modulo the list length, so the colours
  do not march through the list in order and arrive back at purple every
  Sunday. Every value is a brand token, and each pairing holds white text well
  clear of the contrast floor.
*/
const DAY_GRADIENTS = [
  "linear-gradient(155deg,var(--accent-deep),var(--accent))",
  "linear-gradient(155deg,var(--wawu-purple-deep),var(--brand-aqua))",
  "linear-gradient(155deg,var(--accent-deep),var(--brand-coral))",
  "linear-gradient(155deg,var(--wawu-ink),var(--wawu-purple-deep))",
  "linear-gradient(155deg,var(--brand-aqua),var(--accent-deep))",
  "linear-gradient(155deg,var(--wawu-purple-deep),var(--brand-coral))",
  "linear-gradient(155deg,var(--accent),var(--wawu-ink))",
  "linear-gradient(155deg,var(--wawu-ink),var(--brand-aqua))",
  "linear-gradient(155deg,var(--brand-coral),var(--wawu-purple-deep))",
  "linear-gradient(155deg,var(--accent-deep),var(--wawu-sky))",
  "linear-gradient(155deg,var(--wawu-purple-deep),var(--wawu-pink))",
] as const;

function gradientFor(date: Date): string {
  /*
    FNV-1a over "2026-09-05", then an avalanche step.

    The obvious `h * 31 + charCode` was tried first and is not good enough
    here. On keys that differ by one digit it stays almost linear, so a month
    came out as 10, 9, 8, 7, 6, 5... : the colour visibly counted down the
    list and back up again, which is the opposite of the "different every day"
    this is for. The extra mixing breaks that, and the eleven colours still
    share the year fairly evenly (23 to 47 days each).
  */
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491);
  h ^= h >>> 13;
  return DAY_GRADIENTS[(h >>> 0) % DAY_GRADIENTS.length];
}

const LONG_DATE = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface Card {
  /** The word on the progress bar's tooltip and the card's own eyebrow. */
  label: string;
  body: React.ReactNode;
}

export function TgifDaily() {
  const { user } = useSession();
  const firstName = firstNameOf(user?.fullName);

  /*
    The date is decided on the CLIENT, after mount.

    This renders on the server too, and a server in one timezone and a reader
    in another do not always agree about what day it is. Reading `new Date()`
    during render would let them disagree in the markup, and the reader would
    watch yesterday's verse swap for today's. Null until mounted, so there is
    one date and it is theirs.
  */
  const [date, setDate] = useState<Date | null>(null);
  const [entry, setEntry] = useState<TgifEntry | null>(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setDate(startOfDay(new Date()));
  }, []);

  const load = useCallback((on: Date) => {
    setFailed(false);
    setEntry(null);
    setStep(0);
    getTgifEntry(on)
      .then(setEntry)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (date) load(date);
  }, [date, load]);

  const say = useCallback((text: string) => personalise(text, firstName), [firstName]);

  /*
    "Remember" IS NOT ONE OF THESE CARDS, and it used to be.

    It is pinned under the story instead, where it stays put the whole time
    rather than going by once. Leaving it in both places printed the same
    sentence twice on one screen, big on the card and again three centimetres
    below it, which reads as a bug rather than as emphasis.
  */
  const cards: Card[] = useMemo(() => {
    if (!entry || !date) return [];
    const list: Card[] = [
      {
        label: "The verse",
        body: (
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[3px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.72)]">
                {LONG_DATE.format(date)}
              </span>
              <span className="text-[15px] font-semibold text-white">
                {firstName ? `Dear ${firstName},` : "Dear friend,"}
              </span>
            </div>
            <p className="m-0 text-[22px] font-bold leading-[1.34] tracking-[-0.01em] text-white [text-wrap:balance]">
              &ldquo;{entry.quote}&rdquo;
            </p>
            <div className="flex flex-wrap items-center gap-[8px]">
              <span className="rounded-[var(--radius-chip)] bg-[rgba(255,255,255,0.18)] px-[11px] py-[5px] text-[12.5px] font-semibold text-white">
                {entry.ref}
              </span>
              <CopyVerse text={`"${entry.quote}" ${entry.ref}`} />
            </div>
          </div>
        ),
      },
      {
        label: "The reality",
        body: (
          <p className="m-0 text-[15.5px] leading-[1.66] text-[rgba(255,255,255,0.94)]">{say(entry.reality)}</p>
        ),
      },
      {
        label: "Prayer",
        body: (
          <p className="m-0 text-[17px] italic leading-[1.6] text-white [text-wrap:balance]">{say(entry.prayer)}</p>
        ),
      },
      {
        label: "Take it with you",
        body: (
          <p className="m-0 text-[17px] leading-[1.62] text-white [text-wrap:balance]">{say(entry.takeaway)}</p>
        ),
      },
    ];
    if (entry.outro) {
      list.push({
        label: "The end of the year",
        body: (
          <div className="flex flex-col gap-[10px]">
            {entry.outro.map((line) => (
              <p key={line} className="m-0 text-[15.5px] leading-[1.6] text-white">
                {say(line)}
              </p>
            ))}
          </div>
        ),
      });
    }
    return list;
  }, [entry, date, firstName, say]);

  const last = cards.length - 1;
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const forward = useCallback(() => setStep((s) => Math.min(last, s + 1)), [last]);

  // Arrow keys move through the cards, the way they move through any other
  // sequence. Without this the whole thing is unusable without a pointer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") back();
      if (e.key === "ArrowRight") forward();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, forward]);

  if (failed) {
    return (
      <EmptyState
        icon="WifiOff"
        title="Could not open today's reading"
        caption="Check your connection and try again."
        action="Try again"
        onAction={() => date && load(date)}
      />
    );
  }

  if (!date || !entry || !cards.length) return <TgifSkeleton />;

  const card = cards[step];
  const atEnd = step === last;

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-[12px]">
      <div
        className="relative flex min-h-[430px] flex-col overflow-hidden rounded-[var(--radius-card)] p-[16px_18px_18px]"
        style={{ backgroundImage: gradientFor(date) }}
      >
        <span className="pointer-events-none absolute -right-8 -top-10 opacity-[0.13]" aria-hidden="true">
          <Icon name="Quote" size={190} color="#fff" strokeWidth={1} />
        </span>

        {/* How far through, and how much is left. */}
        <div className="relative z-[3] flex gap-[5px]" aria-hidden="true">
          {cards.map((c, i) => (
            <span
              key={c.label}
              className={`h-[3px] flex-1 rounded-[2px] transition-colors ${
                i <= step ? "bg-white" : "bg-[rgba(255,255,255,0.28)]"
              }`}
            />
          ))}
        </div>

        <span className="relative z-[3] mt-[13px] text-[11px] font-bold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.72)]">
          {step === 0 ? entry.series : card.label}
        </span>

        {/*
          The card body is centred in what is left, so a two-line affirmation
          and an eight-line paragraph both sit where the eye already is rather
          than one starting at the top and the other in the middle.

          `key` is the step, so React swaps the subtree rather than mutating
          it, and the fade actually plays on every card instead of only the
          first. The animation is a class, and the class does nothing when the
          reader has asked for less motion. The keyframe is the one the hero's
          rotating word already uses, not a new one for this screen.
        */}
        <div key={step} className="relative z-[1] my-auto py-[18px] motion-safe:animate-[wawuFadeUp_0.32s_var(--ease-soft)]">
          {card.body}
        </div>

        {/*
          TAP LEFT, TAP RIGHT.

          The way every story anywhere works, so nobody has to be taught it.
          They are real buttons, named, so a screen reader and a keyboard get
          the same two moves.

          They sit OVER the card body, which is the only arrangement where
          tapping the middle of the card does anything: under it, a tap landed
          on the paragraph and the story only advanced from the margins. The
          few things inside a card that are meant to be pressed for themselves
          (the Copy button, Back and Next) are lifted back above these.
        */}
        <button
          type="button"
          aria-label="Previous card"
          onClick={back}
          disabled={step === 0}
          className="absolute inset-y-0 left-0 z-[2] w-1/3 cursor-pointer disabled:cursor-default"
        />
        <button
          type="button"
          aria-label="Next card"
          onClick={forward}
          disabled={atEnd}
          className="absolute inset-y-0 right-0 z-[2] w-2/3 cursor-pointer disabled:cursor-default"
        />

        {/* A visible affordance for the people who will never guess the taps. */}
        <div className="relative z-[3] flex items-center justify-between gap-[10px]">
          <StepButton label="Back" icon="ChevronLeft" onClick={back} disabled={step === 0} />
          {atEnd ? (
            <span className="text-[12.5px] font-semibold text-[rgba(255,255,255,0.8)]">
              That is today. See you tomorrow.
            </span>
          ) : (
            <StepButton label="Next" icon="ChevronRight" iconFirst={false} onClick={forward} />
          )}
        </div>
      </div>

      {/*
        UNDER THE STORY: THE LINE TO CARRY, AND NOTHING TO BROWSE.

        This slot held yesterday and tomorrow. It should not have: a devotional
        is for the day it is for, and a pair of arrows turns it into an archive
        to page through, which is a different product and a worse one. Today's
        is the only reading there is.

        What sits here instead is the day's own "Remember" line. It is the one
        sentence the document means for somebody to take with them, and it is
        the only part worth having on screen after the story is done, so it
        stays put while the cards move and is still there when they finish. It
        is not a constant: there are 365 of them, one per day, so this line
        changes with the reading like everything else on the screen.
      */}
      <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[15px_16px]">
        <div className="flex flex-col gap-[5px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Remember today</span>
          <p className="m-0 text-[15.5px] font-semibold leading-[1.5] text-[var(--text-primary)]">
            {say(entry.remember)}
          </p>
        </div>

        <div className="flex items-end justify-between gap-[10px] border-t border-t-[var(--border-hairline)] pt-[11px]">
          {/*
            The series is labelled, not just printed. On its own, "THE NEW
            CREATION" in small caps reads as another heading with nothing under
            it. It is not called "this month's" because the document's series
            run 29 to 35 days and do not line up with a calendar month.
          */}
          <div className="flex min-w-0 flex-col gap-[1px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Series</span>
            <span className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{entry.series}</span>
            <span className="truncate text-[12.5px] text-[var(--text-secondary)]">{entry.seriesTheme}</span>
          </div>
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(0)}
              className="shrink-0 text-[12.5px] font-semibold text-[var(--accent)]"
            >
              Read it again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StepButton({
  label,
  icon,
  iconFirst = true,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  iconFirst?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const glyph = <Icon name={icon} size={14} color="#fff" strokeWidth={2.6} />;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-[5px] rounded-[var(--radius-chip)] border border-[rgba(255,255,255,0.3)] px-[12px] py-[7px] text-[12.5px] font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.16)] disabled:invisible"
    >
      {iconFirst ? glyph : null}
      {label}
      {iconFirst ? null : glyph}
    </button>
  );
}

/**
 * Copies the verse and its reference.
 *
 * People send these to each other, and retyping a verse out of an app is how
 * the reference gets dropped. `navigator.clipboard` is not there on every
 * browser and throws when a page is not trusted, so the button says nothing
 * happened rather than claiming it worked.
 */
function CopyVerse({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2200);
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        // The tap zones sit under this; without stopping here, copying the
        // verse would also advance the card out from under the reader.
        e.stopPropagation();
        void copy();
      }}
      className="relative z-[3] inline-flex items-center gap-[6px] rounded-[var(--radius-chip)] border border-[rgba(255,255,255,0.3)] px-[11px] py-[5px] text-[12.5px] font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.16)]"
    >
      <Icon name={state === "copied" ? "Check" : "Copy"} size={13} color="#fff" strokeWidth={2.4} />
      {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : "Copy"}
    </button>
  );
}

function TgifSkeleton() {
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-[12px]">
      <Skeleton variant="media" className="min-h-[430px]" />
      <Skeleton variant="row" />
    </div>
  );
}
