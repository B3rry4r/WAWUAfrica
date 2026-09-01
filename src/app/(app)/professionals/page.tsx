import Link from "next/link";
import { listProfessionals } from "@/lib/api/professionals";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TileCard } from "@/components/ui/TileCard";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import type { ProfessionalListing } from "@/types/professional";

/**
 * Reads live data and must not be prerendered — a directory of practitioners
 * baked at build time would keep serving people who have since withdrawn.
 */
export const dynamic = "force-dynamic";

function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id.replace(/_/g, " ");
}

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = CATEGORIES.find((c) => c.id === category)?.id as CategoryId | undefined;

  let pros: ProfessionalListing[] | null = null;
  let failed = false;
  try {
    pros = await listProfessionals(active);
  } catch {
    // No mock fallback here on purpose (see src/lib/api/professionals.ts):
    // inventing a lawyer is the one failure this directory exists to prevent.
    failed = true;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="xl:hidden">
        <ScreenHeader title="Professionals" />
      </div>

      <div className="flex flex-col gap-[16px] p-[14px_16px_96px] xl:p-[26px]">
        <div className="flex flex-col gap-[6px]">
          <h1 className="hidden text-[24px] font-bold text-[var(--text-primary)] xl:block">
            Professionals
          </h1>
          <p className="max-w-[62ch] text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            Vetted practitioners on WAWU. Pay to send the first message; you and
            they arrange the work itself.
          </p>
        </div>

        {/*
          The field filter, as cards rather than a strip of grey pills.

          Same treatment as the landing services and the legal list, at the
          smaller size — a row of these has to stay a filter, not become a
          second page of content. No icons: professional fields have never had
          one, and the colour is what separates them. Selected state is an
          OUTLINE, so picking one does not resize the card and shuffle the row.

          Still scrolls in its own container, so the page body never scrolls
          sideways.
        */}
        <div className="wawu-no-scrollbar -mx-[16px] overflow-x-auto px-[16px] xl:mx-0 xl:px-0">
          {/*
            Vertical padding, not decoration: the selected card is marked with
            an `outline-offset-2`, and an outline drawn outside the element is
            clipped by the scroll container unless there is room for it. Without
            this the chosen field looked cut off along the top and bottom.

            wawu-no-scrollbar for the same reason every other chip row in the
            app uses it — a horizontal scrollbar under a single row of cards
            reads as a rendering fault rather than an affordance.
          */}
          <div className="flex w-max gap-[10px] py-[6px]">
            <TileCard
              size="sm"
              index={0}
              title="All"
              href="/professionals"
              selected={!active}
            />
            {CATEGORIES.map((c, i) => (
              <TileCard
                key={c.id}
                size="sm"
                // +1 so "All" and the first field do not share a colour.
                index={i + 1}
                title={c.name}
                href={`/professionals?category=${c.id}`}
                selected={active === c.id}
              />
            ))}
          </div>
        </div>

        {failed ? (
          <ErrorState
            title="We could not load the directory"
            body="This needs a live connection — we will not show you a list we cannot verify."
          />
        ) : pros && pros.length > 0 ? (
          <div className="grid gap-[12px] xl:grid-cols-2 2xl:grid-cols-3">
            {pros.map((pro) => (
              <ProfessionalCard key={pro.id} pro={pro} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="BriefcaseBusiness"
            title={
              active
                ? `No professionals in ${categoryName(active)} yet`
                : "No professionals listed yet"
            }
            caption="If you do this work, apply to be listed here."
            action="Apply to be listed"
            actionHref="/professionals/apply"
          />
        )}
      </div>
    </div>
  );
}

