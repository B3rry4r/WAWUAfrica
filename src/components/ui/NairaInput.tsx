"use client";
import { Input, type InputProps } from "./Input";
import { formatNaira } from "@/lib/format";

/**
 * Money is always an integer number of Naira. This never emits floats and never
 * formats the field itself — formatNaira() does that at render time.
 *
 * `presets` renders one-tap amounts above the field (tip sheet, DM pricing).
 * Both `onValueChange` and `onChange` are accepted; they do the same thing.
 */
export interface NairaInputProps
  extends Omit<InputProps, "value" | "onChange" | "type"> {
  value: number | null;
  onValueChange?: (value: number | null) => void;
  onChange?: (value: number) => void;
  /** One-tap amounts in integer Naira. */
  presets?: readonly number[];
}

export function NairaInput({
  value,
  onValueChange,
  onChange,
  presets,
  ...rest
}: NairaInputProps) {
  const emit = (next: number | null) => {
    onValueChange?.(next);
    onChange?.(next ?? 0);
  };

  return (
    <div className="flex flex-col gap-2">
      {presets && presets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => emit(p)}
              className={[
                "h-9 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                value === p
                  ? "border-[var(--border-accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                  : "border-hairline bg-card text-text-secondary",
              ].join(" ")}
            >
              {formatNaira(p)}
            </button>
          ))}
        </div>
      ) : null}
      <Input
        {...rest}
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          emit(digits === "" ? null : parseInt(digits, 10));
        }}
      />
    </div>
  );
}
