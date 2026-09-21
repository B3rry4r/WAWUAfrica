"use client";

import { TileCard, VerificationTicks } from "@/components/ui";
import type { IconName, TileIconTone } from "@/components/ui";
import { hasAnyTick, type VerificationState } from "@/types/verification";
import { SlotMeter } from "./SlotMeter";

/**
 * `/create` - the hub of things a creator can make.
 *
 * ── WHAT THIS REPLACED, AND WHY IT WAS WRONG ───────────────────────────────
 *
 * `/create` used to BE the content format picker. It asked "What are you
 * publishing?" and offered six file types: video, course, audio, PDF, image,
 * template. The product owner's words, 21 Sep 2026: "create users should be
 * able to see the events communities or content and whatever is available".
 *
 * Three things were actually broken, not just styled wrong:
 *
 *  1. EVENTS WERE NOT REACHABLE FROM CREATE AT ALL. `/events/new` existed and
 *     worked, but nothing on the creator's own Create screen pointed at it.
 *     A creator could only host an event by already knowing the URL.
 *  2. COMMUNITIES WERE A FOOTNOTE, and a badly worded one: a single text row
 *     at the bottom reading "Start a community instead". Hosting a room is
 *     one of the things you come here to do, not the consolation prize for
 *     not uploading a file.
 *  3. THE QUESTION WAS THE WRONG QUESTION. File format is a decision you make
 *     after deciding you are publishing content at all. Asking it first made
 *     the other three creatable things unaskable.
 *
 * So the hub asks what you are MAKING, and the format picker moved to
 * `/create/content` as step two (ContentTypePicker).
 *
 * ── THE TREATMENT ──────────────────────────────────────────────────────────
 *
 * refs/target-home-mobile.jpg is the reference for the feel: an action row of
 * tiles, each with one brightly coloured icon, a bold title and a short line
 * under it. Note what that image actually does - the CARDS are dark and only
 * the GLYPHS carry colour. That is the distinction that keeps this inside
 * build brief A5, which throws out the full-bleed purple/teal/red/amber
 * colour-block tiles of the old Bills Payment screen. Neutral card, coloured
 * icon, via TileCard's `iconTone` prop. No second card component was forked
 * to get this.
 *
 * The colour is tied to the ACT and is stable: content is always the accent,
 * an event is always coral, a community is always aqua, a service is always
 * lime. A5's complaint about the old tiles was that their colour was
 * `index % 7` and therefore meant nothing; a colour that identifies the thing
 * survives that objection, a colour that identifies a grid position does not.
 *
 * ── WHAT IS DELIBERATELY NOT HIDDEN ────────────────────────────────────────
 *
 * Hosting an event is verified-only (build brief B3). The Events tile is
 * shown to everyone regardless, because B3 says in as many words: "Enforce
 * server-side, not by hiding a button. And where an ineligible user
 * encounters the control, it must explain what they need to do to become
 * eligible, never fail silently, never simply disappear. That explanation is
 * a conversion surface, not an error."
 *
 * So an unverified creator sees the tile, sees a line saying a tick is
 * needed, and lands on HostEventGate at `/events/new`, which does the
 * explaining and sells the tick. The tile does not gate; it signposts. The
 * server is the enforcement.
 */

export interface CreateHubProps {
  slotsUsed: number;
  /** The flat per-account cap. See MAX_ITEMS_PER_ACCOUNT in gates.ts. */
  slotsTotal: number;
  /**
   * The signed-in account's ticks, read off the session rather than fetched.
   * Only used to word the Events tile honestly; it never decides access.
   */
  verification: VerificationState | null | undefined;
}

const eyebrow = "text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]";

interface CreatableThing {
  id: string;
  title: string;
  /** One line, wrapped to two by `layout="action"`. Say the whole thing. */
  subtitle: string;
  icon: IconName;
  tone: TileIconTone;
  href: string;
}

/**
 * Everything a creator can make, in the order the brief's B2 listing types
 * put them. Driven by this one list so a new creatable thing is a row here
 * rather than another screen nobody can find - which is exactly how events
 * went missing in the first place.
 */
function creatableThings(verified: boolean): CreatableThing[] {
  return [
    {
      id: "content",
      title: "Content",
      subtitle: "Video, course, audio, PDF or art",
      icon: "Clapperboard",
      tone: "accent",
      href: "/create/content",
    },
    {
      id: "event",
      title: "Event",
      // The one tile whose subtitle changes, and it changes to the truth.
      // Saying "Sell tickets" to somebody who cannot host yet is the silent
      // failure B3 forbids; saying it needs a tick is the conversion line.
      subtitle: verified ? "Sell tickets to a date" : "Needs a verified tick",
      icon: "CalendarDays",
      tone: "coral",
      href: "/events/new",
    },
    {
      id: "community",
      title: "Community",
      subtitle: "A room your people talk in",
      icon: "Users",
      tone: "aqua",
      href: "/communities/new",
    },
    {
      id: "service",
      title: "Service",
      subtitle: "Get listed and paid for your time",
      icon: "BriefcaseBusiness",
      tone: "lime",
      href: "/professionals/apply",
    },
  ];
}

export function CreateHub({ slotsUsed, slotsTotal, verification }: CreateHubProps) {
  const verified = hasAnyTick(verification);
  const things = creatableThings(verified);

  return (
    <div className="flex flex-col dt:mx-auto dt:w-full dt:max-w-[1120px] dt:px-[26px] dt:py-[26px]">
      {/* No header bar of its own: AppShell already puts the global header on
          every (app) route, and CLAUDE.md locks search and notifications into
          it on every screen. The page chrome lives in the body, same as every
          other tab root. */}
      <div className="flex flex-col gap-[6px] px-[16px] pb-[4px] pt-[16px] dt:px-0 dt:pt-0">
        <span className={eyebrow}>Create</span>
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-text-primary dt:text-[28px]">
          What are you making?
        </h1>
        <p className="m-0 text-[13.5px] leading-[1.5] text-text-secondary dt:max-w-[560px] dt:text-[14.5px]">
          Four things go up on WAWU. Pick one and we will only ask for what
          that one needs.
        </p>
      </div>

      <div className="flex flex-col gap-[18px] px-[16px] pb-[24px] pt-[18px] dt:grid dt:grid-cols-[minmax(0,1fr)_320px] dt:items-start dt:gap-[26px] dt:px-0 dt:pb-0">
        <div className="flex flex-col gap-[18px]">
          {/* Four items, so not TILE_GRID: that class is tuned to a twelve
              service catalogue (six across) and would leave two dead columns
              with four narrow tiles in them. Two across on a phone, four on
              desktop, so the set is one row at both ends. */}
          <div className="grid grid-cols-2 gap-[10px] dt:grid-cols-4">
            {things.map((thing) => (
              <TileCard
                key={thing.id}
                layout="action"
                icon={thing.icon}
                iconTone={thing.tone}
                title={thing.title}
                subtitle={thing.subtitle}
                href={thing.href}
              />
            ))}
          </div>

          {/*
            The slot rule, stated once and honestly.

            Build brief B2 caps an account at five items across products,
            content and services TOGETHER. Communities and events are not
            listings and do not count. The old screen showed a slot meter over
            a picker where every option consumed a slot, so there was nothing
            to explain; now that two of the four are free, saying so is the
            difference between a creator rationing their uploads correctly and
            one who thinks hosting a room costs them a slot.
          */}
          <SlotMeter slotsUsed={slotsUsed} slotsTotal={slotsTotal} className="dt:hidden" />
        </div>

        <div className="hidden flex-col gap-[14px] dt:flex">
          <SlotMeter slotsUsed={slotsUsed} slotsTotal={slotsTotal} />

          {/*
            Shown only to an account that already holds a tick. An account
            without one is being asked to buy it by VerificationPrompt on Home
            and on its own profile, and a third ask on this screen would be
            nagging rather than selling. The Events tile already carries the
            one line that matters here.
          */}
          {verified ? (
            <div className="flex items-center gap-[10px] rounded-card border border-hairline bg-card p-[14px]">
              <VerificationTicks verification={verification} size="sm" />
              <span className="flex-1 text-[12.5px] leading-[1.45] text-text-secondary">
                Your tick is active, so you can host events as well as publish.
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
