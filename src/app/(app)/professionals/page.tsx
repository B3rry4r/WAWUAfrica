import Link from "next/link";
import { listProfessionals } from "@/lib/api/professionals";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
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

        {/* Horizontal filter. Scrolls in its own container so the page body
            never scrolls sideways. */}
        <div className="-mx-[16px] overflow-x-auto px-[16px] xl:mx-0 xl:px-0">
          <div className="flex w-max gap-[8px]">
            <FilterChip href="/professionals" label="All" active={!active} />
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.id}
                href={`/professionals?category=${c.id}`}
                label={c.name}
                active={active === c.id}
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

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "whitespace-nowrap rounded-full border px-[13px] py-[7px] text-[12.5px] no-underline transition-colors",
        active
          ? "border-[var(--border-selected)] bg-[var(--selected-tint)] font-semibold text-accent"
          : "border-hairline bg-card font-medium text-text-secondary hover:border-strong hover:bg-surface-hover active:bg-surface-press",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
