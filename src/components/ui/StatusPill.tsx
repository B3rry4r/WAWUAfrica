import type { ReactNode } from "react";

/** "error" is an accepted alias for "danger". */
export type StatusKind = "neutral" | "info" | "success" | "warning" | "danger" | "error";

type StatusSize = "xs" | "sm" | "md";

interface StatusPillProps {
  kind?: StatusKind;
  size?: StatusSize;
  /**
   * Set when the pill sits ON TOP OF A PHOTOGRAPH rather than on a card.
   *
   * The normal `kindClass` fill is a low-opacity tint, which is right on a
   * surface whose colour is known and wrong on an image that could be any
   * colour at all. "In review" on the profile's featured shelf was amber text
   * over a tint over a bright sky, and it was barely readable. This keeps the
   * kind's colour for the text and the border but puts an opaque dark plate
   * behind it, so contrast no longer depends on what the creator uploaded.
   */
  onMedia?: boolean;
  children?: ReactNode;
}

const sizeClass: Record<StatusSize, string> = {
  xs: "h-[19px] px-[7px] text-[10px]",
  sm: "h-[22px] px-[8px] text-[10.5px]",
  md: "h-[26px] px-[10px] text-[11.5px]",
};

const kindClass: Record<StatusKind, string> = {
  neutral: "bg-tag text-text-secondary border-hairline",
  info: "bg-info-tint text-info border-info",
  success: "bg-success-tint text-success border-success",
  warning: "bg-warning-tint text-warning border-warning",
  danger: "bg-danger-tint text-danger border-danger",
  error: "bg-danger-tint text-danger border-danger",
};

/**
 * The same six colours, but as text and border over an opaque plate instead
 * of over a tint. The plate is the app's own scrim colour, the one the media
 * cards already use for a price chip on a photograph, so a status pill and a
 * price chip on the same shelf sit on the same backing.
 */
const onMediaClass: Record<StatusKind, string> = {
  neutral: "bg-[rgba(11,10,13,0.82)] text-white border-transparent",
  info: "bg-[rgba(11,10,13,0.82)] text-info border-info",
  success: "bg-[rgba(11,10,13,0.82)] text-success border-success",
  warning: "bg-[rgba(11,10,13,0.82)] text-warning border-warning",
  danger: "bg-[rgba(11,10,13,0.82)] text-danger border-danger",
  error: "bg-[rgba(11,10,13,0.82)] text-danger border-danger",
};

export function StatusPill({ kind = "neutral", size = "md", onMedia = false, children }: StatusPillProps) {
  return (
    <span
      className={[
        "inline-flex items-center whitespace-nowrap rounded-full border font-semibold leading-none",
        sizeClass[size],
        onMedia ? `${onMediaClass[kind]} backdrop-blur-sm` : kindClass[kind],
      ].join(" ")}
    >
      {children}
    </span>
  );
}