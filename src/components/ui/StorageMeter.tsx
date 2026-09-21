"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { getStorageUsage, type StorageUsage } from "@/lib/api/uploads";

/**
 * How much of their storage an account has used.
 *
 * This exists because the ceiling is real and was invisible. Storage is capped
 * per account and enforced at presign — so without this
 * the first a creator learns of the limit is an upload being refused, after
 * they picked the file and waited.
 *
 * Every figure comes from GET /uploads/usage, which SUMS recorded objects
 * server-side. Nothing is estimated in the browser: a meter that computed its
 * own total would eventually disagree with the refusal, and the refusal is the
 * one that decides.
 */

function humanBytes(bytes: number): string {
  const gb = 1024 ** 3;
  const mb = 1024 ** 2;
  if (bytes >= gb) {
    const n = bytes / gb;
    // Whole numbers stay whole: "2GB", not "2.0GB".
    return `${Number.isInteger(n) ? n : Math.round(n * 10) / 10}GB`;
  }
  if (bytes >= mb) return `${Math.round(bytes / mb)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

export interface StorageMeterProps {
  /**
   * Bump this to re-read usage — pass an upload counter so the bar moves the
   * moment a file lands, rather than staying stale until the page reloads.
   */
  refreshKey?: number;
  className?: string;
}

export function StorageMeter({ refreshKey = 0, className = "" }: StorageMeterProps) {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsage(await getStorageUsage());
    } catch {
      // A meter is context, never the task. If usage cannot be read — offline,
      // or no backend configured — the upload itself still works, so this
      // renders nothing rather than an error the user can neither fix nor act
      // on.
      setUnavailable(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (unavailable || !usage) return null;

  const pct = usage.limitBytes > 0
    ? Math.min(100, Math.round((usage.usedBytes / usage.limitBytes) * 100))
    : 0;
  // 90% is the point where the next ordinary file is likely to be refused, so
  // that is where the bar stops being neutral information and starts being a
  // warning. Below it, a coloured bar would be alarm without a decision.
  const tight = pct >= 90;

  return (
    <div className={`flex flex-col gap-[7px] ${className}`}>
      <div className="flex items-baseline justify-between gap-[10px]">
        <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Storage</span>
        <span className="text-[12px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
          {humanBytes(usage.usedBytes)} of {humanBytes(usage.limitBytes)} used
        </span>
      </div>
      <div className="h-[5px] w-full overflow-hidden rounded-full bg-[var(--surface-tag)]">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${
            tight ? "bg-[var(--warning)]" : "bg-[var(--accent)]"
          }`}
          // A percentage is a computed value, so it cannot be a Tailwind class.
          // Same exception the upload progress bar already takes.
          style={{ width: `${pct}%` }}
        />
      </div>
      {tight ? (
        <span className="flex items-start gap-[6px] text-[11.5px] leading-[1.45] text-[var(--text-muted)]">
          <Icon name="TriangleAlert" size={13} color="var(--warning)" className="mt-[1px] shrink-0" />
          {humanBytes(usage.remainingBytes)} left. Remove something you no longer need.
        </span>
      ) : null}
    </div>
  );
}
