import { Suspense } from "react";
import { SignUpFlow } from "@/app/(auth)/sign-up/components/SignUpFlow";

export default function UploadSiteSignUpPage() {
  return (
    <Suspense>
      <SignUpFlow uploadOnly />
    </Suspense>
  );
}
