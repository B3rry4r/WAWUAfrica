import type { Metadata } from "next";
import { AuthFrame } from "@/app/(auth)/components/AuthFrame";
import { JoinShell } from "@/app/join/components/JoinShell";
import { currentSiteMode } from "@/lib/site-mode";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm";

/**
 * wawuafrica.com/forgot-password: asks for the password-reset mail.
 *
 * R-133 (11 Nov 2026) keeps this page on the website next to /reset-password and /activate, and closes sign in
 * here, so in join-only mode:
 *
 *   join-only   the /join frame (the Who Made This logo, one column), the same form, and every way back goes to
 *               sign in on https://usewmt.com.
 *   full        the page as it was: the auth frame, and a Back to sign in link on this site.
 *
 * Dynamic on purpose, like /reset-password: the mode is read from the environment on each request.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Forgot password · Who Made This?" },
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  if (currentSiteMode() === "join-only") {
    return (
      <JoinShell themedLogo>
        <ForgotPasswordForm appOnly />
      </JoinShell>
    );
  }
  return (
    <AuthFrame>
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
