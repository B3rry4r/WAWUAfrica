"use client";

import { useMemo, useState } from "react";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const PRESETS = [500, 1000, 2500, 5000];

export function EarningsCalculator() {
  const [pro, setPro] = useState(false);
  const [fans, setFans] = useState(5000);
  const [price, setPrice] = useState(2500);

  const { monthly, yearly, keepPct } = useMemo(() => {
    const rate = pro ? 0.9 : 0.85;
    const monthly = fans * 0.05 * (price || 0) * rate;
    return { monthly, yearly: monthly * 12, keepPct: pro ? "90%" : "85%" };
  }, [pro, fans, price]);

  return (
    <div className="flex flex-col gap-[22px] rounded-card border border-hairline bg-card p-5">
      <div className="flex gap-1 rounded-full border border-hairline bg-tag p-1">
        {[
          { label: "Standard", active: !pro, on: () => setPro(false) },
          { label: "Pro creator", active: pro, on: () => setPro(true) },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={opt.on}
            className={`h-[38px] flex-1 rounded-full text-[13.5px] font-semibold transition-colors ${
              opt.active ? "bg-accent text-on-accent" : "text-text-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-semibold text-text-secondary">How many followers do you have?</span>
          <span className="text-[17px] font-bold [font-feature-settings:var(--font-feature-tabular)]">
            {fans.toLocaleString("en-NG")}
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={50000}
          step={100}
          value={fans}
          onChange={(e) => setFans(Number(e.target.value))}
          className="h-6 w-full cursor-pointer [accent-color:var(--accent)]"
          aria-label="Followers"
        />
        <div className="flex justify-between text-[11.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
          <span>100</span>
          <span>50,000</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-text-secondary">Average price per piece</span>
        <div className="flex h-[52px] items-center gap-3 rounded-input border border-hairline bg-input px-4">
          <span className="text-[15px] text-text-muted">₦</span>
          <input
            type="number"
            min={100}
            max={5000}
            value={price}
            onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
            className="w-full bg-transparent text-[15px] font-semibold text-text-primary outline-none [font-feature-settings:var(--font-feature-tabular)]"
            aria-label="Average price per piece"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrice(p)}
              className={`h-[28px] rounded-full border px-3 text-[12px] font-semibold ${
                price === p
                  ? "border-accent bg-accent-tint text-accent-hover"
                  : "border-hairline bg-tag text-text-secondary"
              }`}
            >
              {formatNaira(p)}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-text-muted">Content prices run from ₦100 to ₦5,000.</p>
      </div>

      <div className="flex gap-3 border-t border-hairline pt-[18px]">
        <div className="flex-1 rounded-input border border-hairline bg-elevated p-4">
          <div className="flex flex-col gap-1">
            <span className="text-[22px] font-bold tracking-tight text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
              {formatNaira(monthly)}
            </span>
            <span className="text-[12.5px] text-text-muted">A month</span>
          </div>
        </div>
        <div className="flex-1 rounded-input border border-accent bg-accent-tint p-4">
          <div className="flex flex-col gap-1">
            <span className="text-[22px] font-bold tracking-tight text-accent-hover [font-feature-settings:var(--font-feature-tabular)]">
              {formatNaira(yearly)}
            </span>
            <span className="text-[12.5px] text-text-muted">A year</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold">
          <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
          You keep {keepPct} of every naira
        </span>
        <span className="flex items-center gap-2 text-[13.5px] font-semibold">
          <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
          No hidden fees — the split is the only cost
        </span>
        <p className="text-[12px] leading-relaxed text-text-muted">
          Estimate only. Assumes 5 in every 100 followers unlock one piece a month. Standard split is 85/15; Pro-tier creators keep 90%.
        </p>
      </div>
    </div>
  );
}