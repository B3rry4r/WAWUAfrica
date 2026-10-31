import type { Metadata } from "next";
import { Button, Callout, Icon } from "@/components/ui";

/**
 * /legal/delete-account: where a person asks for their Who Made This? account
 * and data to be deleted. Google Play asks for this page by address, so it is
 * public, signed out and in the same frame as the other legal pages (the
 * layout one level up).
 *
 * The steps are what the app shows (src/features/delete-account and the
 * Settings screen in the mobile repo, Z2 and Z6 to Z8). The 30 days are R-17.
 * What is deleted and what is kept, and for how long, are the owner's Privacy
 * Policy (sections 8 and 9), worded as it words them. If the app's screens or
 * those sections change, this page changes with them.
 *
 * Static on purpose: it needs nothing from the Hub, so it is there even when
 * the Hub is not.
 */
export const metadata: Metadata = {
  title: "Delete your Who Made This? account",
  description:
    "How to ask for your Who Made This? account and data to be deleted: in the app, or by email to support@wawuafrica.com.",
  alternates: { canonical: "/legal/delete-account" },
};

const SUPPORT = "support@wawuafrica.com";
const PRIVACY = "privacy@wawuafrica.com";
const MAILTO = `mailto:${SUPPORT}?subject=${encodeURIComponent("Delete my account")}&body=${encodeURIComponent(
  "Username: ",
)}`;

const H1 = "m-0 text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] xl:text-[30px]";
const H2 = "m-0 text-[16px] font-bold leading-[1.35] text-[var(--text-primary)]";
const P = "m-0 text-[14px] leading-[1.6] text-[var(--text-secondary)]";
const CARD =
  "rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_15px]";
const LINK = "font-semibold text-[var(--text-primary)] underline underline-offset-2 hover:text-[var(--accent)]";

/** A name the app shows on screen, so the reader can find it. */
function Label({ children }: { children: string }) {
  return <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>;
}

/** What the app does, one step to a row. */
const STEPS = [
  <>
    Open <Label>Settings</Label>.
  </>,
  <>
    At the bottom of the page, under <Label>Sign out</Label>, tap <Label>Delete account</Label>.
  </>,
  <>
    If your wallet holds money, the app says <Label>Empty your wallet first</Label>. Withdraw it to your bank.{" "}
    <Label>Continue</Label> opens when the wallet is empty. If you have no wallet, there is nothing to empty.
  </>,
  <>
    The app asks <Label>Delete your account?</Label> and lists what goes with it: your profile, content and
    communities, your purchases and tickets, and your wallet and cards. Tap <Label>Continue</Label>.
  </>,
  <>
    Choose why you are leaving if you want to; it is optional. Type <Label>DELETE</Label> and tap{" "}
    <Label>Delete my account</Label>.
  </>,
  <>
    The app shows <Label>Scheduled for deletion</Label> and the date it will happen. Tap <Label>Done</Label>. That
    signs you out of the phone.
  </>,
];

/** Privacy Policy section 8, Data retention, in its own order. */
const KEPT: { what: string; howLong: string }[] = [
  { what: "Account data", howLong: "For as long as your account exists, plus seven years, to meet legal and tax requirements." },
  { what: "Verification data", howLong: "For as long as your account exists, plus seven years, for regulatory compliance." },
  { what: "Transaction records", howLong: "Seven years, in line with financial regulations." },
  { what: "Content you uploaded", howLong: "Until you delete it or close your account, then a further 90 days." },
  { what: "Communication data (messages, support tickets, feedback)", howLong: "Three years from your last interaction." },
  { what: "Usage and analytics data", howLong: "Two years, after which it is aggregated or anonymized." },
];

export default function DeleteAccountPage() {
  return (
    <article className="flex flex-col gap-[22px]">
      <header className="flex flex-col gap-[8px]">
        <h1 className={H1}>Delete your Who Made This? account</h1>
        <p className={P}>
          You can ask for your account and your data to be deleted in the app, or by email. Both ways are below,
          with what is deleted and what is kept.
        </p>
      </header>

      <section aria-labelledby="in-the-app" className="flex flex-col gap-[12px]">
        <h2 id="in-the-app" className={H2}>
          Delete it in the app
        </h2>
        <ol className="m-0 flex list-none flex-col gap-[12px] p-0">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-[12px]">
              <span
                aria-hidden="true"
                className="mt-[1px] flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[13px] font-bold text-[var(--text-primary)]"
              >
                {i + 1}
              </span>
              <span className={P}>{step}</span>
            </li>
          ))}
        </ol>
        <Callout tone="info" icon="Clock" title="30 days to change your mind" full>
          Your account is deleted 30 days after you ask. The app shows you the date. Sign in again before then and the
          deletion is cancelled.
        </Callout>
      </section>

      <section aria-labelledby="by-email" className="flex flex-col gap-[12px]">
        <h2 id="by-email" className={H2}>
          Or ask by email
        </h2>
        <p className={P}>
          Write from the email address on the account to{" "}
          <a href={`mailto:${SUPPORT}`} className={LINK}>
            {SUPPORT}
          </a>
          . Use the subject <Label>Delete my account</Label> and put your username in the message. We may need to
          verify your identity before we process the request.
        </p>
        <div>
          <Button variant="secondary" href={MAILTO} icon="Mail">
            Email support
          </Button>
        </div>
        <p className={P}>
          For any other question about your data, write to our Data Protection Officer at{" "}
          <a href={`mailto:${PRIVACY}`} className={LINK}>
            {PRIVACY}
          </a>
          . We respond within 30 days.
        </p>
      </section>

      <section aria-labelledby="deleted" className="flex flex-col gap-[8px]">
        <h2 id="deleted" className={H2}>
          What is deleted
        </h2>
        <p className={P}>
          Deleting your account removes your profile and content, subject to legal retention requirements (Privacy
          Policy, section 9). In the app that is your profile, content and communities, your purchases and tickets,
          and your wallet and cards.
        </p>
      </section>

      <section aria-labelledby="kept" className="flex flex-col gap-[10px]">
        <h2 id="kept" className={H2}>
          What is kept, and for how long
        </h2>
        <p className={P}>
          Some records are kept because the law asks for it. These are the periods in section 8 of the Privacy
          Policy, Data retention.
        </p>
        <ul className={`m-0 flex list-none flex-col gap-[12px] ${CARD}`}>
          {KEPT.map((row) => (
            <li key={row.what} className="flex flex-col gap-[2px]">
              <span className="text-[14px] font-semibold leading-[1.45] text-[var(--text-primary)]">{row.what}</span>
              <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">{row.howLong}</span>
            </li>
          ))}
        </ul>
        <p className={P}>When a period ends, the data is securely deleted or anonymized.</p>
      </section>

      <section aria-labelledby="policy" className="flex flex-col gap-[10px]">
        <h2 id="policy" className={H2}>
          The full policy
        </h2>
        <div>
          <Button variant="secondary" href="/legal/privacy">
            Read the Privacy Policy
            <Icon name="ChevronRight" size={16} strokeWidth={2.2} />
          </Button>
        </div>
      </section>
    </article>
  );
}
