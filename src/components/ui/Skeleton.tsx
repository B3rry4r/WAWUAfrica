interface SkeletonProps {
  variant?: "row" | "card" | "circle" | "media";
  className?: string;
}

const base =
  "relative overflow-hidden bg-tag [background-image:linear-gradient(110deg,transparent,var(--state-hover),transparent)]";
const shimmer = "[background-size:200%_100%] [animation:wawuShimmer_1.4s_linear_infinite]";

const variantClass = {
  row: "h-[44px] w-full rounded-2xl",
  card: "h-full w-full rounded-card",
  circle: "rounded-full",
  media: "h-full w-full rounded-media",
};

/** Loading placeholder, per the design system's Skeleton (shimmer at 1.4s). */
export function Skeleton({ variant = "row", className = "" }: SkeletonProps) {
  return <div className={`${base} ${shimmer} ${variantClass[variant]} ${className}`} aria-hidden="true" />;
}