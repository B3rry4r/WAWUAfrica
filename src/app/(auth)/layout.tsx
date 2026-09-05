import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/session-provider";
import { AuthBrandPanel, AuthBrandProvider } from "./components/AuthBrand";
import { AuthMobileBackdrop } from "./components/AuthMobileBackdrop";

export default function AuthLayout({ children }: { children: ReactNode }) {
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