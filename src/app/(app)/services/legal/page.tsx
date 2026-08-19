"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getLegalCatalogue,
  getLegalAvailability,
  createLegalRequest,
  getMyLegalRequests,
  bookLegalConsultation,
  verifyLegalConsultation,
  getLegalContract,
  signLegalContract,
  initLegalPayment,
  verifyLegalPayment,
  type LegalCatalogue,
  type LegalServiceItem,
  type LegalRequest,
  type LegalAvailability,
} from "@/lib/api/lifestyle";
import { openFlutterwaveCheckout, isFlutterwaveCancelled, checkoutCustomerFromSession } from "@/lib/flutterwave";
import { useSession } from "@/lib/auth/session-provider";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ErrorState, FilePicker, Icon, Input, Skeleton, StatusPill, Toast } from "@/components/ui";
import { formatNaira } from "@/lib/format";

/**
 * Legal.
 *
 * The screen follows the two paths the catalogue defines. A `simple` service
 * is a form and a payment. A `consultation` one has to be walked: book and pay
 * for the consultation, wait for WAWU to quote, read and sign the engagement
 * letter, then pay for the work.
 *
 * The signing step is not a checkbox. The client is shown the exact contract
 * text and has to type their own name, because that text and that name are
 * what gets stored as the signature.
 */
export default function LegalPage() {
  const { user } = useSession();
  const [catalogue, setCatalogue] = useState<LegalCatalogue | null>(null);
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [active, setActive] = useState<LegalRequest | null>(null);
  const [intake, setIntake] = useState<LegalServiceItem | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getLegalCatalogue()
      .then((c) => { setCatalogue(c); setCategory(c.categories[0] ?? null); })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load legal services."));
    getMyLegalRequests()
      .then((rows) => setRequests(Array.isArray(rows) ? rows : []))
      .catch(() => setRequests([]));
  }, []);

  const services = useMemo(
    () => (catalogue?.services ?? []).filter((s) => s.category === category),
    [catalogue, category],
  );

  /**
   * Services that need documents get an intake step first. Creating the
   * request immediately would fail server-side for those, since the API
   * refuses a document-backed service with nothing attached.
   */
  function startRequest(service: LegalServiceItem) {
    if (service.requiresDocuments) {
      setIntake(service);
      return;
    }
    void submitRequest(service, []);
  }

  async function submitRequest(service: LegalServiceItem, documents: string[]) {
    setBusy(true); setError(null);
    try {
      const created = await createLegalRequest({ serviceCode: service.code, documents });
      setIntake(null);
      setActive(created);
      setRequests((r) => [created, ...r]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start that request.");
    } finally {
      setBusy(false);
    }
  }

  if (intake) {
    return (
      <IntakeStep
        service={intake}
        busy={busy}
        error={error}
        onCancel={() => { setIntake(null); setError(null); }}
        onSubmit={(docs) => submitRequest(intake, docs)}
      />
    );
  }

  if (active) {
    return (
      <RequestFlow
        request={active}
        consultationOptions={catalogue?.consultationOptions ?? []}
        onBack={() => setActive(null)}
        onChange={(r) => {
          setActive(r);
          setRequests((list) => list.map((x) => (x.id === r.id ? r : x)));
        }}
        email={user?.email}
        fullName={user?.fullName}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
      <ProfileBackButton />
      <div className="flex flex-col gap-[6px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">Legal</span>
        <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">Legal, without the runaround</h1>
        <p className="m-0 text-[14px] leading-[1.5] text-[var(--text-secondary)]">
          Register a business or file a return with no lawyer needed. For everything else, book a consultation.
        </p>
      </div>

      {error ? <ErrorState title="Something went wrong" body={error} /> : null}

      {requests.length ? (
        <div className="flex flex-col gap-[8px]">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Your requests</span>
          {requests.slice(0, 5).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActive(r)}
              className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] text-left"
            >
              <span className="flex flex-col">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">{r.serviceName}</span>
                <span className="text-[12.5px] text-[var(--text-muted)]">{humanStatus(r.status)}</span>
              </span>
              <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      ) : null}

      {!catalogue ? (
        <Skeleton variant="card" />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {catalogue.categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`inline-flex h-8 flex-shrink-0 items-center whitespace-nowrap rounded-[var(--radius-chip)] border px-[14px] text-[13px] ${
                  category === c
                    ? "border-transparent bg-[var(--accent)] font-semibold text-[var(--text-on-accent)]"
                    : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-[10px] xl:grid xl:grid-cols-2 xl:gap-[14px]">
            {services.map((s) => (
              <div key={s.code} className="flex h-full flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-[15px] font-semibold text-[var(--text-primary)]">{s.name}</span>
                  <StatusPill kind={s.path === "simple" ? "success" : "info"}>
                    {s.path === "simple" ? "No lawyer needed" : "Consultation"}
                  </StatusPill>
                </span>
                <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">{s.blurb}</span>
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                  {s.priceNaira ? formatNaira(s.priceNaira) : "Price agreed after we review it"}
                </span>
                <div className="mt-auto pt-[2px]">
                  <Button full variant="secondary" size="sm" onClick={() => startRequest(s)} disabled={busy}>
                    Start this
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function humanStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "Started",
    awaiting_quote: "Submitted, price being agreed",
    awaiting_consultation_payment: "Consultation fee due",
    consultation_scheduled: "Consultation booked",
    consultation_done: "Consultation done",
    quoted: "Quote ready, contract to sign",
    contract_signed: "Contract signed, payment due",
    awaiting_service_payment: "Payment due",
    in_progress: "In progress",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

function RequestFlow({
  request,
  consultationOptions,
  onBack,
  onChange,
  email,
  fullName,
}: {
  request: LegalRequest;
  consultationOptions: LegalCatalogue["consultationOptions"];
  onBack: () => void;
  onChange: (r: LegalRequest) => void;
  email?: string;
  fullName?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [medium, setMedium] = useState<"chat" | "zoom" | "physical" | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [availability, setAvailability] = useState<LegalAvailability | null>(null);
  const [toast, setToast] = useState<{ title: string; body?: string } | null>(null);

  useEffect(() => {
    if (request.path !== "consultation" || request.consultationPaidAt) return;
    getLegalAvailability().then(setAvailability).catch(() => setAvailability(null));
  }, [request.path, request.consultationPaidAt]);
  const [contract, setContract] = useState<{ contractText: string; amountNaira: number } | null>(null);
  const [signature, setSignature] = useState(fullName ?? "");

  const customer = checkoutCustomerFromSession(email ? { email, fullName } : null);

  async function book(kind: "chat" | "zoom" | "physical", scheduledFor?: string) {
    setBusy(true); setError(null); setNote(null);
    try {
      const { request: updated, flutterwaveConfig, message } = await bookLegalConsultation(
        request.id,
        kind,
        scheduledFor,
      );
      onChange(updated);
      if (!flutterwaveConfig) {
        setNote(message);
        setToast({
          title: "Request received",
          body: "We will email you to arrange the in-person consultation.",
        });
        return;
      }
      if (!customer) { setError("We need an email on your account before you can pay."); return; }
      const result = await openFlutterwaveCheckout(flutterwaveConfig, customer, {
        title: "Legal consultation",
        description: `${updated.serviceName} · ${kind}`,
      });
      const confirmed = await verifyLegalConsultation(request.id, result.transaction_id);
      onChange(confirmed);
      setToast({
        title: "Consultation booked",
        body: confirmed.scheduledFor
          ? `${formatSlot(confirmed.scheduledFor)}. We have emailed you the details.`
          : "We have emailed you the details.",
      });
    } catch (e) {
      if (!isFlutterwaveCancelled(e)) setError(e instanceof Error ? e.message : "That did not complete.");
    } finally { setBusy(false); }
  }

  async function loadContract() {
    setBusy(true); setError(null);
    try {
      setContract(await getLegalContract(request.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the contract.");
    } finally { setBusy(false); }
  }

  async function sign() {
    if (!signature.trim()) { setError("Type your full name to sign."); return; }
    setBusy(true); setError(null);
    try {
      onChange(await signLegalContract(request.id, signature.trim()));
      setContract(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign that.");
    } finally { setBusy(false); }
  }

  async function payForWork() {
    if (!customer) { setError("We need an email on your account before you can pay."); return; }
    setBusy(true); setError(null);
    try {
      const { flutterwaveConfig } = await initLegalPayment(request.id);
      const result = await openFlutterwaveCheckout(flutterwaveConfig, customer, {
        title: "Legal",
        description: request.serviceName,
      });
      onChange(await verifyLegalPayment(request.id, result.transaction_id));
    } catch (e) {
      if (!isFlutterwaveCancelled(e)) setError(e instanceof Error ? e.message : "That payment did not complete.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
      {toast ? (
        <Toast kind="success" title={toast.title} body={toast.body} onDismiss={() => setToast(null)} />
      ) : null}
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 self-start text-[13.5px] text-[var(--text-secondary)]">
        <Icon name="ChevronLeft" size={16} color="var(--text-secondary)" /> All legal services
      </button>

      <div className="flex flex-col gap-[6px]">
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">{request.serviceName}</h1>
        <span className="text-[13px] text-[var(--text-muted)]">{humanStatus(request.status)}</span>
      </div>

      {error ? <ErrorState title="Something went wrong" body={error} /> : null}
      {note ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
          {note}
        </div>
      ) : null}

      {/* Step: book a consultation. How, then when, then pay. */}
      {request.path === "consultation" && !request.consultationPaidAt ? (
        <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">Book your consultation</span>
          <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
            A lawyer talks through what you need before anything is quoted.
          </span>
          {consultationOptions.map((o) => {
            const chosen = medium === o.medium;
            return (
              <button
                key={o.medium}
                type="button"
                disabled={busy}
                onClick={() => setMedium(chosen ? null : o.medium)}
                className={`flex items-center justify-between rounded-[var(--radius-card)] border p-[14px] text-left ${
                  chosen
                    ? "border-[var(--border-accent)] bg-[var(--surface-elevated)]"
                    : "border-[var(--border-hairline)] bg-[var(--surface-elevated)]"
                }`}
              >
                <span className="flex flex-col">
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">{o.label}</span>
                  <span className="text-[12.5px] text-[var(--text-muted)]">
                    {o.minutes ? `${o.minutes} minutes` : "Booked by email, fee agreed per matter"}
                  </span>
                </span>
                <span className="text-[14px] font-bold text-[var(--text-primary)]">
                  {o.feeNaira ? formatNaira(o.feeNaira) : "On request"}
                </span>
              </button>
            );
          })}

          {/*
            Physical consultations are arranged by email and book no slot, so
            the calendar only appears for the ones that happen at a set hour.
          */}
          {medium && medium !== "physical" ? (
            <AvailabilityCalendar
              availability={availability}
              selected={slot}
              onSelect={setSlot}
            />
          ) : null}

          {medium ? (
            <Button
              full
              disabled={busy || (medium !== "physical" && !slot)}
              onClick={() => book(medium, slot ?? undefined)}
            >
              {busy
                ? "Opening checkout…"
                : medium === "physical"
                  ? "Request an in-person consultation"
                  : `Pay ${formatNaira(consultationOptions.find((o) => o.medium === medium)?.feeNaira ?? 0)}`}
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Step: a simple service submitted with no price on the list. */}
      {request.path === "simple" && request.quoteAmount == null ? (
        <div className="flex items-start gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
          <Icon name="Clock" size={19} color="var(--text-muted)" className="mt-[2px] shrink-0" />
          <span className="flex flex-col gap-1">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">We have your request</span>
            <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
              This one is priced once we have looked at it. We will agree the fee with you and it will show up here to
              approve. Nothing is charged until you sign.
            </span>
            {request.documents.length ? (
              <span className="text-[12.5px] text-[var(--text-muted)]">
                {request.documents.length} document{request.documents.length === 1 ? "" : "s"} received
              </span>
            ) : null}
          </span>
        </div>
      ) : null}

      {/* Step: waiting on WAWU to quote after a consultation. */}
      {request.consultationPaidAt && request.quoteAmount == null ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
          Your consultation is paid for. We will be in touch to hold it, and you will get a quote here afterwards.
        </div>
      ) : null}

      {/* Step: read and sign the engagement letter. */}
      {request.quoteAmount != null && !request.contractSigned ? (
        <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-card)] p-[16px]">
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">
            Quote: {formatNaira(request.quoteAmount)}
          </span>
          {request.quoteNote ? (
            <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">{request.quoteNote}</span>
          ) : null}
          {!contract ? (
            <Button variant="secondary" onClick={loadContract} disabled={busy}>Read the engagement letter</Button>
          ) : (
            <>
              <pre className="m-0 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-elevated)] p-[14px] font-[var(--font-sans)] text-[12.5px] leading-[1.6] text-[var(--text-secondary)]">
                {contract.contractText}
              </pre>
              <Input label="Type your full name to sign" value={signature} onChange={(e) => setSignature(e.target.value)} />
              <Button full onClick={sign} disabled={busy}>Sign this agreement</Button>
              <span className="text-[12px] leading-[1.5] text-[var(--text-muted)]">
                Signing records your name, the time, and the exact text above.
              </span>
            </>
          )}
        </div>
      ) : null}

      {/* Step: pay for the work. Only reachable once signed. */}
      {request.contractSigned && !request.servicePaidAt ? (
        <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--surface-card)] p-[16px]">
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">Signed. Ready to start.</span>
          <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
            Signed as {request.contractSignedAs}. Work begins once the fee is paid.
          </span>
          <Button full onClick={payForWork} disabled={busy}>
            Pay {request.quoteAmount ? formatNaira(request.quoteAmount) : ""}
          </Button>
        </div>
      ) : null}

      {request.servicePaidAt ? (
        <div className="flex items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-[var(--accent-tint)] p-[16px]">
          <Icon name="Check" size={20} color="var(--accent)" strokeWidth={2.4} />
          <span className="text-[13.5px] leading-[1.5] text-[var(--text-primary)]">
            {request.deliveredAt
              ? "Delivered. Check your email for the documents."
              : "Paid. We are working on it and will email you when it is ready."}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Document intake for the simple services that need paperwork (CAC, tax
 * registration, NDPR filing). Uploads go straight to storage and the request
 * is created with the resulting URLs, so the API never sees a document-backed
 * service submitted empty.
 */
function IntakeStep({
  service,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  service: LegalServiceItem;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (documents: string[]) => void;
}) {
  const [documents, setDocuments] = useState<{ url: string; name: string }[]>([]);

  return (
    <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[900px] xl:gap-[22px] xl:p-[30px_28px_64px]">
      <button type="button" onClick={onCancel} className="flex items-center gap-1.5 self-start text-[13.5px] text-[var(--text-secondary)]">
        <Icon name="ChevronLeft" size={16} color="var(--text-secondary)" /> Back
      </button>

      <div className="flex flex-col gap-[6px]">
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">{service.name}</h1>
        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
          Upload what we need and submit. No lawyer call required.{" "}
          {service.priceNaira
            ? `The fee is ${formatNaira(service.priceNaira)}.`
            : "We will review it and send you a price here before anything is charged."}
        </p>
      </div>

      {error ? <ErrorState title="Something went wrong" body={error} /> : null}

      <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
        {documents.map((d) => (
          <span key={d.url} className="flex items-center gap-2 text-[13.5px] text-[var(--text-secondary)]">
            <Icon name="Check" size={15} color="var(--accent)" strokeWidth={2.4} />
            {d.name}
          </span>
        ))}
        <FilePicker
          folder="service-application/document"
          accept="image/*,application/pdf"
          label={documents.length ? "Add another document" : "Upload a document"}
          hint="Photos or PDFs. Add as many as the filing needs."
          onUploaded={(f) => setDocuments((list) => [...list, { url: f.fileUrl, name: f.name }])}
          disabled={busy}
        />
      </div>

      <Button full onClick={() => onSubmit(documents.map((d) => d.url))} disabled={busy || !documents.length}>
        {busy ? "Submitting…" : "Submit this request"}
      </Button>
    </div>
  );
}

/** "Thu 20 Aug, 9:00am" in Lagos time, which is where the practice sits. */
function formatSlot(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
}

/**
 * The booking calendar.
 *
 * Consultations used to be paid for with no time attached, so nobody knew when
 * theirs would actually happen. This shows the days a lawyer is free, and
 * which hours on those days are already taken, before any money moves.
 *
 * Days are a horizontal strip rather than a month grid: the horizon is three
 * weeks of weekdays, so a full month view would be mostly empty cells.
 */
function AvailabilityCalendar({
  availability,
  selected,
  onSelect,
}: {
  availability: LegalAvailability | null;
  selected: string | null;
  onSelect: (iso: string) => void;
}) {
  const [day, setDay] = useState<string | null>(null);

  if (!availability) return <Skeleton variant="card" />;

  const days = availability.days.filter((d) => d.slots.some((s) => s.available));
  if (!days.length) {
    return (
      <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
        No slots are open in the next three weeks. Choose an in-person consultation and we will arrange a time by email.
      </span>
    );
  }

  const activeDate = day ?? days[0].date;
  const active = days.find((d) => d.date === activeDate) ?? days[0];

  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Pick a time</span>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {days.map((d) => {
          const on = d.date === activeDate;
          const date = new Date(`${d.date}T12:00:00Z`);
          const open = d.slots.filter((x) => x.available).length;
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => setDay(d.date)}
              className={`flex shrink-0 flex-col items-center rounded-[12px] border px-[13px] py-[8px] ${
                on
                  ? "border-transparent bg-[var(--accent)] text-[var(--text-on-accent)]"
                  : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)]"
              }`}
            >
              <span className="text-[11px] uppercase tracking-[0.06em]">
                {date.toLocaleDateString("en-NG", { weekday: "short", timeZone: "Africa/Lagos" })}
              </span>
              <span className="text-[15px] font-bold">
                {date.toLocaleDateString("en-NG", { day: "numeric", timeZone: "Africa/Lagos" })}
              </span>
              <span className={`text-[10px] ${on ? "opacity-80" : "text-[var(--text-muted)]"}`}>
                {open} free
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {active.slots.map((sl) => {
          const on = selected === sl.startsAt;
          return (
            <button
              key={sl.startsAt}
              type="button"
              disabled={!sl.available}
              onClick={() => onSelect(sl.startsAt)}
              className={`rounded-[10px] border py-[9px] text-[12.5px] font-semibold ${
                on
                  ? "border-transparent bg-[var(--accent)] text-[var(--text-on-accent)]"
                  : sl.available
                    ? "border-[var(--border-hairline)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                    : "border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-disabled)] line-through"
              }`}
            >
              {new Date(sl.startsAt).toLocaleTimeString("en-NG", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Africa/Lagos",
              })}
            </button>
          );
        })}
      </div>

      {selected ? (
        <span className="text-[12.5px] text-[var(--text-secondary)]">
          Booking {formatSlot(selected)} (Lagos time).
        </span>
      ) : null}
    </div>
  );
}
