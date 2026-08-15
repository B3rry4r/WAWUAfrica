import { getAccountType } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const accountType = await getAccountType();
  return <AppShell accountType={accountType}>{children}</AppShell>;
}
