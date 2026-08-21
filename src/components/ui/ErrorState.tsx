import type { ReactNode } from "react";
import { describeError } from "@/lib/api/errors";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface ErrorStateProps {
  title?: string;
  body?: string;
  /**
   * Alias for `body`. Same slot, second name — Feedback.tsx's copy of this
   * component called it `description`, and its call sites should be able to
   * move here without an edit.
   */
  description?: string;
  /**
   * The caught error itself. Pass this instead of hand-writing copy: it is
   * mapped through describeError(), so a 403 reads as a permission problem
   * with a route back, a 404 as not-found, and only a real transport failure
   * reads as "we couldn't reach WAWU". `title`/`body` still win when given,
   * and the raw message is never rendered as-is.
   */
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  /** An extra way out, when the caller knows a better one than the mapping does. */
  action?: ReactNode;
}

/** Errors always offer a way out. Never a dead end. */
export function ErrorState({
  title,
  body,
  description,
  error,
  onRetry,
  retryLabel = "Try again",
  action,
}: ErrorStateProps) {
  const mapped = error === undefined ? null : describeError(error);
  const heading = title ?? mapped?.title ?? "Something went wrong";
  const message = body ?? description ?? mapped?.body;
  // Retry is offered only where retrying could work. Hammering "Try again"
  // against a 403 is the dead end this component exists to avoid — so when
  // the mapping says the call cannot succeed, the route back takes its place.
  const showRetry = Boolean(onRetry) && (mapped ? mapped.retryable : true);
  const fallbackAction =
    !action && mapped?.action ? (
      <Button variant={showRetry ? "ghost" : "secondary"} href={mapped.action.href}>
        {mapped.action.label}
      </Button>
    ) : null;

  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--danger-tint)]">
        <Icon name="TriangleAlert" size={20} color="var(--danger)"  />
      </span>
      <p className="text-[17px] font-semibold text-[var(--text-primary)]">{heading}</p>
      {message && <p className="max-w-[38ch] text-[14px] text-[var(--text-secondary)]">{message}</p>}
      {(showRetry || action || fallbackAction) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {showRetry && onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {action}
          {fallbackAction}
        </div>
      )}
    </div>
  );
}
