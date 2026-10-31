import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/session-provider";
import { AuthBrandPanel, AuthBrandProvider } from "./AuthBrand";
import { AuthMobileBackdrop } from "./AuthMobileBackdrop";

/**
 * The frame every auth screen sits in: the session, the brand panel on desktop
 * and the blurred video behind the form on a phone. It is the body of
 * `(auth)/layout.tsx`, lifted out unchanged so that /reset-password, which now
 * lives outside the `(auth)` group (it has a second frame in join-only mode,
 * see src/app/reset-password/page.tsx), can still draw this one in full mode.
 */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthBrandProvider>
        <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-surface-page xl:mx-0 xl:flex xl:max-w-none xl:items-stretch">
          {/*
            Mobile only. Desktop keeps the video in the brand panel beside the
            form, where it has a column of its own; below xl there is no panel,
            so it goes behind the form instead. See AuthMobileBackdrop.
          */}
          <AuthMobileBackdrop />
          <AuthBrandPanel />
          <div className="relative z-10 xl:flex xl:flex-1 xl:items-center xl:justify-center xl:px-12 xl:py-12">
            <div className="xl:w-full xl:max-w-[520px]">{children}</div>
          </div>
        </div>
      </AuthBrandProvider>
    </SessionProvider>
  );
}
