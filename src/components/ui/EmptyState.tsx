import { Button } from "./Button";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  caption?: string;
  action?: string;
  onAction?: () => void;
}

/** Empty-state block with a way out, per the design system's EmptyState. */
export function EmptyState({ icon, title, caption, action, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-tag text-text-secondary">
        <Icon name={icon} size={30} strokeWidth={1.8} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[17px] font-semibold text-text-primary">{title}</h3>
        {caption ? <p className="mx-auto max-w-[260px] text-[14px] leading-relaxed text-text-secondary">{caption}</p> : null}
      </div>
      {action && onAction ? (
        <Button size="md" variant="secondary" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  );
}