import { ProfileBackButton } from "@/components/profile/ProfileBackButton";

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-[14px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:p-[30px_28px_64px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Terms of service
        </span>
      </div>
      <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
        This is a plain-language placeholder. It explains how WAWU works today; it is not a
        substitute for legal advice.
      </p>
      <Section
        title="Your account"
        body="You need accurate name, contact and account-type details to use WAWU. User accounts browse and pay for content. Creator accounts can additionally publish content once a subscription and manual KYC review are both complete. These are separate gates and either can be pending on its own."
      />
      <Section
        title="Buying content"
        body="Prices are set by creators, always in naira. When you pay for content, a paid message, or a tip, that payment is final once delivered, except where a specific refund rule applies (like an unanswered paid message)."
      />
      <Section
        title="Paid messages"
        body="If a creator doesn't reply to a paid message within 24 hours, the cost is refunded automatically. Paid messages are visible only to you and the creator you wrote to."
      />
      <Section
        title="Selling content"
        body="Creators keep 85% of what a member pays, or 90% on the Pro tier, and WAWU keeps the remainder as a platform fee. Rates are fixed by tier and never negotiated per creator. Earning requires manual KYC review to be approved; uploading only requires an active paid subscription. You're responsible for the accuracy and rights to whatever you publish."
      />
      <Section
        title="WAWU Credits"
        body="Credits are a count on your account, spent on paid messages, community posts and tips. They are not money: they can't be bought back, withdrawn, or exchanged for cash under any circumstance."
      />
      <Section
        title="No wallet"
        body="WAWU never holds a cash balance for you and there's no cash-out flow. Money moves directly for the thing being bought."
      />
      <Section
        title="Verification (KYC)"
        body="Creators who want to earn go through manual identity review. In Nigeria this uses BVN and NIN; elsewhere, an equivalent national ID. A human reviews every submission, and there's no automated liveness or face-matching step in this process."
      />
      <Section
        title="Acceptable use"
        body="No content that infringes someone else's rights, misrepresents who you are, or violates Nigerian law. We can remove content or suspend accounts that break these terms."
      />
      <Section
        title="Changes to these terms"
        body="We may update these terms as the product changes. Material changes will be reflected here with an updated date."
      />
      <Section
        title="Contact"
        body="Questions about these terms can be sent to hello@wawuafrica.com."
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
