import { Icon } from "../ui/Icon";

export interface HeaderProps {
  title?: string;
}

/** Search and notifications live in the header on every screen (locked). */
export function Header({ title }: HeaderProps) {
  return (
    <header
      className="flex items-center gap-[12px] py-[14px] px-[16px] border-b border-b-[var(--border-hairline)]"
    >
      {title ? (
        <h1
          className="m-0 flex-1 min-w-0 text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)]"
        >
          {title}
        </h1>
      ) : null}
      <span className={title ? "flex-none" : "flex-1"} />
      <button
        type="button"
        aria-label="Search"
        className="grid place-items-center w-[36px] h-[36px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-secondary)] cursor-pointer"
      >
        <Icon name="Search" size={17} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Notifications"
        className="relative grid place-items-center w-[36px] h-[36px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-secondary)] cursor-pointer"
      >
        <Icon name="Bell" size={17} strokeWidth={2} />
        <span
          className="absolute top-[8px] right-[8px] w-[6px] h-[6px] rounded-[999] bg-[var(--danger)]"
        />
      </button>
    </header>
  );
}
