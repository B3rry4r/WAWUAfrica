interface AvatarProps {
  initial: string;
  size?: number;
  className?: string;
}

export function Avatar({ initial, size = 36, className = "" }: AvatarProps) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-accent-tint text-accent-hover ring-1 ring-border-accent ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      <span className="font-semibold">{initial.slice(0, 1).toUpperCase()}</span>
    </span>
  );
}