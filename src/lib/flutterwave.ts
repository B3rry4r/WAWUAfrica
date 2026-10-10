/**
 * Flutterwave inline checkout (v3).
 *
 * This is the piece that was missing across every paid flow in the app.
 * Previously each flow (content unlock, tips, paid DMs, credits, creator
 * subscription, CAC/NEPC) called its backend `init` endpoint to create a
 * charge, then immediately called the matching `verify` endpoint with a
 * FABRICATED transaction id (`txn-${Date.now()}`). No card was ever
 * collected, so no money ever moved: against a real Flutterwave adapter the
 * verify call correctly fails, and against the mock adapter it "succeeded"
 * without a payment — which is worse, because it hid the gap.
 *
 * The correct sequence, which this module makes possible, is:
 *   1. POST the backend's init endpoint -> `flutterwaveConfig` {txRef, amount,
 *      currency, publicKey}.
 *   2. `openFlutterwaveCheckout(config)` — Flutterwave's own modal collects
 *      card / bank transfer / USSD on their PCI-compliant surface. We never
 *      see or store card details.
 *   3. Flutterwave's callback hands back a REAL `transaction_id`.
 *   4. POST the backend's verify endpoint with that real id. The server
 *      re-verifies with Flutterwave before granting anything. A client-side
 *      callback alone is never trusted.
 */

const SCRIPT_SRC = "https://checkout.flutterwave.com/v3.js";
const SCRIPT_ID = "flutterwave-checkout-v3";

/** Shape Flutterwave's `callback` receives on a completed charge. */
interface FlutterwaveCallbackResponse {
  transaction_id?: number | string;
  tx_ref?: string;
  status?: string;
  flw_ref?: string;
}

interface FlutterwaveCheckoutOptions {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: { email: string; name?: string; phone_number?: string };
  customizations: { title: string; description: string; logo?: string };
  redirect_url?: string;
  callback: (response: FlutterwaveCallbackResponse) => void;
  onclose: (incomplete?: boolean) => void;
}

interface FlutterwaveModal {
  close: () => void;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: FlutterwaveCheckoutOptions) => FlutterwaveModal;
  }
}

/**
 * Thrown when the payer dismisses the checkout modal without completing
 * payment. Callers should treat this as "nothing happened" (return the user
 * to the pre-payment state) rather than as a failed payment — showing a
 * scary "your bank declined this" screen to someone who simply changed their
 * mind is wrong.
 */
export class FlutterwaveCancelledError extends Error {
  constructor() {
    super("Payment was cancelled before it completed.");
    this.name = "FlutterwaveCancelledError";
  }
}

/** Thrown when the checkout script itself cannot be loaded (offline, blocked). */
export class FlutterwaveUnavailableError extends Error {
  constructor() {
    super("Could not reach Flutterwave. Check your connection and try again.");
    this.name = "FlutterwaveUnavailableError";
  }
}

export function isFlutterwaveCancelled(e: unknown): boolean {
  return e instanceof FlutterwaveCancelledError;
}

let scriptPromise: Promise<void> | null = null;

/**
 * Injects Flutterwave's checkout script once per page and resolves when
 * `window.FlutterwaveCheckout` is callable. Concurrent callers share the
 * same in-flight promise; a failed load is not cached, so a later attempt
 * can retry after a transient network problem.
 */
function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new FlutterwaveUnavailableError());
  }
  if (window.FlutterwaveCheckout) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    // A dead <script id> left in the DOM is worse than none: the next attempt
    // finds it, attaches a listener to a tag whose load/error event already
    // fired, and waits forever. Always start from a clean element.
    document.getElementById(SCRIPT_ID)?.remove();

    const script = document.createElement("script");
    const fail = () => {
      // Not cached, and the element goes with it, so a later attempt is a real
      // retry rather than a permanent hang.
      scriptPromise = null;
      script.remove();
      reject(new FlutterwaveUnavailableError());
    };

    script.addEventListener(
      "load",
      () => {
        if (window.FlutterwaveCheckout) resolve();
        else fail();
      },
      { once: true },
    );
    script.addEventListener("error", fail, { once: true });

    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Warms the checkout script ahead of time.
 *
 * Loading it lazily on the first Pay tap meant a visible dead gap: the button
 * did nothing while a cross-origin script downloaded, which reads as a broken
 * button rather than as loading. Call this once when authenticated chrome
 * mounts; failures are ignored because this is only an optimisation, and the
 * real load path still retries on demand.
 */
export function preloadFlutterwaveCheckout(): void {
  if (typeof window === "undefined") return;
  void loadCheckoutScript().catch(() => undefined);
}

/** The `flutterwaveConfig` every backend init endpoint returns. */
export interface FlutterwaveChargeConfig {
  publicKey: string;
  txRef: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  /**
   * Where Flutterwave sends the browser back after a payment that leaves the
   * page (a bank app, a 3-D Secure page, a USSD hand-off). Optional: callers
   * that omit it behave exactly as before. The page named here must finish
   * the verify on its own, because the page that opened the modal is gone.
   */
  redirectUrl?: string;
}

export interface CheckoutCustomer {
  email: string;
  name?: string;
}

export interface CheckoutResult {
  transaction_id: string;
  tx_ref: string;
}

/**
 * What the caller wants done when the payer comes BACK from a hosted checkout.
 *
 * Only needed in redirect mode: an inline modal resolves in place, so the
 * caller keeps its own promise. A redirect destroys the page, so the intent
 * has to survive the round trip on its own.
 */
export interface CheckoutReturn {
  /** The owning resource's verify endpoint. It re-checks the charge server-side. */
  verifyPath: string;
  /** Extra body fields the verify call needs beyond the transaction id. */
  verifyBody?: Record<string, unknown>;
  /**
   * What the owning endpoint calls the transaction id, and whether it also
   * takes tx_ref.
   *
   * These are NOT uniform across the product: most verify DTOs take
   * `transaction_id` + `tx_ref` (echoing Flutterwave's own callback), while
   * bills, care and legal take a camelCase `transactionId` alone. The global
   * ValidationPipe runs with forbidNonWhitelisted, so sending the wrong shape
   * is a 400, not a tolerated extra field.
   */
  verifyShape?: "snake_with_ref" | "camel_id_only";
  /** Where to land once the charge is verified. */
  successPath: string;
  /** Where to land if they abandoned or it failed. Defaults to the page they left. */
  cancelPath?: string;
  /** Shown while the return page is verifying. */
  label?: string;
}

const PENDING_KEY = "wawu.pendingCharge";

export interface PendingCharge extends CheckoutReturn {
  txRef: string;
}

/**
 * The pending charge, parked across the redirect.
 *
 * sessionStorage rather than a URL parameter: the verify path and body are
 * ours, not Flutterwave's, and round-tripping them through a third party's
 * redirect would let anything come back claiming to be a verify target.
 * Every access is guarded because sessionStorage throws outright in a private
 * window, and a storage failure must not take payment down with it.
 */
export const pendingCharge = {
  set(v: PendingCharge): void {
    try {
      window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(v));
    } catch {
      // Non-fatal: the return page falls back to the home screen.
    }
  },
  take(): PendingCharge | null {
    try {
      const raw = window.sessionStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      window.sessionStorage.removeItem(PENDING_KEY);
      return JSON.parse(raw) as PendingCharge;
    } catch {
      return null;
    }
  },
};

/**
 * True when checkout should REDIRECT rather than open in place.
 *
 * The inline SDK authenticates with a public key. When that key is missing or
 * rejected, inline cannot work at all, and a modal that opens and then says
 * "Invalid public key" is worse than a redirect that completes. The hosted
 * page needs only the secret key, which lives on the server.
 *
 * Explicitly forced with NEXT_PUBLIC_FLUTTERWAVE_MODE=redirect; otherwise it
 * is inferred from the absence of a usable public key, so an environment that
 * never had one does the right thing without extra configuration.
 */
export function shouldRedirectToCheckout(config: FlutterwaveChargeConfig): boolean {
  if (process.env.NEXT_PUBLIC_FLUTTERWAVE_MODE === "inline") return false;
  if (process.env.NEXT_PUBLIC_FLUTTERWAVE_MODE === "redirect") return true;
  // Inline whenever there is a usable public key, because paying without
  // leaving the app is the better experience. Redirect is the FALLBACK, for
  // an environment that has no key at all — which is exactly the state this
  // product was in when the modal opened and then said "Invalid public key".
  //
  // So the choice is made by what is actually configured rather than by a
  // flag somebody has to remember to set: a broken or missing key degrades to
  // a checkout that works instead of one that cannot.
  return !config.publicKey || /mock|placeholder|not-real/i.test(config.publicKey);
}

/**
 * Opens Flutterwave's inline checkout and resolves with the REAL
 * transaction id once the payer completes the charge.
 *
 * Rejects with `FlutterwaveCancelledError` if the modal is dismissed first,
 * `FlutterwaveUnavailableError` if the script cannot load, and a plain Error
 * if Flutterwave reports a non-successful terminal status.
 *
 * The resolved `transaction_id` is only a claim by the client — it means
 * nothing until the caller passes it to the matching server-side `verify`
 * endpoint, which re-checks it directly with Flutterwave.
 */
export async function openFlutterwaveCheckout(
  config: FlutterwaveChargeConfig,
  customer: CheckoutCustomer,
  labels: { title: string; description: string },
  onReturn?: CheckoutReturn,
): Promise<CheckoutResult> {
  if (shouldRedirectToCheckout(config)) {
    if (!onReturn) {
      // A caller that has not said what happens after the round trip cannot
      // be sent on one: the payer would come back to a page with no idea a
      // charge had happened. Better to say so than to take their money and
      // lose the thread.
      throw new Error("Payments are not configured on this environment yet.");
    }
    // NEVER resolves: the line below navigates away and this page is gone.
    // The return page picks the flow back up from the parked record.
    await redirectToHostedCheckout(config, customer, labels, onReturn);
    return new Promise<CheckoutResult>(() => {});
  }

  await loadCheckoutScript();

  const checkout = window.FlutterwaveCheckout;
  if (!checkout) throw new FlutterwaveUnavailableError();

  return new Promise<CheckoutResult>((resolve, reject) => {
    // Flutterwave fires `onclose` after `callback` as the modal tears down.
    // Without this guard a completed payment would immediately be rejected
    // as a cancellation.
    let settled = false;
    let modal: FlutterwaveModal | undefined;

    modal = checkout({
      public_key: config.publicKey,
      tx_ref: config.txRef,
      amount: config.amount,
      currency: config.currency ?? "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: config.customerEmail ?? customer.email,
        name: config.customerName ?? customer.name,
      },
      customizations: {
        title: labels.title,
        description: labels.description,
        logo: typeof window !== "undefined" ? `${window.location.origin}/wawu-logo-white.png` : undefined,
      },
      ...(config.redirectUrl ? { redirect_url: config.redirectUrl } : {}),
      callback: (response) => {
        if (settled) return;
        const status = (response.status ?? "").toLowerCase();
        const transactionId = response.transaction_id;

        if ((status === "successful" || status === "completed") && transactionId) {
          settled = true;
          resolve({ transaction_id: String(transactionId), tx_ref: response.tx_ref ?? config.txRef });
        } else {
          settled = true;
          reject(new Error("Flutterwave did not confirm the payment."));
        }
        modal?.close();
      },
      onclose: () => {
        if (settled) return;
        settled = true;
        reject(new FlutterwaveCancelledError());
      },
    });
  });
}

/**
 * Reads the signed-in user's email/name for Flutterwave's `customer` block.
 * Flutterwave requires an email; if the session somehow has none, the caller
 * should surface a real error rather than invent one.
 */
export function checkoutCustomerFromSession(user: { email?: string; fullName?: string } | null): CheckoutCustomer | null {
  if (!user?.email) return null;
  return { email: user.email, name: user.fullName };
}

/**
 * Sends the payer to Flutterwave's own checkout page.
 *
 * The link is minted server-side, because it needs the SECRET key. The server
 * also re-reads the amount from the charge it already recorded, so nothing
 * here can name a price.
 */
async function redirectToHostedCheckout(
  config: FlutterwaveChargeConfig,
  customer: CheckoutCustomer,
  labels: { title: string; description: string },
  onReturn: CheckoutReturn,
): Promise<void> {
  const { apiFetch } = await import("./api/client");

  pendingCharge.set({
    ...onReturn,
    txRef: config.txRef,
    cancelPath: onReturn.cancelPath ?? window.location.pathname + window.location.search,
  });

  const { link } = await apiFetch<{ link: string }>("/api/hub/payments/hosted-link", {
    method: "POST",
    authed: true,
    body: {
      txRef: config.txRef,
      currency: config.currency ?? "NGN",
      title: labels.title,
      description: labels.description,
      customerEmail: config.customerEmail ?? customer.email,
      redirectUrl: `${window.location.origin}/payment/return`,
    },
  });

  window.location.assign(link);
}
