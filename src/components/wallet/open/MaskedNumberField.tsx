"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { digitsOf, groupDigits, maskedNumber, ID_NUMBER_DIGITS } from "@/lib/wallet-opening";

export interface MaskedNumberFieldProps {
  id?: string;
  label: string;
  /** What has been typed: digits for a BVN or NIN, letters, digits and dashes for an ID number. */
  value: string;
  onChange: (value: string) => void;
  /** `digits` is exactly 11 digits (BVN, NIN); `code` is an ID number as printed. */
  kind: "digits" | "code";
  error?: string;
  hint?: string;
}

/**
 * A number the person types once and should not have to see again.
 *
 * While the field has focus it shows what is typed (a BVN in the groups of
 * the design). Once it is whole and the field is left, it shows only the last
 * 4 ("•••• ••• 8901"): the rest is still in the field, never on screen, never
 * in a URL, a cookie or storage, and it is cleared by the form the moment the
 * server has taken it. Focusing the field again shows it so it can be fixed.
 *
 * The browser is told not to remember or offer it (`autoComplete="off"`).
 */
export function MaskedNumberField({ id, label, value, onChange, kind, error, hint }: MaskedNumberFieldProps) {
  const [focused, setFocused] = useState(false);
  const whole = kind === "digits" ? value.length === ID_NUMBER_DIGITS : value.length >= 5;
  const masked = !focused && whole;
  const shown = masked ? maskedNumber(value) : kind === "digits" ? groupDigits(value) : value;
  return (
    <Input
      id={id}
      label={label}
      value={shown}
      onChange={(e) => {
        const typed = e.target.value;
        onChange(kind === "digits" ? digitsOf(typed) : typed.replace(/[^A-Za-z0-9-]/g, "").slice(0, 30));
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      inputMode={kind === "digits" ? "numeric" : "text"}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      error={error}
      hint={hint}
    />
  );
}
