import { ProfileBackButton } from "@/components/profile/ProfileBackButton";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-[14px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Privacy
        </span>
      </div>
      <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
        This is a plain-English summary. The full terms live in the About section.
      </p>
      <Section
        title="What we see"
        body="Your profile, DMs, uploads and purchases are only used to run WAWU for you. We never sell your data. WAWU's creators see what you post and share, never your payment details."
      />
      <Section
        title="Your paid DMs"
        body="Paid messages are read only by you and the creator you wrote to. If a creator hasn't replied within 24 hours, the cost is refunded automatically."
      />
      <Section
        title="Credits"
        body="WAWU Credits are a count on your account used for messages, community posts and tips. They can't be withdrawn or turned into cash — spend them inside the app only."
      />
      <Section
        title="KYC documents"
        body="BVN, NIN and ID documents go only to our manual review team and are never shared with creators or partners."
      />
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-col gap-[5px]">
      <span className="text-[15px] font-bold text-[var(--text-primary)]">{title}</span>
      <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">{body}</span>
    </section>
  );
}
