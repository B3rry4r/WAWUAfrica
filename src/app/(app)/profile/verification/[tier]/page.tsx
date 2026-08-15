"use client";

import { useRouter, useParams } from "next/navigation";
import type { VerificationLevel } from "@/types/account";
import { VERIFY_TIER_LABELS } from "@/types/verification";
import { VerificationApplyForm } from "@/components/profile/VerificationApplyForm";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ErrorState } from "@/components/ui/ErrorState";

const VALID_TIERS = Object.keys(VERIFY_TIER_LABELS) as VerificationLevel[];

/**
 * Mobile drill-down route for one verification level's apply form (design's
 * own-screen flow). Desktop (D16) reaches the same form inline from the main
 * ladder page instead — see VerificationLadderList — but this route stays
 * reachable and functional at any width (e.g. the "Resubmit" link under
 * Recent submissions still points here), just with an added xl width cap so
 * a direct desktop visit isn't full-bleed at 1440px.
 */
export default function VerificationApplyPage() {
  const router = useRouter();
  const params = useParams();
  const tier = String(params?.tier ?? "") as VerificationLevel;

  if (!VALID_TIERS.includes(tier)) {
    return <ErrorState title="That verification level doesn't exist." onRetry={() => router.push("/profile/verification")} />;
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-24 pt-4 xl:mx-auto xl:w-full xl:max-w-[700px] xl:px-0 xl:pb-16 xl:pt-8">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary">
          {VERIFY_TIER_LABELS[tier]}
        </span>
      </div>
      <VerificationApplyForm tier={tier} />
    </div>
  );
}
