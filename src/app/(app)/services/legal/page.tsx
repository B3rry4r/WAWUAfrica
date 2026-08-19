"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getLegalCatalogue,
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
} from "@/lib/api/lifestyle";
import { openFlutterwaveCheckout, isFlutterwaveCancelled, checkoutCustomerFromSession } from "@/lib/flutterwave";
import { useSession } from "@/lib/auth/session-provider";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ErrorState, FilePicker, Icon, Input, Skeleton, StatusPill } from "@/components/ui";
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
    getMyLegalRequests().then(setRequests).catch(() => setRequests([]));
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
    <div className="flex flex-col gap-[18px] p-[16px_16px_96px]">
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

          <div className="flex flex-col gap-[10px]">
            {services.map((s) => (
              <div key={s.code} className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
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
                <Button variant="secondary" size="sm" onClick={() => startRequest(s)} disabled={busy}>
                  Start this
                </Button>
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
  const [contract, setContract] = useState<{ contractText: string; amountNaira: number } | null>(null);
  const [signature, setSignature] = useState(fullName ?? "");

  const customer = checkoutCustomerFromSession(email ? { email, fullName } : null);

  async function book(medium: "chat" | "zoom" | "physical") {
    setBusy(true); setError(null); setNote(null);
    try {
      const { request: updated, flutterwaveConfig, message } = await bookLegalConsultation(request.id, medium);
      onChange(updated);
      if (!flutterwaveConfig) { setNote(message); return; }
      if (!customer) { setError("We need an email on your account before you can pay."); return; }
      const result = await openFlutterwaveCheckout(flutterwaveConfig, customer, {
        title: "Legal consultation",
        description: `${updated.serviceName} · ${medium}`,
      });
      onChange(await verifyLegalConsultation(request.id, result.transaction_id));
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
    <div className="flex flex-col gap-[18px] p-[16px_16px_96px]">
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

      {/* Step: book a consultation. */}
      {request.path === "consultation" && !request.consultationPaidAt ? (
        <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">Book your consultation</span>
          <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
            A lawyer talks through what you need before anything is quoted.
          </span>
          {consultationOptions.map((o) => (
            <button
              key={o.medium}
              type="button"
              disabled={busy}
              onClick={() => book(o.medium)}
              className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-elevated)] p-[14px] text-left"
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
          ))}
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
    <div className="flex flex-col gap-[18px] p-[16px_16px_96px]">
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
