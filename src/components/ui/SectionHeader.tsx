interface SectionHeaderProps {
  caption: string;
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ caption, title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="mb-0 flex items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">{caption}</span>
        <h2 className="text-[20px] font-semibold leading-snug tracking-[-0.015em] text-text-primary">{title}</h2>
      </div>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-[13.5px] font-semibold text-accent hover:text-text-primary"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}