"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** ₦4.5M / ₦54M / ₦900k style compact naira, per the moodboard's example results. */
function compactNaira(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₦${m >= 100 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

export function EarningsCalculator() {
  const [pro, setPro] = useState(true);
  const [followers, setFollowers] = useState(1000);
  const [price, setPrice] = useState(5000);

  const { monthly, yearly } = useMemo(() => {
    const rate = pro ? 0.9 : 0.85;
    const monthly = followers * price * rate;
    return { monthly, yearly: monthly * 12 };
  }, [pro, followers, price]);

  return (
    <div className="flex flex-col gap-5 rounded-card border border-hairline bg-card p-5 dt:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-[40px] w-[40px] place-items-center rounded-[12px] border border-decor bg-decor-tint">
          <Icon name="Calculator" size={17} color="var(--accent)" strokeWidth={2} />
        </span>
        <span className="flex flex-col">
          <span className="text-[15px] font-semibold text-text-primary">Earnings Calculator</span>
          <span className="text-[12px] text-text-muted">See what you could earn</span>
        </span>
        <div className="ml-auto flex gap-1 rounded-full border border-hairline bg-tag p-1">
          {[
            { label: "85%", active: !pro, on: () => setPro(false) },
            { label: "90%", active: pro, on: () => setPro(true) },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={opt.on}
              className={`h-[28px] rounded-full px-3 text-[12px] font-bold transition-colors ${
                opt.active ? "bg-accent text-on-accent" : "text-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 dt:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-text-secondary">How many followers do you have?</span>
          </div>
          <div className="flex h-[46px] items-center rounded-input border border-hairline bg-input px-3.5 text-[16px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
            {followers.toLocaleString("en-NG")}
          </div>
          <input
            type="range"
            min={100}
            max={50000}
            step={100}
            value={followers}
            onChange={(e) => setFollowers(Number(e.target.value))}
            className="h-5 w-full cursor-pointer [accent-color:var(--accent)]"
            aria-label="How many followers do you have?"
          />
          <div className="flex justify-between text-[10.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
            <span>100</span>
            <span>50K</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-semibold text-text-secondary">Avg Subscription Price</span>
          <div className="flex h-[46px] items-center gap-1.5 rounded-input border border-hairline bg-input px-3.5">
            <span className="text-[14px] text-text-muted">₦</span>
            <span className="text-[16px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
              {price.toLocaleString("en-NG")}
            </span>
            <span className="ml-auto text-[12px] text-text-muted">/mo</span>
          </div>
          <input
            type="range"
            min={500}
            max={20000}
            step={500}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="h-5 w-full cursor-pointer [accent-color:var(--accent)]"
            aria-label="Average subscription price"
          />
          <div className="flex justify-between text-[10.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
            <span>₦500</span>
            <span>₦20,000</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-input border border-hairline bg-elevated p-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Monthly Revenue</span>
          <span className="mt-1 block text-[26px] font-bold tracking-tight text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
            {compactNaira(monthly)}
          </span>
        </div>
        <div className="rounded-input border border-decor bg-decor-tint p-4">
          <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-accent">Yearly Potential</span>
          <span className="mt-1 block text-[26px] font-bold tracking-tight text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
            {compactNaira(yearly)}
          </span>
        </div>
      </div>

      <p className="m-0 border-t border-hairline pt-4 text-[12px] leading-relaxed text-text-muted">
        <span className="font-semibold text-text-secondary">How it works:</span> WAWUAfrica takes 10-15%. You keep 85-90% of
        everything you earn. Best in Africa.
      </p>
    </div>
  );
}
