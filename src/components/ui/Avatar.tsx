export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: number;
  border?: boolean;
}

export function Avatar({ src, alt = "", initials = "", size = 48, border = false }: AvatarProps) {
  return (
    <span
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: "var(--surface-tag)",
        border: border ? "1px solid var(--border-hairline)" : "1px solid transparent",
        flexShrink: 0,
        color: "var(--text-secondary)",
        fontSize: Math.round(size * 0.36),
        fontWeight: 700,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
