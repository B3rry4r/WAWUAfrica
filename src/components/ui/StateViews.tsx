import { Button } from "./Button";

/**
 * Every screen ships with loading, empty, error and success states.
 * Empty and error must always offer a way forward — no dead ends.
 */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="text-[17px] font-semibold text-[var(--text-primary)]">{title}</p>
      {body && <p className="max-w-[38ch] text-[14px] text-[var(--text-secondary)]">{body}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body,
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" role="alert">
      <p className="text-[17px] font-semibold text-[var(--text-primary)]">{title}</p>
      {body && <p className="max-w-[38ch] text-[14px] text-[var(--text-secondary)]">{body}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
