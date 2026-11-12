"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { APP_ORIGIN } from "@/lib/app-redirects";
import { formatNairaFromKobo } from "@/lib/format";
import { isReference, isTransactionId, joinResume, joinTier, shortReference } from "@/lib/join-session";
import { getRegistrationStatus, refusalOf, verifyRegistration } from "@/lib/api/waitlist";
import { JoinShell } from "../components/JoinShell";
import { JoinSuccess } from "../components/JoinSuccess";
import { StateCard } from "../components/StateCard";

/**
 * /join/paid: where Flutterwave sends the browser back to for a registration that was paid before the join page
 * closed (R-141, owner, 12 Nov 2026). Nothing starts a registration or opens a payment window any more; this page
 * only finishes the server check for a payment that was already made, and says where it stands.
 *
 * ── THE STATES ─────────────────────────────────────────────────────────────
 *   verifying    asking the server where the payment stands
 *   checking     not settled yet ("Checking your payment"); asks again by itself for five minutes
 *   registered   paid: the plan, where to sign in (usewmt.com), and the short reference, small, for support only
 *   extra        registered, and THIS payment was a second one (kept to be refunded)
 *   support      the server refused the payment in a way only a person can settle
 *   notPaid      back from Flutterwave, and nothing was charged
 *   noPayment    this page with nothing to look up
 *
 * ── THE ONE RULE (the page never lies about money) ─────────────────────────
 * "You have not been charged" is said only when ALL of these hold:
 *   1. Flutterwave itself reported cancelled (or failed),
 *   2. no transaction id exists anywhere (the address or storage),
 *   3. and the status route has answered that the registration is not paid.
 * Every other case ends in "Checking your payment" until the server says paid, or in a screen that names the
 * support address and the person's reference. A transaction id is checked with the server, whatever status word
 * came with it. The page never offers to pay again.
 */

const SUPPORT_EMAIL = "support@wawuafrica.com";

/** How often "Checking your payment" asks the status route by itself, and for how long. */
const POLL_EVERY_MS = 15_000;
const POLL_FOR_MS = 5 * 60_000;

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

/** Everything the page knows about one payment before it asks the server. */
interface Evidence {
  reference: string;
  /** A transaction id from the address or from storage. */
  transactionId: string | null;
  /** Set only when Flutterwave said cancelled or failed AND no transaction id exists anywhere. */
  negative: Negative | null;
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
  | { kind: "verifying" }
  | { kind: "checking"; reference: string; transactionId: string | null; negative: Negative | null }
  | { kind: "registered"; reference: string }
  | { kind: "extra"; reference: string }
  | { kind: "support"; reference: string; why: SupportWhy }
  | { kind: "notPaid" }
  | { kind: "noPayment" };

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
async function inspect(ev: Evidence): Promise<Outcome> {
  if (!ev.transactionId) return askStatus(ev.reference);
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

export function PaidReturn() {
  const [phase, setPhase] = useState<Phase>({ kind: "verifying" });
  /** True once "Checking your payment" has gone five minutes without an answer. */
  const [stillChecking, setStillChecking] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const booted = useRef(false);
  /** The checking screen's own data, for the timer that runs while it is up. */
  const checkingRef = useRef<Extract<Phase, { kind: "checking" }> | null>(null);

  /**
   * Draws an outcome. `quiet` is for a re-check that is already on the checking screen: an answer that settles
   * nothing leaves the screen as it is.
   */
  const apply = useCallback((out: Outcome, ev: Evidence, quiet = false) => {
    switch (out.kind) {
      case "paid":
        joinResume.set({ reference: out.reference, transactionId: ev.transactionId ?? undefined });
        setPhase({ kind: "registered", reference: out.reference });
        return;
      case "extra":
        setPhase({ kind: "extra", reference: ev.reference });
        return;
      case "support":
        setPhase({ kind: "support", reference: ev.reference, why: out.why });
        return;
      case "noSuchRegistration":
      case "notPaid":
        // Nothing was charged only when Flutterwave said so, no transaction id exists, and the server agrees.
        if (ev.negative) {
          joinResume.clear();
          setPhase({ kind: "notPaid" });
          return;
        }
        break;
      case "unknown":
        break;
    }
    if (quiet) return;
    setPhase({ kind: "checking", reference: ev.reference, transactionId: ev.transactionId, negative: ev.negative });
  }, []);

  // ── first render: Flutterwave sent the browser back ──────────────────────
  // Whatever status word is in the address, the server decides what was paid.

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const stored = joinResume.get();
    const query = new URLSearchParams(window.location.search);
    const txRef = query.get("tx_ref");
    const rawId = query.get("transaction_id");
    const reference = isReference(txRef) ? txRef : (stored?.reference ?? null);
    if (!reference) {
      setPhase({ kind: "noPayment" });
      return;
    }
    const storedId = stored && stored.reference === reference ? (stored.transactionId ?? null) : null;
    const transactionId = isTransactionId(rawId) ? rawId : storedId;
    // An id that is named but unusable still means a charge may exist.
    const anIdExists = Boolean(rawId) || Boolean(storedId);
    const ev: Evidence = { reference, transactionId, negative: anIdExists ? null : negativeOf(query.get("status")) };
    // Remembered before anything is asked: a refresh now still finds this payment.
    joinResume.set({ reference, transactionId: transactionId ?? undefined });
    void inspect(ev).then((out) => apply(out, ev));
  }, [apply]);

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
      apply(out, { reference: current.reference, transactionId: current.transactionId, negative: current.negative }, true);
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
    const ev: Evidence = { reference: checking.reference, transactionId: checking.transactionId, negative: checking.negative };
    const out = await inspect(ev);
    setRechecking(false);
    apply(out, ev, true);
  }

  // ── what to draw ─────────────────────────────────────────────────────────

  let body: React.ReactNode = null;
  switch (phase.kind) {
    case "verifying":
      body = (
        <StateCard icon="Loader2" spin title="Checking your payment">
          <p className="m-0">This takes a few seconds. Please do not close this page.</p>
        </StateCard>
      );
      break;

    case "checking": {
      const { reference, transactionId, negative } = phase;
      body = (
        <StateCard
          icon="Clock"
          tone="warning"
          title="Checking your payment"
          actions={
            <Button full loading={rechecking} onClick={() => void checkAgain()}>
              Check again
            </Button>
          }
        >
          {negative && !transactionId ? (
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

    case "registered":
      // The plan is named from this tab's storage (kept when the payment was started); the amount is not known here.
      body = (
        <StateCard icon="Check" tone="success" title="You're registered" wide>
          <JoinSuccess tierName={joinTier.get(phase.reference)} reference={shortReference(phase.reference)} />
        </StateCard>
      );
      break;

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
            <Button full href={APP_ORIGIN}>
              Open Who Made This
            </Button>
          }
        >
          <p className="m-0">You have not been charged.</p>
        </StateCard>
      );
      break;

    case "noPayment":
      body = (
        <StateCard
          icon="Undo2"
          title="We couldn't find a payment"
          actions={
            <Button full href={APP_ORIGIN}>
              Open Who Made This
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
  }

  return <JoinShell wordmark>{body}</JoinShell>;
}
