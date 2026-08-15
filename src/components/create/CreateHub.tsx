"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONTENT_TYPE_META, type ContentType } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { TierBadge } from "@/components/ui/TierBadge";
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
  slotFree: boolean;
  tier: "basic" | "pro";
  proPrice: number;
  proSlots: number;
}

export function CreateHub({ slotsUsed, slotsTotal, slotFree, tier, proPrice, proSlots }: CreateHubProps) {
  const router = useRouter();
  const [slotsFull, setSlotsFull] = useState(!slotFree);
  const remaining = slotsTotal - slotsUsed;
  const slotsLeft = Math.max(0, remaining);

  const choose = (type: ContentType) => {
    if (!slotFree) {
      setSlotsFull(true);
      return;
    }
    router.push(`/create/new?type=${type}`);
  };

  const groups: Array<{ label: string; types: ContentType[] }> = [
    { label: "People stream these", types: ["video", "course"] },
    { label: "People download these", types: ["audio", "pdf", "image", "template"] },
  ];

  return (
    <div className="flex flex-col min-h-[100%]">
      <header
        className="flex items-center gap-[12px] py-[14px] px-[16px] border-b border-b-[var(--border-hairline)]"
      >
        <span
          className="grid place-items-center w-[34px] h-[34px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)]"
        >
          <Link href="/profile" aria-label="Close">
            <Icon name="X" size={18} color="var(--text-primary)" strokeWidth={2.2} />
          </Link>
        </span>
        <span className="flex-1 text-[16px] font-semibold text-[var(--text-primary)]">
          What are you publishing?
        </span>
        <span
          className="text-[12.5px] font-semibold text-[var(--text-muted)]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}
        >
          {slotsLeft} of {slotsTotal} slots
        </span>
      </header>

      <div className="flex-1 overflow-hidden py-[18px] px-[16px] flex flex-col gap-[18px]">
        {groups.map((g) => (
          <div key={g.label} className="flex flex-col gap-[10px]">
            <span
              className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)] py-0 px-[2px]"
            >
              {g.label}
            </span>
            <div className="grid grid-cols-[1fr_1fr] gap-[12px]">
              {g.types.map((type, i) => {
                const first = g.label === "People stream these" && i === 0;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => choose(type)}
                    className="flex flex-col gap-[11px] p-[16px] rounded-[var(--radius-card)] cursor-pointer text-left" style={{background: first ? "var(--surface-elevated)" : "var(--surface-card)", border: first ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", fontFamily: "var(--font-sans)"}}
                  >
                    <span
                      className="grid place-items-center w-[40px] h-[40px] rounded-[13]" style={{background: first ? "var(--accent-tint)" : "var(--surface-tag)", border: first ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)"}}
                    >
                      <Icon name={typeIcons[type]} size={18} strokeWidth={2} color={first ? "var(--accent)" : "var(--text-secondary)"} />
                    </span>
                    <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">
                      {CONTENT_TYPE_META[type].label}
                    </span>
                    <span className="text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">
                      {CONTENT_TYPE_META[type].blurb}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-[14px] px-[16px] pb-[24px] border-t border-t-[var(--border-hairline)]">
        <Button full size="lg" iconRight="ArrowRight" onClick={() => choose("video")}>
          Continue with video
        </Button>
      </div>

      <Sheet
        open={slotsFull}
        onClose={() => setSlotsFull(false)}
        title={`All ${slotsTotal} slots are in use`}
        caption="Free up a slot by removing a piece — or move up a tier for more."
      >
        <div className="flex flex-col gap-[16px]">
          <div
            className="flex flex-col gap-[9px] py-[15px] px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-card)] border border-[var(--border-hairline)]"
          >
            <div className="flex items-baseline gap-[10px]">
              <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">Slots used</span>
              <span
                className="text-[17px] font-bold" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}
              >
                {slotsTotal} of {slotsTotal}
              </span>
            </div>
            <div className="h-[5px] rounded-[999] bg-[var(--surface-tag)] overflow-hidden">
              <div className="w-full h-full rounded-[999] bg-[var(--warning)]" />
            </div>
          </div>

          <div
            className="flex flex-col gap-[14px] p-[18px] rounded-[var(--radius-card)] bg-[var(--surface-elevated)] border border-[var(--border-accent)]"
          >
            <div className="flex items-center gap-[10px]">
              <TierBadge tier="pro" />
              <span className="flex-1 text-[13px] text-[var(--text-muted)]">
                {formatNaira(proPrice)} a year
              </span>
            </div>
            <div className="flex flex-col gap-[9px]">
              <span className="flex items-center gap-[9px] text-[13.5px] text-[var(--text-secondary)]">
                <Icon name="Check" size={15} strokeWidth={2.4} color="var(--accent)" />
                {proSlots} uploads instead of {slotsTotal}
              </span>
              <span className="flex items-center gap-[9px] text-[13.5px] font-semibold text-[var(--text-primary)]">
                <Icon name="Check" size={15} strokeWidth={2.4} color="var(--accent)" />
                Keep 90% instead of 85%
              </span>
              <span className="flex items-center gap-[9px] text-[13.5px] text-[var(--text-secondary)]">
                <Icon name="Check" size={15} strokeWidth={2.4} color="var(--accent)" />
                Private communities and 3 free courses
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-[10px]">
            <Button full size="lg" onClick={() => router.push("/subscription")}>
              Upgrade to Pro
            </Button>
            <Button full variant="secondary" onClick={() => router.push("/create/library")}>
              Take something down instead
            </Button>
          </div>
          <span className="text-[12px] text-[var(--text-muted)] text-center" style={{alignSelf: "center"}}>
            Removing a piece frees its slot. Buyers keep what they bought.
          </span>
        </div>
      </Sheet>
    </div>
  );
}
