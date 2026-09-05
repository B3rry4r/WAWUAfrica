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

/**
 * Shown in place of a service tool that the catalogue says is not open yet.
 *
 * The panel is CAPPED and centred at desktop width. It used to be the shell's
 * full 844px with a heading and one sentence in it, which on a laptop is a
 * near-empty rectangle running the width of the screen with an otherwise
 * blank page under it — reported repeatedly as "a bloody long card". The
 * content did not change; only the measure it is allowed to occupy.
 */
export function ServiceComingSoon({
  name,
  icon,
  note,
  headline,
}: {
  name: string;
  icon: IconName;
  note?: string;
  /**
   * Replaces the default heading.
   *
   * Not every closed service is one that never opened. A tool that was working
   * and has since been switched off is PAUSED, and telling somebody who used it
   * last week that it is on its way for the first time is simply untrue.
   */
  headline?: string;
}) {
  return (
    <div className={shell}>
      <BackLink />
      <div className="flex flex-col items-start gap-[12px] rounded-card border border-hairline bg-card p-[22px] xl:mx-auto xl:max-w-[440px] xl:items-center xl:p-[28px] xl:text-center">
        <span className="grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-hairline bg-elevated">
          <Icon name={icon} size={22} color="var(--text-secondary)" strokeWidth={2} />
        </span>
        <span className="text-[20px] font-bold tracking-[-0.02em] text-text-primary">{headline ?? `${name} is coming soon`}</span>
        <p className="m-0 max-w-[46ch] text-[14px] leading-[1.55] text-text-secondary">
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
      {/* Matches ServiceComingSoon's capped panel so the page does not jump
          from a full-bleed skeleton to a centred card when the status lands. */}
      <Skeleton variant="card" className="xl:mx-auto xl:max-w-[440px]" />
    </div>
  );
}
