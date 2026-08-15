"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

/** Back button for the profile page: floating glass over the cover, or compact tile in the sticky bar. */
export function ProfileBackButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      style={
        compact
          ? {
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "var(--surface-tag)",
              border: "1px solid var(--border-hairline)",
              cursor: "pointer",
              flexShrink: 0,
            }
          : {
              position: "absolute",
              top: 14,
              left: 14,
              zIndex: 5,
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "rgba(11,10,13,0.62)",
              border: "1px solid rgba(255,255,255,0.16)",
              backdropFilter: "blur(10px)",
              cursor: "pointer",
            }
      }
    >
      <Icon name="ChevronLeft" size={18} color={compact ? "var(--text-primary)" : "#fff"} strokeWidth={2.2} />
    </button>
  );
}