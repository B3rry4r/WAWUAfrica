import type { ReactNode } from "react";

/**
 * The frame every /join screen sits in: the Who Made This logo, a soft purple
 * glow, and one centred column.
 *
 * Standalone on purpose. /join lives outside every route group (no app shell,
 * no auth layout, no session provider), so a person who scanned a QR code at
 * an event sees the logo and the registration, and nothing to tap that leads
 * away from it. The logo is a picture, not a link, for the same reason: one
 * mis-tap must not drop someone out of a half-finished payment.
 *
 * Both logo files are drawn and the stylesheet picks one, because the white
 * lockup disappears on the light theme and the ink one on the dark theme. They
 * are the owner's horizontal lockups from the brand pack, kept at the ROOT of
 * public/ because production serves only root-level static files (site mode).
 */
export function JoinShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-page">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_55%_45%_at_50%_0%,var(--accent-tint-strong),transparent_70%)]"
        aria-hidden="true"
      />
      <header className="relative z-10 mx-auto flex w-full max-w-[520px] items-center px-4 pt-5 dt:pt-8">
        <img
          src="/who-made-this-white.png"
          alt="Who Made This"
          width={1009}
          height={295}
          className="h-[46px] w-auto object-contain [[data-theme=light]_&]:hidden dt:h-[56px]"
        />
        <img
          src="/who-made-this-ink.png"
          alt="Who Made This"
          width={1009}
          height={295}
          className="hidden h-[46px] w-auto object-contain [[data-theme=light]_&]:block dt:h-[56px]"
        />
      </header>
      <main className="relative z-10 mx-auto w-full max-w-[520px] px-4 pb-16 pt-8 dt:pt-14">{children}</main>
    </div>
  );
}
