"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONTENT_TYPE_META, PUBLISHABLE_CONTENT_TYPES, type ContentType } from "@/types/content";
import { Button, Icon, Sheet } from "@/components/ui";
import { SlotMeter } from "./SlotMeter";
import type { IconName } from "@/components/ui/Icon";

const typeIcons: Record<ContentType, IconName> = {
  video: "Play",
  course: "GraduationCap",
  audio: "Headphones",
  pdf: "BookOpen",
  image: "Image",
  template: "LayoutTemplate",
};

export interface ContentTypePickerProps {
  slotsUsed: number;
  /** The flat per-account cap. See MAX_ITEMS_PER_ACCOUNT in gates.ts. */
  slotsTotal: number;
}

const eyebrow = "text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]";

/**
 * `/create/content` - the content FORMAT picker. Step two, not step one.
 *
 * It used to be the whole of `/create`, and that was the defect: the screen a
 * creator reached by pressing Create asked "what FILE TYPE are you
 * uploading?" and offered six formats. Events were not on it at all, so a
 * creator could not make one without already knowing /events/new existed, and
 * communities were a single text row at the bottom reading "Start a community
 * instead" - the alternative to the thing you came to do, rather than one of
 * the things you came to do.
 *
 * `/create` is now the hub of creatable THINGS (CreateHub). This screen is
 * what its Content tile opens. Format is a decision you make AFTER deciding
 * you are publishing content at all, so it belongs here and not at the front
 * door. The community row is gone from this file for the same reason:
 * communities are a first-class tile on the hub now, not a footnote here.
 *
 * Two earlier fixes still hold and should not be undone:
 *
 * 1. It draws no header bar of its own. AppShell already puts AppHeader
 *    (mobile) / DesktopHeader (desktop) on every `(app)` route that does not
 *    opt out, so a second one stacked, and its "close" control threw you onto
 *    Profile, a screen you were never on. CLAUDE.md's locked nav rule keeps
 *    the global header, so the design's picker chrome lives in the page body.
 *
 * 2. The card grid is auto-FILL with a minimum column width, so it reflows at
 *    1024, 1280, 1440 and up instead of being a stretched two-column mobile
 *    layout, and at `dt` the page becomes a real two-column layout with the
 *    slot state and the CTA in a rail rather than a stretched footer bar.
 */
export function ContentTypePicker({ slotsUsed, slotsTotal }: ContentTypePickerProps) {
  const router = useRouter();
  const slotsLeft = Math.max(0, slotsTotal - slotsUsed);
  const slotsFull = slotsLeft === 0;
  // Opens only when someone actually tries to publish. It used to open on
  // mount (`useState(!slotFree)`), so a creator with a full library was met
  // by a modal before they had done anything, over a picker that was still
  // fully interactive behind it.
  const [upsellOpen, setUpsellOpen] = useState(false);
  // The design highlights one card as chosen and puts "Continue with …"
  // underneath it. The old build hardcoded the highlight onto Video and
  // navigated on tap, so the footer button contradicted whatever you picked.
  const [selected, setSelected] = useState<ContentType>("video");

  const proceed = (type: ContentType) => {
    if (slotsFull) {
      setUpsellOpen(true);
      return;
    }
    router.push(`/create/new?type=${type}`);
  };

  // Driven by PUBLISHABLE_CONTENT_TYPES, never a hardcoded list: `template`
  // is hidden from the picker while the type itself stays in the union so
  // already-published template pieces keep rendering everywhere else.
  const groups: Array<{ label: string; types: ContentType[] }> = [
    { label: "People stream these", types: PUBLISHABLE_CONTENT_TYPES.filter((t) => CONTENT_TYPE_META[t].group === "stream") },
    { label: "People download these", types: PUBLISHABLE_CONTENT_TYPES.filter((t) => CONTENT_TYPE_META[t].group === "download") },
  ].filter((g) => g.types.length > 0);

  const cta = (
    <Button
      full
      size="lg"
      iconRight="ArrowRight"
      onClick={() => proceed(selected)}
      className={slotsFull ? "opacity-70" : ""}
    >
      Continue with {CONTENT_TYPE_META[selected].label.toLowerCase()}
    </Button>
  );

  return (
    <div className="flex flex-col dt:mx-auto dt:w-full dt:max-w-[1120px] dt:px-[26px] dt:py-[26px]">
      {/* Page head — the design's picker header, rendered in-page so it does
          not fight the global app header. */}
      <div className="flex flex-col gap-[6px] px-[16px] pb-[4px] pt-[16px] dt:px-0 dt:pt-0">
        <span className={eyebrow}>Create</span>
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-text-primary dt:text-[28px]">
          What are you publishing?
        </h1>
        <p className="m-0 text-[13.5px] leading-[1.5] text-text-secondary dt:max-w-[560px] dt:text-[14.5px]">
          Pick the shape of the thing first. It decides what you upload, what buyers preview, and how it is delivered.
        </p>
      </div>

      <div className="flex flex-col gap-[18px] px-[16px] pb-[24px] pt-[18px] dt:grid dt:grid-cols-[minmax(0,1fr)_320px] dt:items-start dt:gap-[26px] dt:px-0 dt:pb-0">
        <div className="flex flex-col gap-[18px]">
          {slotsFull ? (
            <div className="flex items-start gap-[10px] rounded-input border border-[rgba(255,183,3,0.28)] bg-[var(--warning-tint)] px-[14px] py-[13px]">
              <Icon name="Info" size={15} color="var(--warning)" className="mt-[1px] shrink-0" />
              <span className="flex-1 text-[12.5px] leading-[1.5] text-text-secondary">
                All {slotsTotal} slots are in use, so nothing new can go up yet.{" "}
                <button
                  type="button"
                  onClick={() => setUpsellOpen(true)}
                  className="border-none bg-transparent p-0 text-[12.5px] font-semibold text-accent underline underline-offset-2 hover:text-text-primary"
                >
                  See what to do
                </button>
              </span>
            </div>
          ) : null}

          {groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-[10px]">
              <span className={`${eyebrow} px-[2px]`}>{g.label}</span>
              {/* auto-FILL, not auto-fit. Both size columns to the space, but
                  auto-fit collapses the tracks it did not fill and hands the
                  slack to the items that exist — so this group's 2 cards came
                  out 313px wide while the next group's 3 came out 207px, two
                  fat mismatched rectangles above three normal ones. auto-fill
                  keeps the empty track, so every card in every group is the
                  same width and the columns line up. Same bug, same fix, as
                  the services grid. */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-[12px]">
                {g.types.map((type) => {
                  const active = selected === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelected(type)}
                      className={`flex cursor-pointer flex-col gap-[11px] rounded-card border p-[16px] text-left font-[var(--font-sans)] transition-colors ${
                        active
                          ? "border-selected bg-elevated"
                          : "border-hairline bg-card hover:border-strong"
                      }`}
                    >
                      <span
                        className={`grid h-[40px] w-[40px] place-items-center rounded-[13px] border ${
                          active ? "border-selected bg-selected-tint" : "border-hairline bg-tag"
                        }`}
                      >
                        <Icon
                          name={typeIcons[type]}
                          size={18}
                          strokeWidth={2}
                          color={active ? "var(--accent)" : "var(--text-secondary)"}
                        />
                      </span>
                      <span className="text-[15.5px] font-semibold text-text-primary">
                        {CONTENT_TYPE_META[type].label}
                      </span>
                      <span className="text-[12.5px] leading-[1.4] text-text-secondary">
                        {CONTENT_TYPE_META[type].blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Mobile keeps the design's footer CTA; at dt it moves into the
              rail so it is not a 900px-wide button. */}
          <div className="dt:hidden">{cta}</div>
          <div className="dt:hidden"><SlotMeter slotsUsed={slotsUsed} slotsTotal={slotsTotal} /></div>
        </div>

        <aside className="hidden flex-col gap-[16px] dt:flex dt:sticky dt:top-[26px]">
          <SlotMeter slotsUsed={slotsUsed} slotsTotal={slotsTotal} />
          {cta}
        </aside>
      </div>

      <Sheet
        desktop="modal"
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title={`All ${slotsTotal} slots are in use`}
        caption="Every account can list up to this many items. Take a piece down to open a slot."
      >
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[9px] rounded-input border border-hairline bg-card px-[16px] py-[15px]">
            <div className="flex items-baseline gap-[10px]">
              <span className="flex-1 text-[13.5px] text-text-secondary">Slots used</span>
              <span className="text-[17px] font-bold [font-feature-settings:var(--font-feature-tabular)]">
                {slotsTotal} of {slotsTotal}
              </span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-tag">
              <div className="h-full w-full rounded-full bg-warning" />
            </div>
          </div>

          <div className="flex flex-col gap-[10px]">
            <Button full size="lg" onClick={() => router.push("/create/library")}>
              Take something down
            </Button>
          </div>
          <span className="self-center text-center text-[12px] text-text-muted">
            Removing a piece opens its slot again. Buyers keep what they bought.
          </span>
        </div>
      </Sheet>
    </div>
  );
}
