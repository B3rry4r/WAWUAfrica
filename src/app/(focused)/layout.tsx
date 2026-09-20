import type { ReactNode } from "react";
import { FocusedFlowShell } from "@/components/layout/FocusedFlowShell";

/**
 * Route group for single-purpose flow screens — /kyc, /onboarding and
 * /create/new — that intentionally sit outside `(app)`
 * because they own their own local FlowHeader/back-button navigation and
 * must never get the mobile BottomNav or global AppHeader. A route group's
 * parentheses don't affect the URL, so this changes none of those paths.
 *
 * FocusedFlowShell adds ONLY the desktop half of AppShell's chrome
 * (persistent Sidebar + DesktopHeader at `xl` and up) so these routes are
 * still navigable at desktop widths; below `xl` it renders nothing extra —
 * mobile behavior is byte-for-byte unchanged.
 */
export default function FocusedLayout({ children }: { children: ReactNode }) {
  return <FocusedFlowShell>{children}</FocusedFlowShell>;
}
