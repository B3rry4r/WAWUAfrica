import Link from "next/link";
import type { CSSProperties } from "react";
import { getCategories } from "@/lib/api/explore";
import { Icon } from "@/components/ui/Icon";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { ListRow } from "@/components/ui/ListRow";

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 2px" } as const;
const seeAll = { fontSize: 12.5, fontWeight: 600, color: "var(--accent)" } as const;

export default async function ExplorePage() {
  const categories = await getCategories();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <span style={eyebrow}>Browse</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Link href="/explore/categories" style={tileLink}>
            <IconTile icon="LayoutGrid" />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={tileTitle}>Categories</span>
              <span style={tileSub}>All {categories.length}</span>
            </div>
          </Link>
          <Link href="/explore/creators" style={tileLink}>
            <IconTile icon="UserRoundSearch" />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={tileTitle}>Creators</span>
              <span style={tileSub}>By field</span>
            </div>
          </Link>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <span style={eyebrow}>Buy and sell</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
          <ShopCard id="basket" />
          <ShopCard id="beauty" />
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px" }}>
          <span style={{ flex: 1, ...eyebrow, padding: 0 }}>Learn</span>
          <Link href="/learn" style={seeAll}>See all</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
          <ListRow title="Business Playbook" subtitle="96 pages · free to download" icon="BookOpen" meta="Free" href="/learn" />
          <ListRow title="Courses and guides" subtitle="24 courses · 12 country guides" icon="GraduationCap" href="/learn" />
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px" }}>
          <span style={{ flex: 1, ...eyebrow, padding: 0 }}>Services</span>
          <Link href="/services" style={seeAll}>See all</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
          <ListRow title="CAC registration" subtitle="From ₦25,000 · 7 to 14 days" icon="Stamp" href="/services" />
          <ListRow title="NEPC, mentors and more" subtitle="3 open · 4 coming with Pro" icon="Briefcase" href="/services" />
        </div>
      </section>
    </div>
  );
}

const tileLink: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  height: 72,
  padding: "0 14px",
  borderRadius: "var(--radius-card)",
  background: "var(--surface-card)",
  border: "1px solid var(--border-hairline)",
  textDecoration: "none",
  color: "inherit",
};
const tileTitle = { fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", color: "var(--text-primary)" } as const;
const tileSub = { fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" } as const;

function IconTile({ icon }: { icon: string }) {
  return (
    <span
      style={{
        display: "grid",
        placeItems: "center",
        width: 40,
        height: 40,
        borderRadius: 12,
        flexShrink: 0,
        background: "var(--accent-tint)",
        border: "1px solid var(--border-accent)",
      }}
    >
      <Icon name={icon} size={18} color="var(--accent)" stroke={2} />
    </span>
  );
}

const SHOPS = {
  basket: { name: "WAWUBasket", tagline: "Fashion, food, art", stat: "4,120 items", icon: "ShoppingBag" },
  beauty: { name: "WAWUBeauty", tagline: "Hair, nails, skin", stat: "890 services", icon: "Scissors" },
} as const;

function ShopCard({ id }: { id: keyof typeof SHOPS }) {
  const shop = SHOPS[id];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 14,
        borderRadius: "var(--radius-card)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: 12,
          background: "var(--accent-tint)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <Icon name={shop.icon} size={18} color="var(--accent)" stroke={2} />
      </span>
      <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>{shop.name}</span>
      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4, color: "var(--text-secondary)" }}>{shop.tagline}</span>
      <div style={{ display: "flex" }}>
        <HandoffPill app={shop.name} />
      </div>
      <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>{shop.stat}</span>
    </div>
  );
}