import { getCategories } from "@/lib/api/explore";
import { TileCard } from "@/components/ui";
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

        No icons: these have never had one, and a glyph invented per category
        would be inventing meaning rather than adding it.
      */}
      <div className="grid grid-cols-2 gap-[10px] p-[14px_16px_96px] sm:grid-cols-3 xl:grid-cols-4 xl:gap-3 xl:p-[26px]">
        {categories.map((category, i) => (
          <TileCard
            key={category.id}
            index={i}
            title={category.name}
            href={`/explore/creators?category=${category.id}`}
          />
        ))}
      </div>
    </div>
  );
}
