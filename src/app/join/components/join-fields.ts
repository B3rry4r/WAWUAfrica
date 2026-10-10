import { DEFAULT_DIAL_CODE, fullPhoneNumber } from "@/components/ui";

/** What the form holds. Lives in component state only; never written to storage. */
export interface JoinFields {
  fullName: string;
  dialCode: string;
  /** The number without the dial code. */
  phone: string;
  email: string;
  state: string;
  makes: string;
  consent: boolean;
}

export const EMPTY_FIELDS: JoinFields = {
  fullName: "",
  dialCode: DEFAULT_DIAL_CODE,
  phone: "",
  email: "",
  state: "",
  makes: "",
  consent: false,
};

export type JoinFieldName = "fullName" | "phone" | "email" | "consent";
export type JoinErrors = Partial<Record<JoinFieldName, string>>;

/** The longest "what you make" the backend takes. */
export const MAKES_MAX = 60;

/**
 * A Nigerian mobile after the dial code: 10 digits, network prefix 7, 8 or 9
 * and a 0 or 1 next. The same pattern the backend validates with, so a number
 * this form lets through is one it will take.
 */
const NIGERIAN_MOBILE = /^[789][01]\d{8}$/;

function nationalDigits(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0+/, "");
}

export function validateJoin(f: JoinFields): JoinErrors {
  const errors: JoinErrors = {};

  const name = f.fullName.trim();
  if (name.length < 2 || !/\p{L}/u.test(name)) errors.fullName = "Enter your name.";
  else if (name.length > 120) errors.fullName = "That name is too long.";

  const digits = nationalDigits(f.phone);
  if (f.dialCode === DEFAULT_DIAL_CODE) {
    if (!NIGERIAN_MOBILE.test(digits)) errors.phone = "Enter a Nigerian mobile number, for example 803 123 4567.";
  } else if (digits.length < 6 || digits.length > 14) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) errors.email = "Enter a valid email address.";

  if (!f.consent) errors.consent = "Tick this box to register.";

  return errors;
}

/** The phone the way the API takes it: dial code plus digits, no zeros in between. */
export function phoneOf(f: JoinFields): string {
  return fullPhoneNumber(f.dialCode, nationalDigits(f.phone));
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}
