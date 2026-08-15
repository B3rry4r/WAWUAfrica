"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * CommunitiesPage is a server component — it fetches its data during render,
 * so an ErrorState rendered there has no client-side function to call for
 * onRetry. This wraps it in a client boundary and retries by refreshing the
 * server component tree (re-running the page's data fetch) instead of a
 * full page reload.
 */
export function CommunitiesErrorRetry({ title, body }: { title: string; body?: string }) {
  const router = useRouter();
  return <ErrorState title={title} body={body} onRetry={() => router.refresh()} />;
}
