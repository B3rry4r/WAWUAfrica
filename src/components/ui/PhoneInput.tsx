"use client";

import { useId, useMemo } from "react";
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
  /** Id for the number field. The label points at it; a caller can focus it by this id. */
  id?: string;
  /**
   * What is wrong with the number. Drawn under the field, tied to it with
   * `aria-describedby`, and the field reports `aria-invalid`.
   */
  error?: string;
  /** 16px text below the desktop breakpoint, so iPhone Safari does not zoom on focus. Off by default. */
  noZoom?: boolean;
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
  id,
  error,
  noZoom = false,
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const text = noZoom ? "text-[16px] dt:text-[15px]" : "text-[15px]";
  // Several countries share +1, so the option value carries the country too.
  const options = useMemo(
    () => DIAL_CODES.map((d) => ({ ...d, key: `${d.country}|${d.code}` })),
    [],
  );
  const selected = options.find((o) => o.code === dialCode) ?? options[0];

  return (
    <div className="flex flex-col gap-[8px]">
      <label htmlFor={inputId} className="text-[13px] font-semibold text-[var(--text-secondary)]">
        {label}
      </label>
      <div className="flex gap-[8px]">
        <div className="relative shrink-0">
          <select
            aria-label="Country code"
            value={`${selected.country}|${selected.code}`}
            onChange={(e) => onDialCodeChange(e.target.value.split("|")[1])}
            disabled={disabled}
            className={`h-[52px] w-[112px] appearance-none rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] pl-[12px] pr-[26px] font-[var(--font-sans)] ${text} text-[var(--text-primary)]`}
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
          id={inputId}
          type="tel"
          inputMode="tel"
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          /*
            Strip non-digits, and NOTHING ELSE while typing.

            This used to also strip leading zeros on every keystroke. A
            Nigerian number is habitually typed "0803…", so the very first
            character was deleted the instant it was entered and the field
            looked completely dead — you could type and nothing appeared. It
            only became usable if you happened to start with a non-zero digit.

            The zero still has to go, because with a dial code in front of it
            "+234 0803…" is unreachable. That now happens on BLUR, once, when
            the number is finished — see onBlur below.
          */
          onChange={(e) => onValueChange(e.target.value.replace(/[^\d]/g, ""))}
          // Normalise when they are done, not while they are typing.
          onBlur={(e) => {
            const trimmed = e.target.value.replace(/^0+/, "");
            if (trimmed !== e.target.value) onValueChange(trimmed);
          }}
          className={`h-[52px] w-0 min-w-0 flex-1 rounded-[var(--radius-input)] border ${
            error ? "border-danger" : "border-[var(--border-hairline)]"
          } bg-[var(--surface-input)] px-[16px] font-[var(--font-sans)] ${text} text-[var(--text-primary)] placeholder:text-[var(--text-muted)]`}
        />
      </div>
      {error ? (
        <span id={messageId} className="text-[12.5px] text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={messageId} className="text-[12px] text-[var(--text-muted)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/** Joins the two halves into the E.164-ish string an API expects. */
export function fullPhoneNumber(dialCode: string, value: string): string {
  return `${dialCode}${value.replace(/^0+/, "")}`;
}

/**
 * Splits a stored "+2348031234567" back into its two halves.
 *
 * Do NOT do this with `/^\+\d{1,4}/`. That regex is greedy and every dial code
 * here is at most 4 digits, so on "+2348031234567" it matched "+2348" — the
 * dial code PLUS the first digit of the number. Combined with the leading-zero
 * strip on the way in, each keystroke was written and then re-parsed one digit
 * shorter, so the field stayed permanently empty however much you typed. That
 * is the "WhatsApp number field is dead" report.
 *
 * Matching against the KNOWN dial codes, longest first, is the only version
 * that cannot eat a digit: "+1" must not win against "+234" for a Nigerian
 * number, and nothing may match more than a real code.
 */
export function splitPhoneNumber(stored: string): { dialCode: string; value: string } {
  const codes = [...new Set(DIAL_CODES.map((d) => d.code))].sort(
    (a, b) => b.length - a.length,
  );
  const match = codes.find((c) => stored.startsWith(c));
  return match
    ? { dialCode: match, value: stored.slice(match.length) }
    : { dialCode: DEFAULT_DIAL_CODE, value: stored.replace(/^\+/, "") };
}
