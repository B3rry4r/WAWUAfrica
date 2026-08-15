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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label ? (
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
          {label}
        </label>
      ) : null}
      <input
        {...rest}
        style={{
          height: 52,
          padding: "0 16px",
          borderRadius: "var(--radius-input)",
          background: "var(--surface-input)",
          border: "1px solid var(--border-hairline)",
          color: "var(--text-primary)",
          fontSize: 14.5,
          fontFamily: "var(--font-sans)",
          lineHeight: 1.5,
          outline: "none",
          transition: "border-color var(--dur-base) var(--ease-soft)",
          ...style,
        }}
      />
      {hint ? (
        <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {label ? (
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
          {label}
        </label>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 56,
          padding: "0 16px",
          borderRadius: "var(--radius-input)",
          background: "var(--surface-input)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "var(--text-muted)",
            marginRight: 8,
          }}
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
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: 17,
            fontWeight: 700,
            fontFamily: "var(--font-sans)",
            fontFeatureSettings: "var(--font-feature-tabular)",
          }}
        />
      </div>

      {presets.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 999,
                  border: active ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
                  background: active ? "var(--accent-tint)" : "var(--surface-tag)",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  fontFamily: "var(--font-sans)",
                  fontFeatureSettings: "var(--font-feature-tabular)",
                  cursor: "pointer",
                }}
              >
                {formatNaira(p)}
              </button>
            );
          })}
        </div>
      ) : null}

      {hint ? (
        <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
