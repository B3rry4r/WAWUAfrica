import type {
  Gender,
  IdentityDocuments,
  IdentityDocument,
  IdentityDocumentKind,
  IdentityLiveness,
  IdType,
  MoneyWallet,
  OpenWalletInput,
  ProofOfAddressType,
  ReasonCode,
} from "@/lib/api/money";

/**
 * Opening a wallet: the rules the screens share, apart from any component.
 *
 * Everything here is pure. Nothing keeps anything: each function takes what
 * the person typed (or what the server answered) and returns a new value, so
 * a BVN, NIN, ID number or PIN lives only as long as the field that holds it.
 */

// ── which step the person is on ───────────────────────────────────────────

/**
 * Where the person stands, read from what the server says and from nothing
 * else. The page never remembers a step of its own: a reload, a return from
 * the hosted selfie and a second browser all land on the same one.
 */
export type OpeningStage =
  /** The wallet provider here does not review people on the website. */
  | "unavailable"
  /** Nothing has been sent yet: the details form. */
  | "details"
  /** The details are in; the ID and proof of address (and the selfie when it is in use) are still needed. */
  | "documents"
  /** Sent for review. */
  | "checking"
  /** Refused: what was wrong and what to fix. */
  | "rejected"
  /** Stopped for good here: support can help. */
  | "stopped"
  /** Approved, the account number is on its way. */
  | "approved"
  /** The account is open and shows its number; the PIN is not set yet. */
  | "account"
  /** The account is open and has its PIN. */
  | "done"
  /** The account is on hold. */
  | "frozen";

export function stageOf(wallet: MoneyWallet): OpeningStage {
  if (wallet.openingFlow !== "review") return "unavailable";
  if (wallet.state === "frozen") return "frozen";
  if (wallet.state === "open") return wallet.pin.isSet ? "done" : "account";
  if (wallet.state === "opening") return wallet.review?.stage === "approved" ? "approved" : "checking";
  switch (wallet.review?.stage) {
    case "needs_documents":
      return "documents";
    case "rejected":
      return "rejected";
    case "stopped":
      return "stopped";
    case "checking":
      return "checking";
    case "approved":
      return "approved";
    default:
      return "details";
  }
}

/** What the wallet screen offers a person who has no open wallet yet, by where they stand. Null when there is nothing to offer. */
export function entryOf(wallet: MoneyWallet): { title: string; body: string; action: string; icon: "Wallet" | "Clock" | "CircleAlert" | "ShieldCheck" } | null {
  switch (stageOf(wallet)) {
    case "details":
      return {
        title: "Open your wallet",
        body: "Add your details and two documents. We check them, then give you your own account number.",
        action: "Open your wallet",
        icon: "Wallet",
      };
    case "documents":
      return {
        title: "Finish opening your wallet",
        body: "Your details are in. Add your documents to send them for review.",
        action: "Add your documents",
        icon: "Wallet",
      };
    case "checking":
      return {
        title: "We're checking your details",
        body: "You can leave this to us. We'll send you a notification when there is a decision.",
        action: "See where it's at",
        icon: "Clock",
      };
    case "rejected":
      return {
        title: "We couldn't verify your details",
        body: "See what to fix, then send them again.",
        action: "See what to fix",
        icon: "CircleAlert",
      };
    case "stopped":
      return {
        title: "We couldn't open your wallet",
        body: "Your request was stopped during review. Contact support and we'll help you from here.",
        action: "See details",
        icon: "CircleAlert",
      };
    case "approved":
      return {
        title: "You're approved",
        body: "Your account number is on its way.",
        action: "See where it's at",
        icon: "ShieldCheck",
      };
    case "frozen":
      return {
        title: "Your wallet is on hold",
        body: "Contact support and we'll help you from here.",
        action: "See details",
        icon: "CircleAlert",
      };
    case "account":
      return {
        title: "Set your transaction PIN",
        body: "Your wallet is open. One last step: the PIN that approves every payment.",
        action: "Set my PIN",
        icon: "ShieldCheck",
      };
    default:
      return null;
  }
}

export interface StepLabel {
  id: "details" | "documents" | "selfie" | "review" | "account";
  label: string;
}

/** The steps the rail draws. The selfie is drawn only when the server has it switched on. */
export function railSteps(selfieInUse: boolean): StepLabel[] {
  return [
    { id: "details", label: "Your details" },
    { id: "documents", label: "Documents" },
    ...(selfieInUse ? [{ id: "selfie" as const, label: "Selfie" }] : []),
    { id: "review", label: "Review" },
    { id: "account", label: "Your account" },
  ];
}

export function railIndexOf(stage: OpeningStage, onSelfie: boolean, selfieInUse: boolean): number {
  const steps = railSteps(selfieInUse);
  const at = (id: StepLabel["id"]) => steps.findIndex((s) => s.id === id);
  switch (stage) {
    case "details":
      return at("details");
    case "documents":
      return onSelfie && selfieInUse ? at("selfie") : at("documents");
    case "checking":
    case "rejected":
    case "stopped":
      return at("review");
    default:
      return at("account");
  }
}

// ── the details form ──────────────────────────────────────────────────────

export interface DetailsForm {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender | "";
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  bvn: string;
  nin: string;
  idType: IdType | "";
  idNumber: string;
  idIssueDate: string;
  idExpiryDate: string;
  proofOfAddressType: ProofOfAddressType | "";
}

export const EMPTY_DETAILS: DetailsForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  bvn: "",
  nin: "",
  idType: "",
  idNumber: "",
  idIssueDate: "",
  idExpiryDate: "",
  proofOfAddressType: "",
};

export type DetailsProblems = Partial<Record<keyof DetailsForm, string>>;

export const ID_TYPES: ReadonlyArray<{ value: IdType; label: string }> = [
  { value: "national_id", label: "National ID" },
  { value: "drivers_license", label: "Driver's licence" },
  { value: "international_passport", label: "International passport" },
];

export const PROOF_OF_ADDRESS_TYPES: ReadonlyArray<{ value: ProofOfAddressType; label: string }> = [
  { value: "utility_bill", label: "Utility bill" },
  { value: "bank_statement", label: "Bank statement" },
];

export const GENDERS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

/** A BVN and a NIN are each 11 digits. */
export const ID_NUMBER_DIGITS = 11;

/** Digits only, at most 11: what a paste or a typed space leaves. */
export function digitsOf(typed: string): string {
  return typed.replace(/\D+/g, "").slice(0, ID_NUMBER_DIGITS);
}

/** "2234 5678 901": the groups the design draws a BVN and a NIN in. */
export function groupDigits(digits: string): string {
  const parts: string[] = [];
  let at = 0;
  for (const size of [4, 4, 3]) {
    if (at >= digits.length) break;
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  return parts.join(" ");
}

/** What a typed number shows once the field is left: only the last 4 digits. */
export function maskedNumber(value: string, keep = 4): string {
  const tail = value.slice(-keep);
  return `•••• ••• ${tail}`;
}

const NAME = /^\p{L}[\p{L}\p{M}' .-]{0,49}$/u;
const PLACE = /^(?=.*\p{L})[^\p{Cc}<>]{1,100}$/u;
const ADDRESS = /^(?=.*\p{L})[^\p{Cc}<>]{5,200}$/u;
const POSTAL = /^[A-Za-z0-9][A-Za-z0-9 -]{0,19}$/;
const ID_NUMBER = /^[A-Za-z0-9][A-Za-z0-9-]{4,29}$/;

function parseDay(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return date;
}

function startOfDayUtc(now: Date): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * What is missing or cannot be used, field by field, in words the person can
 * act on. The same rules the server checks, so a form that passes here is not
 * sent back for a field. The BVN, NIN and ID number are tested and never
 * repeated in a message.
 */
export function detailsProblems(f: DetailsForm, now: Date = new Date()): DetailsProblems {
  const p: DetailsProblems = {};
  const first = f.firstName.trim();
  const middle = f.middleName.trim();
  const last = f.lastName.trim();
  if (!first) p.firstName = "Enter your first name.";
  else if (!NAME.test(first)) p.firstName = "Use letters only, up to 50.";
  if (middle && !NAME.test(middle)) p.middleName = "Use letters only, up to 50.";
  if (!last) p.lastName = "Enter your last name.";
  else if (!NAME.test(last)) p.lastName = "Use letters only, up to 50.";

  if (!f.dateOfBirth) p.dateOfBirth = "Enter your date of birth.";
  else {
    const dob = parseDay(f.dateOfBirth);
    if (!dob || dob.getUTCFullYear() < 1900) p.dateOfBirth = "Enter a real date of birth.";
    else if (dob.getTime() > startOfDayUtc(now)) p.dateOfBirth = "Your date of birth can't be in the future.";
  }
  if (!f.gender) p.gender = "Choose one.";

  const address = f.address.trim();
  if (!address) p.address = "Enter your street address.";
  else if (!ADDRESS.test(address)) p.address = "Enter your street address with the street name.";
  if (f.addressLine2.trim().length > 100) p.addressLine2 = "Keep this to 100 characters.";
  const city = f.city.trim();
  if (!city) p.city = "Enter your city or town.";
  else if (!PLACE.test(city)) p.city = "Enter the name of your city or town.";
  if (!f.state.trim()) p.state = "Choose your state.";
  const postal = f.postalCode.trim();
  if (!postal) p.postalCode = "Enter your postal code.";
  else if (!POSTAL.test(postal)) p.postalCode = "Use letters, numbers, spaces or dashes, up to 20.";

  if (f.bvn.length !== ID_NUMBER_DIGITS) p.bvn = "Enter the 11 digits of your BVN.";
  if (f.nin.length !== ID_NUMBER_DIGITS) p.nin = "Enter the 11 digits of your NIN.";

  if (!f.idType) p.idType = "Choose the ID you will upload.";
  const idNumber = f.idNumber.trim();
  if (!idNumber) p.idNumber = "Enter the number on your ID.";
  else if (!ID_NUMBER.test(idNumber)) p.idNumber = "Use 5 to 30 letters, numbers or dashes.";

  const issued = f.idIssueDate ? parseDay(f.idIssueDate) : null;
  const expires = f.idExpiryDate ? parseDay(f.idExpiryDate) : null;
  if (f.idIssueDate && !issued) p.idIssueDate = "Enter a real date.";
  else if (issued && issued.getTime() > startOfDayUtc(now)) p.idIssueDate = "The issue date can't be in the future.";
  if (f.idExpiryDate && !expires) p.idExpiryDate = "Enter a real date.";
  else if (expires && expires.getTime() < startOfDayUtc(now)) p.idExpiryDate = "This ID has expired. Use one that is still valid.";
  else if (issued && expires && expires.getTime() < issued.getTime()) p.idExpiryDate = "The expiry date comes before the issue date.";

  if (!f.proofOfAddressType) p.proofOfAddressType = "Choose the proof of address you will upload.";
  return p;
}

/** The request body for a form `detailsProblems` found nothing wrong with. Optional fields left empty are left out. */
export function toOpenInput(f: DetailsForm): OpenWalletInput {
  const input: OpenWalletInput = {
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    dateOfBirth: f.dateOfBirth,
    address: f.address.trim(),
    city: f.city.trim(),
    state: f.state.trim(),
    postalCode: f.postalCode.trim(),
    bvn: f.bvn,
    nin: f.nin,
    idNumber: f.idNumber.trim(),
  };
  if (f.gender) input.gender = f.gender;
  if (f.idType) input.idType = f.idType;
  if (f.proofOfAddressType) input.proofOfAddressType = f.proofOfAddressType;
  if (f.middleName.trim()) input.middleName = f.middleName.trim();
  if (f.addressLine2.trim()) input.addressLine2 = f.addressLine2.trim();
  if (f.idIssueDate) input.idIssueDate = f.idIssueDate;
  if (f.idExpiryDate) input.idExpiryDate = f.idExpiryDate;
  return input;
}

// ── the documents ─────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};

const EXTENSION_TYPE: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/** "10 MB": the limit as the server states it, in words. */
export function sizeLabel(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "PDF, JPG or PNG": the types the server takes. */
export function typesLabel(acceptedTypes: readonly string[]): string {
  const names = acceptedTypes.map((t) => TYPE_LABEL[t]).filter((n): n is string => Boolean(n));
  if (names.length === 0) return "PDF, JPG or PNG";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/**
 * A chosen file, checked on the page before anything is sent: its type and its
 * size against the limits the server stated (`maxBytes`, `acceptedTypes`).
 * Null when it may go. The server still reads the bytes and has the last word.
 */
export function fileProblem(
  file: { name: string; type: string; size: number },
  limits: { maxBytes: number; acceptedTypes: readonly string[] },
): string | null {
  const ext = file.name.includes(".") ? (file.name.split(".").pop() ?? "").toLowerCase() : "";
  const type = file.type || EXTENSION_TYPE[ext] || "";
  if (!type || !limits.acceptedTypes.includes(type)) {
    return `That file type isn't accepted. Use a ${typesLabel(limits.acceptedTypes)}.`;
  }
  if (file.size === 0) return "That file is empty. Choose another one.";
  if (file.size > limits.maxBytes) return `That file is larger than ${sizeLabel(limits.maxBytes)}. Choose a smaller one.`;
  return null;
}

/**
 * The two sides of an ID go in one request and must be the same kind of file
 * (both PDF, both JPG or both PNG): the server refuses a mixed pair, so the
 * page says so before anything is sent. Null when there is no pair or it matches.
 */
export function sidesProblem(front: File | null, back: File | null): string | null {
  if (!front || !back) return null;
  const typeOf = (f: File) => {
    const ext = f.name.includes(".") ? (f.name.split(".").pop() ?? "").toLowerCase() : "";
    return f.type || EXTENSION_TYPE[ext] || "";
  };
  return typeOf(front) === typeOf(back) ? null : "Use the same file type for both sides. For example two JPGs or two PNGs.";
}

export function documentOf(view: IdentityDocuments, kind: IdentityDocumentKind): IdentityDocument | undefined {
  return view.documents.find((d) => d.kind === kind);
}

/** True when this document still needs a file from the person. */
export function needsFile(doc: IdentityDocument | undefined): boolean {
  if (!doc) return true;
  return doc.state === "missing" || doc.state === "send_again" || doc.state === "not_accepted" || doc.state === "needs_new";
}

/** True when the selfie is in use and still to be taken. */
export function selfieNeeded(view: IdentityDocuments | null, liveness: IdentityLiveness | null): boolean {
  if (!liveness || !liveness.enabled || liveness.state === "not_in_use") return false;
  if (view) return view.selfie === "needed";
  return liveness.state !== "passed";
}

// ── words for what the server answers ─────────────────────────────────────

/** "in about 20 minutes": how long to wait, from the seconds the server gave. Never a figure it did not give. */
export function waitPhrase(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) return "in a little while";
  if (seconds < 60) return "in under a minute";
  if (seconds < 300) {
    const minutes = Math.ceil(seconds / 60);
    return minutes === 1 ? "in a minute" : `in ${minutes} minutes`;
  }
  if (seconds < 45 * 60) return `in about ${Math.round(seconds / 60 / 5) * 5} minutes`;
  const hours = Math.round(seconds / 3600);
  return hours <= 1 ? "in about an hour" : `in about ${hours} hours`;
}

/** What a refused upload, selfie start or open says, by its `reason.code`. Null when the code is not one of these. */
export function refusalWords(code: ReasonCode | undefined, retryAfter: number | undefined): { title: string; body: string } | null {
  switch (code) {
    case "document_request_invalid":
      return { title: "That didn't go through", body: "Choose the file again and send it once more." };
    case "document_file_invalid":
      return { title: "We can't use that file", body: "It may be empty, too large or the wrong type. Choose a PDF, JPG or PNG under the size limit." };
    case "document_not_accepted":
      return {
        title: "We couldn't read that file",
        body: "Take a clear photo with all four corners in frame and no glare, or choose another file, then send it again.",
      };
    case "documents_closed":
      return { title: "Your details are already with us", body: "We're not taking more files right now. We'll tell you if we need anything else." };
    case "document_in_progress":
      return { title: "Still confirming your last file", body: `Wait a moment, then check again. Try ${waitPhrase(retryAfter)}.` };
    case "document_rate_limited":
      return { title: "That's a lot of files", body: `You've sent several files in a short time. Try again ${waitPhrase(retryAfter)}.` };
    case "document_busy":
      return { title: "We're busy right now", body: `Try again ${waitPhrase(retryAfter)}.` };
    case "selfie_not_available":
      return { title: "The selfie isn't needed", body: "You can carry on without it." };
    case "wallet_not_open":
      return { title: "Start with your details", body: "We need your details before we can take documents." };
    case "identity_under_review":
      return { title: "Your details are being checked", body: "We'll tell you as soon as there is a decision." };
    case "provider_unreachable":
      return { title: "We couldn't reach our identity checker", body: `Nothing was lost. Try again ${waitPhrase(retryAfter)}.` };
    default:
      return null;
  }
}

/** The words for a refused `POST /money/wallet/open`, by its `reason.code`. Null for a code that isn't one of these. */
export function openRefusalWords(code: ReasonCode | undefined, retryAfter: number | undefined): { title: string; body: string; support?: boolean } | null {
  switch (code) {
    case "identity_has_wallet":
      return {
        title: "We can't use these details",
        body: "We can't use this BVN or phone number for a new wallet. If it's yours, contact support.",
        support: true,
      };
    case "identity_checks_exhausted":
      return {
        title: "You've used today's tries",
        body: `You can try again ${waitPhrase(retryAfter)}. Your details are safe.`,
      };
    case "account_not_opened":
      return {
        title: "We couldn't use these details",
        body: "Check your name, date of birth and numbers against your documents, then try again.",
      };
    case "wallet_already_open":
      return { title: "Your wallet is already open", body: "Go back to your wallet." };
    case "identity_under_review":
      return { title: "Your details are being checked", body: "We'll tell you as soon as there is a decision." };
    case "provider_unreachable":
      return { title: "We couldn't reach our identity checker", body: `Nothing was sent. Try again ${waitPhrase(retryAfter)}.` };
    default:
      return null;
  }
}

/** The account number as a bank draws it, "812 345 6789"; any other length as sent. */
export function groupedAccountNumber(accountNumber: string): string {
  return /^\d{10}$/.test(accountNumber)
    ? `${accountNumber.slice(0, 3)} ${accountNumber.slice(3, 6)} ${accountNumber.slice(6)}`
    : accountNumber;
}
