"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { CountryGuide, LearnGuide, ReferenceArticle, TemplatePack } from "@/types/learn";
import { getGuides } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatBlock } from "@/components/ui/StatBlock";
import { DownloadButton } from "@/components/learn/DownloadButton";

export default function GuideDetailPage() {
  const params = useParams<{ id: string }>();
  const [guide, setGuide] = useState<LearnGuide | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setGuide(undefined);
    setError(null);
    getGuides()
      .then((all) => setGuide(all.find((g) => g.id === params.id) ?? null))
      .catch(() => setError("We couldn't load this guide."));
  }, [params.id]);

  useEffect(load, [load]);

  const title = guide && guide.kind === "country" ? guide.country : guide?.title ?? "Guide";

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:max-w-[720px] xl:p-[26px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="flex-1 text-[15px] font-semibold text-[var(--text-primary)]">{title}</span>
      </div>

      {error ? (
        <ErrorState title={error} onRetry={load} />
      ) : guide === undefined ? (
        <DetailSkeleton />
      ) : guide === null ? (
        <ErrorState title="Guide not found" body="This guide may have been removed." onRetry={load} />
      ) : guide.kind === "country" ? (
        <CountryGuideDetail guide={guide} />
      ) : guide.kind === "article" ? (
        <ArticleDetail guide={guide} />
      ) : (
        <TemplateDetail guide={guide} />
      )}
    </div>
  );
}

function CountryGuideDetail({ guide }: { guide: CountryGuide }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] tracking-[-0.025em] text-[var(--text-primary)]">{guide.title}</h1>
        <span className="text-[12.5px] text-[var(--text-muted)]">
          {guide.updated} · {guide.readMinutes} min read
        </span>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-3.5">
          <StatBlock value={guide.dutyLabel} label={guide.dutyCaption} align="start" size="sm" />
        </div>
        <div className="flex-1 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-3.5">
          <StatBlock value={guide.borderDaysLabel} label={guide.borderDaysCaption} align="start" size="sm" />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <span className="text-[16px] font-semibold text-[var(--text-primary)]">{guide.whyFirstHeading}</span>
        <p className="m-0 text-[14.5px] leading-[1.6] text-[var(--text-secondary)]">{guide.whyFirstBody}</p>
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-[16px] font-semibold text-[var(--text-primary)]">What you need</span>
        <div className="flex flex-col gap-2.5 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-4">
          {guide.whatYouNeed.map((item) => (
            <span key={item} className="flex items-start gap-[9px] text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
              <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} className="mt-0.5" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2.5 rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-[var(--surface-elevated)] p-4">
        <span className="text-[14px] font-semibold text-[var(--text-primary)]">{guide.crossSell.heading}</span>
        <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">{guide.crossSell.body}</span>
        <Link href={guide.crossSell.href} className="self-start text-[13px] font-semibold text-[var(--accent)]">
          {guide.crossSell.label}
        </Link>
      </div>
    </>
  );
}

function ArticleDetail({ guide }: { guide: ReferenceArticle }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] tracking-[-0.025em] text-[var(--text-primary)]">{guide.title}</h1>
        <span className="text-[12.5px] text-[var(--text-muted)]">
          {guide.updated} · {guide.readMinutes} min read
        </span>
      </div>
      <p className="m-0 text-[14.5px] leading-[1.55] text-[var(--text-secondary)]">{guide.summary}</p>
      {guide.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold text-[var(--text-primary)]">{s.heading}</span>
          <p className="m-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]">{s.body}</p>
        </section>
      ))}
    </>
  );
}

function TemplateDetail({ guide }: { guide: TemplatePack }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] tracking-[-0.025em] text-[var(--text-primary)]">{guide.title}</h1>
        <span className="text-[12.5px] text-[var(--text-muted)]">
          {guide.updated} · {guide.fileCount} files
        </span>
      </div>
      <p className="m-0 text-[14.5px] leading-[1.55] text-[var(--text-secondary)]">{guide.description}</p>
      <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-3.5">
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name="LayoutTemplate" size={18} color="var(--accent)" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{guide.fileCount} editable files</span>
        </div>
        <span className="text-[12.5px] font-bold text-[var(--success)]">No charge</span>
      </div>
      <DownloadButton title={guide.title} />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-[22px] w-[75%] rounded" />
      <Skeleton className="h-[14px] w-[45%] rounded" />
      <Skeleton className="h-[80px] w-full rounded-[var(--radius-card)]" />
      <Skeleton className="h-[14px] w-full rounded" />
      <Skeleton className="h-[14px] w-[90%] rounded" />
      <Skeleton className="h-[150px] w-full rounded-[var(--radius-card)]" />
    </div>
  );
}
