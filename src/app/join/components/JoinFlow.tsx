"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Skeleton } from "@/components/ui";
import {
  FlutterwaveCancelledError,
  FlutterwaveNotConfirmedError,
  FlutterwaveScriptTimeoutError,
  FlutterwaveUnavailableError,
  openFlutterwaveCheckout,
} from "@/lib/flutterwave";
import { formatNairaFromKobo } from "@/lib/format";
import { isReference, isTransactionId, joinResume, shortReference } from "@/lib/join-session";
import {
  getCurrentOffer,
  getRegistrationStatus,
  offerPrice,
  refusalOf,
  startRegistration,
  verifyRegistration,
} from "@/lib/api/waitlist";
import type { WaitlistOffer } from "@/lib/api/waitlist";
import { EMPTY_FIELDS, phoneOf, validateJoin } from "./join-fields";
import type { JoinErrors, JoinFields } from "./join-fields";
import { JoinForm } from "./JoinForm";
import type { FormNotice } from "./JoinForm";
import { JoinHeading } from "./JoinHeading";
import { JoinShell } from "./JoinShell";
import { LaunchAccessCode } from "./LaunchAccessCode";
import { StateCard } from "./StateCard";

/**
 * /join and /join/paid: one flow, one state machine.
 *
 * ── THE STATES ─────────────────────────────────────────────────────────────
 *   loading      reading the open offer (the heading and a skeleton of the form)
 *   form         the fields and the pay button (the price is only on the button)
 *   paying       the Flutterwave window is open
 *   verifying    asking the server where a payment stands
 *   checking     not settled yet ("Checking your payment"); asks again by itself
 *   registered   paid, with the launch access code (the short reference) and how to keep it
 *   already      that phone or email had already paid before this one started
 *   extra        registered, and THIS payment was a second one (kept to be refunded)
 *   support      the server refused the payment in a way only a person can settle
 *   notPaid      back from Flutterwave, and nothing was charged
 *   noPayment    /join/paid with nothing to look up
 *   windowTimeout  Flutterwave's script did not load, nothing was started
 *   closed / none / unreachable   the refusals before any payment
 *
 * ── THE ONE RULE (the page never lies about money) ─────────────────────────
 * "You have not been charged" is said only when ALL of these hold:
 *   1. Flutterwave itself reported cancelled (or failed),
 *   2. no transaction id exists anywhere (the address, the callback, storage),
 *   3. and the status route has answered that the registration is not paid.
 * Every other case ends in "Checking your payment" (never the form, never a
 * pay button, never "not charged") until the server says paid, or in a screen
 * that names the support address and the person's reference. A transaction id
 * is checked with the server, whatever status word came with it.
 * The stored reference is not cleared while the outcome is unknown.
 *
 * ── WHAT IS KEPT ───────────────────────────────────────────────────────────
 * The reference (and the transaction id once there is one) in sessionStorage,
 * so a refresh resumes. The name, phone and email stay in this component's
 * state and are never written anywhere. See lib/join-session.ts.
 */

const SUPPORT_EMAIL = "support@wawuafrica.com";

/** How often "Checking your payment" asks the status route by itself, and for how long. */
const POLL_EVERY_MS = 15_000;
const POLL_FOR_MS = 5 * 60_000;

/** Flutterwave's checkout script gets this long to arrive before the person is told. */
const SCRIPT_TIMEOUT_MS = 15_000;

/** A 429 on the offer load is retried by itself after these waits, then handed back to the person. */
const BUSY_RETRY_MS = [2_000, 4_000, 8_000];

/** The two statuses that mean "Flutterwave says no charge was made". Anything else is not trusted as that. */
type Negative = "cancelled" | "failed";

function negativeOf(status: string | null | undefined): Negative | null {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "failed") return "failed";
  return null;
}

/** Why a payment needs a person at WAWU rather than another check. */
type SupportWhy = "mismatch" | "used" | "missing";

/** Where the person is coming from, which decides the words and the way out. */
type From = "window" | "return" | "stored";

/** Everything the page knows about one payment before it asks the server. */
interface Evidence {
  reference: string;
  /** A transaction id from anywhere: the callback, the address, or storage. */
  transactionId: string | null;
  /** Set only when Flutterwave said cancelled or failed AND no transaction id exists anywhere. */
  negative: Negative | null;
  from: From;
}

/** What the server said about the payment. */
type Outcome =
  | { kind: "paid"; reference: string; firstName: string }
  | { kind: "extra" }
  | { kind: "support"; why: SupportWhy }
  | { kind: "notPaid" }
  | { kind: "noSuchRegistration" }
  | { kind: "unknown" };

type Phase =
  | { kind: "loading" }
  | { kind: "unreachable"; busy: boolean; retrying: boolean }
  | { kind: "none" }
  | { kind: "closed" }
  | { kind: "form" }
  | { kind: "paying" }
  | { kind: "verifying" }
  | { kind: "checking"; reference: string; transactionId: string | null; negative: Negative | null; from: From }
  | { kind: "registered"; firstName: string; reference: string }
  | { kind: "already" }
  | { kind: "extra"; reference: string }
  | { kind: "support"; reference: string; why: SupportWhy }
  | { kind: "notPaid"; negative: Negative }
  | { kind: "noPayment" }
  | { kind: "windowTimeout" };

const NOT_CHARGED: FormNotice = { tone: "info", text: "You have not been charged." };
const DECLINED: FormNotice = {
  tone: "warning",
  title: "Your payment did not go through",
  text: "You have not been charged. Try again, or pay another way.",
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ── asking the server ───────────────────────────────────────────────────────

/** The status route: cheap, and it also shows what the webhook and the server's own re-check have done. */
async function askStatus(reference: string): Promise<Outcome> {
  try {
    const s = await getRegistrationStatus(reference);
    if (s.status === "paid") return { kind: "paid", reference, firstName: s.firstName };
    // `failed` on the server is a second payment by someone already registered, kept for a refund.
    if (s.status === "failed") return { kind: "extra" };
    return { kind: "notPaid" };
  } catch (e) {
    return refusalOf(e).kind === "not_found" ? { kind: "noSuchRegistration" } : { kind: "unknown" };
  }
}

/** The verify route: the server asks Flutterwave itself. Every refusal it can give has an answer here. */
async function askVerify(reference: string, transactionId: string): Promise<Outcome> {
  try {
    const r = await verifyRegistration(reference, transactionId);
    return r.paid ? { kind: "paid", reference: r.reference, firstName: r.firstName } : { kind: "unknown" };
  } catch (e) {
    switch (refusalOf(e).kind) {
      case "already_registered":
        return { kind: "extra" };
      case "payment_mismatch":
        return { kind: "support", why: "mismatch" };
      case "transaction_already_used":
        return { kind: "support", why: "used" };
      case "not_found":
        return { kind: "support", why: "missing" };
      default:
        // payment_not_confirmed, payment_check_unavailable, no network, 429, 5xx, a code not known yet:
        // the payment is not settled as far as we can tell, so it stays "Checking your payment".
        return { kind: "unknown" };
    }
  }
}

/** With a transaction id the server is asked to verify it. Without one, only the status route can say. */
async function inspect(ev: Evidence, statusFirst: boolean): Promise<Outcome> {
  if (!ev.transactionId) return askStatus(ev.reference);
  if (statusFirst) {
    const s = await askStatus(ev.reference);
    if (s.kind === "paid" || s.kind === "extra") return s;
  }
  return askVerify(ev.reference, ev.transactionId);
}

/** "Email support@wawuafrica.com with your reference XXXX XXXX." */
function SupportLine({ reference }: { reference: string }) {
  return (
    <p className="m-0">
      Email{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-accent-hover underline underline-offset-2">
        {SUPPORT_EMAIL}
      </a>{" "}
      with your reference{" "}
      <span data-testid="support-reference" className="whitespace-nowrap font-mono font-bold tracking-[0.08em] text-text-primary">
        {shortReference(reference)}
      </span>
      .
    </p>
  );
}

export function JoinFlow({ mode = "form" }: { mode?: "form" | "return" }) {
  // The first paint (also the static HTML) already says what the page is: the
  // form's heading and skeleton, or "Checking your payment" on the return page.
  const [phase, setPhase] = useState<Phase>(mode === "return" ? { kind: "verifying" } : { kind: "loading" });
  const [offer, setOffer] = useState<WaitlistOffer | null>(null);
  const [fields, setFields] = useState<JoinFields>(EMPTY_FIELDS);
  const [touched, setTouched] = useState<Partial<Record<keyof JoinErrors, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<FormNotice | null>(null);
  /** A field the server refused (it can judge a phone number better than we can). Cleared when the person edits that field. */
  const [serverErrors, setServerErrors] = useState<JoinErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  /** True once "Checking your payment" has gone five minutes without an answer. */
  const [stillChecking, setStillChecking] = useState(false);
  const booted = useRef(false);
  /**
   * One registration call and one window, however fast the taps come. State
   * alone is not enough: two taps inside one JavaScript task both see the same
   * (old) state, so this is a ref that is set before anything is awaited.
   */
  const payLock = useRef(false);
  /** Which offer load is current, so an older one (a retry wait) does not overwrite a newer one. */
  const loadToken = useRef(0);
  /** The checking screen's own data, for the timer that runs while it is up. */
  const checkingRef = useRef<Extract<Phase, { kind: "checking" }> | null>(null);

  // ── reading the offer ────────────────────────────────────────────────────

  const loadOffer = useCallback(async () => {
    payLock.current = false;
    const token = ++loadToken.current;
    setPhase({ kind: "loading" });
    for (let tries = 0; ; tries++) {
      try {
        const current = await getCurrentOffer();
        if (token !== loadToken.current) return;
        setOffer(current);
        setPhase({ kind: "form" });
        return;
      } catch (e) {
        if (token !== loadToken.current) return;
        const refusal = refusalOf(e);
        if (refusal.kind === "no_open_offer") {
          setPhase({ kind: "none" });
          return;
        }
        if (refusal.kind !== "rate_limited") {
          setPhase({ kind: "unreachable", busy: false, retrying: false });
          return;
        }
        // Busy right now (a crowd on one connection): wait a little and ask again by itself.
        if (tries >= BUSY_RETRY_MS.length) {
          setPhase({ kind: "unreachable", busy: true, retrying: false });
          return;
        }
        setPhase({ kind: "unreachable", busy: true, retrying: true });
        await sleep(BUSY_RETRY_MS[tries]);
        if (token !== loadToken.current) return;
      }
    }
  }, []);

  const showForm = useCallback(
    async (withNotice: FormNotice | null = null) => {
      setNotice(withNotice);
      await loadOffer();
    },
    [loadOffer],
  );

  // ── what the server's answer means for the screen ────────────────────────

  /** Nothing was charged and the server agrees. The only place "not charged" is decided. */
  const notCharged = useCallback(
    (ev: Evidence & { negative: Negative }) => {
      joinResume.clear();
      if (ev.from === "return") {
        setPhase({ kind: "notPaid", negative: ev.negative });
        return;
      }
      payLock.current = false;
      setNotice(ev.negative === "failed" ? DECLINED : NOT_CHARGED);
      setPhase({ kind: "form" });
    },
    [],
  );

  /**
   * Draws an outcome. `quiet` is for a re-check that is already on the
   * checking screen: an answer that settles nothing leaves the screen as it is.
   */
  const apply = useCallback(
    (out: Outcome, ev: Evidence, quiet = false) => {
      switch (out.kind) {
        case "paid":
          joinResume.set({ reference: out.reference, transactionId: ev.transactionId ?? undefined });
          setPhase({ kind: "registered", firstName: out.firstName, reference: out.reference });
          return;
        case "extra":
          setPhase({ kind: "extra", reference: ev.reference });
          return;
        case "support":
          setPhase({ kind: "support", reference: ev.reference, why: out.why });
          return;
        case "noSuchRegistration":
          // Nothing stored here is known to the server. With no transaction id there is nothing to wait for.
          if (ev.from === "stored" && !ev.transactionId) {
            joinResume.clear();
            void showForm();
            return;
          }
        // falls through: no transaction id and a negative word means no charge; otherwise keep checking
        case "notPaid":
          if (ev.negative) {
            notCharged({ ...ev, negative: ev.negative });
            return;
          }
          break;
        case "unknown":
          break;
      }
      if (quiet) return;
      setPhase({ kind: "checking", reference: ev.reference, transactionId: ev.transactionId, negative: ev.negative, from: ev.from });
    },
    [notCharged, showForm],
  );

  /** Asks the server about a payment and shows the answer. */
  const conclude = useCallback(
    async (ev: Evidence, statusFirst = false) => {
      setPhase({ kind: "verifying" });
      // Remembered before anything is asked: a refresh now still finds this payment.
      joinResume.set({ reference: ev.reference, transactionId: ev.transactionId ?? undefined });
      apply(await inspect(ev, statusFirst), ev);
    },
    [apply],
  );

  // ── first render ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const stored = joinResume.get();

    if (mode === "return") {
      // Flutterwave sent the browser back. Whatever status word is in the
      // address, the server decides what was paid: this never says "not
      // charged" unless Flutterwave said cancelled, no transaction id exists
      // anywhere, and the status route agrees.
      const query = new URLSearchParams(window.location.search);
      const txRef = query.get("tx_ref");
      const rawId = query.get("transaction_id");
      const reference = isReference(txRef) ? txRef : stored?.reference ?? null;
      if (!reference) {
        setPhase({ kind: "noPayment" });
        return;
      }
      const storedId = stored && stored.reference === reference ? stored.transactionId ?? null : null;
      const transactionId = isTransactionId(rawId) ? rawId : storedId;
      // An id that is named but unusable still means a charge may exist.
      const anIdExists = Boolean(rawId) || Boolean(storedId);
      void conclude({
        reference,
        transactionId,
        negative: anIdExists ? null : negativeOf(query.get("status")),
        from: "return",
      });
      return;
    }

    if (stored) {
      void conclude({ reference: stored.reference, transactionId: stored.transactionId ?? null, negative: null, from: "stored" }, true);
      return;
    }
    void showForm();
  }, [mode, conclude, showForm]);

  // ── "Checking your payment" asks by itself ───────────────────────────────

  const checking = phase.kind === "checking" ? phase : null;
  checkingRef.current = checking;
  const checkingReference = checking?.reference ?? null;

  useEffect(() => {
    if (!checkingReference) return;
    setStillChecking(false);
    let live = true;
    let ticks = 0;
    const timer = setInterval(async () => {
      const current = checkingRef.current;
      if (!current) return;
      ticks += 1;
      if (ticks >= POLL_FOR_MS / POLL_EVERY_MS) clearInterval(timer);
      const out = await askStatus(current.reference);
      if (!live) return;
      apply(
        out,
        { reference: current.reference, transactionId: current.transactionId, negative: current.negative, from: current.from },
        true,
      );
    }, POLL_EVERY_MS);
    const flag = setTimeout(() => setStillChecking(true), POLL_FOR_MS);
    return () => {
      live = false;
      clearInterval(timer);
      clearTimeout(flag);
    };
  }, [checkingReference, apply]);

  async function checkAgain() {
    if (!checking || rechecking) return;
    setRechecking(true);
    const ev: Evidence = { reference: checking.reference, transactionId: checking.transactionId, negative: checking.negative, from: checking.from };
    const out = await inspect(ev, false);
    setRechecking(false);
    apply(out, ev, true);
  }

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
    if (payLock.current) return;
    setSubmitted(true);
    if (Object.keys(allErrors).length > 0 || !offer) {
      setAttempt((n) => n + 1);
      return;
    }

    payLock.current = true;
    setSubmitting(true);
    setNotice(null);
    setServerErrors({});
    let reference: string | null = null;
    try {
      const started = await startRegistration(offer, {
        fullName: fields.fullName.trim(),
        phone: phoneOf(fields),
        email: fields.email.trim().toLowerCase(),
        state: fields.state || undefined,
        makes: fields.makes.trim() || undefined,
      });
      reference = started.reference;

      // The server's amount is the truth. If it is not the fee the button showed
      // (the price changed while the form was open), no window opens: the
      // button is updated and the person decides again.
      if (started.amountKobo !== offer.priceKobo || Math.round(started.checkout.amount * 100) !== started.amountKobo) {
        setOffer({ ...offer, priceKobo: started.amountKobo });
        payLock.current = false;
        setSubmitting(false);
        setNotice({ tone: "warning", text: `The fee is now ${formatNairaFromKobo(started.amountKobo)}. Tap Pay to continue.` });
        return;
      }

      joinResume.set({ reference });
      setPhase({ kind: "paying" });
      setSubmitting(false);

      const result = await openFlutterwaveCheckout(
        { ...started.checkout, redirectUrl: `${window.location.origin}/join/paid` },
        { email: fields.email.trim().toLowerCase(), name: fields.fullName.trim() },
        { title: "WAWU", description: "Event registration fee" },
        undefined,
        { scriptTimeoutMs: SCRIPT_TIMEOUT_MS },
      );
      await conclude({ reference, transactionId: result.transaction_id, negative: null, from: "window" });
    } catch (e) {
      setSubmitting(false);

      // The window was closed. That is only "not charged" if the server agrees.
      if (e instanceof FlutterwaveCancelledError && reference) {
        await conclude({ reference, transactionId: null, negative: "cancelled", from: "window" });
        return;
      }
      // Flutterwave's callback said the payment is not complete. A transaction
      // id in it means a charge exists whatever the status word says.
      if (e instanceof FlutterwaveNotConfirmedError && reference) {
        const idNamed = Boolean(e.transactionId);
        await conclude({
          reference,
          transactionId: isTransactionId(e.transactionId) ? e.transactionId : null,
          negative: idNamed ? null : negativeOf(e.status),
          from: "window",
        });
        return;
      }

      // Everything below happened before any payment window was open.
      payLock.current = false;
      joinResume.clear();
      if (e instanceof FlutterwaveScriptTimeoutError) {
        setPhase({ kind: "windowTimeout" });
        return;
      }
      if (e instanceof FlutterwaveUnavailableError) {
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
          setPhase({ kind: "already" });
          return;
        case "offer_closed":
          setPhase({ kind: "closed" });
          return;
        case "no_open_offer":
          setPhase({ kind: "none" });
          return;
        default:
          break;
      }
      // Failures before any money moved: say what happened and keep the form.
      setPhase({ kind: "form" });
      if (refusal.kind === "field") {
        setServerErrors({ [refusal.field]: refusal.message });
        setAttempt((n) => n + 1);
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
        <div className="flex flex-col gap-6" aria-busy="true">
          <JoinHeading />
          <div className="flex flex-col gap-5 rounded-card border border-hairline bg-card p-5 dt:p-6" aria-hidden="true">
            <div className="h-[72px]"><Skeleton variant="media" /></div>
            <div className="h-[72px]"><Skeleton variant="media" /></div>
            <div className="h-[72px]"><Skeleton variant="media" /></div>
            <div className="h-[56px]"><Skeleton variant="media" /></div>
          </div>
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
              ? phase.retrying
                ? "Busy right now. Trying again..."
                : "Many people are registering from this connection right now. Try again in a few seconds. Nothing was charged."
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
            the Who Made This app with it and your plan will be waiting.
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
      const { reference, transactionId, negative, from } = phase;
      const canRestart = from === "stored" && !transactionId;
      body = (
        <StateCard
          icon="Clock"
          tone="warning"
          title="Checking your payment"
          actions={
            <>
              <Button full loading={rechecking} onClick={() => void checkAgain()}>
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
          ) : negative && !transactionId ? (
            <p className="m-0">We are making sure no payment was taken. Check again in a moment.</p>
          ) : (
            <p className="m-0">
              We have not confirmed your payment yet. If money left your account it is safe, and you will not be charged
              twice. Check again in a moment.
            </p>
          )}
          {stillChecking ? (
            <p className="m-0" data-testid="still-checking">
              Still checking. If money left your account, email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-accent-hover underline underline-offset-2">
                {SUPPORT_EMAIL}
              </a>{" "}
              with your reference{" "}
              <span className="whitespace-nowrap font-mono font-bold tracking-[0.08em] text-text-primary">
                {shortReference(reference)}
              </span>
              .
            </p>
          ) : null}
        </StateCard>
      );
      break;
    }

    case "registered": {
      body = (
        <StateCard icon="Check" tone="success" title="YOUR WHO MADE THIS? LAUNCH ACCESS CODE" wide>
          <LaunchAccessCode code={shortReference(phase.reference)} />
        </StateCard>
      );
      break;
    }

    case "extra":
      body = (
        <StateCard icon="CircleCheck" tone="info" title="You're already registered">
          <p className="m-0">This extra payment will be refunded.</p>
          <SupportLine reference={phase.reference} />
        </StateCard>
      );
      break;

    case "support":
      body = (
        <StateCard
          icon="TriangleAlert"
          tone="warning"
          title={
            phase.why === "mismatch"
              ? "We need to check your payment"
              : phase.why === "used"
                ? "This payment was already used"
                : "We couldn't find your registration"
          }
        >
          <p className="m-0">
            {phase.why === "mismatch"
              ? "The payment we received does not match your registration."
              : phase.why === "used"
                ? "It is linked to another registration."
                : "We have no registration with this reference."}
          </p>
          <SupportLine reference={phase.reference} />
        </StateCard>
      );
      break;

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

    case "noPayment":
      body = (
        <StateCard
          icon="Undo2"
          title="We couldn't find a payment"
          actions={
            <Button full href="/join">
              Back to registration
            </Button>
          }
        >
          <p className="m-0">
            This page has no payment to check. If money left your account, email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-accent-hover underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </StateCard>
      );
      break;

    case "windowTimeout":
      body = (
        <StateCard
          icon="WifiOff"
          tone="warning"
          title="Payment did not start"
          actions={
            <Button full onClick={() => void pay()}>
              Try again
            </Button>
          }
        >
          <p className="m-0">The payment window did not load. Check your connection and try again.</p>
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
          attempt={attempt}
          onChange={change}
          onBlurField={(name) => setTouched((t) => ({ ...t, [name]: true }))}
          onSubmit={() => void pay()}
        />
      ) : null;
      break;
  }

  return <JoinShell>{body}</JoinShell>;
}
