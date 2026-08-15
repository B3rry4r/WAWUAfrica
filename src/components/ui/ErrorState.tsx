import { Button } from "./Button";
import { Icon } from "./Icon";

/** Errors always offer a way out. Never a dead end. */
export function ErrorState({
  title = "Something went wrong",
  body,
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--danger-tint)]">
        <Icon name="TriangleAlert" size={20} color="var(--danger)"  />
      </span>
      <p className="text-[17px] font-semibold text-[var(--text-primary)]">{title}</p>
      {body && <p className="max-w-[38ch] text-[14px] text-[var(--text-secondary)]">{body}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-1">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
