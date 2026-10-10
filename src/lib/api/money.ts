import { ApiError, apiFetch } from "@/lib/api/client";
import type { components } from "@/types/api.generated";

/**
 * The Hub's money routes (`/api/hub/money/*`): the wallet as the person's
 * wallet provider runs it, as opposed to `wallet.ts`, which is the earlier
 * creator payout account and stays as it is until it is removed.
 *
 * ── WHAT THIS MODULE COVERS ────────────────────────────────────────────────
 * Opening a wallet: the wallet's state, the details sent for review, the two
 * documents, the hosted selfie, and the transaction PIN. Adding money, paying
 * and sending belong to the screens that need them and add their own calls
 * here.
 *
 * ── SHAPES ARE NOT TYPED BY HAND ───────────────────────────────────────────
 * Every request and response type below is the generated contract
 * (`src/types/api.generated.ts`, produced from the backend's own OpenAPI), so
 * a field the API renames cannot quietly keep compiling here. The one
 * exception is the list of `reason.code` words the document routes answer
 * with: the contract names them only in each route's description (its error
 * envelope for those routes does not type `reason`), so `DocumentReasonCode`
 * below lists them by hand, from backend docs/contract/CONVENTIONS.md
 * section 17.
 *
 * ── NO MOCK FALLBACK, DELIBERATELY ─────────────────────────────────────────
 * Most modules in this folder answer with fixtures when no backend is
 * configured. This one does not. A fixture here would be a wallet that
 * "opens" and "approves" with nothing behind it, which is exactly the false
 * success `client.ts` warns about for anything that touches money. With no
 * backend the screens show the unreachable state and say so.
 *
 * ── WHAT NEVER LEAVES THIS FILE'S CALLS ────────────────────────────────────
 * A BVN, NIN, ID number, PIN or document goes to its own route and nowhere
 * else: it is not kept in storage, not logged and not put in a URL.
 */

type Schemas = components["schemas"];

/** `GET /money/wallet`: the state, the account once it is active, and (under a reviewing provider) the review. */
export type MoneyWallet = Schemas["WalletView"];
export type WalletReview = Schemas["WalletReviewView"];
export type WalletReviewReason = Schemas["WalletReviewReasonView"];
/** The body of `POST /money/wallet/open`. */
export type OpenWalletInput = Schemas["OpenNairaWalletDto"];
export type IdentityDocuments = Schemas["IdentityDocumentsView"];
export type IdentityDocument = Schemas["IdentityDocumentView"];
export type IdentityDocumentKind = IdentityDocument["kind"];
export type IdentityDocumentState = IdentityDocument["state"];
export type IdentityLiveness = Schemas["IdentityLivenessView"];
export type PinState = Schemas["PinStateView"];
export type SetPinInput = Schemas["SetPinDto"];
/** The ID types and proof-of-address types the open route takes. */
export type IdType = NonNullable<OpenWalletInput["idType"]>;
export type ProofOfAddressType = NonNullable<OpenWalletInput["proofOfAddressType"]>;
export type Gender = NonNullable<OpenWalletInput["gender"]>;

/** Every `reason.code` the money contract lists. */
export type MoneyReasonCode = Schemas["MoneyErrorReason"]["code"];

/**
 * The document and selfie routes' own `reason.code` words (backend
 * `src/nuvion/documents/document-errors.ts`). Not in the contract's shared
 * list: see the module comment.
 */
export type DocumentReasonCode =
  | "document_request_invalid"
  | "document_file_invalid"
  | "document_not_accepted"
  | "documents_closed"
  | "document_in_progress"
  | "document_rate_limited"
  | "document_busy"
  | "selfie_not_available";

export type ReasonCode = MoneyReasonCode | DocumentReasonCode;

/** The `reason.code` a failed money call answered with, or undefined (a refusal without one, or not a refusal). */
export function reasonCodeOf(e: unknown): ReasonCode | undefined {
  return e instanceof ApiError ? (e.reason?.code as ReasonCode | undefined) : undefined;
}

/** Seconds the server asked the person to wait, when it said. */
export function retryAfterOf(e: unknown): number | undefined {
  return e instanceof ApiError ? e.reason?.retryAfterSeconds : undefined;
}

// ── the wallet ────────────────────────────────────────────────────────────

export function getMoneyWallet(): Promise<MoneyWallet> {
  return apiFetch<MoneyWallet>("/api/hub/money/wallet", { authed: true });
}

/**
 * Sends the person's details for review (and, after a refusal, the corrected
 * ones). The BVN, NIN and ID number in `input` go to this one call and are
 * not kept: the caller clears them as soon as it returns.
 */
export function openWallet(input: OpenWalletInput): Promise<MoneyWallet> {
  return apiFetch<MoneyWallet>("/api/hub/money/wallet/open", {
    method: "POST",
    authed: true,
    body: input,
  });
}

// ── documents and the hosted selfie ───────────────────────────────────────

export function getIdentityDocuments(): Promise<IdentityDocuments> {
  return apiFetch<IdentityDocuments>("/api/hub/money/identity/documents", { authed: true });
}

/**
 * Sends one document. An ID goes with its back in the same call (the server
 * keeps no copy of a file to wait for the other side); a proof of address has
 * no back. Answers the documents view as it stands afterwards.
 */
export function uploadIdentityDocument(input: {
  kind: IdentityDocumentKind;
  file: File;
  fileBack?: File;
}): Promise<IdentityDocuments> {
  const form = new FormData();
  form.append("kind", input.kind);
  form.append("file", input.file, input.file.name);
  if (input.fileBack) form.append("file_back", input.fileBack, input.fileBack.name);
  return apiFetch<IdentityDocuments>("/api/hub/money/identity/documents", {
    method: "POST",
    authed: true,
    body: form,
    // Two 10 MB files on a phone connection take longer than a JSON read.
    timeoutMs: 120_000,
  });
}

export function getLiveness(): Promise<IdentityLiveness> {
  return apiFetch<IdentityLiveness>("/api/hub/money/identity/liveness", { authed: true });
}

/** Starts the hosted selfie (or answers the one already running); `url` is the secure page to open. */
export function startLiveness(redirectUrl?: string): Promise<IdentityLiveness> {
  return apiFetch<IdentityLiveness>("/api/hub/money/identity/liveness", {
    method: "POST",
    authed: true,
    body: redirectUrl ? { redirectUrl } : {},
  });
}

// ── the transaction PIN ───────────────────────────────────────────────────

export function getPinState(): Promise<PinState> {
  return apiFetch<PinState>("/api/hub/money/pin", { authed: true });
}

/** Sets the PIN once. Both entries go in one call; the caller clears them as soon as it returns. */
export function setPin(input: SetPinInput): Promise<PinState> {
  return apiFetch<PinState>("/api/hub/money/pin", {
    method: "POST",
    authed: true,
    body: input,
  });
}
