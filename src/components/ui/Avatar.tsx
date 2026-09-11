interface AvatarProps {
  /** The real photo. Falls back to initials when absent. */
  src?: string | null;
  /** Single letter. `initials` is accepted as an alias for two-letter forms. */
  initial?: string;
  initials?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, initial, initials, size = 36, className = "" }: AvatarProps) {
  const label = initial ?? initials ?? "?";
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-accent-tint text-accent-hover ring-1 ring-[var(--border-decor)] ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold" aria-hidden="true">
          {label.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}