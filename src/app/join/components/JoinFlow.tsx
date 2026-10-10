"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Skeleton } from "@/components/ui";
import { FlutterwaveCancelledError, FlutterwaveUnavailableError, openFlutterwaveCheckout } from "@/lib/flutterwave";
import { isReference, isTransactionId, joinResume, shortReference } from "@/lib/join-session";
import {
  getCurrentOffer,
  getRegistrationStatus,
  refusalOf,
  startRegistration,
  offerPrice,
  verifyRegistration,
} from "@/lib/api/waitlist";
import type { WaitlistOffer } from "@/lib/api/waitlist";
import { EMPTY_FIELDS, phoneOf, validateJoin } from "./join-fields";
import type { JoinErrors, JoinFields } from "./join-fields";
import { JoinForm } from "./JoinForm";
import type { FormNotice } from "./JoinForm";
import { JoinShell } from "./JoinShell";
import { StateCard } from "./StateCard";

/**
 * /join and /join/paid: one flow, one state machine.
 *
 * ── THE STATES ─────────────────────────────────────────────────────────────
 *   loading      reading the open offer (or resuming a registration)
 *   form         the fields and the pay button (the price is only on the button)
 *   paying       the Flutterwave window is open
 *   verifying    a transaction id came back, the server is re-checking it
 *   checking     the check did not settle yet ("Checking your payment")
 *   registered   paid, with the person's first name and reference
 *   already      that phone or email has already paid (nothing was charged)
 *   closed / none / unreachable / notPaid   the refusals
 *
 * ── WHAT NEVER HAPPENS ─────────────────────────────────────────────────────
 * Once Flutterwave has handed back a transaction id the person HAS paid, so
 * from there the page only ever re-checks (`checking`); it never shows the form
 * or a pay button again. Before that, cancelling returns to the form and says
 * nothing was charged.
 *
 * ── WHAT IS KEPT ───────────────────────────────────────────────────────────
 * The reference (and the transaction id once there is one) in sessionStorage,
 * so a refresh resumes. The name, phone and email stay in this component's
 * state and are never written anywhere. See lib/join-session.ts.
 */
type Phase =
  | { kind: "loading" }
  | { kind: "unreachable"; busy: boolean }
  | { kind: "none" }
  | { kind: "closed" }
  | { kind: "form" }
  | { kind: "paying" }
  | { kind: "verifying" }
  | { kind: "checking"; reference: string; transactionId: string | null; canRestart: boolean }
  | { kind: "registered"; firstName: string; reference: string }
  | { kind: "already" }
  | { kind: "notPaid" };

const NOT_CHARGED: FormNotice = { tone: "info", text: "You have not been charged." };

/** Flutterwave's window answered, and the answer was not "paid" (a declined card, say). */
function isDeclinedPayment(e: unknown): boolean {
  return e instanceof Error && /did not confirm the payment/i.test(e.message);
}

export function JoinFlow({ mode = "form" }: { mode?: "form" | "return" }) {
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [offer, setOffer] = useState<WaitlistOffer | null>(null);
  const [fields, setFields] = useState<JoinFields>(EMPTY_FIELDS);
  const [touched, setTouched] = useState<Partial<Record<keyof JoinErrors, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<FormNotice | null>(null);
  /** A field the server refused (it can judge a phone number better than we can). Cleared when the person edits that field. */
  const [serverErrors, setServerErrors] = useState<JoinErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const booted = useRef(false);

  // ── reading the offer ────────────────────────────────────────────────────

  const showForm = useCallback(async (withNotice: FormNotice | null = null) => {
    setNotice(withNotice);
    setPhase({ kind: "loading" });
    try {
      setOffer(await getCurrentOffer());
      setPhase({ kind: "form" });
    } catch (e) {
      const refusal = refusalOf(e);
      setPhase(refusal.kind === "no_open_offer" ? { kind: "none" } : { kind: "unreachable", busy: refusal.kind === "rate_limited" });
    }
  }, []);

  // ── finishing a payment ──────────────────────────────────────────────────

  const settle = useCallback(async (reference: string, transactionId: string) => {
    setPhase({ kind: "verifying" });
    joinResume.set({ reference, transactionId });
    try {
      const paid = await verifyRegistration(reference, transactionId);
      if (paid.paid) {
        joinResume.set({ reference: paid.reference, transactionId });
        setPhase({ kind: "registered", firstName: paid.firstName, reference: paid.reference });
        return;
      }
      setPhase({ kind: "checking", reference, transactionId, canRestart: false });
    } catch {
      // Whatever went wrong, the charge already happened. Re-check; never pay again.
      setPhase({ kind: "checking", reference, transactionId, canRestart: false });
    }
  }, []);

  /** Asks the server where a stored registration stands, and shows that. */
  const resume = useCallback(
    async (reference: string, transactionId: string | null) => {
      setPhase({ kind: "verifying" });
      try {
        const status = await getRegistrationStatus(reference);
        if (status.paid) {
          setPhase({ kind: "registered", firstName: status.firstName, reference });
          return;
        }
        if (status.failed) {
          joinResume.clear();
          await showForm({
            tone: "warning",
            text: "Your last payment did not go through. You have not been charged.",
          });
          return;
        }
        if (transactionId) {
          await settle(reference, transactionId);
          return;
        }
        setPhase({ kind: "checking", reference, transactionId: null, canRestart: true });
      } catch (e) {
        if (refusalOf(e).kind === "not_found") {
          joinResume.clear();
          await showForm();
          return;
        }
        setPhase({ kind: "checking", reference, transactionId, canRestart: transactionId === null });
      }
    },
    [settle, showForm],
  );

  // ── first render ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const stored = joinResume.get();

    if (mode === "return") {
      // Flutterwave sent the browser back. The status in the URL only tells a
      // finished payment from a backed-out one; the server decides what was paid.
      const status = (params.get("status") ?? "").toLowerCase();
      const txRef = params.get("tx_ref");
      const transactionId = params.get("transaction_id");
      const reference = isReference(txRef) ? txRef : stored?.reference ?? null;
      const finished = status === "" || status === "successful" || status === "completed";
      if (reference && isTransactionId(transactionId) && finished) {
        void settle(reference, transactionId);
        return;
      }
      joinResume.clear();
      setPhase({ kind: "notPaid" });
      return;
    }

    if (stored) {
      void resume(stored.reference, stored.transactionId ?? null);
      return;
    }
    void showForm();
  }, [mode, params, resume, settle, showForm]);

  // ── the form ─────────────────────────────────────────────────────────────

  const allErrors = validateJoin(fields);
  const visibleErrors: JoinErrors = {};
  (Object.keys(allErrors) as Array<keyof JoinErrors>).forEach((name) => {
    if (submitted || touched[name]) visibleErrors[name] = allErrors[name];
  });
  // What the server said wins over our own wording for the same field.
  Object.assign(visibleErrors, serverErrors);

  function change(patch: Partial<JoinFields>) {
    setFields((f) => ({ ...f, ...patch }));
    const edited: Partial<Record<keyof JoinFields, keyof JoinErrors>> = {
      fullName: "fullName",
      phone: "phone",
      dialCode: "phone",
      email: "email",
      consent: "consent",
    };
    const cleared = (Object.keys(patch) as Array<keyof JoinFields>).map((k) => edited[k]).filter(Boolean) as Array<keyof JoinErrors>;
    if (cleared.some((name) => serverErrors[name])) {
      setServerErrors((current) => {
        const next = { ...current };
        cleared.forEach((name) => delete next[name]);
        return next;
      });
    }
  }

  async function pay() {
    setSubmitted(true);
    if (Object.keys(allErrors).length > 0 || !offer) return;

    setSubmitting(true);
    setNotice(null);
    setServerErrors({});
    let reference: string;
    try {
      const started = await startRegistration(offer, {
        fullName: fields.fullName.trim(),
        phone: phoneOf(fields),
        email: fields.email.trim().toLowerCase(),
        state: fields.state || undefined,
        makes: fields.makes.trim() || undefined,
      });
      reference = started.reference;
      joinResume.set({ reference });
      setPhase({ kind: "paying" });
      setSubmitting(false);

      const result = await openFlutterwaveCheckout(
        { ...started.checkout, redirectUrl: `${window.location.origin}/join/paid` },
        { email: fields.email.trim().toLowerCase(), name: fields.fullName.trim() },
        { title: offer.name, description: "Event registration fee" },
      );
      await settle(reference, result.transaction_id);
    } catch (e) {
      setSubmitting(false);
      if (e instanceof FlutterwaveCancelledError) {
        joinResume.clear();
        setPhase({ kind: "form" });
        setNotice(NOT_CHARGED);
        return;
      }
      if (e instanceof FlutterwaveUnavailableError) {
        joinResume.clear();
        setPhase({ kind: "form" });
        setNotice({
          tone: "danger",
          title: "We couldn't open the payment window",
          text: "Check your connection and try again. You have not been charged.",
        });
        return;
      }
      const refusal = refusalOf(e);
      switch (refusal.kind) {
        case "already_registered":
          joinResume.clear();
          setPhase({ kind: "already" });
          return;
        case "offer_closed":
          joinResume.clear();
          setPhase({ kind: "closed" });
          return;
        case "no_open_offer":
          joinResume.clear();
          setPhase({ kind: "none" });
          return;
        default:
          break;
      }
      // Failures before any money moved: say what happened and keep the form.
      joinResume.clear();
      setPhase({ kind: "form" });
      if (refusal.kind === "field") {
        setServerErrors({ [refusal.field]: refusal.message });
        return;
      }
      if (isDeclinedPayment(e)) {
        setNotice({
          tone: "warning",
          title: "Your payment did not go through",
          text: "You have not been charged. Try again, or pay another way.",
        });
        return;
      }
      setNotice({
        tone: refusal.kind === "rate_limited" ? "warning" : "danger",
        text: "message" in refusal ? refusal.message : "Something went wrong. You have not been charged. Try again in a moment.",
      });
    }
  }

  // ── what to draw ─────────────────────────────────────────────────────────

  let body: React.ReactNode;
  switch (phase.kind) {
    case "loading":
      body = (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
          <div className="h-[16px] w-[140px]"><Skeleton variant="media" /></div>
          <div className="h-[44px] w-[260px]"><Skeleton variant="media" /></div>
          <div className="h-[420px]"><Skeleton variant="card" /></div>
        </div>
      );
      break;

    case "unreachable":
      body = (
        <StateCard
          icon={phase.busy ? "Clock" : "WifiOff"}
          tone="warning"
          title={phase.busy ? "Please wait a moment" : "We couldn't reach WAWU"}
          actions={
            <Button full onClick={() => void showForm()}>
              Try again
            </Button>
          }
        >
          <p className="m-0">
            {phase.busy
              ? "Many people are registering from this connection right now. Wait a minute, then try again. Nothing was charged."
              : "Check your connection and try again. Nothing was charged."}
          </p>
        </StateCard>
      );
      break;

    case "none":
      body = (
        <StateCard
          icon="CalendarX"
          title="Registration is not open right now"
          actions={
            <Button full variant="secondary" onClick={() => void showForm()}>
              Check again
            </Button>
          }
        >
          <p className="m-0">There is no event registration open at the moment. Please check back soon.</p>
        </StateCard>
      );
      break;

    case "closed":
      body = (
        <StateCard icon="CalendarX" title="Registration has closed">
          <p className="m-0">This registration closed before your payment started, so you have not been charged.</p>
        </StateCard>
      );
      break;

    case "already":
      body = (
        <StateCard
          icon="CircleCheck"
          tone="info"
          title="You are already registered"
          actions={
            <Button full variant="secondary" onClick={() => void showForm()}>
              Use different details
            </Button>
          }
        >
          <p className="m-0">
            That phone number or email has already paid for this event, so you have not been charged again. Sign up in
            the WAWU app with it and your plan will be waiting.
          </p>
        </StateCard>
      );
      break;

    case "paying":
      body = (
        <StateCard icon="Loader2" spin title="Opening secure payment">
          <p className="m-0">Finish paying in the payment window. Please do not close this page.</p>
        </StateCard>
      );
      break;

    case "verifying":
      body = (
        <StateCard icon="Loader2" spin title="Checking your payment">
          <p className="m-0">This takes a few seconds. Please do not close this page.</p>
        </StateCard>
      );
      break;

    case "checking": {
      const { reference, transactionId, canRestart } = phase;
      body = (
        <StateCard
          icon="Clock"
          tone="warning"
          title="Checking your payment"
          actions={
            <>
              <Button
                full
                onClick={() => void (transactionId ? settle(reference, transactionId) : resume(reference, null))}
              >
                Check again
              </Button>
              {canRestart ? (
                <Button
                  full
                  variant="ghost"
                  onClick={() => {
                    joinResume.clear();
                    void showForm();
                  }}
                >
                  I have not paid. Start again
                </Button>
              ) : null}
            </>
          }
        >
          {canRestart ? (
            <p className="m-0">
              You started a payment on this device. If you finished paying, check again. If you did not pay, you can
              start again.
            </p>
          ) : (
            <p className="m-0">
              We have not confirmed your payment yet. If money left your account it is safe, and you will not be charged
              twice. Check again in a moment.
            </p>
          )}
        </StateCard>
      );
      break;
    }

    case "registered": {
      body = (
        <StateCard icon="Check" tone="success" title={`You're registered, ${phase.firstName}`}>
          <div className="flex flex-col items-center gap-1 rounded-input border border-hairline bg-input px-5 py-3">
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-text-muted">Your reference</span>
            <span
              data-testid="short-reference"
              className="font-mono text-[28px] font-bold leading-[1.15] tracking-[0.12em] text-text-primary"
            >
              {shortReference(phase.reference)}
            </span>
          </div>
          <p className="m-0">Sign up in the WAWU app with this phone number or email and your plan will be waiting.</p>
        </StateCard>
      );
      break;
    }

    case "notPaid":
      body = (
        <StateCard
          icon="Undo2"
          title="Payment not completed"
          actions={
            <Button full href="/join">
              Back to registration
            </Button>
          }
        >
          <p className="m-0">You have not been charged. You can go back and try again.</p>
        </StateCard>
      );
      break;

    case "form":
      body = offer ? (
        <JoinForm
          price={offerPrice(offer)}
          fields={fields}
          errors={visibleErrors}
          notice={notice}
          submitting={submitting}
          onChange={change}
          onBlurField={(name) => setTouched((t) => ({ ...t, [name]: true }))}
          onSubmit={() => void pay()}
        />
      ) : null;
      break;
  }

  return <JoinShell>{body}</JoinShell>;
}

