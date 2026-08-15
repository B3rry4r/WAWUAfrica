import { ProfileBackButton } from "@/components/profile/ProfileBackButton";

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-[14px] p-[14px_16px_96px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          About WAWU
        </span>
      </div>
      <p className="m-0 text-[13.5px] leading-[1.6] text-[var(--text-secondary)]">
        WAWU is a Nigerian marketplace for creators — people who teach, write, draw, sew, cook
        and build. Creators charge for their content in naira, and members pay for what they
        value. When you pay a creator, 85% goes to them and WAWU keeps 15% (90/10 for Pro).
      </p>
      <Section title="Credits, never cash" body="WAWU Credits are a count used for paid messages, community posts and tips. They can't be withdrawn or converted to cash." />
      <Section title="No wallet" body="There's no balance to cash out. Money moves from member to creator for the thing being bought, and that's it." />
      <Section title="Nigeria-first" body="Prices are in naira. Verification uses BVN and NIN in Nigeria, national IDs elsewhere, and every review is done by a human." />
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
