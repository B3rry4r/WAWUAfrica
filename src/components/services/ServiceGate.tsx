"use client";

import { useEffect, useState } from "react";
import { getService } from "@/lib/api/services";
import { BackLink } from "@/components/ui/BackLink";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Whether a partner service is open for business, read from the catalogue.
 *
 * Every service tool lives at its own STATIC route (/services/pay,
 * /services/legal, /services/care). Next resolves those ahead of the dynamic
 * /services/[id] detail page, so a card marked "coming soon" — whose button
 * points at the same path — walked straight into the live tool, payment and
 * all. The status lives in the catalogue, so each tool has to check it itself;
 * that also covers anyone arriving with the URL rather than through a card.
 *
 * Returns `null` while the answer is unknown. A catalogue that will not load
 * resolves to `false`: not being able to read the status is not permission to
 * take someone's money.
 */
export function useServiceLive(slug: string): boolean | null {
  const [live, setLive] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    getService(slug)
      .then((svc) => {
        if (!cancelled) setLive(svc ? svc.status === "live" : false);
      })
      .catch(() => {
        if (!cancelled) setLive(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return live;
}

const shell =
  "mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]";

/** Shown in place of a service tool that the catalogue says is not open yet. */
export function ServiceComingSoon({
  name,
  icon,
  note,
}: {
  name: string;
  icon: IconName;
  note?: string;
}) {
  return (
    <div className={shell}>
      <BackLink />
      <div className="flex flex-col items-start gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px]">
        <span className="grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-[var(--border-hairline)] bg-[var(--surface-elevated)]">
          <Icon name={icon} size={22} color="var(--text-secondary)" strokeWidth={2} />
        </span>
        <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          {name} is coming soon
        </span>
        <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">
          {note ?? "We are finishing the partner rollout. It opens here first, and nothing is charged until it does."}
        </p>
      </div>
    </div>
  );
}

/** Placeholder while the catalogue status is still in flight. */
export function ServiceGateLoading() {
  return (
    <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px]">
      <Skeleton variant="card" />
    </div>
  );
}
