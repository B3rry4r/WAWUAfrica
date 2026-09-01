import { getCategories } from "@/lib/api/explore";
import { TileCard } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="xl:hidden">
        <ScreenHeader title="Categories" />
      </div>
      {/*
        Cards, not a wrapped bag of grey pills.

        Every category looked identical, so the whole screen was one texture
        and picking a category meant reading every label in turn. The colour
        does the separating now, and it is stable per position so a category
        keeps its identity between visits.

        The icon comes from the shared taxonomy, which has always carried one
        per category — it is not invented here.
      */}
      <div className="grid grid-cols-2 gap-[10px] p-[14px_16px_96px] sm:grid-cols-3 xl:grid-cols-4 xl:gap-3 xl:p-[26px]">
        {categories.map((category, i) => (
          <TileCard
            key={category.id}
            index={i}
            title={category.name}
            // The taxonomy has carried an icon per category all along — see
            // CATEGORIES in src/lib/categories.ts. Nothing is invented here.
            icon={category.icon as IconName}
            href={`/explore/creators?category=${category.id}`}
          />
        ))}
      </div>
    </div>
  );
}
