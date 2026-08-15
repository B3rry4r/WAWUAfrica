import { getCategories } from "@/lib/api/explore";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <ScreenHeader title="Categories" />
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          padding: "14px 16px 96px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          alignContent: "start",
        }}
      >
        {categories.map((category, i) => (
          <CategoryTile
            key={category.id}
            name={category.name}
            fullWidth={i === categories.length - 1 && categories.length % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryTile({ name, fullWidth }: { name: string; fullWidth: boolean }) {
  return (
    <div
      style={{
        gridColumn: fullWidth ? "1 / -1" : undefined,
        position: "relative",
        height: 104,
        borderRadius: "var(--radius-media)",
        overflow: "hidden",
        border: "1px solid var(--border-hairline)",
        background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,10,13,0.88) 0%, rgba(11,10,13,0.32) 42%, transparent 68%)" }} />
      <span style={{ position: "absolute", left: 12, bottom: 11, fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
    </div>
  );
}