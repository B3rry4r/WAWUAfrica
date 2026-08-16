import Link from "next/link";
import { getCategories } from "@/lib/api/explore";
import type { ExploreCategoryId } from "@/types/explore";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="xl:hidden">
        <ScreenHeader title="Categories" />
      </div>
      <div className="flex flex-1 content-start flex-wrap gap-2 overflow-hidden p-[14px_16px_96px] xl:gap-3 xl:p-[26px]">
        {categories.map((category) => (
          <CategoryTile key={category.id} id={category.id} name={category.name} />
        ))}
      </div>
    </div>
  );
}

function CategoryTile({ id, name }: { id: ExploreCategoryId; name: string }) {
  return (
    <Link
      href={`/explore/creators?category=${id}`}
      className="inline-flex h-8 items-center rounded-full border border-hairline bg-tag px-[13px] text-[12.5px] font-medium text-text-secondary no-underline"
    >
      {name}
    </Link>
  );
}
