import { formatNaira } from "@/lib/format";
import type { ContentItem } from "@/types/content";
import { Icon } from "./Icon";
import { PriceChip } from "./PriceChip";
import { StatusPill, type StatusKind } from "./StatusPill";

const statusPill: Record<ContentItem["status"], { kind: StatusKind; label: string }> = {
  live: { kind: "success", label: "Live" },
  review: { kind: "warning", label: "In review" },
  rejected: { kind: "error", label: "Rejected" },
};

const borderTint: Record<ContentItem["status"], string | undefined> = {
  live: undefined,
  review: "rgba(255,183,3,0.28)",
  rejected: "rgba(255,92,92,0.28)",
};

export interface ContentCardProps {
  item: ContentItem;
  onClick?: () => void;
  onFix?: () => void;
}

export function ContentCard({ item, onClick, onFix }: ContentCardProps) {
  const pill = statusPill[item.status];
  const tint = borderTint[item.status];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        gap: 13,
        padding: 14,
        borderRadius: "var(--radius-card)",
        background: "var(--surface-card)",
        border: `1px solid ${tint ?? "var(--border-hairline)"}`,
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        fontFamily: "var(--font-sans)",
        width: "100%",
      }}
    >
      <span
        style={{
          width: 56,
          height: 70,
          borderRadius: 10,
          flexShrink: 0,
          background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)",
          border: "1px solid var(--border-hairline)",
        }}
      />
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 14.5,
              fontWeight: 600,
              lineHeight: 1.3,
              color: "var(--text-primary)",
            }}
          >
            {item.title}
          </span>
          <span style={{ display: "flex", flexShrink: 0 }}>
            <StatusPill kind={pill.kind} size="xs">
              {pill.label}
            </StatusPill>
          </span>
        </span>

        <span
          style={{
            fontSize: 12.5,
            color: "var(--text-secondary)",
            lineHeight: 1.4,
            fontFeatureSettings: "var(--font-feature-tabular)",
          }}
        >
          {item.meta}
        </span>

        {item.status === "rejected" && item.rejectionReason ? (
          <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--text-secondary)" }}>
            {item.rejectionReason}
          </span>
        ) : null}

        {item.status === "rejected" && onFix ? (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>Fix and resubmit</span>
        ) : null}

        {item.status === "live" && item.earned !== undefined ? (
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFeatureSettings: "var(--font-feature-tabular)",
            }}
          >
            {formatNaira(item.earned)} earned
          </span>
        ) : null}

        {item.isFirstUpload ? (
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Your first upload</span>
        ) : null}
      </span>
    </button>
  );
}

export interface ContentGridCardProps {
  state: "locked" | "free";
  title: string;
  price?: number;
  contentType: string;
  count?: string;
  ratio?: string;
  onClick?: () => void;
}

/** Fan-facing grid tile: square art with lock veil, title, type + price. */
export function ContentGridCard({
  state,
  title,
  price,
  contentType,
  count,
  ratio = "1 / 1",
  onClick,
}: ContentGridCardProps) {
  const locked = state === "locked";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        fontFamily: "var(--font-sans)",
      }}
    >
      <span
        style={{
          position: "relative",
          aspectRatio: ratio,
          borderRadius: "var(--radius-media)",
          background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)",
          border: "1px solid var(--border-hairline)",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {locked ? (
          <span
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--locked-veil)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="Lock" size={16} stroke={2.2} color="#fff" />
          </span>
        ) : null}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            lineHeight: 1.3,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500 }}>
            {count ?? contentType}
          </span>
          <PriceChip amount={price} free={!locked && price === undefined} />
        </span>
      </span>
    </button>
  );
}
