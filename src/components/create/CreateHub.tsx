"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONTENT_TYPE_META, PUBLISHABLE_CONTENT_TYPES, type ContentType } from "@/types/content";
import { Button, Icon, Sheet, TierBadge } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";
import { formatNaira } from "@/lib/format";

const typeIcons: Record<ContentType, IconName> = {
  video: "Play",
  course: "GraduationCap",
  audio: "Headphones",
  pdf: "BookOpen",
  image: "Image",
  template: "LayoutTemplate",
};

export interface CreateHubProps {
  slotsUsed: number;
  slotsTotal: number;
  tier: "basic" | "pro";
  proPrice: number;
  proSlots: number;
}

const eyebrow = "text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]";

/**
 * `/create` — the type picker (design "WAWU Publishing", frame 1).
 *
 * Two things the previous version got wrong and this one does not:
 *
 * 1. It drew its own header bar (round X → /profile, title, slot count) on a
 *    route that is a BOTTOM-NAV TAB ROOT. AppShell already puts AppHeader
 *    (mobile) / DesktopHeader (desktop) on every `(app)` route that does not
 *    opt out, so this rendered TWO stacked headers, and the "close" control
 *    threw you onto Profile — a screen you were never on. CLAUDE.md's locked
 *    nav rule ("search and notifications live in the header on every screen")
 *    means the global header has to stay, so the design's picker chrome lives
 *    in the page body here instead. Every other tab root (/explore, /home)
 *    does exactly this.
 *
 * 2. Below `dt` it was a fixed two-column grid and above `dt` it was the SAME
 *    fixed two-column grid — i.e. a stretched mobile column, with 500px-wide
 *    type cards and a full-bleed CTA on any laptop. The grid is now auto-fit
 *    with a minimum column width so it reflows at 1024, 1280, 1440 and up,
 *    and at `dt` the page becomes a real two-column layout with the slot
 *    state and the CTA in a rail rather than a stretched footer bar.
 */
export function CreateHub({ slotsUsed, slotsTotal, tier, proPrice, proSlots }: CreateHubProps) {
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

  const slotsCard = (
    <div className="flex flex-col gap-[10px] rounded-card border border-hairline bg-card p-[16px]">
      <div className="flex items-baseline gap-[10px]">
        <span className="flex-1 text-[13px] text-text-secondary">Upload slots</span>
        <span className="text-[15px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
          {slotsUsed} of {slotsTotal}
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-tag">
        <div
          className={`h-full rounded-full ${slotsFull ? "bg-warning" : "bg-accent"}`}
          style={{ width: `${slotsTotal > 0 ? Math.min(100, (slotsUsed / slotsTotal) * 100) : 0}%` }}
        />
      </div>
      <span className="text-[12.5px] leading-[1.45] text-text-muted">
        {slotsFull
          ? "Every slot is in use. Take something down, or move up a tier for more room."
          : `${slotsLeft} still open on ${tier === "pro" ? "Pro" : "Basic"}. Taking a piece down returns its slot.`}
      </span>
      <Link
        href="/create/library"
        className="inline-flex items-center gap-[6px] text-[13px] font-semibold text-accent hover:text-text-primary"
      >
        Manage my content
        <Icon name="ArrowRight" size={14} strokeWidth={2.2} />
      </Link>
    </div>
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
          Pick the shape of the thing first — it decides what you upload, what buyers preview, and how it is delivered.
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
                  See your options
                </button>
              </span>
            </div>
          ) : null}

          {groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-[10px]">
              <span className={`${eyebrow} px-[2px]`}>{g.label}</span>
              {/* auto-fit, not a fixed column count: two columns on a phone,
                  three or four on a laptop, without assuming a screen size. */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-[12px]">
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
          <div className="dt:hidden">{slotsCard}</div>
        </div>

        <aside className="hidden flex-col gap-[16px] dt:flex dt:sticky dt:top-[26px]">
          {slotsCard}
          {cta}
          {tier !== "pro" ? (
            <div className="flex flex-col gap-[10px] rounded-card border border-decor bg-elevated p-[18px]">
              <div className="flex items-center gap-[10px]">
                <TierBadge tier="pro" />
                <span className="flex-1 text-[12.5px] text-text-muted">{formatNaira(proPrice)} a year</span>
              </div>
              <span className="text-[13px] leading-[1.45] text-text-secondary">
                {proSlots} upload slots instead of {slotsTotal}, and you keep 90% instead of 85%.
              </span>
              <Button size="sm" variant="secondary" href="/subscription">
                Compare plans
              </Button>
            </div>
          ) : null}
        </aside>
      </div>

      <Sheet
        desktop="modal"
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title={`All ${slotsTotal} slots are in use`}
        caption="Take a piece down to open a slot, or move up a tier for more room."
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

          {tier !== "pro" ? (
            <div className="flex flex-col gap-[14px] rounded-card border border-decor bg-elevated p-[18px]">
              <div className="flex items-center gap-[10px]">
                <TierBadge tier="pro" />
                <span className="flex-1 text-[13px] text-text-muted">{formatNaira(proPrice)} a year</span>
              </div>
              <div className="flex flex-col gap-[9px]">
                <span className="flex items-center gap-[9px] text-[13.5px] text-text-secondary">
                  <Icon name="Check" size={15} strokeWidth={2.4} color="var(--accent)" />
                  {proSlots} uploads instead of {slotsTotal}
                </span>
                <span className="flex items-center gap-[9px] text-[13.5px] font-semibold text-text-primary">
                  <Icon name="Check" size={15} strokeWidth={2.4} color="var(--accent)" />
                  Keep 90% instead of 85%
                </span>
                <span className="flex items-center gap-[9px] text-[13.5px] text-text-secondary">
                  <Icon name="Check" size={15} strokeWidth={2.4} color="var(--accent)" />
                  Private communities and 3 courses included
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-[10px]">
            {tier !== "pro" ? (
              <Button full size="lg" onClick={() => router.push("/subscription")}>
                Upgrade to Pro
              </Button>
            ) : null}
            <Button
              full
              variant={tier === "pro" ? "primary" : "secondary"}
              onClick={() => router.push("/create/library")}
            >
              Take something down instead
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
