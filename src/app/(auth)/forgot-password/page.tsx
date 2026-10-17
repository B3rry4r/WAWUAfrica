import { currentSiteMode, pageHref } from "@/lib/site-mode";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm";

// The mode is read per request (site-mode.ts), so the page cannot be built ahead of it.
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  // In join-only mode sign-in is a closed part of the site: the page keeps working
  // but draws no link into it (null), like the landing page does.
  return <ForgotPasswordForm signInHref={pageHref(currentSiteMode(), "/sign-in")} />;
}
