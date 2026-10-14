import { DEFAULT_DIAL_CODE, fullPhoneNumber } from "@/components/ui";
import { CITY_CHOICES, CRAFT_CHOICES } from "./join-content";

/** What the form holds. Lives in component state only; never written to storage. */
export interface JoinFields {
  fullName: string;
  dialCode: string;
  /** The number without the dial code. */
  phone: string;
  email: string;
  /** What the person makes or does: one of CRAFT_CHOICES, "" until chosen. */
  craft: string;
  /** The conference city they will attend: one of CITY_CHOICES, "" until chosen. */
  city: string;
  /** "Send me launch and conference updates ..." (optional). */
  updates: boolean;
  /** The privacy line. Required: the server refuses a registration without it. */
  consent: boolean;
  /** An optional referral code (REF-01): upper case letters and digits; "" when none. The server decides what it is worth. */
  referralCode: string;
}

export const EMPTY_FIELDS: JoinFields = {
  fullName: "",
  dialCode: DEFAULT_DIAL_CODE,
  phone: "",
  email: "",
  craft: "",
  city: "",
  updates: false,
  consent: false,
  referralCode: "",
};

export type JoinFieldName = "fullName" | "phone" | "email" | "craft" | "city" | "consent";
export type JoinErrors = Partial<Record<JoinFieldName, string>>;

/**
 * A Nigerian mobile after the dial code: 10 digits, network prefix 7, 8 or 9
 * and a 0 or 1 next. The same pattern the backend validates with, so a number
 * this form lets through is one it will take.
 */
const NIGERIAN_MOBILE = /^[789][01]\d{8}$/;

/**
 * The digits of the number itself, without the trunk zero and, for Nigeria,
 * without a country code that came with it. People paste what their phone
 * shows: "0803 123 4567", "+234 803 123 4567" or "2348031234567" are the same
 * number. The field has already dropped the plus sign and spaces; a leading
 * "234" (with or without a trunk zero after it) is the country code, because
 * no Nigerian mobile number starts with a 2.
 */
function nationalDigits(phone: string, dialCode: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (dialCode === DEFAULT_DIAL_CODE && /^234\d{10,11}$/.test(digits)) return digits.slice(3).replace(/^0+/, "");
  return digits;
}

export function validateJoin(f: JoinFields): JoinErrors {
  const errors: JoinErrors = {};

  const name = f.fullName.trim();
  if (name.length < 2 || !/\p{L}/u.test(name)) errors.fullName = "Enter your name.";
  else if (name.length > 120) errors.fullName = "That name is too long.";

  const digits = nationalDigits(f.phone, f.dialCode);
  if (f.dialCode === DEFAULT_DIAL_CODE) {
    if (!NIGERIAN_MOBILE.test(digits)) errors.phone = "Enter a Nigerian mobile number, for example 803 123 4567.";
  } else if (digits.length < 6 || digits.length > 14) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) errors.email = "Enter a valid email address.";

  if (!CRAFT_CHOICES.includes(f.craft)) errors.craft = "Choose what you make or do.";
  if (!CITY_CHOICES.includes(f.city)) errors.city = "Choose a city.";

  if (!f.consent) errors.consent = "Tick this box to register.";

  return errors;
}

/** The phone the way the API takes it: dial code plus digits, no zeros in between. */
export function phoneOf(f: JoinFields): string {
  return fullPhoneNumber(f.dialCode, nationalDigits(f.phone, f.dialCode));
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}
