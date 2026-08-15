import { Icon } from "../ui/Icon";

export interface HeaderProps {
  title?: string;
}

/** Search and notifications live in the header on every screen (locked). */
export function Header({ title }: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      {title ? (
        <h1
          style={{
            margin: 0,
            flex: 1,
            minWidth: 0,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h1>
      ) : null}
      <span style={{ flex: title ? 0 : 1 }} />
      <button
        type="button"
        aria-label="Search"
        style={{
          display: "grid",
          placeItems: "center",
          width: 36,
          height: 36,
          borderRadius: 999,
          background: "var(--surface-tag)",
          border: "1px solid var(--border-hairline)",
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <Icon name="Search" size={17} stroke={2} />
      </button>
      <button
        type="button"
        aria-label="Notifications"
        style={{
          position: "relative",
          display: "grid",
          placeItems: "center",
          width: 36,
          height: 36,
          borderRadius: 999,
          background: "var(--surface-tag)",
          border: "1px solid var(--border-hairline)",
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <Icon name="Bell" size={17} stroke={2} />
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--danger)",
          }}
        />
      </button>
    </header>
  );
}
