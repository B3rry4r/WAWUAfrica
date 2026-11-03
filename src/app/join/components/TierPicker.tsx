"use client";

import { Icon } from "@/components/ui";
import { formatNairaFromKobo } from "@/lib/format";
import type { ReferralVerdict } from "@/lib/join-referral";
import { periodOf, tierItems } from "@/lib/join-tiers";
import type { WaitlistTier } from "@/lib/join-tiers";
import { SlashedPrice } from "./SlashedPrice";

interface TierPickerProps {
  /** The plans, in the app's order; `null` while they load. */
  tiers: readonly WaitlistTier[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** What the Hub said about the code for the SELECTED plan. */
  verdict: ReferralVerdict;
  disabled?: boolean;
}

/**
 * The three plans (JOIN-TIERS, R-125): the app's own tier cards. Name, price and
 * "a year", then one line with a check for each thing the plan gives (length,
 * products, points, event pass, numbered badge, pack bonus: the app's words).
 * The Hub's "Best" plan carries the chip and is the one the page starts on.
 *
 * A referral code changes only the selected card, and only when the Hub says it
 * applies to that plan: the plan's price is struck through and the code's price
 * beside it. On another plan the Hub's own sentence says why (reason other_tier).
 */
export function TierPicker({ tiers, selectedId, onSelect, verdict, disabled = false }: TierPickerProps) {
  if (!tiers) {
    return (
      <div aria-busy="true" className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} aria-hidden="true" className="h-[210px] animate-pulse rounded-card border border-hairline bg-tag" />
        ))}
      </div>
    );
  }
  return (
    <div role="radiogroup" aria-label="Choose your plan" className="grid gap-3">
      {tiers.map((tier) => {
        const selected = tier.id === selectedId;
        const full = formatNairaFromKobo(tier.priceKobo);
        const codeApplies = selected && verdict.kind === "applies";
        const items = tierItems(tier);
        return (
          <button
            key={tier.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            data-tier={tier.id}
            onClick={() => onSelect(tier.id)}
            className={`flex w-full flex-col gap-3 rounded-card border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-70 dt:p-5 ${
              selected ? "border-accent bg-accent-tint" : "border-hairline bg-card hover:border-strong"
            }`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-2 ${
                    selected ? "border-accent bg-accent text-on-accent" : "border-strong"
                  }`}
                >
                  {selected ? <Icon name="Check" size={13} strokeWidth={3} /> : null}
                </span>
                <span className="text-[19px] font-extrabold leading-tight tracking-[-0.01em] text-text-primary">{tier.name}</span>
                {tier.best ? (
                  <span className="inline-flex h-[22px] flex-none items-center rounded-full bg-accent px-2.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-on-accent">
                    Best
                  </span>
                ) : null}
              </span>
              <span className="flex flex-none flex-col items-end text-right">
                {codeApplies ? (
                  <SlashedPrice price={formatNairaFromKobo(verdict.priceKobo)} was={full} className="text-[22px] text-text-primary" />
                ) : (
                  <span className="text-[22px] font-extrabold leading-none tracking-[-0.02em] text-text-primary">{full}</span>
                )}
                <span className="mt-1 text-[12.5px] text-text-secondary">{periodOf(tier.days)}</span>
              </span>
            </span>
            <ul className="m-0 grid list-none gap-1.5 p-0">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[14.5px] leading-[1.35] text-text-primary">
                  <Icon name="Check" size={15} strokeWidth={2.6} className="mt-[2px] flex-none text-accent-soft" />
                  {item}
                </li>
              ))}
            </ul>
            {selected && verdict.kind === "notApplied" && verdict.reason === "other_tier" ? (
              <span role="status" className="flex items-start gap-1.5 text-[13.5px] font-semibold leading-[1.4] text-warning">
                <Icon name="CircleAlert" size={16} className="mt-[1px] flex-none" />
                {verdict.message ?? `The ${verdict.code} code is for another plan. ${tier.name} is full price.`}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
