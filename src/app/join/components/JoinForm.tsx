"use client";

import type { FormEvent } from "react";
import { Button, Callout, Checkbox, Icon, Input, PhoneInput, Select } from "@/components/ui";
import type { CalloutTone } from "@/components/ui";
import { subdivisionsFor } from "@/lib/geo";
import { MAKES_MAX } from "./join-fields";
import type { JoinErrors, JoinFields } from "./join-fields";

/** What the page tells the person above the form, after something went wrong or was undone. */
export interface FormNotice {
  tone: CalloutTone;
  title?: string;
  text: string;
}


interface JoinFormProps {
  /** The fee as the API sent it ("₦2,000"): it is drawn on the pay button and nowhere else. */
  price: string;
  fields: JoinFields;
  /** Errors to show. The parent decides which fields have been touched. */
  errors: JoinErrors;
  notice: FormNotice | null;
  submitting: boolean;
  onChange: (patch: Partial<JoinFields>) => void;
  onBlurField: (name: keyof JoinErrors) => void;
  onSubmit: () => void;
}

const NIGERIAN_STATES = subdivisionsFor("Nigeria");

/**
 * The form: everything a person at an event fills in before they pay. One
 * column at every width; the page shell caps it, so it is a phone form on a
 * phone and a centred card on a laptop.
 *
 * There is no offer card. The button names the price the API sent and nothing
 * else on the page does. Nothing here is a literal amount.
 */
export function JoinForm({ price, fields, errors, notice, submitting, onChange, onBlurField, onSubmit }: JoinFormProps) {
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!submitting) onSubmit();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-accent-hover">Event registration</span>
        <h1 className="m-0 text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-text-primary dt:text-[44px]">
          Register for WAWU
        </h1>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-card border border-hairline bg-card p-5 dt:p-6">
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
        />

        <div className="flex flex-col gap-2">
          <PhoneInput
            dialCode={fields.dialCode}
            value={fields.phone}
            onDialCodeChange={(dialCode) => onChange({ dialCode })}
            onValueChange={(phone) => onChange({ phone })}
            disabled={submitting}
          />
          {errors.phone ? <span className="text-[12.5px] text-danger">{errors.phone}</span> : null}
        </div>

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
        />

        <Select
          label="State (optional)"
          name="state"
          autoComplete="address-level1"
          placeholder="Choose your state"
          options={NIGERIAN_STATES}
          value={fields.state}
          onChange={(e) => onChange({ state: e.target.value })}
          disabled={submitting}
        />

        <Input
          label="What you make (optional)"
          name="makes"
          placeholder="Music, fashion, photography"
          value={fields.makes}
          onChange={(e) => onChange({ makes: e.target.value })}
          maxLength={MAKES_MAX}
          disabled={submitting}
        />

        <Checkbox
          name="consent"
          checked={fields.consent}
          onChange={(e) => onChange({ consent: e.target.checked })}
          error={errors.consent}
          disabled={submitting}
          label={
            <>
              I agree to WAWU contacting me about my registration. Read the{" "}
              <a href="/privacy/policy" target="_blank" rel="noopener" className="font-semibold">
                privacy policy
              </a>
              .
            </>
          }
        />

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
    </div>
  );
}
