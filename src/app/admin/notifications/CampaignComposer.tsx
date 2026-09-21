"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, Input } from "@/components/ui";
import { describeError } from "@/lib/api/errors";
import {
  composeCampaign,
  dispatchCampaign,
  getCampaignAudiences,
  getCampaignDestinations,
  getCampaigns,
} from "@/lib/api/notifications";
import type {
  AppNotification,
  CampaignAudience,
  CampaignAudienceKey,
  CampaignDestination,
  CampaignTone,
  NotificationCampaign,
} from "@/types/notification";
import { NotificationCard } from "@/app/(app)/notifications/_components/NotificationCard";

/**
 * Bounds, mirrored from the backend's ComposeCampaignDto so the composer
 * refuses what the server would refuse, in the field, before a round trip.
 * The server still validates: this is a courtesy, not the enforcement.
 */
const TITLE_MAX = 70;
const BODY_MAX = 220;
const DASHES = /[—–]/;

/** The four quiet tones. `danger` and `warning` are the app's money-and-deadline colours and a promotion may not borrow them. */
const TONES: { value: CampaignTone; label: string; note: string }[] = [
  { value: "accent", label: "Brand", note: "A WAWU announcement" },
  { value: "info", label: "Neutral", note: "Something to know" },
  { value: "success", label: "Good news", note: "Something landed" },
  { value: "neutral", label: "Quiet", note: "Low priority" },
];

function formatCount(n: number): string {
  return n.toLocaleString("en-NG");
}

/**
 * The admin push composer (build brief C8).
 *
 * There is no reference image for this screen, so it is designed from the
 * brief's own principles and its reasoning is in DECISIONS.md D17e. The three
 * decisions that shaped it:
 *
 *  1. THE PREVIEW IS THE REAL COMPONENT. The panel on the right renders
 *     <NotificationCard>, the exact component the app's notification list
 *     uses, fed a notification built from the draft. It is not a mock-up of
 *     the card, so it cannot drift from it. What you see is the thing.
 *
 *  2. THE NUMBER IS MEASURED, AND THERE ARE TWO OF IT. Every audience option
 *     shows how many accounts match AND how many of those have "Offers and
 *     news" switched on, both counted by the backend when this screen asks.
 *     An admin who only ever sees "4,820 people" will believe 4,820 people
 *     read it.
 *
 *  3. SENDING IS A TWO-STEP DOOR. Composing saves a draft and sends nothing.
 *     Sending asks again, restating the measured number and that it cannot be
 *     undone, because it cannot: the notification has been read by the time
 *     anybody regrets it.
 */
export function CampaignComposer() {
  const [audiences, setAudiences] = useState<CampaignAudience[] | null>(null);
  const [destinations, setDestinations] = useState<CampaignDestination[] | null>(null);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [audience, setAudience] = useState<CampaignAudienceKey>("everyone");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionHref, setActionHref] = useState("");
  const [tone, setTone] = useState<CampaignTone>("accent");

  const [draft, setDraft] = useState<NotificationCampaign | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentSummary, setSentSummary] = useState<string | null>(null);

  const load = () => {
    setLoadError(null);
    Promise.all([getCampaignAudiences(), getCampaignDestinations(), getCampaigns()])
      .then(([a, d, c]) => {
        setAudiences(a);
        setDestinations(d);
        setCampaigns(c);
      })
      .catch((e) => setLoadError(describeError(e).body));
  };

  useEffect(load, []);

  const selected = audiences?.find((a) => a.audience === audience) ?? null;

  /**
   * What the recipient will actually see. Built as a real AppNotification and
   * handed to the real card, so the preview and the product cannot disagree.
   */
  const preview: AppNotification = useMemo(
    () => ({
      id: "preview",
      kind: "campaign",
      title: title.trim() || "Your headline goes here",
      body: body.trim() || "Two or three lines saying what this is and why it is worth opening.",
      tone,
      imageUrl: imageUrl.trim() || null,
      actionLabel: actionLabel.trim() || undefined,
      actionHref: actionHref || null,
      read: false,
      createdAt: new Date().toISOString(),
    }),
    [title, body, tone, imageUrl, actionLabel, actionHref],
  );

  /** Mirrors the server's rules. Returns the first problem, or null. */
  const problem = useMemo(() => {
    const t = title.trim();
    const b = body.trim();
    if (t.length < 3) return "Give it a headline of at least 3 characters.";
    if (t.length > TITLE_MAX) return `The headline is ${t.length} characters. The limit is ${TITLE_MAX}.`;
    if (b.length < 10) return "Write at least a sentence of body copy.";
    if (b.length > BODY_MAX) return `The body is ${b.length} characters. The limit is ${BODY_MAX}.`;
    if (DASHES.test(t) || DASHES.test(b) || DASHES.test(actionLabel)) {
      return "No dashes in copy. Use a comma, a colon, brackets, or two sentences.";
    }
    if (imageUrl.trim() && !imageUrl.trim().startsWith("https://")) {
      return "The image has to be an https address.";
    }
    if (Boolean(actionLabel.trim()) !== Boolean(actionHref)) {
      return "A button needs both a label and a destination, or neither.";
    }
    return null;
  }, [title, body, actionLabel, actionHref, imageUrl]);

  const saveDraft = async () => {
    if (problem) {
      setFormError(problem);
      return;
    }
    setBusy(true);
    setFormError(null);
    setSentSummary(null);
    try {
      const saved = await composeCampaign({
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        actionLabel: actionLabel.trim() || undefined,
        actionHref: actionHref || undefined,
        tone,
        audience,
      });
      setDraft(saved);
      setCampaigns((prev) => (prev ? [saved, ...prev] : [saved]));
      setConfirming(true);
    } catch (e) {
      setFormError(describeError(e).body);
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!draft) return;
    setBusy(true);
    setFormError(null);
    try {
      const result = await dispatchCampaign(draft.id);
      setSentSummary(
        `Sent. ${formatCount(result.deliveredCount)} of ${formatCount(result.recipientCount)} accounts received it, ` +
          `${formatCount(result.suppressedByPreference)} have announcements switched off.`,
      );
      setCampaigns((prev) =>
        prev ? prev.map((c) => (c.id === result.campaign.id ? result.campaign : c)) : prev,
      );
      setDraft(null);
      setConfirming(false);
      setTitle("");
      setBody("");
      setImageUrl("");
      setActionLabel("");
      setActionHref("");
    } catch (e) {
      setFormError(describeError(e).body);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-start gap-3 px-4 py-16">
        <span className="text-[16px] font-semibold text-text-primary">Could not load the composer</span>
        <p className="m-0 text-[13.5px] leading-relaxed text-text-secondary">{loadError}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-button border border-hairline bg-tag px-5 py-3 text-[13.5px] font-semibold text-text-primary hover:bg-surface-hover active:bg-surface-press"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 pb-20 pt-6 lg:px-8">
      <header className="flex flex-col gap-1.5">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
          <Icon name="Megaphone" size={13} />
          WAWU admin
        </span>
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
          Compose a push notification
        </h1>
        <p className="m-0 max-w-[62ch] text-[13.5px] leading-relaxed text-text-secondary">
          This lands in the notification list of every account in the segment you pick. Saving keeps it as
          a draft. Nothing goes out until you send it, and a send cannot be undone.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── the form ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionLabel step="1" title="Who gets it" />
            {!audiences ? (
              <div className="h-[220px] rounded-card border border-hairline bg-card" />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {audiences.map((a) => {
                  const on = a.audience === audience;
                  return (
                    <button
                      key={a.audience}
                      type="button"
                      onClick={() => setAudience(a.audience)}
                      aria-pressed={on}
                      className={`flex flex-col items-start gap-1 rounded-card border px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                        on
                          ? "border-selected bg-selected-tint"
                          : "border-hairline bg-card hover:bg-surface-hover active:bg-surface-press"
                      }`}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="text-[14px] font-semibold text-text-primary">{a.label}</span>
                        {on ? <Icon name="Check" size={15} color="var(--accent)" /> : null}
                      </span>
                      <span className="text-[12px] leading-[1.4] text-text-muted">{a.description}</span>
                      <span className="mt-1 text-[12px] font-semibold text-text-secondary [font-feature-settings:var(--font-feature-tabular)]">
                        {formatCount(a.size)} accounts, {formatCount(a.optedIn)} with announcements on
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel step="2" title="What it says" />
            <div className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-4">
              <Input
                label="Headline"
                name="campaign-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bills payment is live on WAWU"
                hint={`${title.trim().length} of ${TITLE_MAX} characters`}
                maxLength={TITLE_MAX}
              />

              <div className="flex flex-col gap-2">
                <label htmlFor="campaign-body" className="text-[13px] font-semibold text-text-secondary">
                  Body
                </label>
                <textarea
                  id="campaign-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={BODY_MAX}
                  rows={4}
                  placeholder="Say what it is and why it is worth opening. Two or three lines."
                  className="w-full resize-y rounded-input border border-hairline bg-input px-4 py-3 text-[14px] leading-relaxed text-text-primary placeholder:text-text-disabled focus-visible:border-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                />
                <span className="text-[12px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
                  {body.trim().length} of {BODY_MAX} characters
                </span>
              </div>

              <Input
                label="Picture (optional)"
                name="campaign-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://"
                hint="An https address for a 16:9 image. Leave it empty and this sends as a compact row instead."
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel step="3" title="Where it goes, and how it reads" />
            <div className="flex flex-col gap-4 rounded-card border border-hairline bg-card p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Button label (optional)"
                  name="campaign-action-label"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="Pay a bill"
                  maxLength={24}
                />
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="campaign-action-href"
                    className="text-[13px] font-semibold text-text-secondary"
                  >
                    Button destination
                  </label>
                  <select
                    id="campaign-action-href"
                    value={actionHref}
                    onChange={(e) => setActionHref(e.target.value)}
                    className="h-[52px] w-full rounded-input border border-hairline bg-input px-4 text-[14px] text-text-primary focus-visible:border-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <option value="">No button</option>
                    {(destinations ?? []).map((d) => (
                      <option key={d.href} value={d.href}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[12px] leading-[1.4] text-text-muted">
                    In-app screens only. The server refuses anything else, so an announcement can never
                    send the whole platform to an outside page.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-text-secondary">Tone</span>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => {
                    const on = t.value === tone;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTone(t.value)}
                        aria-pressed={on}
                        title={t.note}
                        className={`rounded-chip border px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                          on
                            ? "border-selected bg-selected-tint text-selected-text"
                            : "border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[12px] leading-[1.4] text-text-muted">
                  Red and amber are not offered. Those are the app&apos;s money and deadline colours, and a
                  promotion dressed as an emergency teaches people to ignore the real one.
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ── the preview and the send door ───────────────────────────── */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <SectionLabel step="4" title="What they will see" />
          <div className="rounded-card border border-hairline bg-page p-3">
            <NotificationCard notification={preview} />
          </div>

          <div className="flex flex-col gap-3 rounded-card border border-hairline bg-card p-4">
            {selected ? (
              <p className="m-0 text-[13px] leading-relaxed text-text-secondary">
                <span className="font-semibold text-text-primary">{selected.label}</span>: {formatCount(selected.size)}{" "}
                accounts match. {formatCount(selected.optedIn)} of them have announcements switched on and
                will get this one.
              </p>
            ) : null}

            {formError ? (
              <p className="m-0 flex items-start gap-2 text-[12.5px] leading-relaxed text-danger">
                <Icon name="CircleAlert" size={14} color="var(--danger)" />
                {formError}
              </p>
            ) : null}

            {sentSummary ? (
              <p className="m-0 flex items-start gap-2 text-[12.5px] leading-relaxed text-success">
                <Icon name="CheckCircle2" size={14} color="var(--success)" />
                {sentSummary}
              </p>
            ) : null}

            {confirming && draft ? (
              <div className="flex flex-col gap-3">
                <p className="m-0 text-[13px] leading-relaxed text-text-primary">
                  Send &ldquo;{draft.title}&rdquo; to {selected ? formatCount(selected.optedIn) : "every matching"}{" "}
                  accounts now? There is no unsend.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={send}
                    disabled={busy}
                    className="h-[44px] flex-1 rounded-button bg-accent px-4 text-[13.5px] font-semibold text-on-accent transition-colors hover:bg-accent-hover active:bg-accent-press disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Sending..." : "Send it"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                    className="h-[44px] rounded-button border border-hairline bg-tag px-4 text-[13.5px] font-semibold text-text-secondary hover:bg-surface-hover active:bg-surface-press"
                  >
                    Keep as draft
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={saveDraft}
                disabled={busy || problem !== null}
                className="h-[46px] rounded-button bg-text-primary px-5 text-[14px] font-semibold text-page transition-colors hover:bg-text-secondary active:bg-text-muted disabled:cursor-not-allowed disabled:border disabled:border-hairline disabled:bg-tag disabled:text-text-disabled"
              >
                {busy ? "Saving..." : "Save draft and review"}
              </button>
            )}

            {problem && !confirming ? (
              <span className="text-[12px] leading-[1.4] text-text-muted">{problem}</span>
            ) : null}
          </div>
        </aside>
      </div>

      {/* ── what has gone out ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <SectionLabel step="" title="Sent and drafted" />
        {!campaigns ? (
          <div className="h-[120px] rounded-card border border-hairline bg-card" />
        ) : campaigns.length === 0 ? (
          <p className="m-0 rounded-card border border-hairline bg-card px-4 py-6 text-center text-[13px] text-text-muted">
            Nothing has been sent yet. The first campaign you send will be listed here with what it reached.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-2 rounded-card border border-hairline bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-[14px] font-semibold text-text-primary">{c.title}</span>
                  <span className="text-[12px] text-text-muted">
                    {c.audience.replace(/_/g, " ")}
                    {c.dispatchedByAdminEmail ? `, sent by ${c.dispatchedByAdminEmail}` : ", not sent yet"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {c.status === "sent" ? (
                    <span className="text-[12.5px] text-text-secondary [font-feature-settings:var(--font-feature-tabular)]">
                      {formatCount(c.deliveredCount)} of {formatCount(c.recipientCount)} received
                    </span>
                  ) : null}
                  <span
                    className={`rounded-chip border px-3 py-1 text-[11.5px] font-semibold capitalize ${
                      c.status === "sent"
                        ? "border-success text-success"
                        : c.status === "failed"
                          ? "border-danger text-danger"
                          : "border-hairline text-text-muted"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionLabel({ step, title }: { step: string; title: string }) {
  return (
    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
      {step ? (
        <span className="grid h-[20px] w-[20px] place-items-center rounded-full border border-hairline text-[11px] text-text-secondary">
          {step}
        </span>
      ) : null}
      {title}
    </span>
  );
}
