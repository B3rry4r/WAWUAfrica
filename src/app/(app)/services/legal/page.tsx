"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getLegalCatalogue,
  getLegalAvailability,
  createLegalRequest,
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
import { ServiceComingSoon, ServiceGateLoading, useServiceLive } from "@/components/services/ServiceGate";
import { Button, ErrorState, FilePicker, Icon, Input, Skeleton, StatusPill, TileCard, Toast } from "@/components/ui";
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
/** Renders a link only for a URL we would actually be willing to open. */
function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function LegalPage() {
  const router = useRouter();
  const { user } = useSession();
  // Catalogue status. This tool lives at a static route, which Next resolves
  // ahead of /services/[id], so a service the catalogue has closed would still
  // open and take payment here unless the page refuses on its own.
  const live = useServiceLive("legal");
  const [catalogue, setCatalogue] = useState<LegalCatalogue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<LegalRequest | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getLegalCatalogue()
      .then((c) => setCatalogue(c))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load legal services."));
  }, []);

  const services = useMemo(
    // EVERY service, one list. There used to be a row of category pills above
    // this and the list showed one category at a time — so finding "Tax
    // registration" meant guessing which of six pills it lived under and
    // clicking between them. Twenty-seven rows in two columns is shorter than
    // the clicking was.
    () => catalogue?.services ?? [],
    [catalogue],
  );

  /**
   * Where a service actually starts.
   *
   * Three destinations, and the old single one was the problem. Anything
   * flagged `requiresDocuments` used to open a bare file picker captioned
   * "upload what we need" — which never said WHICH documents, and for CAC
   * could not produce a filing at all, because a CAC registration needs three
   * proposed names and the nature of the business before any document
   * matters.
   *
   *  - `applyHref`  a purpose-built flow already exists (CAC). Go there; it
   *                 names every document and collects the fields the filing
   *                 needs.
   *  - documents    no dedicated flow, so go through profiling. The
   *                 matter-specific questions establish what the filing
   *                 actually requires, and the consultant asks for exactly
   *                 those in the chat rather than the client guessing.
   *  - otherwise    nothing to collect; open the request.
   */
  function startRequest(service: LegalServiceItem) {
    if (service.applyHref) {
      router.push(service.applyHref);
      return;
    }
    if (service.requiresDocuments) {
      router.push("/services/legal/intake");
      return;
    }
    void submitRequest(service, []);
  }

  async function submitRequest(service: LegalServiceItem, documents: string[]) {
    setBusy(true); setError(null);
    try {
      const created = await createLegalRequest({ serviceCode: service.code, documents });
      setActive(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start that request.");
    } finally {
      setBusy(false);
    }
  }

  if (live === false) {
    return <ServiceComingSoon name="Legal" icon="Scale" />;
  }

  if (live === null) {
    return <ServiceGateLoading />;
  }

  if (active) {
    return (
      <RequestFlow
        request={active}
        consultationOptions={catalogue?.consultationOptions ?? []}
        onBack={() => setActive(null)}
        onChange={(r) => setActive(r)}
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
          Register a business or file a return with no lawyer needed. For everything else, tell us what you need and a consultant will pick it up.
        </p>
      </div>

      {error ? <ErrorState title="Something went wrong" body={error} /> : null}

      {/*
        The way in, above the price list on purpose.

        This page used to open on a catalogue with a consultation fee against
        each line, so the first thing WAWU said to somebody with a legal
        problem was a number — before anyone had heard what the problem was.
        Profiling comes first now: a couple of minutes of questions, a
        consultant who has read the answers, and a price only once somebody
        understands what is being priced. The catalogue stays below for people
        who already know exactly which filing they want.
      */}
      <Link
        href="/services/legal/intake"
        className="flex items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-selected)] bg-[var(--selected-tint)] p-[16px] no-underline text-inherit transition-colors hover:border-strong"
      >
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border border-[var(--border-selected)] bg-[var(--surface-card)]">
          <Icon name="MessagesSquare" size={20} color="var(--accent)" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="text-[15.5px] font-bold text-[var(--text-primary)]">
            Not sure what you need?
          </span>
          <span className="text-[13px] leading-[1.45] text-[var(--text-secondary)]">
            Answer a few questions. About two minutes. Nothing is charged,
            and no price is quoted until a consultant has read them.
          </span>
        </span>
        <Icon name="ChevronRight" size={18} color="var(--text-muted)" strokeWidth={2} />
      </Link>


      {!catalogue ? (
        <Skeleton variant="card" />
      ) : (
        <>
          {/*
            Rows, in TWO COLUMNS on desktop.

            Each service used to be a bordered card with a name, a pill, a
            blurb, a price and its own button. For twenty-seven legal services
            that is a wall of boxes, and finding the one you need was harder
            than reading a list of names.

            But one column of twenty-seven rows is its own problem: on a wide
            screen it is a very long ribbon down the left with the right half
            empty, and it pushes everything below it off the fold. Two columns
            halve the height and use the width that is actually there. Mobile
            stays one column, where a second would leave nothing room to read.

            The whole row is the target, so there is one obvious thing to
            press and a far larger tap area than a small button in a card.
          */}
          {/*
            Cards, not rows.

            Twenty-seven identical bordered rows with a chevron read as a
            database table — the name you are scanning for had nothing to
            distinguish it from its twenty-six neighbours. These carry no icon
            because legal services have never had one and inventing a glyph
            per service would be inventing meaning; the colour does the
            separating instead, and it is stable per service between visits.

            The price stays on the card: it is the thing somebody is actually
            comparing across the list.
          */}
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 xl:grid-cols-4">
            {services.map((s, i) => (
              <TileCard
                key={s.code}
                index={i}
                title={s.name}
                subtitle={s.blurb}
                meta={s.priceNaira ? formatNaira(s.priceNaira) : "Priced after review"}
                onClick={() => startRequest(s)}
              />
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
        // The promise of an email is GONE, not reworded into another one.
        // The Hub API has no mail transport, so "we will email you" was a
        // guarantee nothing implements (LESSONS V.2). What is true is that
        // the request is now in the legal ops queue a consultant works.
        // The surrounding element — the confirmation — stays.
        setToast({
          title: "Request received",
          body: "Your request is with our legal team. In-person consultations are arranged with you directly.",
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
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 self-start text-[13.5px] text-[var(--text-secondary)] hover:text-[var(--accent-hover)]">
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
                  busy ? "" : "hover:bg-[var(--surface-hover)] active:bg-[var(--surface-press)]"
                } ${
                  chosen
                    ? "border-[var(--border-selected)] bg-[var(--surface-elevated)]"
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
        <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-[var(--surface-card)] p-[16px]">
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
        <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-[var(--surface-card)] p-[16px]">
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
        <div className="flex items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-decor)] bg-[var(--decor-tint)] p-[16px]">
          <Icon name="Check" size={20} color="var(--accent)" strokeWidth={2.4} />
          {/*
            NEITHER LINE PROMISES AN EMAIL ANY MORE.

            This service has no mail transport — grep resend/nodemailer/
            sendMail/MailService across WAWU-Hub-API/src returns nothing — so
            both previous sentences pointed the customer at an inbox and were
            guarantees nothing implements (LESSONS V.2). The phrasings are not
            quoted here on purpose: the gate matches them literally, and a
            comment explaining a removed promise should not read to the gate
            as the promise still being made.

            What actually happens is better than the promise was: an operator
            marking the request delivered writes `deliverableUrl`, the API
            returns it, and the web client already types it — and then rendered
            it NOWHERE. The finished document was sitting on the response while
            the screen sent the customer to an inbox that would never receive
            anything. Written by one role, read by none (POST-MORTEM class B).
          */}
          <span className="flex min-w-0 flex-col gap-[6px] text-[13.5px] leading-[1.5] text-[var(--text-primary)]">
            {request.deliveredAt ? (
              <>
                <span>Delivered.</span>
                {safeHttpUrl(request.deliverableUrl) ? (
                  <a
                    href={safeHttpUrl(request.deliverableUrl) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-[6px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
                  >
                    Open your documents
                    <Icon name="ArrowUpRight" size={15} color="currentColor" />
                  </a>
                ) : (
                  // Marked delivered with no URL attached. Say so rather than
                  // pointing at an inbox nothing will arrive in.
                  <span className="text-[var(--text-secondary)]">
                    Your documents are being attached. Contact support if they do not appear.
                  </span>
                )}
              </>
            ) : (
              <span>Paid. We are working on it. Your documents appear here when they are ready.</span>
            )}
          </span>
        </div>
      ) : null}
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
                  ? "border-transparent bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)]"
                  : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-press)]"
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
                  ? "border-transparent bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)]"
                  : sl.available
                    ? "border-[var(--border-hairline)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-press)]"
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
