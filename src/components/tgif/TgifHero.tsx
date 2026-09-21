"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSession } from "@/lib/auth/session-provider";
import { getTgifEntry, firstNameOf, type TgifEntry } from "@/lib/api/tgif";
import { tgifGradient, startOfDay } from "./gradient";

/**
 * TGIF on the home screen: the verse, and one way in.
 *
 * WHAT THIS IS FOR. refs/target-home-mobile.jpg opens Home on the devotional
 * card, not on a feed: the date, the greeting, the verse, its reference, a
 * copy control and a single button through to the rest of the reading. That
 * is the one emphatic thing on the screen (build brief A5, "let one thing per
 * screen be the emphatic thing") and everything under it is quiet.
 *
 * WHY IT IS NOT TgifDaily. TgifDaily is the whole reading, dealt out five
 * cards at a time, and it is still what the TGIF tab opens. This is its first
 * card and nothing else, so Home stays a screen you pass through rather than
 * a screen you sit and read. Both take the same entry from the same API and
 * the same colour from the same hash, so they cannot show different days or
 * different palettes.
 *
 * The reference draws a five-segment progress bar across the top of this
 * card. It is not here: on a card that does not advance, a progress bar is a
 * control that does nothing. "Reflect" is the affordance instead, and it says
 * where it goes.
 */
export function TgifHero({ onOpen }: { onOpen: () => void }) {
  const { user } = useSession();
  const firstName = firstNameOf(user?.fullName);

  /*
    The date is decided on the CLIENT, after mount, for the same reason
    TgifDaily does it: a server in one timezone and a reader in another do not
    always agree about what day it is, and the reader should never watch
    yesterday's verse swap for today's.
  */
  const [date, setDate] = useState<Date | null>(null);
  const [entry, setEntry] = useState<TgifEntry | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setDate(startOfDay(new Date()));
  }, []);

  useEffect(() => {
    if (!date) return;
    let alive = true;
    getTgifEntry(date)
      .then((e) => alive && setEntry(e))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [date]);

  /*
    A DAY THE READING CANNOT BE LOADED IS NOT AN ERROR ON THIS SCREEN.

    Home is not the devotional, it is the home screen, and a month file that
    did not arrive is no reason to put a red box at the top of it. The card
    simply is not there, the action row moves up, and the TGIF tab (which is
    the devotional, and does own the failure) still says what went wrong and
    offers the retry.
  */
  if (failed) return null;
  if (!date || !entry) return <Skeleton variant="media" className="min-h-[248px]" />;

  return (
    <section
      className={`relative flex flex-col gap-[14px] overflow-hidden rounded-card p-[16px_18px_18px] ${tgifGradient(date)}`}
    >
      <span className="pointer-events-none absolute -right-7 -top-9 opacity-[0.13]" aria-hidden="true">
        <Icon name="Quote" size={168} color="#fff" strokeWidth={1} />
      </span>

      <div className="relative z-[1] flex items-start justify-between gap-[12px]">
        <div className="flex min-w-0 flex-col">
          <span className="text-[19px] font-extrabold leading-none tracking-[-0.01em] text-white">TGIF</span>
          <span className="mt-[5px] truncate text-[10.5px] font-bold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.72)]">
            {entry.series}
          </span>
        </div>
        <span className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.78)]">
          {SHORT_DATE.format(date)}
        </span>
      </div>

      <div className="relative z-[1] flex flex-col gap-[10px]">
        <span className="text-[14.5px] font-semibold text-white">
          {firstName ? `Dear ${firstName},` : "Dear friend,"}
        </span>
        {/*
          Clamped, not truncated by hand. The verses run from one line to
          eight, and a card whose height follows the longest day in the year
          pushes everything else below the fold on the shortest. Four lines is
          the whole verse most days and an invitation to open the reading on
          the rest.
        */}
        <p className="m-0 line-clamp-4 text-[19px] font-bold leading-[1.36] tracking-[-0.01em] text-white [text-wrap:balance]">
          &ldquo;{entry.quote}&rdquo;
        </p>
      </div>

      <div className="relative z-[1] flex flex-wrap items-center gap-[8px]">
        <span className="rounded-chip bg-[rgba(255,255,255,0.18)] px-[11px] py-[5px] text-[12px] font-semibold text-white">
          {entry.ref}
        </span>
        <CopyVerse text={`"${entry.quote}" ${entry.ref}`} />
        {/*
          THE ONE PRIMARY ACTION ON THE SCREEN.

          White on the card's own colour rather than another purple pill: A5
          asks for restraint with the accent and says a white primary button on
          dark is correct where it serves hierarchy. Here it is the only solid
          fill above the fold, so there is nothing to compete with it.
        */}
        <button
          type="button"
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-[6px] rounded-chip bg-white px-[15px] py-[8px] text-[13px] font-bold text-[var(--text-on-light)] transition-colors hover:bg-[rgba(255,255,255,0.86)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]"
        >
          Reflect
          <Icon name="ArrowRight" size={14} color="var(--text-on-light)" strokeWidth={2.4} />
        </button>
      </div>
    </section>
  );
}

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "long" });

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
      onClick={() => void copy()}
      className="inline-flex items-center gap-[6px] rounded-chip border border-[rgba(255,255,255,0.3)] px-[11px] py-[5px] text-[12px] font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.16)]"
    >
      <Icon name={state === "copied" ? "Check" : "Copy"} size={13} color="#fff" strokeWidth={2.4} />
      {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : "Copy"}
    </button>
  );
}
