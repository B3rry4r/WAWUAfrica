import Link from "next/link";
import type { Block, LegalSection } from "@/lib/legal/master-agreement";
import { LEGAL_EFFECTIVE_DATE, LEGAL_UPDATED_DATE, sectionId } from "@/lib/legal/master-agreement";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";

/**
 * Renders a view of the master agreement. /terms shows all of it,
 * /privacy/policy shows its privacy sections; both come from the same list so
 * a clause cannot say one thing on one page and something else on the other.
 *
 * Section numbers are the agreement's own, kept even on the privacy view: a
 * reader who is told "section 26" by support needs to find section 26.
 */
export function LegalDocument({
  title,
  sections,
  intro,
  notice,
  acceptance,
}: {
  title: string;
  sections: LegalSection[];
  intro?: string;
  notice?: string[];
  acceptance?: { intro: string; items: string[] };
}) {
  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:p-[30px_28px_64px]">
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          {title}
        </span>
      </div>

      <div className="flex flex-col gap-[3px]">
        <span className="text-[12px] text-[var(--text-muted)]">
          Effective {LEGAL_EFFECTIVE_DATE}
        </span>
        <span className="text-[12px] text-[var(--text-muted)]">
          Last updated {LEGAL_UPDATED_DATE}
        </span>
      </div>

      <p className="m-0 text-[13px] leading-[1.5] text-[var(--text-muted)]">
        The full set of WAWU legal documents, including the{" "}
        <Link href="/legal/privacy" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
          Privacy Policy
        </Link>{" "}
        and the{" "}
        <Link href="/legal/terms" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
          Terms of Service
        </Link>
        , is on the{" "}
        <Link href="/legal" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
          legal documents page
        </Link>
        .
      </p>

      {intro ? (
        <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">{intro}</p>
      ) : null}

      {notice ? (
        <div className="flex flex-col gap-[8px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_15px]">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Important notice
          </span>
          {notice.map((line) => (
            <p key={line} className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {/*
        A contents list, because fifty sections without one is a wall. Also
        what makes "section 26" findable when support quotes a clause number.
      */}
      <nav className="flex flex-col gap-[6px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_15px]">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          Contents
        </span>
        <ol className="m-0 flex list-none flex-col gap-[3px] p-0">
          {sections.map((section) => (
            <li key={section.n}>
              <a
                href={`#${sectionId(section)}`}
                className="text-[13px] leading-[1.5] text-[var(--text-secondary)] hover:text-[var(--accent)]"
              >
                {section.n}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((section) => (
        <section key={section.n} id={sectionId(section)} className="flex scroll-mt-[80px] flex-col gap-[8px]">
          <h2 className="m-0 text-[15px] font-bold text-[var(--text-primary)]">
            {section.n}. {section.title}
          </h2>
          {section.blocks.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
        </section>
      ))}

      {acceptance ? (
        <section className="flex flex-col gap-[8px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_15px]">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Acceptance
          </span>
          <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
            {acceptance.intro}
          </p>
          <ul className="m-0 flex list-disc flex-col gap-[5px] pl-[18px]">
            {acceptance.items.map((item) => (
              <li key={item} className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.kind === "p") {
    return (
      <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">{block.text}</p>
    );
  }
  if (block.kind === "list") {
    return (
      <ul className="m-0 flex list-disc flex-col gap-[4px] pl-[18px]">
        {block.items.map((item) => (
          <li key={item} className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
      <span className="font-semibold text-[var(--text-primary)]">{block.title}. </span>
      {block.text}
    </p>
  );
}
