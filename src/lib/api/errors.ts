import { ApiError, isMockModeError, isNetworkError } from "./client";

/**
 * One place that turns a caught error into copy a human can act on.
 *
 * The rule this encodes: a transport failure and a refusal are different
 * events and must never read the same. "We couldn't reach WAWU" is only true
 * when we genuinely could not reach it. When the server answered — 401, 403,
 * 404 — it usually said why, and that reason is the most useful thing we can
 * put on the screen. What we must never put on the screen is the raw
 * envelope, a status code, or a stack.
 */

export type ErrorKind =
  /** No answer at all: offline, DNS/TLS, timeout, or 5xx from the origin. */
  | "unreachable"
  /** Signed out, or the session expired. */
  | "auth"
  /** Signed in, but this account may not be here. */
  | "forbidden"
  | "not-found"
  /** The server understood and declined (validation, conflict, rate limit). */
  | "rejected";

export interface ErrorPresentation {
  kind: ErrorKind;
  title: string;
  body: string;
  /** False when retrying the same call cannot possibly succeed — a 403 does not fix itself. */
  retryable: boolean;
  /** The way out when retrying is not it. Errors always offer a way out. */
  action?: { label: string; href: string };
}

const UNREACHABLE_TITLE = "We couldn't reach WAWU";

/**
 * Backend copy is written for API consumers, not for people: it says
 * "endpoint" and "resource" where a user reads "area" and "page". Two words,
 * swapped in place — this deliberately does not rewrite the sentence, because
 * the server's meaning is the part worth keeping.
 */
const DEV_WORDS: Array<[RegExp, string]> = [
  [/\bendpoints\b/gi, "areas"],
  [/\bendpoint\b/gi, "area"],
  [/\bresources\b/gi, "pages"],
  [/\bresource\b/gi, "page"],
];

/**
 * Returns the server's sentence if it is fit to show a user, otherwise
 * undefined so the caller falls back to our own copy. Rejects the things that
 * are machine output rather than an explanation: JSON/HTML fragments, bare
 * error codes, stack frames, essays, and the "Request failed (403)"
 * placeholder ApiError synthesizes when the body carried no message.
 */
export function humanizeServerMessage(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const text = raw.trim();
  if (!text) return undefined;
  if (text.length > 200) return undefined;
  if (/^[[{<]/.test(text)) return undefined;
  if (/^[A-Z0-9_]+$/.test(text)) return undefined;
  if (/\bat\s+\S+\s+\(/.test(text)) return undefined;
  if (/^request failed/i.test(text)) return undefined;
  if (/^(internal server error|bad gateway|service unavailable|forbidden|unauthorized|not found)$/i.test(text)) {
    return undefined;
  }
  let out = text;
  for (const [pattern, word] of DEV_WORDS) out = out.replace(pattern, word);
  return /[.!?]$/.test(out) ? out : `${out}.`;
}

/** Maps any caught value to the copy, the retry affordance, and the route back. */
export function describeError(e: unknown): ErrorPresentation {
  // No backend configured (dev/demo build). Retrying will not conjure one.
  if (isMockModeError(e)) {
    return {
      kind: "unreachable",
      title: UNREACHABLE_TITLE,
      body: "This build is running without a backend, so there is nothing to load here yet.",
      retryable: false,
    };
  }

  // The only genuine connectivity story. Checked before ApiError because
  // NetworkError extends it.
  if (isNetworkError(e)) {
    return {
      kind: "unreachable",
      title: UNREACHABLE_TITLE,
      body:
        e.kind === "timeout"
          ? "That took too long to answer. Check your connection and try again."
          : "Check your connection and try again.",
      retryable: true,
    };
  }

  if (e instanceof ApiError) {
    const server = humanizeServerMessage(e.serverMessage);

    if (e.status === 401) {
      return {
        kind: "auth",
        title: "Please sign in again",
        body: server ?? "Your session has ended. Sign in and we'll bring you straight back.",
        retryable: false,
        action: { label: "Sign in", href: "/sign-in" },
      };
    }

    if (e.status === 403) {
      // The backend's 403s on creator-only routes say so in the message
      // ("This endpoint is only available to creator accounts."), which makes
      // the right way out "become a creator" rather than a generic bounce home.
      const creatorOnly = /creator/i.test(e.serverMessage ?? "");
      return {
        kind: "forbidden",
        title: creatorOnly ? "This is a creator-only area" : "You don't have access to this",
        body:
          server ??
          (creatorOnly
            ? "Switch to a creator account to open this."
            : "Your account can't open this part of WAWU."),
        retryable: false,
        action: creatorOnly
          ? { label: "Become a creator", href: "/onboarding" }
          : { label: "Back to Home", href: "/home" },
      };
    }

    if (e.status === 404) {
      return {
        kind: "not-found",
        title: "We couldn't find that",
        body: server ?? "It may have been moved, or removed.",
        retryable: false,
        action: { label: "Back to Home", href: "/home" },
      };
    }

    if (e.status === 429) {
      return {
        kind: "rejected",
        title: "That was a bit fast",
        body: server ?? "Too many attempts in a row. Wait a moment, then try again.",
        retryable: true,
      };
    }

    // Status 0 only ever comes from a hand-built ApiError with no response
    // behind it — same story as a transport failure.
    if (e.status === 0 || e.status >= 500) {
      return {
        kind: "unreachable",
        title: UNREACHABLE_TITLE,
        body: server ?? "Something went wrong on our side. Try again in a moment.",
        retryable: true,
      };
    }

    return {
      kind: "rejected",
      title: "That didn't go through",
      body: server ?? "WAWU couldn't accept that. Check it over and try again.",
      retryable: true,
    };
  }

  // Anything else is a bug on our side, not a story about the network.
  return {
    kind: "rejected",
    title: "Something went wrong",
    body: (e instanceof Error ? humanizeServerMessage(e.message) : undefined) ?? "Try that again in a moment.",
    retryable: true,
  };
}
