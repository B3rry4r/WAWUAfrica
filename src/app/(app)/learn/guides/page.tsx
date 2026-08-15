"use client";

import { useCallback, useEffect, useState } from "react";
import type { CountryGuide } from "@/types/learn";
import { getGuides } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListRow } from "@/components/ui/ListRow";

export default function CountryGuidesPage() {
  const [guides, setGuides] = useState<CountryGuide[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setGuides(null);
    setError(null);
    getGuides()
      .then((all) => setGuides(all.filter((g): g is CountryGuide => g.kind === "country")))
      .catch(() => setError("We couldn't load country guides."));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="flex flex-col gap-3.5 p-[16px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="text-[16px] font-semibold text-[var(--text-primary)]">Country guides</span>
      </div>

      {error ? (
        <ErrorState title={error} onRetry={load} />
      ) : !guides ? (
        <ListSkeleton />
      ) : (
        <>
          <p className="m-0 px-[2px] text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            What it takes to sell into each market — duties, paperwork, who to register with.
          </p>
          <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-1">
            {guides.map((g) => (
              <ListRow key={g.id} title={g.country} subtitle={g.subtitle} icon="Globe" href={`/learn/guides/${g.id}`} />
            ))}
          </div>
          <span className="px-[2px] text-[12px] text-[var(--text-muted)]">{guides.length} countries · reviewed quarterly</span>
        </>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} variant="row" className="h-[66px]" />
      ))}
    </div>
  );
}
