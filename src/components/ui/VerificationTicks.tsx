import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  VERIFICATION_KINDS,
  VERIFICATION_SHORT_LABELS,
  tickOf,
  type VerificationKind,
  type VerificationState,
} from "@/types/verification";

/**
 * The ONE tick component. There is no second copy anywhere in this repo and
 * there must never be: a screen that needs a different size or a different
 * surrounding asks for it with a prop.
 *
 * It renders the purple creator tick, the green professional tick, or BOTH
 * when the account holds both. It never collapses the two and never picks a
 * winner, because they are independent paid credentials (build brief B1) and
 * somebody holding both paid for both.
 *
 * It replaced VerificationBadge, which drew one glyph off a five-rung ladder
 * that no longer exists.
 */

export type VerificationTickSize = "xs" | "sm" | "md" | "lg";

/**
 * Discrete sizes rather than a number.
 *
 * The old badge took `size={n}` and applied it through `style={{ width, height }}`,
 * because Tailwind's JIT cannot see `w-[${n}px]` as a class name. Fixing that
 * with a literal class map is what lets this component obey the house rule
 * (Tailwind classes, never `style={{}}`) instead of carrying an exemption.
 */
const BOX: Record<VerificationTickSize, string> = {
  xs: "h-[14px] w-[14px]",
  sm: "h-[17px] w-[17px]",
  md: "h-[21px] w-[21px]",
  lg: "h-[34px] w-[34px]",
};

/** Lucide takes a numeric size attribute; this is svg geometry, not a token. */
const GLYPH: Record<VerificationTickSize, number> = { xs: 11, sm: 13, md: 16, lg: 26 };

const GAP: Record<VerificationTickSize, string> = {
  xs: "gap-[3px]",
  sm: "gap-[3px]",
  md: "gap-1",
  lg: "gap-[6px]",
};

/** The two semantic colours. Tokens only, both themes, see tokens.css. */
const TONE: Record<VerificationKind, string> = {
  creator: "text-verify-creator bg-verify-creator-tint",
  professional: "text-verify-professional bg-verify-professional-tint",
};

export interface VerificationTicksProps {
  /** The whole state. Both ticks are decided here, never by the caller. */
  verification: VerificationState | null | undefined;
  size?: VerificationTickSize;
  className?: string;
}

/**
 * Renders nothing at all when no tick is held. An unverified account is not
 * a greyed-out tick: a grey tick still reads as a credential at a glance,
 * which is the exact confusion the old `basic` rung caused.
 */
export function VerificationTicks({ verification, size = "sm", className }: VerificationTicksProps) {
  const held = VERIFICATION_KINDS.filter((kind) => tickOf(verification, kind).verified);
  if (held.length === 0) return null;

  return (
    <span className={cn("inline-flex shrink-0 items-center", GAP[size], className)}>
      {held.map((kind) => (
        <span
          key={kind}
          className={cn("inline-grid shrink-0 place-items-center rounded-full", BOX[size], TONE[kind])}
          title={VERIFICATION_SHORT_LABELS[kind]}
          aria-label={VERIFICATION_SHORT_LABELS[kind]}
          role="img"
        >
          <BadgeCheck width={GLYPH[size]} height={GLYPH[size]} strokeWidth={2.4} aria-hidden />
        </span>
      ))}
    </span>
  );
}
