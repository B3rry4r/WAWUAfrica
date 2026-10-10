"use client";

import { useMemo, useState } from "react";
import { Button, Callout, ChoiceChips, Icon, Input, Select } from "@/components/ui";
import { describeError } from "@/lib/api/errors";
import { openWallet, reasonCodeOf, retryAfterOf } from "@/lib/api/money";
import type { MoneyWallet, WalletReviewReason } from "@/lib/api/money";
import { COUNTRIES, subdivisionsFor } from "@/lib/geo";
import {
  detailsProblems,
  EMPTY_DETAILS,
  GENDERS,
  ID_TYPES,
  openRefusalWords,
  PROOF_OF_ADDRESS_TYPES,
  toOpenInput,
} from "@/lib/wallet-opening";
import type { DetailsForm, DetailsProblems } from "@/lib/wallet-opening";
import { MaskedNumberField } from "./MaskedNumberField";
import { StepFrame } from "./StepFrame";

/** What is shown instead of the form when a wallet can't be opened for this person yet. */
type Blocked = "country" | "no_bvn" | "phone";

const BLOCKED_WORDS: Record<Blocked, string> = {
  country: "Wallets for people outside Nigeria are not available yet.",
  no_bvn: "A naira wallet needs a Nigerian BVN. Wallets for people without one are not available yet.",
  phone: "A wallet needs a Nigerian phone number on your account. Wallets for people outside Nigeria are not available yet.",
};

const CARD =
  "flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] xl:p-[20px]";
const GRID = "grid grid-cols-1 gap-[14px] xl:grid-cols-2";

const FIELD_ORDER: Array<keyof DetailsForm> = [
  "firstName",
  "middleName",
  "lastName",
  "dateOfBirth",
  "gender",
  "address",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "bvn",
  "nin",
  "idType",
  "idNumber",
  "idIssueDate",
  "idExpiryDate",
  "proofOfAddressType",
];

export interface DetailsStepProps {
  /** Entries kept from an earlier send in this visit, never a number: a correction starts from them. */
  initial?: DetailsForm;
  /** What the review said to fix, when this is a correction. */
  reasons?: WalletReviewReason[] | null;
  /** The server took the details. `kept` is the form with every number cleared. */
  onSent: (wallet: MoneyWallet, kept: DetailsForm) => void;
  /** Leave the opening (the person can't open a wallet here yet). */
  onLeave: () => void;
}

/**
 * Step 1, "Who you are": the person, where they live, and the numbers and
 * documents the review checks them against.
 *
 * The country comes first. A person outside Nigeria is shown what they will
 * find instead and is never asked for a BVN or NIN: those fields are not
 * drawn for them at all. The numbers (BVN, NIN, ID number) live only in this
 * form's state, show only their last 4 once typed, go to the server in the one
 * call that sends them and are cleared the moment it answers.
 */
export function DetailsStep({ initial = EMPTY_DETAILS, reasons = null, onSent, onLeave }: DetailsStepProps) {
  const [form, setForm] = useState<DetailsForm>(initial);
  const [country, setCountry] = useState("Nigeria");
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [problems, setProblems] = useState<DetailsProblems>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ title: string; body: string; support?: boolean } | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const states = useMemo(() => subdivisionsFor("Nigeria"), []);

  const set = <K extends keyof DetailsForm>(key: K, value: DetailsForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setProblems((p) => (p[key] ? { ...p, [key]: undefined } : p));
  };

  const closed: Blocked | null = blocked ?? (country !== "Nigeria" ? "country" : null);

  const send = async () => {
    if (submitting) return;
    const found = detailsProblems(form);
    if (Object.values(found).some(Boolean)) {
      setProblems(found);
      const first = FIELD_ORDER.find((k) => found[k]);
      if (first) {
        const el = document.getElementById(`open-${first}`);
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.focus({ preventScroll: true });
      }
      return;
    }
    setSubmitting(true);
    setBanner(null);
    try {
      const wallet = await openWallet(toOpenInput(form));
      // The server has them; nothing here keeps a number.
      const kept: DetailsForm = { ...form, bvn: "", nin: "", idNumber: "", idIssueDate: "", idExpiryDate: "" };
      setForm(kept);
      onSent(wallet, kept);
    } catch (e) {
      const code = reasonCodeOf(e);
      if (code === "phone_not_nigerian") {
        setBlocked("phone");
      } else {
        const words = openRefusalWords(code, retryAfterOf(e));
        if (words) setBanner(words);
        else {
          const d = describeError(e);
          setBanner({ title: d.kind === "rejected" ? "Check your details" : d.title, body: d.body });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const title = reasons ? "Correct your details" : "Who you are";

  return (
    <StepFrame
      stickyFooter={!closed}
      footer={
        closed ? (
          <>
            <Button full size="lg" onClick={onLeave}>
              Done
            </Button>
            {closed === "no_bvn" ? (
              <Button full variant="ghost" onClick={() => setBlocked(null)}>
                I do have a Nigerian BVN
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button full size="lg" iconRight="ArrowRight" loading={submitting} onClick={() => void send()}>
              Continue
            </Button>
            <Button full variant="ghost" disabled={submitting} onClick={() => setBlocked("no_bvn")}>
              I don&apos;t have a Nigerian BVN
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-[8px]">
        <h2 className="m-0 text-[24px] font-bold tracking-[-0.025em]">{title}</h2>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
          {reasons
            ? "Fix what is listed below, then send your details again."
            : "We check these against your BVN, NIN and documents. Use your name as it is on your ID."}
        </p>
      </div>

      {reasons && reasons.length > 0 ? (
        <Callout tone="warning" title="What to fix" full>
          <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
            {reasons.map((r) => (
              <li key={r.code}>
                {r.message} {r.fix}
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}

      {banner ? (
        <Callout tone="danger" title={banner.title} full>
          {banner.body}
          {banner.support ? (
            <span className="mt-[10px] block">
              <Button size="sm" variant="secondary" href="mailto:support@wawuafrica.com">
                Contact support
              </Button>
            </span>
          ) : null}
        </Callout>
      ) : null}

      <Select
        id="open-country"
        label="Country"
        value={country}
        onChange={(e) => {
          setCountry(e.target.value);
          setBlocked(null);
        }}
        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
      />

      {closed ? (
        <div
          role="status"
          className="flex flex-col items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-[20px] py-[32px] text-center"
        >
          <span className="grid h-[56px] w-[56px] place-items-center rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)]">
            <Icon name="Globe" size={24} color="var(--decor-icon)" />
          </span>
          <h3 className="m-0 text-[18px] font-semibold">Not available yet</h3>
          <p className="m-0 max-w-[36ch] text-[14px] leading-[1.5] text-[var(--text-secondary)]">{BLOCKED_WORDS[closed]}</p>
        </div>
      ) : (
        <>
          <section className={CARD} aria-labelledby="open-about">
            <h3 id="open-about" className="m-0 text-[15px] font-semibold">
              About you
            </h3>
            <div className={GRID}>
              <Input id="open-firstName" label="First name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} error={problems.firstName} autoComplete="given-name" />
              <Input id="open-middleName" label="Middle name (if you have one)" value={form.middleName} onChange={(e) => set("middleName", e.target.value)} error={problems.middleName} autoComplete="additional-name" />
              <Input id="open-lastName" label="Last name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} error={problems.lastName} autoComplete="family-name" />
              <Input id="open-dateOfBirth" label="Date of birth" type="date" max={today} value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} error={problems.dateOfBirth} autoComplete="bday" />
            </div>
            <div className="flex flex-col gap-[8px]">
              <span id="open-gender" tabIndex={-1} className="text-[13px] font-semibold text-[var(--text-secondary)] outline-none">
                Gender
              </span>
              <ChoiceChips
                ariaLabel="Gender"
                options={GENDERS}
                value={form.gender || null}
                onSelect={(v) => set("gender", v)}
              />
              {problems.gender ? <span className="text-[12.5px] text-danger">{problems.gender}</span> : null}
            </div>
          </section>

          <section className={CARD} aria-labelledby="open-home">
            <h3 id="open-home" className="m-0 text-[15px] font-semibold">
              Where you live
            </h3>
            <div className={GRID}>
              <Input id="open-address" label="Street address" value={form.address} onChange={(e) => set("address", e.target.value)} error={problems.address} autoComplete="address-line1" />
              <Input id="open-addressLine2" label="Flat, estate or landmark (optional)" value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} error={problems.addressLine2} autoComplete="address-line2" />
              <Input id="open-city" label="City or town" value={form.city} onChange={(e) => set("city", e.target.value)} error={problems.city} autoComplete="address-level2" />
              <Select
                id="open-state"
                label="State"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                error={problems.state}
                placeholder="Choose your state"
                options={states.map((s) => ({ value: s, label: s }))}
              />
              <Input id="open-postalCode" label="Postal code" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} error={problems.postalCode} autoComplete="postal-code" />
            </div>
          </section>

          <section className={CARD} aria-labelledby="open-ids">
            <h3 id="open-ids" className="m-0 text-[15px] font-semibold">
              Your numbers and ID
            </h3>
            <div className={GRID}>
              <MaskedNumberField id="open-bvn" label="BVN" kind="digits" value={form.bvn} onChange={(v) => set("bvn", v)} error={problems.bvn} hint="11 digits. Only the last 4 show once you have typed it." />
              <MaskedNumberField id="open-nin" label="NIN" kind="digits" value={form.nin} onChange={(v) => set("nin", v)} error={problems.nin} hint="11 digits. Only the last 4 show once you have typed it." />
            </div>
            <div className="flex flex-col gap-[8px]">
              <span id="open-idType" tabIndex={-1} className="text-[13px] font-semibold text-[var(--text-secondary)] outline-none">
                The ID you will upload
              </span>
              <ChoiceChips ariaLabel="The ID you will upload" options={ID_TYPES} value={form.idType || null} onSelect={(v) => set("idType", v)} />
              {problems.idType ? <span className="text-[12.5px] text-danger">{problems.idType}</span> : null}
            </div>
            <div className={GRID}>
              <MaskedNumberField id="open-idNumber" label="Number on that ID" kind="code" value={form.idNumber} onChange={(v) => set("idNumber", v)} error={problems.idNumber} hint="As printed on it." />
              <span className="hidden xl:block" aria-hidden="true" />
              <Input id="open-idIssueDate" label="Issued on (optional)" type="date" max={today} value={form.idIssueDate} onChange={(e) => set("idIssueDate", e.target.value)} error={problems.idIssueDate} />
              <Input id="open-idExpiryDate" label="Expires on (optional)" type="date" min={today} value={form.idExpiryDate} onChange={(e) => set("idExpiryDate", e.target.value)} error={problems.idExpiryDate} />
            </div>
            <div className="flex flex-col gap-[8px]">
              <span id="open-proofOfAddressType" tabIndex={-1} className="text-[13px] font-semibold text-[var(--text-secondary)] outline-none">
                Proof of your address
              </span>
              <ChoiceChips
                ariaLabel="Proof of your address"
                options={PROOF_OF_ADDRESS_TYPES}
                value={form.proofOfAddressType || null}
                onSelect={(v) => set("proofOfAddressType", v)}
              />
              {problems.proofOfAddressType ? <span className="text-[12.5px] text-danger">{problems.proofOfAddressType}</span> : null}
            </div>
          </section>

          <div className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
            <Icon name="ShieldCheck" size={16} color="var(--text-muted)" className="mt-[1px]" />
            <span className="flex-1 text-[13px] leading-[1.5] text-[var(--text-secondary)]">
              Used to check who you are, and nothing else. Never shown on your profile.
            </span>
          </div>
        </>
      )}
    </StepFrame>
  );
}
