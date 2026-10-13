import type { Metadata } from "next";
import type { ReactNode } from "react";

/** The admin dashboard is not for search engines. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
