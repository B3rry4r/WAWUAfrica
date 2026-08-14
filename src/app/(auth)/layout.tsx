import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/session-provider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-surface-page">{children}</div>
    </SessionProvider>
  );
}