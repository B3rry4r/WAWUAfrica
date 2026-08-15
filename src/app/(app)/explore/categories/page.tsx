import { getCategories } from "@/lib/api/explore";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="xl:hidden">
        <ScreenHeader title="Categories" />
      </div>
      <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-hidden p-[14px_16px_96px] xl:grid-cols-4 xl:gap-4 xl:p-[26px]">
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
      className={`relative h-[104px] overflow-hidden rounded-[var(--radius-media)] border border-[var(--border-hairline)] bg-[repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)] xl:h-[130px] ${
        fullWidth ? "col-span-2 xl:col-span-1" : ""
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,10,13,0.88)_0%,rgba(11,10,13,0.32)_42%,transparent_68%)]" />
      <span className="absolute bottom-[11px] left-3 text-[14.5px] font-semibold text-[var(--text-primary)]">{name}</span>
    </div>
  );
}
