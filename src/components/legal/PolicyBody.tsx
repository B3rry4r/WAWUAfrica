import type { PolicyDocument } from "@/lib/api/policies";
import { formatLongDate } from "@/lib/format";

/** The text of a section, one paragraph where a blank line is. */
function paragraphsOf(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * One published document, as the Hub holds it: the title, the date, a
 * contents list and each section's heading and paragraphs. Nothing here adds
 * to, rewords or numbers the owner's text; if a heading carries a number, it is
 * the owner's.
 *
 * Server component. The contents list is plain anchors, so it works with no
 * script, and "section 6" is findable when someone quotes a clause.
 */
export function PolicyBody({ doc }: { doc: PolicyDocument }) {
  const effective = formatLongDate(doc.effectiveDate);
  return (
    <article className="flex flex-col gap-[18px]">
      <header className="flex flex-col gap-[6px]">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] xl:text-[30px]">
          {doc.title}
        </h1>
        {effective ? <p className="m-0 text-[13px] text-[var(--text-muted)]">Effective {effective}</p> : null}
      </header>

      {doc.sections.length > 1 ? (
        <nav
          aria-label="Contents"
          className="flex flex-col gap-[6px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_15px]"
        >
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Contents
          </span>
          <ol className="m-0 flex list-none flex-col gap-[3px] p-0">
            {doc.sections.map((section, i) => (
              <li key={i}>
                <a
                  href={`#section-${i + 1}`}
                  className="text-[13px] leading-[1.5] text-[var(--text-secondary)] hover:text-[var(--accent)]"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      {doc.sections.map((section, i) => (
        <section key={i} id={`section-${i + 1}`} className="flex scroll-mt-[24px] flex-col gap-[8px]">
          <h2 className="m-0 text-[16px] font-bold leading-[1.35] text-[var(--text-primary)]">{section.heading}</h2>
          {paragraphsOf(section.body).map((paragraph, j) => (
            <p
              key={j}
              className="m-0 whitespace-pre-line text-[14px] leading-[1.6] text-[var(--text-secondary)]"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
