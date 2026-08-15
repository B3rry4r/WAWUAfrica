import type { InputHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { formatNaira } from "@/lib/format";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "children"> {
  label?: string;
  hint?: string;
  hintSize?: string;
  defaultValue?: string;
}

export function Input({ label, hint, style, ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-[8px]">
      {label ? (
        <label className="text-[13px] font-semibold text-[var(--text-secondary)]">
          {label}
        </label>
      ) : null}
      <input
        {...rest}
        className="h-[52px] py-0 px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-input)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-[14.5px] leading-[1.5]" style={{fontFamily: "var(--font-sans)", outline: "none", transition: "border-color var(--dur-base) var(--ease-soft)"}}
      />
      {hint ? (
        <span className="text-[12px] text-[var(--text-muted)] leading-[1.45]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export interface NairaInputProps {
  label?: string;
  value: number;
  onChange?: (value: number) => void;
  presets?: number[];
  hint?: string;
  min?: number;
  max?: number;
}

export function NairaInput({
  label,
  value,
  onChange,
  presets = [500, 1000, 1500, 2500],
  hint,
  min = 100,
  max = 5000,
}: NairaInputProps) {
  const [draft, setDraft] = useState<string>(value > 0 ? String(value) : "");

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw.replace(/\D/g, ""), 10);
    if (Number.isNaN(parsed)) {
      setDraft("");
      onChange?.(0);
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    setDraft(String(clamped));
    onChange?.(clamped);
  };

  return (
    <div className="flex flex-col gap-[12px]">
      {label ? (
        <label className="text-[13px] font-semibold text-[var(--text-secondary)]">
          {label}
        </label>
      ) : null}

      <div
        className="flex items-center h-[56px] py-0 px-[16px] rounded-[var(--radius-input)] bg-[var(--surface-input)] border border-[var(--border-hairline)]"
      >
        <span
          className="text-[17px] font-semibold text-[var(--text-muted)] mr-[8px]"
        >
          ₦
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          placeholder="0"
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
          }}
          className="flex-1 min-w-0 bg-transparent border-[none] text-[var(--text-primary)] text-[17px] font-bold" style={{outline: "none", fontFamily: "var(--font-sans)", fontFeatureSettings: "var(--font-feature-tabular)"}}
        />
      </div>

      {presets.length > 0 ? (
        <div className="flex gap-[8px] flex-wrap">
          {presets.map((p) => {
            const active = p === value;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setDraft(String(p));
                  onChange?.(p);
                }}
                className="h-[32px] py-0 px-[14px] rounded-[999] text-[13px] cursor-pointer" style={{border: active ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", background: active ? "var(--accent-tint)" : "var(--surface-tag)", color: active ? "var(--accent)" : "var(--text-secondary)", fontWeight: active ? 600 : 500, fontFamily: "var(--font-sans)", fontFeatureSettings: "var(--font-feature-tabular)"}}
              >
                {formatNaira(p)}
              </button>
            );
          })}
        </div>
      ) : null}

      {hint ? (
        <span className="text-[12px] text-[var(--text-muted)] leading-[1.45]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
