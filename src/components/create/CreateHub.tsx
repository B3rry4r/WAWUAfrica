"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONTENT_TYPE_META, type ContentType } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { TierBadge } from "@/components/ui/Badge";

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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "var(--surface-tag)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          <Link href="/profile" aria-label="Close">
            <Icon name="X" size={18} color="var(--text-primary)" stroke={2.2} />
          </Link>
        </span>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
          What are you publishing?
        </span>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-muted)",
            fontFeatureSettings: "var(--font-feature-tabular)",
          }}
        >
          {slotsLeft} of {slotsTotal} slots
        </span>
      </header>

      <div style={{ flex: 1, overflow: "hidden", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 18 }}>
        {groups.map((g) => (
          <div key={g.label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                padding: "0 2px",
              }}
            >
              {g.label}
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {g.types.map((type, i) => {
                const first = g.label === "People stream these" && i === 0;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => choose(type)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 11,
                      padding: 16,
                      borderRadius: "var(--radius-card)",
                      background: first ? "var(--surface-elevated)" : "var(--surface-card)",
                      border: first ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <span
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 40,
                        height: 40,
                        borderRadius: 13,
                        background: first ? "var(--accent-tint)" : "var(--surface-tag)",
                        border: first ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
                      }}
                    >
                      <Icon name={typeIcons[type]} size={18} stroke={2} color={first ? "var(--accent)" : "var(--text-secondary)"} />
                    </span>
                    <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>
                      {CONTENT_TYPE_META[type].label}
                    </span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--text-secondary)" }}>
                      {CONTENT_TYPE_META[type].blurb}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 16px 24px", borderTop: "1px solid var(--border-hairline)" }}>
        <Button full size="lg" iconRight="ArrowRight" onClick={() => choose("video")}>
          Continue with video
        </Button>
      </div>

      <Sheet
        open={slotsFull}
        onClose={() => setSlotsFull(false)}
        title="All 3 slots are in use"
        caption="Basic includes 3 uploads — 1 free and 2 paid."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 9,
              padding: "15px 16px",
              borderRadius: "var(--radius-input)",
              background: "var(--surface-card)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>Slots used</span>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  fontFeatureSettings: "var(--font-feature-tabular)",
                }}
              >
                {slotsTotal} of {slotsTotal}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: "var(--surface-tag)", overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: 999, background: "var(--warning)" }} />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: 18,
              borderRadius: "var(--radius-card)",
              background: "var(--surface-elevated)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TierBadge tier="pro" />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-muted)" }}>
                {formatNairaPrice(proPrice)} a year
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--text-secondary)" }}>
                <Icon name="Check" size={15} stroke={2.4} color="var(--accent)" />
                {proSlots} uploads instead of {slotsTotal}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
                <Icon name="Check" size={15} stroke={2.4} color="var(--accent)" />
                Keep 90% instead of 85%
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--text-secondary)" }}>
                <Icon name="Check" size={15} stroke={2.4} color="var(--accent)" />
                Private communities and 3 free courses
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button full size="lg" onClick={() => router.push("/subscription")}>
              Upgrade to Pro
            </Button>
            <Button full variant="secondary" onClick={() => router.push("/create/library")}>
              Take something down instead
            </Button>
          </div>
          <span style={{ alignSelf: "center", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            Removing a piece frees its slot. Buyers keep what they bought.
          </span>
        </div>
      </Sheet>
    </div>
  );
}

function formatNairaPrice(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}
