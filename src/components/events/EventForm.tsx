"use client";

import { useState } from "react";
import Link from "next/link";
import { createEvent, updateEvent } from "@/lib/api/events";
import { describeError } from "@/lib/api/errors";
import { useSession } from "@/lib/auth/session-provider";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/event-date";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABEL,
  EVENT_FORMAT_LABEL,
  EVENT_FORMATS,
  EVENT_TIMEZONES,
  EVENT_TYPE_LABEL,
  EVENT_TYPES,
  type EventCategory,
  type EventDraft,
  type EventFormat,
  type EventSpeakerDraft,
  type EventType,
  type WawuEvent,
} from "@/types/events";
import { Button, FilePicker, Icon, Input, PhoneInput, fullPhoneNumber, splitPhoneNumber } from "@/components/ui";

/**
 * Submit an event, or edit one you already submitted.
 *
 * ── OPEN TO EVERY SIGNED-IN ACCOUNT ──────────────────────────────────────────
 * There is no creator gate on this form and there must not be one. An event
 * costs no upload slot and earns nobody anything, so there is nothing for a
 * paid subscription to unlock — the moderation queue is the gate. Do not wrap
 * this in `creatorGates()`.
 *
 * ── STILL NO MONEY FIELDS, FOR A DIFFERENT REASON NOW ────────────────────────
 * Tickets exist (29 Aug 2026), but they are NOT set up here. This form runs
 * before an admin has approved anything, and a price on an event nobody can
 * attend yet is a price on nothing. Ticket tiers are set at
 * /events/[id]/tickets, after approval, where the organiser can also see what
 * has already sold — which is the thing that decides whether a tier may still
 * be edited.
 *
 * ── REVIEW IS SAID OUT LOUD ──────────────────────────────────────────────────
 * Every submission lands `pending`, and every edit to an already-approved
 * event sends it back to `pending`. Both are stated in the copy before the
 * button, not discovered afterwards.
 */

const LIMITS = {
  name: 160,
  description: 5000,
  hostOrg: 160,
  hostOrgBio: 1000,
  timeLabel: 40,
  timezone: 40,
  location: 160,
  address: 300,
  externalUrl: 500,
  bannerUrl: 500,
  contactEmail: 200,
  contactPhone: 40,
  speakerName: 120,
  speakerTitle: 160,
  speakers: 20,
} as const;

interface EventFormProps {
  mode: "create" | "edit";
  /** The event being edited. Required for `mode: "edit"`. */
  event?: WawuEvent;
}

interface FormState {
  name: string;
  description: string;
  hostOrg: string;
  hostOrgBio: string;
  format: EventFormat;
  type: EventType;
  startsAtLocal: string;
  endsAtLocal: string;
  timeLabel: string;
  timezone: string;
  location: string;
  address: string;
  externalUrl: string;
  bannerUrl: string;
  category: EventCategory;
  contactEmail: string;
  /** Split so the field can offer a real country-code dropdown; joined back into one string in toDraft. */
  contactPhoneDialCode: string;
  contactPhoneValue: string;
  speakers: EventSpeakerDraft[];
}

function initialState(event?: WawuEvent): FormState {
  const contactPhone = splitPhoneNumber(event?.contactPhone ?? "");
  return {
    name: event?.name ?? "",
    description: event?.description ?? "",
    hostOrg: event?.hostOrg ?? "",
    hostOrgBio: event?.hostOrgBio ?? "",
    format: event?.format ?? "in_person",
    type: event?.type ?? "workshop",
    startsAtLocal: toLocalInputValue(event?.startsAt),
    endsAtLocal: toLocalInputValue(event?.endsAt),
    timeLabel: event?.timeLabel ?? "",
    // WAT is the zone of the country this app serves; a host running something
    // elsewhere overwrites it.
    timezone: event?.timezone ?? "WAT",
    location: event?.location ?? "",
    address: event?.address ?? "",
    externalUrl: event?.externalUrl ?? "",
    bannerUrl: event?.bannerUrl ?? "",
    // `other` rather than the first category: guessing a category for someone
    // puts wrong events in front of people browsing by it.
    category: event?.category ?? "other",
    contactEmail: event?.contactEmail ?? "",
    contactPhoneDialCode: contactPhone.dialCode,
    contactPhoneValue: contactPhone.value,
    speakers: (event?.speakers ?? []).map((s) => ({
      name: s.name,
      title: s.title ?? "",
      ...(s.photoUrl ? { photoUrl: s.photoUrl } : {}),
    })),
  };
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name.trim()) errors.name = "Give the event a name.";
  if (!form.description.trim()) errors.description = "Say what happens at it.";
  if (!form.hostOrg.trim()) errors.hostOrg = "Say who is running it.";
  if (!form.location.trim()) {
    errors.location = form.format === "online" ? "Say where it runs, e.g. Zoom." : "Name the venue or the city.";
  }
  if (!form.startsAtLocal) errors.startsAtLocal = "Pick a start date and time.";
  if (form.startsAtLocal && form.endsAtLocal) {
    if (new Date(form.endsAtLocal).getTime() < new Date(form.startsAtLocal).getTime()) {
      errors.endsAtLocal = "The end has to come after the start.";
    }
  }
  if (form.externalUrl.trim() && !/^https?:\/\/\S+$/i.test(form.externalUrl.trim())) {
    errors.externalUrl = "Include the full address, starting with https://";
  }
  if (form.bannerUrl.trim() && !/^https?:\/\/\S+$/i.test(form.bannerUrl.trim())) {
    errors.bannerUrl = "Include the full address, starting with https://";
  }
  if (form.contactEmail.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contactEmail.trim())) {
    errors.contactEmail = "That does not look like an email address.";
  }
  if (form.speakers.some((s) => !s.name.trim())) errors.speakers = "Every speaker needs a name, or remove the row.";
  return errors;
}

/** Trims, drops the empties, and never sends a field the DTO does not declare. */
function toDraft(form: FormState): EventDraft {
  const speakers = form.speakers
    .filter((s) => s.name.trim())
    .map((s, i) => ({
      name: s.name.trim(),
      ...(s.title?.trim() ? { title: s.title.trim() } : {}),
      ...(s.photoUrl ? { photoUrl: s.photoUrl } : {}),
      order: i,
    }));
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    hostOrg: form.hostOrg.trim(),
    ...(form.hostOrgBio.trim() ? { hostOrgBio: form.hostOrgBio.trim() } : {}),
    format: form.format,
    type: form.type,
    startsAt: fromLocalInputValue(form.startsAtLocal),
    ...(form.endsAtLocal ? { endsAt: fromLocalInputValue(form.endsAtLocal) } : {}),
    ...(form.timeLabel.trim() ? { timeLabel: form.timeLabel.trim() } : {}),
    ...(form.timezone.trim() ? { timezone: form.timezone.trim() } : {}),
    location: form.location.trim(),
    ...(form.address.trim() ? { address: form.address.trim() } : {}),
    ...(form.externalUrl.trim() ? { externalUrl: form.externalUrl.trim() } : {}),
    ...(form.bannerUrl.trim() ? { bannerUrl: form.bannerUrl.trim() } : {}),
    category: form.category,
    ...(form.contactEmail.trim() ? { contactEmail: form.contactEmail.trim() } : {}),
    ...(form.contactPhoneValue.trim()
      ? { contactPhone: fullPhoneNumber(form.contactPhoneDialCode, form.contactPhoneValue.trim()) }
      : {}),
    speakers,
  };
}

export function EventForm({ mode, event }: EventFormProps) {
  const { user } = useSession();
  const [form, setForm] = useState<FormState>(() => initialState(event));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<{ title: string; body: string } | null>(null);
  const [saved, setSaved] = useState<WawuEvent | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setFailure(null);
    setSubmitting(true);
    try {
      const draft = toDraft(form);
      const result =
        mode === "edit" && event
          ? await updateEvent(event.id, draft)
          : await createEvent(user?.wawuId ?? "", draft);
      setSaved(result);
    } catch (e) {
      // A refusal is not a connectivity story. describeError keeps the two
      // apart and renders the server's own sentence where it sent one.
      const mapped = describeError(e);
      setFailure({ title: mapped.title, body: mapped.body });
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-start gap-[14px] rounded-[var(--radius-card)] border border-success bg-[var(--success-tint)] p-[20px]">
        <span className="grid h-[44px] w-[44px] place-items-center rounded-full bg-[var(--surface-card)]">
          <Icon name="Check" size={22} strokeWidth={2.2} color="var(--success)" />
        </span>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">
          {mode === "edit" ? "Saved, and back in review" : "Submitted for review"}
        </h2>
        <p className="m-0 max-w-[52ch] text-[14px] leading-[1.55] text-[var(--text-secondary)]">
          {mode === "edit"
            ? "Your changes are in. Every edit goes back through review, so the event comes off the public calendar until an admin looks at it again."
            : "An admin reads every event before it goes on the calendar. Nobody else can see this one yet. You'll find it under My submissions, with the reason attached if it isn't approved."}
        </p>
        <div className="flex flex-wrap gap-[10px]">
          <Button href="/events/mine">My submissions</Button>
          <Button href={`/events/${saved.id}`} variant="secondary">
            View this event
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {failure ? (
        <div role="alert" className="rounded-input border border-danger bg-[var(--danger-tint)] px-[14px] py-[12px]">
          <div className="text-[13px] font-semibold text-[var(--text-primary)]">{failure.title}</div>
          <div className="mt-[2px] text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">{failure.body}</div>
        </div>
      ) : null}

      <Field label="Event name" error={errors.name}>
        <Input
          value={form.name}
          maxLength={LIMITS.name}
          placeholder="Pricing your work without guessing"
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>

      <Field
        label="What happens at it"
        hint="Who it is for, and what someone walks away with. This is the part people read before deciding."
        error={errors.description}
      >
        <textarea
          value={form.description}
          maxLength={LIMITS.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Three hours on the numbers behind a price: what your time costs, what the market will carry, and how to raise a price on people who already bought from you."
          className="flex min-h-[124px] resize-none rounded-input border border-hairline bg-input px-4 py-[14px] font-[var(--font-sans)] text-[14.5px] leading-[1.5] text-text-primary placeholder:text-text-muted"
        />
      </Field>

      <Field label="Who is running it" error={errors.hostOrg}>
        <Input
          value={form.hostOrg}
          maxLength={LIMITS.hostOrg}
          placeholder="Adeyemi & Co"
          onChange={(e) => set("hostOrg", e.target.value)}
        />
      </Field>

      <Field label="About the organiser" hint="Optional. A line or two on who you are.">
        <textarea
          value={form.hostOrgBio}
          maxLength={LIMITS.hostOrgBio}
          onChange={(e) => set("hostOrgBio", e.target.value)}
          className="flex min-h-[74px] resize-none rounded-input border border-hairline bg-input px-4 py-[14px] font-[var(--font-sans)] text-[14.5px] leading-[1.5] text-text-primary placeholder:text-text-muted"
        />
      </Field>

      <Field label="Format">
        <div className="flex gap-[8px]">
          {EVENT_FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => set("format", f)}
              aria-pressed={form.format === f}
              className={`inline-flex h-[44px] flex-1 items-center justify-center gap-[7px] rounded-[var(--radius-chip)] border text-[13.5px] transition-colors ${
                form.format === f
                  ? "border-transparent bg-[var(--accent)] font-semibold text-[var(--text-on-accent)] hover:bg-accent-hover active:bg-accent-press"
                  : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)] hover:border-strong hover:bg-surface-hover active:bg-surface-press"
              }`}
            >
              <Icon name={f === "online" ? "Video" : "MapPin"} size={15} color="currentColor" />
              {EVENT_FORMAT_LABEL[f]}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Category"
        hint="What people browsing by category will find this under. Leave it on Other if none of them fit."
      >
        <div className="relative">
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as EventCategory)}
            className="flex h-[52px] w-full cursor-pointer appearance-none items-center rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] font-[var(--font-sans)] text-[15px] text-[var(--text-primary)]"
          >
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EVENT_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDown"
            size={16}
            strokeWidth={2.2}
            color="var(--text-muted)"
            className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2"
          />
        </div>
      </Field>

      <Field label="Kind of event">
        <div className="relative">
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value as EventType)}
            className="flex h-[52px] w-full cursor-pointer appearance-none items-center rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] font-[var(--font-sans)] text-[15px] text-[var(--text-primary)]"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDown"
            size={16}
            strokeWidth={2.2}
            color="var(--text-muted)"
            className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2"
          />
        </div>
      </Field>

      <div className="flex flex-col gap-[18px] xl:flex-row xl:gap-[16px]">
        <div className="flex-1">
          <Field label="Starts" error={errors.startsAtLocal}>
            <Input
              type="datetime-local"
              value={form.startsAtLocal}
              onChange={(e) => set("startsAtLocal", e.target.value)}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Ends" hint="Optional." error={errors.endsAtLocal}>
            <Input
              type="datetime-local"
              value={form.endsAtLocal}
              onChange={(e) => set("endsAtLocal", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-[18px] xl:flex-row xl:gap-[16px]">
        <div className="flex-1">
          <Field label="Start time, in your own words" hint="Optional. Leave it and we show the time above.">
            <Input
              value={form.timeLabel}
              maxLength={LIMITS.timeLabel}
              placeholder="6:00 PM"
              onChange={(e) => set("timeLabel", e.target.value)}
            />
          </Field>
        </div>
        <div className="xl:w-[220px]">
          <Field label="Time zone" hint="Shown next to the time.">
            <div className="relative">
              <select
                value={form.timezone}
                onChange={(e) => set("timezone", e.target.value)}
                className="flex h-[52px] w-full cursor-pointer appearance-none items-center rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-input)] px-[16px] font-[var(--font-sans)] text-[15px] text-[var(--text-primary)]"
              >
                {/*
                  An event being edited can carry a timezone typed in before
                  this was a dropdown. Rather than silently swap it for WAT,
                  the unrecognised value gets its own option so editing never
                  rewrites a host's existing event out from under them.
                */}
                {EVENT_TIMEZONES.some((z) => z.value === form.timezone) || !form.timezone ? null : (
                  <option value={form.timezone}>{form.timezone}</option>
                )}
                {EVENT_TIMEZONES.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
              <Icon
                name="ChevronDown"
                size={16}
                strokeWidth={2.2}
                color="var(--text-muted)"
                className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2"
              />
            </div>
          </Field>
        </div>
      </div>

      <Field
        label={form.format === "online" ? "Where it runs" : "Venue or city"}
        error={errors.location}
      >
        <Input
          value={form.location}
          maxLength={LIMITS.location}
          placeholder={form.format === "online" ? "Online (Zoom)" : "Landmark Centre, Lagos"}
          onChange={(e) => set("location", e.target.value)}
        />
      </Field>

      {form.format === "in_person" ? (
        <Field label="Street address" hint="Optional, but an event with no address is the most common reason one gets sent back.">
          <Input
            value={form.address}
            maxLength={LIMITS.address}
            placeholder="Water Corporation Road, Victoria Island, Lagos"
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
      ) : null}

      <Field
        label="Banner image"
        hint="Optional. A link to the flyer or header image. It sits at the top of the event page."
        error={errors.bannerUrl}
      >
        <Input
          value={form.bannerUrl}
          onChange={(e) => set("bannerUrl", e.target.value.slice(0, LIMITS.bannerUrl))}
          placeholder="https://"
          inputMode="url"
        />
      </Field>

      {/*
        Contact details are shown ON the public event page. That is the point
        of them — somebody deciding whether to buy needs a way to ask. They are
        optional because an organiser who would rather not publish a phone
        number should not be forced to, not because they are unimportant.
      */}
      <div className="flex flex-col gap-[18px] xl:flex-row xl:gap-[16px]">
        <div className="flex-1">
          <Field
            label="Contact email"
            hint="Optional, and shown publicly on the event page."
            error={errors.contactEmail}
          >
            <Input
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value.slice(0, LIMITS.contactEmail))}
              placeholder="hello@example.com"
              inputMode="email"
            />
          </Field>
        </div>
        <div className="flex-1">
          <PhoneInput
            label="Contact phone"
            dialCode={form.contactPhoneDialCode}
            value={form.contactPhoneValue}
            onDialCodeChange={(code) => set("contactPhoneDialCode", code)}
            onValueChange={(v) => set("contactPhoneValue", v.slice(0, LIMITS.contactPhone))}
            hint="Optional, and shown publicly on the event page."
          />
        </div>
      </div>

      <Field
        label="Organiser's page"
        hint="Optional. If you run a registration, put its address here. It happens on your page, not on WAWU."
        error={errors.externalUrl}
      >
        <Input
          value={form.externalUrl}
          maxLength={LIMITS.externalUrl}
          inputMode="url"
          placeholder="https://"
          onChange={(e) => set("externalUrl", e.target.value)}
        />
      </Field>

      <Field label="Speakers" hint="Optional. Up to 20." error={errors.speakers}>
        <div className="flex flex-col gap-[12px]">
          {form.speakers.map((s, i) => (
            <div
              key={i}
              className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[12px]"
            >
              <div className="flex items-start gap-[8px]">
                <div className="flex min-w-0 flex-1 flex-col gap-[8px] xl:flex-row">
                  <Input
                    className="xl:flex-1"
                    value={s.name}
                    maxLength={LIMITS.speakerName}
                    placeholder="Name"
                    onChange={(e) =>
                      set(
                        "speakers",
                        form.speakers.map((row, j) => (j === i ? { ...row, name: e.target.value } : row)),
                      )
                    }
                  />
                  <Input
                    className="xl:flex-1"
                    value={s.title ?? ""}
                    maxLength={LIMITS.speakerTitle}
                    placeholder="What they do"
                    onChange={(e) =>
                      set(
                        "speakers",
                        form.speakers.map((row, j) => (j === i ? { ...row, title: e.target.value } : row)),
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remove speaker ${i + 1}`}
                  onClick={() => set("speakers", form.speakers.filter((_, j) => j !== i))}
                  className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-strong hover:bg-surface-hover active:bg-surface-press"
                >
                  <Icon name="X" size={16} color="currentColor" />
                </button>
              </div>

              <div className="flex items-center gap-[10px]">
                {s.photoUrl ? (
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.photoUrl}
                      alt=""
                      className="h-[48px] w-[48px] rounded-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${s.name.trim() || "this speaker"}'s photo`}
                      onClick={() =>
                        set(
                          "speakers",
                          form.speakers.map((row, j) => (j === i ? { ...row, photoUrl: undefined } : row)),
                        )
                      }
                      className="absolute -right-[4px] -top-[4px] grid h-[20px] w-[20px] place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-danger"
                    >
                      <Icon name="X" size={11} strokeWidth={2.6} color="currentColor" />
                    </button>
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <FilePicker
                    folder="event/speaker"
                    accept="image/*"
                    label={s.photoUrl ? "Replace their photo" : "Add their photo"}
                    hint="Optional."
                    onUploaded={(file) =>
                      set(
                        "speakers",
                        form.speakers.map((row, j) => (j === i ? { ...row, photoUrl: file.fileUrl } : row)),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          {form.speakers.length < LIMITS.speakers ? (
            <Button
              variant="secondary"
              size="sm"
              icon="Plus"
              className="self-start"
              onClick={() => set("speakers", [...form.speakers, { name: "", title: "" }])}
            >
              Add a speaker
            </Button>
          ) : null}
        </div>
      </Field>

      <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[16px]">
        <span className="flex items-start gap-[10px] text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
          <span className="mt-[1px] shrink-0">
            <Icon name="ShieldCheck" size={15} strokeWidth={2} color="var(--text-muted)" />
          </span>
          {mode === "edit"
            ? "Saving sends this back for review. It comes off the public calendar until an admin approves it again."
            : "An admin reads every event before it goes on the calendar. Nobody else sees it until then, and you'll get the reason if it isn't approved."}
        </span>
        <div className="flex flex-wrap items-center gap-[10px]">
          <Button onClick={() => void submit()} loading={submitting}>
            {mode === "edit" ? "Save and resubmit" : "Submit for review"}
          </Button>
          <Link
            href={mode === "edit" && event ? `/events/${event.id}` : "/events"}
            className="text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{label}</span>
      {children}
      {error ? (
        <span className="text-[12.5px] text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-[12px] leading-[1.45] text-[var(--text-muted)]">{hint}</span>
      ) : null}
    </div>
  );
}
