"use client";

import { useMemo } from "react";
import { encodeQr, qrPath } from "@/lib/qr";

interface QrCodeProps {
  /** The ticket code. Upper-cased before encoding, as the scanner expects. */
  value: string;
  /** Rendered edge length in CSS pixels. Square. */
  size?: number;
  /** Announced to a screen reader. The visible code below the QR is separate. */
  label?: string;
}

/**
 * A ticket's QR code.
 *
 * ── WHY THIS IS AN SVG AND NOT A CANVAS ────────────────────────────────────
 * It is scanned off a screen by a camera pointed from a queue, so it has to
 * stay crisp at whatever size the layout gives it and at whatever the device
 * pixel ratio is. An SVG scales exactly; a canvas has to be re-rendered per
 * DPR and gets blurry when it is not.
 *
 * ── THE WHITE BACKGROUND IS NOT A THEME BUG ────────────────────────────────
 * The quiet zone and the light modules are hardcoded white, and the dark
 * modules black, in BOTH themes. This is the one surface in the app that must
 * not follow the design tokens: a scanner reads contrast, and a "dark mode"
 * QR on a dark card is a code that a door cannot read. Everything AROUND it
 * is tokenised as usual.
 *
 * The four-module quiet zone is part of the QR specification, not padding —
 * decoders use it to find the symbol's edge, and cropping it is the most
 * common reason a QR that looks fine will not scan.
 */
export function QrCode({ value, size = 200, label }: QrCodeProps) {
  const { path, modules } = useMemo(() => {
    const matrix = encodeQr(value);
    return { path: qrPath(matrix), modules: matrix.length };
  }, [value]);

  const quiet = 4;
  const extent = modules + quiet * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${extent} ${extent}`}
      role="img"
      aria-label={label ?? `QR code for ticket ${value}`}
      shapeRendering="crispEdges"
      className="rounded-[8px]"
    >
      <rect width={extent} height={extent} fill="#ffffff" />
      <g transform={`translate(${quiet} ${quiet})`}>
        <path d={path} fill="#000000" />
      </g>
    </svg>
  );
}
