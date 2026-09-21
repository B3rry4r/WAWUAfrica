"use client";

import { useCallback, useEffect, useState } from "react";
import type { VerificationOffer, VerificationOverview } from "@/types/verification";
import {
  VERIFICATION_BENEFITS,
  VERIFICATION_LABELS,
  type VerificationKind,
} from "@/types/verification";
import { getVerificationOverview, purchaseVerification } from "@/lib/api/verification";
import { describeError } from "@/lib/api/errors";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { KycStatusPanel } from "@/components/profile/KycStatusPanel";
import { VerificationTicks } from "@/components/ui/VerificationTicks";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNaira } from "@/lib/format";

/**
 * /profile/verification - the two-tick purchase surface.
 *
 * WHAT THIS REPLACED: a five-rung "badge ladder" with a document-upload
 * application per rung, plus a /profile/verification/[tier] drill-down for
 * the form. That product no longer exists (build brief B1). There are two
 * verifications now, they cost money rather than paperwork, they are annual,
 * and they are INDEPENDENT: an account that is both a creator and a
 * professional can buy both and shows both ticks.
 *
 * Prices are never written here. They arrive from the server with the
 * offers, so what verification costs is a backend change.
 *
 * KYC still sits at the top and is still a different system: it gates
 * earning, it is free, it is reviewed by hand, and buying a tick does
 * nothing for it. The two have been confused on this screen before, so both
 * blocks name their own gate.
 */
export default function VerificationPage() {
  const [overview, setOverview] = useState<VerificationOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<VerificationKind | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null);

  const load = useCallback(() => {
    setError(null);
    setOverview(null);
    getVerificationOverview()
      .then(setOverview)
      .catch((e) => setError(describeError(e).body));
  }, []);

  useEffect(load, [load]);

  async function buy(kind: VerificationKind) {
    setBusyKind(kind);
    setNotice(null);
    try {
      const res = await purchaseVerification(kind);
      if (res.result === "success") {
        setOverview((prev) => (prev ? { ...prev, verification: res.verification } : prev));
        setNotice({ tone: "success", text: `Your ${VERIFICATION_LABELS[kind].toLowerCase()} is live for a year.` });
      } else if (res.result === "cancelled") {
        setNotice({ tone: "warning", text: "Payment was closed before it finished. Nothing was charged." });
      } else if (res.result === "verify_failed") {
        setNotice({
          tone: "warning",
          text: "Your payment went through, but we could not confirm it just yet. Do not pay again: reload this page in a minute and it will be here.",
        });
      } else {
        setNotice({ tone: "danger", text: "That payment did not go through. Nothing was charged." });
      }
    } finally {
      setBusyKind(null);
    }
  }

  if (error) {
    return (
      <div className="px-4 pt-4 xl:mx-auto xl:w-full xl:max-w-[700px] xl:px-0 xl:pt-8">
        <ErrorState title="We couldn't load your verification." body={error} onRetry={load} />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex flex-col gap-5 px-4 pb-24 pt-4 xl:mx-auto xl:w-full xl:max-w-[700px] xl:gap-6 xl:px-0 xl:pb-16 xl:pt-8">
        <Skeleton className="h-[26px] w-[140px] rounded" />
        <Skeleton className="h-[150px] w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-[190px] w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-[190px] w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }

  const held = (kind: VerificationKind) => overview.verification[kind];

  return (
    <div className="flex flex-col gap-5 px-4 pb-24 pt-4 xl:mx-auto xl:w-full xl:max-w-[700px] xl:gap-6 xl:px-0 xl:pb-16 xl:pt-8">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary">Verification</span>
      </div>

      {/*
        KYC first, because it is the thing people submit and then come here
        looking for. It has nothing to do with the ticks below and says so.
        Creator-only, and it renders nothing for a plain user.
      */}
      <KycStatusPanel />

      <section className="flex flex-col gap-[10px]">
        <span className="px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
          Your ticks
        </span>

        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-card p-4">
          <p className="m-0 text-[13.5px] leading-[1.55] text-text-secondary">
            A tick is a paid, annual credential that buyers see beside your name. Here is exactly what it does:
          </p>
          <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
            {VERIFICATION_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-[8px] text-[13px] leading-[1.5] text-text-secondary">
                <Icon
                  name="Check"
                  size={15}
                  color="var(--verify-professional)"
                  strokeWidth={2.6}
                  className="mt-[3px] shrink-0"
                />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-[12.5px] leading-[1.5] text-text-muted">
            The two are separate. If you are both a creator and a professional you can hold both, and both ticks show.
            Buying one never replaces the other. Your identity check for payouts is a third thing, it costs nothing, and
            it is unaffected either way.
          </p>
        </div>

        {notice && (
          <p
            className={`m-0 rounded-[var(--radius-card)] border p-[13px] text-[13px] leading-[1.5] ${
              notice.tone === "success"
                ? "border-success bg-success-tint text-text-primary"
                : notice.tone === "warning"
                  ? "border-warning bg-warning-tint text-text-primary"
                  : "border-danger bg-danger-tint text-text-primary"
            }`}
            role="status"
          >
            {notice.text}
          </p>
        )}

        {/*
          Not an empty state. Build brief B3: where somebody cannot do the
          thing, say what would change that. The SERVER's reason is preferred
          over ours whenever it sent one, because it knows which of the two
          conditions this account actually fails (no creator account, or no
          approved professional profile); the fallback sentence only covers
          the case where it sent none.
        */}
        {overview.offers.length === 0 && (
          <div className="flex flex-col gap-[8px] rounded-[var(--radius-card)] border border-hairline bg-card p-4">
            {overview.unavailable.length > 0 ? (
              overview.unavailable.map((u) => (
                <p key={u.kind} className="m-0 text-[13px] leading-[1.5] text-text-secondary">
                  <span className="font-semibold text-text-primary">{VERIFICATION_LABELS[u.kind]}:</span> {u.reason}
                </p>
              ))
            ) : (
              <p className="m-0 text-[13px] leading-[1.5] text-text-muted">
                There is nothing for this account to buy yet. Verification is for creator and professional accounts.
                Add a creator or professional profile first and it will appear here.
              </p>
            )}
          </div>
        )}

        {overview.offers.map((offer) => (
          <OfferCard
            key={offer.kind}
            offer={offer}
            verified={held(offer.kind).verified}
            expiresAt={held(offer.kind).expiresAt}
            busy={busyKind === offer.kind}
            disabled={busyKind !== null}
            onBuy={() => buy(offer.kind)}
          />
        ))}
      </section>
    </div>
  );
}

function OfferCard({
  offer,
  verified,
  expiresAt,
  busy,
  disabled,
  onBuy,
}: {
  offer: VerificationOffer;
  verified: boolean;
  expiresAt: string | null;
  busy: boolean;
  disabled: boolean;
  onBuy: () => void;
}) {
  const tickOnly =
    offer.kind === "creator"
      ? { creator: { verified: true, expiresAt }, professional: { verified: false, expiresAt: null } }
      : { creator: { verified: false, expiresAt: null }, professional: { verified: true, expiresAt } };

  return (
    <div className="flex flex-col gap-[13px] rounded-[var(--radius-card)] border border-hairline bg-card p-[15px]">
      <div className="flex items-center gap-[11px]">
        <VerificationTicks verification={tickOnly} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="text-[15.5px] font-semibold text-text-primary">{VERIFICATION_LABELS[offer.kind]}</span>
          <span className="text-[12.5px] text-text-muted [font-variant-numeric:tabular-nums]">
            {formatNaira(offer.price)}
            {offer.periodMonths === 12 ? " a year" : ` every ${offer.periodMonths} months`}
          </span>
        </div>
        {verified && <StatusPill kind="success">Active</StatusPill>}
      </div>

      <p className="m-0 text-[13px] leading-[1.55] text-text-secondary">
        {offer.kind === "creator"
          ? "The purple tick. For accounts that sell their own work: content, products, courses."
          : "The green tick. For accounts that sell their practice: services, consultations, bookings."}
      </p>

      {verified ? (
        <p className="m-0 rounded-[var(--radius-input)] bg-tag px-3 py-[10px] text-[12.5px] leading-[1.5] text-text-secondary">
          {expiresAt
            ? `Active until ${formatExpiry(expiresAt)}. Renew from this screen when it gets close.`
            : "Active, with no expiry date on it."}
        </p>
      ) : (
        <Button onClick={onBuy} loading={busy} disabled={disabled} icon="BadgeCheck" full>
          {`Verify for ${formatNaira(offer.price)}`}
        </Button>
      )}
    </div>
  );
}

/** "14 March 2027". Never a raw ISO string on a screen. */
function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}
