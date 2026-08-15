import { Suspense } from "react";
import { SignUpFlow } from "./components/SignUpFlow";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpFlow />
    </Suspense>
  );
}