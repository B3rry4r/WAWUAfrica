"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

/** 6-box OTP entry with auto-advance, matching the auth design. */
export function OtpInput({ length = 6, value, onChange }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const nextIndex = Math.min(value.length, length - 1);
    refs.current[nextIndex]?.focus();
  }, [value, length]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  return (
    <div className="flex justify-center gap-[9px]">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={`Digit ${i + 1}`}
          value={digit}
          maxLength={length}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "");
            const chars = value.split("");
            chars[i] = next.slice(-1) ?? "";
            onChange(chars.join(""));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digit && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (pasted) {
              e.preventDefault();
              onChange(pasted);
            }
          }}
          className={`aspect-[1/1.15] w-[46px] rounded-input border bg-input text-center text-[26px] font-bold outline-none transition-colors [font-feature-settings:var(--font-feature-tabular)] ${
            digit ? "border-strong text-text-primary" : "border-hairline text-text-primary"
          } focus:border-accent focus:shadow-accent`}
        />
      ))}
    </div>
  );
}