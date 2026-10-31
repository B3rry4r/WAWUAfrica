import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/app/(auth)/components/AuthFrame";
import { JoinShell } from "@/app/join/components/JoinShell";
import { currentSiteMode } from "@/lib/site-mode";
import { ResetPasswordForm } from "./components/ResetPasswordForm";

/**
 * wawuafrica.com/reset-password: where the password-reset mail lands.
 *
 * WAWU ID mails `/reset-password?token=...&email=...` (auth.service.ts,
 * FRONTEND_URL), and the phone opens it in the browser because this path is
 * not one of the app's links. On production the site is join-only (R-48), and
 * every path but a few answered 307 to /join, so nobody could reset a password.
 * RESET-WEB (R-123, 31 Oct 2026) opens exactly this page in join-only mode.
 *
 *   join-only   the /join frame (the Who Made This logo, one column), the same
 *               form, and no way into the closed site: the page ends by telling
 *               the person to sign in again in the app.
 *   full        the page as it was: the auth frame, and a Sign in button.
 *
 * Dynamic on purpose, like the landing page: the mode is read from the
 * environment on each request (currentSiteMode), so SITE_MODE changes the page
 * with no rebuild, and a prerender cannot freeze one answer.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Set a new password · Who Made This?" },
  // A link with a one-time token in it: never indexed, never followed.
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  if (currentSiteMode() === "join-only") {
    return (
      <JoinShell themedLogo>
        <Suspense>
          <ResetPasswordForm appOnly />
        </Suspense>
      </JoinShell>
    );
  }
  return (
    <AuthFrame>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthFrame>
  );
}
