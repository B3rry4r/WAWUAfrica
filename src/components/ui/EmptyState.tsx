import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export interface EmptyStateProps {
  /** Defaults to a generic empty inbox, so a caller with nothing better can omit it. */
  icon?: IconName;
  title: string;
  caption?: string;
  /**
   * Alias for `caption`. Same slot, second name — the forked copy of this
   * component in Feedback.tsx called it `description`, and its call sites move
   * here without an edit.
   */
  description?: string;
  /**
   * A label (rendered as a button/link with `onAction`/`actionHref`), or a
   * ready-made control. The fork accepted only the latter.
   */
  action?: string | ReactNode;
  onAction?: () => void;
  /** Renders the action CTA as a navigation link instead of a button. */
  actionHref?: string;
}

/** Empty-state block with a way out, per the design system's EmptyState. */
export function EmptyState({ icon = "Inbox", title, caption, description, action, onAction, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-tag text-text-secondary">
        <Icon name={icon} size={30} strokeWidth={1.8} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[17px] font-semibold text-text-primary">{title}</h3>
        {caption ?? description ? <p className="mx-auto max-w-[260px] text-[14px] leading-relaxed text-text-secondary">{caption ?? description}</p> : null}
      </div>
      {action && actionHref ? (
        <Button size="md" variant="secondary" href={actionHref}>
          {action}
        </Button>
      ) : action && onAction ? (
        <Button size="md" variant="secondary" onClick={onAction}>
          {action}
        </Button>
      ) : action && typeof action !== "string" ? (
        // A ready-made control, passed with no href/handler to wrap it in.
        // Without this branch it rendered as nothing at all.
        action
      ) : null}
    </div>
  );
}