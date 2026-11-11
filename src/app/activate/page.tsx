import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFrame } from "@/app/(auth)/components/AuthFrame";
import { JoinShell } from "@/app/join/components/JoinShell";
import { currentSiteMode } from "@/lib/site-mode";
import { ActivateForm } from "./components/ActivateForm";

/**
 * wawuafrica.com/activate: where the activation mail lands (WEB-STRIP, R-133).
 *
 * WAWU ID mails `/activate?token=...&email=...` to someone whose account was made without a password (a paid
 * /join, a registration). Until this page existed that link had no page, and join-only mode sent it to /join.
 * The page reads the two values, asks for a password twice, and sets it with WAWU ID `POST /auth/activate`. It
 * then points at sign in on usewmt.com.
 *
 *   join-only   the /join frame (the Who Made This logo, one column), like /reset-password.
 *   full        the auth frame, the same form.
 *
 * Dynamic on purpose, like /reset-password: the mode is read from the environment on each request.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Set your password · Who Made This?" },
  // A link with a one-time token in it: never indexed, never followed.
  robots: { index: false, follow: false },
};

export default function ActivatePage() {
  if (currentSiteMode() === "join-only") {
    return (
      <JoinShell themedLogo>
        <Suspense>
          <ActivateForm />
        </Suspense>
      </JoinShell>
    );
  }
  return (
    <AuthFrame>
      <Suspense>
        <ActivateForm />
      </Suspense>
    </AuthFrame>
  );
}
