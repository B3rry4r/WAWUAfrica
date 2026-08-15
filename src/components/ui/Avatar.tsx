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
      className="relative grid place-items-center rounded-full overflow-hidden bg-[var(--surface-tag)] shrink-0 text-[var(--text-secondary)] font-bold" style={{width: size, height: size, border: border ? "1px solid var(--border-hairline)" : "1px solid transparent", fontSize: Math.round(size * 0.36)}}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
