"use client";

import { useMemo } from "react";
import { Icon } from "./Icon";

/**
 * Dial codes WAWU collects numbers for. Nigeria first because that is where
 * most people are; the rest alphabetically.
 */
export const DIAL_CODES: { country: string; code: string; flag: string }[] = [
  { country: "Nigeria", code: "+234", flag: "🇳🇬" },
  { country: "Benin", code: "+229", flag: "🇧🇯" },
  { country: "Cameroon", code: "+237", flag: "🇨🇲" },
  { country: "Canada", code: "+1", flag: "🇨🇦" },
  { country: "Côte d'Ivoire", code: "+225", flag: "🇨🇮" },
  { country: "Egypt", code: "+20", flag: "🇪🇬" },
  { country: "Ethiopia", code: "+251", flag: "🇪🇹" },
  { country: "Ghana", code: "+233", flag: "🇬🇭" },
  { country: "Kenya", code: "+254", flag: "🇰🇪" },
  { country: "Liberia", code: "+231", flag: "🇱🇷" },
  { country: "Morocco", code: "+212", flag: "🇲🇦" },
  { country: "Rwanda", code: "+250", flag: "🇷🇼" },
  { country: "Senegal", code: "+221", flag: "🇸🇳" },
  { country: "Sierra Leone", code: "+232", flag: "🇸🇱" },
  { country: "South Africa", code: "+27", flag: "🇿🇦" },
  { country: "Tanzania", code: "+255", flag: "🇹🇿" },
  { country: "Togo", code: "+228", flag: "🇹🇬" },
  { country: "Uganda", code: "+256", flag: "🇺🇬" },
  { country: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { country: "United States", code: "+1", flag: "🇺🇸" },
  { country: "Zambia", code: "+260", flag: "🇿🇲" },
  { country: "Zimbabwe", code: "+263", flag: "🇿🇼" },
];

export const DEFAULT_DIAL_CODE = "+234";

interface PhoneInputProps {
  label?: string;
  /** The dial code, e.g. "+234". */
  dialCode: string;
  /** The number without the dial code. */
  value: string;
  onDialCodeChange: (code: string) => void;
  onValueChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A phone field with the country's dial code picked separately from the
 * number.
 *
 * Numbers used to be typed into a plain text box, which quietly assumed
 * Nigeria: anyone else had to know to type their own country code, and
 * nothing said so. The two halves are stored separately so a caller can send
 * whichever shape its API wants.
 */
export function PhoneInput({
  label = "Phone number",
  dialCode,
  value,
  onDialCodeChange,
  onValueChange,
  hint,
  placeholder = "801 234 5678",
  disabled,
}: PhoneInputProps) {
  // Several countries share +1, so the option value carries the country too.
  const options = useMemo(
    () => DIAL_CODES.map((d) => ({ ...d, key: `${d.country}|${d.code}` })),
    [],
  );
  const selected = options.find((o) => o.code === dialCode) ?? options[0];

  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{label}</span>
      <div className="flex gap-[8px]">
        <div className="relative shrink-0">
          <select
            aria-label="Country code"
            value={`${selected.country}|${selected.code}`}
            onChange={(e) => onDialCodeChange(e.target.value.split("|")[1])}
            disabled={disabled}
            className="h-[52px] w-[112px] appearance-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] pl-[12px] pr-[26px] font-[var(--font-sans)] text-[15px] text-[var(--text-primary)]"
          >
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.flag} {o.code}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDown"
            size={15}
            strokeWidth={2.2}
            color="var(--text-muted)"
            className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2"
          />
        </div>
        <input
          type="tel"
          inputMode="tel"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          // Leading zeros are a local-format habit; with a dial code in front
          // they would produce an unreachable number.
          onChange={(e) => onValueChange(e.target.value.replace(/[^\d]/g, "").replace(/^0+/, ""))}
          className="h-[52px] min-w-0 flex-1 rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] font-[var(--font-sans)] text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>
      {hint ? <span className="text-[12px] text-[var(--text-muted)]">{hint}</span> : null}
    </div>
  );
}

/** Joins the two halves into the E.164-ish string an API expects. */
export function fullPhoneNumber(dialCode: string, value: string): string {
  return `${dialCode}${value.replace(/^0+/, "")}`;
}
