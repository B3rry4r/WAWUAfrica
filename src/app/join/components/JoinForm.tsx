"use client";

import { useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { Button, Callout, Checkbox, Icon, Input, PhoneInput, Select, Skeleton } from "@/components/ui";
import type { CalloutTone } from "@/components/ui";
import { CITY_CHOICES, CRAFT_CHOICES } from "./join-content";
import type { JoinErrors, JoinFields } from "./join-fields";

/** What the page tells the person above the form, after something went wrong or was undone. */
export interface FormNotice {
  tone: CalloutTone;
  title?: string;
  text: string;
}

interface JoinFormProps {
  /** The fee as the API sent it ("₦2,000"): drawn on the pay button. */
  price: string;
  fields: JoinFields;
  /** Errors to show. The parent decides which fields have been touched. */
  errors: JoinErrors;
  notice: FormNotice | null;
  submitting: boolean;
  /**
   * Counts the times a submit (or the server) found something to fix. Each
   * count moves focus to the first field that is wrong, so a keyboard or a
   * screen reader lands on the problem instead of staying on the Pay button.
   */
  attempt: number;
  onChange: (patch: Partial<JoinFields>) => void;
  onBlurField: (name: keyof JoinErrors) => void;
  onSubmit: () => void;
}

/** The names a person knows the fields by, in the order they appear. */
const FIELD_LABELS: Array<[keyof JoinErrors, string]> = [
  ["fullName", "Full name"],
  ["phone", "WhatsApp number"],
  ["email", "Email"],
  ["craft", "What you make or do"],
  ["city", "City"],
  ["consent", "Consent"],
];

/**
 * The form: everything a person fills in before they pay (owner's redesign,
 * 12 Oct 2026): name, WhatsApp number, email, what they make or do, the city
 * they will attend, the optional updates box and the privacy line. One column
 * at every width, drawn as a card inside the page's form section.
 *
 * The pay button names the price the API sent. Nothing here is a literal amount.
 *
 * Fields are 16px on phones (`noZoom`), because iPhone Safari zooms the page
 * when a smaller field takes focus.
 */
export function JoinForm({ price, fields, errors, notice, submitting, attempt, onChange, onBlurField, onSubmit }: JoinFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // After a submit that found problems, land on the first one. The errors are
  // drawn in the same render as the new count, so the field is already marked.
  useEffect(() => {
    if (attempt === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!submitting) onSubmit();
  }

  const wrong = FIELD_LABELS.filter(([name]) => errors[name]).map(([, label]) => label);
  const summary =
    attempt > 0 && wrong.length > 0
      ? `${wrong.length === 1 ? "1 field needs" : `${wrong.length} fields need`} fixing: ${wrong.join(", ")}.`
      : "";

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-labelledby="join-form-title"
      className="flex flex-col gap-5 rounded-card border border-hairline bg-page p-5 shadow-card dt:p-7"
    >
      <div className="flex flex-col gap-1">
        <h2 id="join-form-title" className="m-0 text-[24px] font-extrabold tracking-[-0.02em] text-text-primary">
          Reserve my spot
        </h2>
        <p className="m-0 text-[14.5px] text-text-secondary">Takes 30 seconds.</p>
      </div>

      {/* Spoken once when a submit finds problems; the fields carry their own message after that. */}
      <p role="alert" className="sr-only">
        {summary}
      </p>

      {notice ? (
        <Callout tone={notice.tone} title={notice.title} full>
          {notice.text}
        </Callout>
      ) : null}

      <Input
        label="Full name"
        name="fullName"
        autoComplete="name"
        autoCapitalize="words"
        value={fields.fullName}
        onChange={(e) => onChange({ fullName: e.target.value })}
        onBlur={() => onBlurField("fullName")}
        error={errors.fullName}
        maxLength={120}
        disabled={submitting}
        noZoom
      />

      <PhoneInput
        id="phone"
        label="WhatsApp number"
        dialCode={fields.dialCode}
        value={fields.phone}
        onDialCodeChange={(dialCode) => onChange({ dialCode })}
        onValueChange={(phone) => onChange({ phone })}
        error={errors.phone}
        disabled={submitting}
        noZoom
      />

      <Input
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={fields.email}
        onChange={(e) => onChange({ email: e.target.value })}
        onBlur={() => onBlurField("email")}
        error={errors.email}
        maxLength={254}
        disabled={submitting}
        noZoom
      />

      <Select
        label="What do you make or do?"
        name="craft"
        placeholder="Choose one"
        options={CRAFT_CHOICES}
        value={fields.craft}
        onChange={(e) => onChange({ craft: e.target.value })}
        onBlur={() => onBlurField("craft")}
        error={errors.craft}
        disabled={submitting}
        noZoom
      />

      <Select
        label="Which city will you attend?"
        name="city"
        placeholder="Choose one"
        options={CITY_CHOICES}
        value={fields.city}
        onChange={(e) => onChange({ city: e.target.value })}
        onBlur={() => onBlurField("city")}
        error={errors.city}
        disabled={submitting}
        noZoom
      />

      <div className="flex flex-col">
        <Checkbox
          id="updates"
          name="updates"
          checked={fields.updates}
          onChange={(e) => onChange({ updates: e.target.checked })}
          disabled={submitting}
          label="Send me launch and conference updates on WhatsApp and email. I can opt out any time."
        />
        <Checkbox
          id="consent"
          name="consent"
          checked={fields.consent}
          onChange={(e) => onChange({ consent: e.target.checked })}
          error={errors.consent}
          disabled={submitting}
          label="I agree to WAWU contacting me about my registration."
        />
        {/* Its own row, so the tap is a full 44px high and never lands on the box by mistake. */}
        <a
          href="/privacy/policy"
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-[44px] items-center self-start pl-[33px] text-[13.5px] font-semibold text-accent-hover underline underline-offset-2"
        >
          Read the privacy policy
        </a>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" full loading={submitting} icon={submitting ? undefined : "Lock"}>
          {submitting ? "Starting secure payment" : `Pay ${price}`}
        </Button>
        <p className="m-0 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-text-muted">
          <Icon name="ShieldCheck" size={14} />
          Secure payment by Flutterwave: card, bank transfer or USSD.
        </p>
      </div>
    </form>
  );
}

/** The form's first paint, while the open offer is being read. */
export function JoinFormSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex flex-col gap-5 rounded-card border border-hairline bg-page p-5 shadow-card dt:p-7"
    >
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.02em] text-text-primary">Reserve my spot</h2>
        <p className="m-0 text-[14.5px] text-text-secondary">Takes 30 seconds.</p>
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[72px]" aria-hidden="true">
          <Skeleton variant="media" />
        </div>
      ))}
      <div className="h-[56px]" aria-hidden="true">
        <Skeleton variant="media" />
      </div>
    </div>
  );
}
