import type { ReactNode } from "react";

/**
 * The frame every /join screen sits in: the WAWU mark, a soft purple glow, and
 * one centred column.
 *
 * Standalone on purpose. /join lives outside every route group (no app shell,
 * no auth layout, no session provider), so a person who scanned a QR code at
 * an event sees the logo and the registration, and nothing to tap that leads
 * away from it. The logo is a picture, not a link, for the same reason: one
 * mis-tap must not drop someone out of a half-finished payment.
 *
 * Both logo files are drawn and the stylesheet picks one, because the white
 * mark disappears on the light theme and the dark one on the dark theme.
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
          src="/wawu-logo-white.png"
          alt="WAWU"
          width={564}
          height={130}
          className="h-[24px] w-auto object-contain [[data-theme=light]_&]:hidden dt:h-[28px]"
        />
        <img
          src="/wawu-logo-dark.png"
          alt="WAWU"
          width={564}
          height={130}
          className="hidden h-[24px] w-auto object-contain [[data-theme=light]_&]:block dt:h-[28px]"
        />
      </header>
      <main className="relative z-10 mx-auto w-full max-w-[520px] px-4 pb-16 pt-8 dt:pt-14">{children}</main>
    </div>
  );
}
