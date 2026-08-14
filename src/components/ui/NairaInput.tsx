"use client";
import { Input, type InputProps } from "./Input";

/**
 * Money is always an integer number of Naira. This never emits floats and never
 * formats — formatting is formatNaira()'s job at render time.
 */
export interface NairaInputProps extends Omit<InputProps, "value" | "onChange" | "type"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
}

export function NairaInput({ value, onValueChange, ...rest }: NairaInputProps) {
  return (
    <Input
      {...rest}
      inputMode="numeric"
      value={value ?? ""}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onValueChange(digits === "" ? null : parseInt(digits, 10));
      }}
    />
  );
}
