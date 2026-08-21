"use client";

import { useCallback, useEffect, useState } from "react";
import type { Playbook } from "@/types/learn";
import { getPlaybook } from "@/lib/api/learn";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { PriceChip } from "@/components/ui/PriceChip";
import { DownloadButton } from "@/components/learn/DownloadButton";

type Mode = "overview" | "reading";

export default function PlaybookPage() {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("overview");

  const load = useCallback(() => {
    setPlaybook(null);
    setError(null);
    getPlaybook()
      .then((result) => {
        // null = nothing published yet, which is an empty state rather than
        // a load failure.
        if (result) setPlaybook(result);
        else setError("The business playbook has not been published yet.");
      })
      .catch(() => setError("We couldn't load the playbook."));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:max-w-[720px] xl:p-[26px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="flex-1 text-[15px] font-semibold text-[var(--text-primary)]">
          {mode === "reading" ? playbook?.title ?? "Playbook" : "Playbook"}
        </span>
        {mode === "reading" ? (
          <Icon name="Share2" size={18} color="var(--text-secondary)" />
        ) : null}
      </div>

      {error ? (
        <ErrorState title={error} onRetry={load} />
      ) : !playbook ? (
        <PlaybookSkeleton />
      ) : mode === "reading" ? (
        <ReadingView playbook={playbook} onBack={() => setMode("overview")} />
      ) : (
        <OverviewView playbook={playbook} onRead={() => setMode("reading")} />
      )}
    </div>
  );
}

function OverviewView({ playbook, onRead }: { playbook: Playbook; onRead: () => void }) {
  return (
    <>
      <div className="flex gap-3.5">
        <span className="grid h-[126px] w-[96px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-hairline)] bg-[repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)] text-[12px] font-extrabold uppercase tracking-[0.02em] text-[var(--text-muted)]">
          WAWU
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="m-0 text-[20px] font-semibold leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)]">{playbook.title}</h1>
          <span className="text-[12.5px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
            {playbook.pages} pages · {playbook.format}
          </span>
          <div className="flex">
            <PriceChip free tone="plain" size="sm" />
          </div>
        </div>
      </div>

      <p className="m-0 text-[14.5px] leading-[1.55] text-[var(--text-secondary)]">{playbook.description}</p>

      <section className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Inside</span>
        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-1">
          {playbook.chapters.map((ch, i) => (
            <div key={ch.title} className="flex items-center gap-3 rounded-[var(--radius-input)] p-3">
              <span className="w-[22px] shrink-0 text-[12px] font-bold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-[13.5px] text-[var(--text-secondary)]">{ch.title}</span>
              <span className="shrink-0 text-[12px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
                Pages {ch.pages}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-[11px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_15px]">
        <Icon name="Download" size={16} color="var(--text-muted)" />
        <span className="flex-1 text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">
          Downloaded {playbook.downloadCount.toLocaleString("en-NG")} times. Yours to keep and to pass on.
        </span>
      </div>

      <div className="flex gap-2.5">
        <DownloadButton title={playbook.title} />
        <Button size="lg" variant="secondary" icon="BookOpen" className="flex-1" onClick={onRead}>
          Read here
        </Button>
      </div>
    </>
  );
}

function ReadingView({ playbook, onBack }: { playbook: Playbook; onBack: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-[var(--accent)] hover:text-text-primary"
      >
        <Icon name="ChevronLeft" size={14} />
        Back to overview
      </button>
      <div className="flex flex-col gap-5">
        {playbook.readingSections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <span className="text-[16px] font-semibold text-[var(--text-primary)]">{section.heading}</span>
            <p className="m-0 text-[14.5px] leading-[1.65] text-[var(--text-secondary)]">{section.body}</p>
          </section>
        ))}
      </div>
      <DownloadButton title={playbook.title} />
    </>
  );
}

function PlaybookSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3.5">
        <Skeleton className="h-[126px] w-[96px] rounded-[12px]" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-[20px] w-full rounded" />
          <Skeleton className="h-[14px] w-[60%] rounded" />
        </div>
      </div>
      <Skeleton className="h-[14px] w-full rounded" />
      <Skeleton className="h-[14px] w-[85%] rounded" />
      <Skeleton className="h-[180px] w-full rounded-[var(--radius-card)]" />
    </div>
  );
}
