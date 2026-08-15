import type { AccountType } from "@/types/account";
import { BottomNav } from "./BottomNav";

export interface AppShellProps {
  children: React.ReactNode;
  accountType: AccountType;
}

/** Mobile-first app frame: single 430px column with the locked 5-slot nav. */
export function AppShell({ children, accountType }: AppShellProps) {
  return (
    <div
      style={{
        maxWidth: "var(--mobile-column)",
        margin: "0 auto",
        minHeight: "100vh",
        background: "var(--surface-page)",
        position: "relative",
      }}
    >
      <main style={{ paddingBottom: 90 }}>{children}</main>
      <BottomNav accountType={accountType} />
    </div>
  );
}
