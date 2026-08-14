"use client";

import { SessionProvider, useSession } from "@/lib/auth/session-provider";
import { AppShell } from "@/components/layout/AppShell";
import { LandingContent } from "@/app/(marketing)/components/LandingContent";
import { HomeFeed } from "@/app/(app)/components/HomeFeed";

/** `/` resolves to the marketing site when signed out and the home feed when signed in. */
function Root() {
  const { isAuthenticated } = useSession();
  return isAuthenticated ? (
    <AppShell elevatedHeader>
      <HomeFeed />
    </AppShell>
  ) : (
    <LandingContent />
  );
}

export default function RootPage() {
  return (
    <SessionProvider>
      <Root />
    </SessionProvider>
  );
}