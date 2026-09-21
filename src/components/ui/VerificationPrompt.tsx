"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { getVerificationOverview } from "@/lib/api/verification";
import {
  VERIFICATION_BENEFITS,
  VERIFICATION_LABELS,
  type VerificationKind,
  type VerificationOffer,
  type VerificationState,
} from "@/types/verification";

/**
 * The persistent verification ask (build brief B1: "unverified creators and
 * professionals receive persistent, recurring prompts to verify, and each
 * prompt states the concrete benefits of verifying").
 *
 * Three rules it holds to:
 *
 *  1. It has NO dismiss. "Persistent and recurring" is the requirement; a
 *     banner with an X is neither after the first tap. It stops appearing
 *     when the tick is bought, which is the only ending it should have.
 *  2. It states benefits, and only the two that B3 actually grants: the tick
 *     everywhere, and hosting events. Nothing else may be added here without
 *     the mechanism behind it - see VERIFICATION_BENEFITS.
 *  3. It never decides who is eligible. The SERVER returns the offers this
 *     account can buy (GET /api/hub/verification); this renders one row per
 *     offer the caller does not already hold. A buyer-only account gets no
 *     offers and therefore no prompt, without this component knowing what a
 *     buyer is.
 *
 * It renders nothing while loading, nothing on failure (a prompt is not
 * worth an error state on somebody else's screen), and nothing once every
 * offered tick is held.
 */

export interface VerificationPromptProps {
  /**
   * `banner` is the wide, in-page ask. `card` is the standalone block for a
   * column of cards. Same copy, same data, one component: a variant is a
   * prop here, never a second file.
   */
  variant?: "banner" | "card";
  className?: string;
}

const TONE: Record<VerificationKind, string> = {
  creator: "text-verify-creator",
  professional: "text-verify-professional",
};

export function VerificationPrompt({ variant = "banner", className }: VerificationPromptProps) {
  const [state, setState] = useState<{ verification: VerificationState; offers: VerificationOffer[] } | null>(null);

  useEffect(() => {
    let live = true;
    getVerificationOverview()
      .then((o) => {
        if (live) setState(o);
      })
      .catch(() => {
        /* A prompt that cannot load is a prompt that does not appear. */
      });
    return () => {
      live = false;
    };
  }, []);

  const missing = (state?.offers ?? []).filter((o) => !state?.verification[o.kind].verified);
  if (!state || missing.length === 0) return null;

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-4",
        variant === "banner" && "xl:flex-row xl:items-center xl:gap-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
        <div className="flex items-center gap-[9px]">
          <Icon name="BadgeCheck" size={19} color="var(--verify-creator)" strokeWidth={2.2} />
          <h2 className="m-0 text-[15px] font-semibold text-text-primary">
            {missing.length === 1
              ? `Get your ${missing[0].kind === "creator" ? "creator" : "professional"} tick`
              : "Get verified on WAWU"}
          </h2>
        </div>
        <ul className="m-0 flex list-none flex-col gap-[5px] p-0">
          {VERIFICATION_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-[7px] text-[13px] leading-[1.5] text-text-secondary">
              <Icon name="Check" size={14} color="var(--verify-professional)" strokeWidth={2.6} className="mt-[3px] shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex shrink-0 flex-col gap-[7px]">
        {missing.map((offer) => (
          <Link
            key={offer.kind}
            href="/profile/verification"
            className="flex items-center justify-between gap-4 rounded-[var(--radius-button)] border border-hairline bg-elevated px-[13px] py-[9px] no-underline hover:border-strong hover:bg-surface-hover"
          >
            <span className={cn("text-[13px] font-semibold", TONE[offer.kind])}>
              {VERIFICATION_LABELS[offer.kind]}
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-text-primary [font-variant-numeric:tabular-nums]">
              {formatNaira(offer.price)}
              <span className="font-normal text-text-muted">{periodSuffix(offer.periodMonths)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** " / year" for the annual case, months otherwise. Never assumes 12. */
function periodSuffix(months: number): string {
  if (months === 12) return " / year";
  if (months === 1) return " / month";
  return ` / ${months} months`;
}
