import Link from "next/link";
import type { ExploreCategoryId } from "@/types/explore";
import type { VerificationLevel } from "@/types/account";
import { getCreators } from "@/lib/api/explore";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { FollowButton } from "@/components/shared/FollowButton";

const VALID_CATEGORIES: ExploreCategoryId[] = [
  "business",
  "agriculture",
  "finance",
  "trade",
  "entertainment",
  "career",
  "education",
  "health",
  "technology",
  "creative_arts",
  "culture",
];

export default async function CreatorsPage({ searchParams }: { searchParams: { category?: string } }) {
  const category = VALID_CATEGORIES.includes(searchParams.category as ExploreCategoryId)
    ? (searchParams.category as ExploreCategoryId)
    : "business";
  const creators = await getCreators(category);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <ScreenHeader
        title="Creators"
        right={
          <Link href="/search" aria-label="Search" style={{ display: "grid", placeItems: "center" }}>
            <Icon name="Search" size={19} color="var(--text-secondary)" />
          </Link>
        }
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 16px",
          overflowX: "auto",
          borderBottom: "1px solid var(--border-hairline)",
          scrollbarWidth: "none",
        }}
      >
        {VALID_CATEGORIES.map((id) => {
          const on = category === id;
          return (
            <Link
              key={id}
              href={id === "business" ? "/explore/creators" : `/explore/creators?category=${id}`}
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                height: 32,
                padding: "0 14px",
                borderRadius: "var(--radius-chip)",
                background: on ? "var(--accent)" : "var(--surface-tag)",
                border: `1px solid ${on ? "transparent" : "var(--border-hairline)"}`,
                color: on ? "var(--text-on-accent)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: on ? 600 : 500,
                textDecoration: "none",
                textTransform: "capitalize",
              }}
            >
              {id.replace("_", " ")}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 16px 96px" }}>
        {creators.map((creator) => (
          <CreatorRow
            key={creator.wawuId}
            wawuId={creator.wawuId}
            name={creator.name}
            field={creator.field}
            pieceCount={creator.pieceCount}
            verification={creator.verification}
            following={creator.following}
          />
        ))}
      </div>
    </div>
  );
}

interface CreatorRowProps {
  wawuId: string;
  name: string;
  field: string;
  pieceCount: number;
  verification?: VerificationLevel;
  following: boolean;
}

function CreatorRow({ wawuId, name, field, pieceCount, verification, following }: CreatorRowProps) {
  return (
    <Link
      href={`/profile/${wawuId}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        minHeight: 86,
        padding: "0 14px",
        borderRadius: "var(--radius-card)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
        textDecoration: "none",
      }}
    >
      <Avatar initial={name.charAt(0)} size={52} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>
            {name}
          </span>
          {verification && <VerificationBadge tier={verification} size={15} />}
        </div>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {field} · {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
        </span>
      </div>
      <div style={{ display: "flex", flexShrink: 0 }}>
        <FollowButton wawuId={wawuId} initial={following} />
      </div>
    </Link>
  );
}