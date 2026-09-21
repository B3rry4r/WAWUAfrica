import { getCategories, getCreators } from "@/lib/api/explore";
import { isCategoryId } from "@/lib/categories";
import type { ExploreCategoryId } from "@/types/explore";
import { ChoiceChips } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreatorGridCard } from "../_components/CreatorGridCard";

/**
 * Reads live data, so it renders per request rather than being prerendered
 * with one moment's catalogue baked in. Same reason as the creators page.
 */
export const dynamic = "force-dynamic";

/**
 * Browse by category.
 *
 * ── WHY THIS IS NOT A WALL OF CARDS ANY MORE ───────────────────────────────
 * This was twenty-five cards and nothing else: you picked one and were sent
 * to a different screen to see anything. The category was the whole page, and
 * the thing you actually came for was one navigation away.
 *
 * It now follows the professionals screen: the categories are a SLIDER along
 * the top, and the creators in the chosen one fill the page underneath. The
 * filter stays visible while you read the results, so changing your mind
 * costs one tap instead of a back-and-forward.
 */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categories = await getCategories();
  const raw = searchParams.category;
  const active: ExploreCategoryId | undefined = raw && isCategoryId(raw) ? raw : undefined;
  const creators = await getCreators(active);
  const activeName = categories.find((c) => c.id === active)?.name;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="xl:hidden">
        <ScreenHeader title="Categories" />
      </div>

      <div className="flex flex-col gap-[16px] p-[14px_16px_96px] xl:p-[26px]">
        <div className="hidden flex-col gap-[6px] xl:flex">
          <h1 className="m-0 text-[24px] font-bold text-[var(--text-primary)]">Categories</h1>
          <p className="m-0 max-w-[62ch] text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            Pick a field and see who is publishing in it.
          </p>
        </div>

        {/*
          The filter rail, per build brief C4: "category chips for browsing".

          It used to be a row of 150x86 gradient cards in seven cycling
          colours, which made a filter look like a gallery and put six colours
          on screen before a single result. The chips are links, not state, so
          the chosen category stays in the URL and survives a share or a
          reload.
        */}
        <ChoiceChips
          ariaLabel="Browse by category"
          scroll
          value={active ?? "all"}
          options={[
            { value: "all", label: "All", href: "/explore/categories" },
            ...categories.map((c) => ({
              value: c.id as string,
              label: c.name,
              icon: c.icon as IconName,
              href: `/explore/categories?category=${c.id}`,
            })),
          ]}
        />

        {creators.length > 0 ? (
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {creators.map((creator) => (
              <CreatorGridCard key={creator.wawuId} creator={creator} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="Compass"
            title={activeName ? `Nobody is publishing in ${activeName} yet` : "No creators yet"}
            caption="Try another category, or come back once more people have published."
          />
        )}
      </div>
    </div>
  );
}
