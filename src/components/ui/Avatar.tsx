interface AvatarProps {
  /** Single letter. `initials` is accepted as an alias for two-letter forms. */
  initial?: string;
  initials?: string;
  size?: number;
  className?: string;
}

export function Avatar({ initial, initials, size = 36, className = "" }: AvatarProps) {
  const label = initial ?? initials ?? "?";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-accent-tint text-accent-hover ring-1 ring-border-accent ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      <span className="font-semibold">{label.slice(0, 2).toUpperCase()}</span>
    </span>
  );
}