"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getVerificationOverview } from "@/lib/api/verification";
import { describeError } from "@/lib/api/errors";
import { Icon, Skeleton, VerificationTicks } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import {
  VERIFICATION_LABELS,
  hasAnyTick,
  type VerificationOverview,
} from "@/types/verification";

/**
 * Build brief B3: hosting an event is verified accounts only. A buyer can
 * never host; an unverified creator or professional cannot either.
 *
 * "Enforce server-side, not by hiding a button. And where an ineligible user
 * encounters the control, it must explain what they need to do to become
 * eligible. Never fail silently, never simply disappear. That explanation is
 * a conversion surface, not an error."
 *
 * So this gate does four things and deliberately not a fifth:
 *
 *  1. It does NOT hide the "Submit an event" control anywhere. Every link to
 *     /events/new stays exactly where it was; this is what the visitor meets
 *     when they follow one.
 *  2. It EXPLAINS: which tick they need, what it costs, where to buy it.
 *  3. It is not styled as an error. No red, no "access denied": an ineligible
 *     user here is somebody we are asking to buy something.
 *  4. It is not the enforcement. The server refuses the POST regardless of
 *     what this renders, and EventForm shows the server's own sentence when
 *     it does (describeError). A client gate is a courtesy, never a control.
 *
 * On a failed read it opens the form rather than blocking it: the server is
 * the real gate, and locking somebody out because a side call failed would
 * be the silent failure the brief forbids.
 */
export function HostEventGate({ children }: { children: ReactNode }) {
  const [overview, setOverview] = useState<VerificationOverview | null>(null);
  const [failedToRead, setFailedToRead] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getVerificationOverview()
      .then((o) => {
        if (live) setOverview(o);
      })
      .catch((e) => {
        if (live) setFailedToRead(describeError(e).body);
      });
    return () => {
      live = false;
    };
  }, []);

  if (!overview && !failedToRead) {
    return <Skeleton className="h-[220px] w-full rounded-[var(--radius-card)]" />;
  }

  if (failedToRead) {
    return (
      <div className="flex flex-col gap-[14px]">
        <p className="m-0 flex items-start gap-[9px] rounded-[var(--radius-card)] border border-warning bg-warning-tint p-[13px] text-[13px] leading-[1.5] text-text-primary">
          <Icon name="Info" size={16} color="var(--warning)" strokeWidth={2.2} className="mt-[2px] shrink-0" />
          <span>
            We could not check your verification just now, so the form is open. Hosting is for verified accounts, and
            the check runs again when you submit. {failedToRead}
          </span>
        </p>
        {children}
      </div>
    );
  }

  if (hasAnyTick(overview?.verification)) return <>{children}</>;

  const offers = overview?.offers ?? [];

  return (
    <section className="flex flex-col gap-[15px] rounded-[var(--radius-card)] border border-hairline bg-card p-[18px] xl:p-[22px]">
      <div className="flex items-center gap-[10px]">
        <VerificationTicks
          verification={{
            creator: { verified: true, expiresAt: null },
            professional: { verified: true, expiresAt: null },
          }}
          size="md"
        />
        <h2 className="m-0 text-[16.5px] font-semibold tracking-[-0.01em] text-text-primary">
          Hosting an event needs a tick
        </h2>
      </div>

      <p className="m-0 max-w-[62ch] text-[13.5px] leading-[1.6] text-text-secondary">
        Events on WAWU sell tickets, so the person behind one has to be a verified account. Either tick qualifies you:
        buy the one that matches what you do and this form opens. Nothing else is required, and your listings, sales
        and identity check are unaffected either way.
      </p>

      {offers.length > 0 ? (
        <div className="flex flex-col gap-[9px]">
          {offers.map((offer) => (
            <Link
              key={offer.kind}
              href="/profile/verification"
              className="flex items-center justify-between gap-4 rounded-[var(--radius-button)] border border-hairline bg-elevated px-[14px] py-[11px] no-underline hover:border-strong hover:bg-surface-hover"
            >
              <span
                className={`text-[13.5px] font-semibold ${
                  offer.kind === "creator" ? "text-verify-creator" : "text-verify-professional"
                }`}
              >
                {VERIFICATION_LABELS[offer.kind]}
              </span>
              <span className="shrink-0 text-[13.5px] font-semibold text-text-primary [font-variant-numeric:tabular-nums]">
                {formatNaira(offer.price)}
                <span className="font-normal text-text-muted">
                  {offer.periodMonths === 12 ? " / year" : ` / ${offer.periodMonths} months`}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="m-0 rounded-[var(--radius-input)] bg-tag px-3 py-[11px] text-[13px] leading-[1.5] text-text-secondary">
          This account cannot buy a tick yet, because it is set up to buy rather than to sell. Register as a creator or
          a professional first, then verify, and hosting opens up.
        </p>
      )}

      <Link
        href="/events"
        className="text-[13.5px] font-semibold text-text-secondary no-underline hover:text-text-primary"
      >
        Back to events
      </Link>
    </section>
  );
}
