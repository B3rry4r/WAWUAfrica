import type { Metadata } from "next";
import Link from "next/link";
import { Button, ErrorState, Icon } from "@/components/ui";
import { listPolicies, POLICY_DOCS, type PolicySummary } from "@/lib/api/policies";
import { formatLongDate } from "@/lib/format";

/**
 * /legal: the nine legal documents by title.
 *
 * Rendered on the server for every request, so a crawler reads the list in the
 * HTML and a document the owner has just published shows up straight away. The
 * Hub is not asked at build time, so a build never depends on it being up.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Legal",
  description: "The privacy policy, terms and other legal documents for WAWU and WHO MADE THIS?",
  alternates: { canonical: "/legal" },
};

export default async function LegalIndexPage() {
  let published: PolicySummary[] | null = null;
  try {
    published = await listPolicies();
  } catch {
    published = null;
  }

  if (published === null) {
    return (
      <>
        <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[30px]">Legal</h1>
        <ErrorState
          title="We could not load the documents"
          body="Try again in a moment."
          action={
            <Button variant="secondary" href="/legal">
              Try again
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[30px]">Legal</h1>
      <ul className="m-0 flex list-none flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-0">
        {POLICY_DOCS.map(({ slug, name }) => {
          const row = published.find((p) => p.slug === slug);
          const effective = formatLongDate(row?.effectiveDate);
          return (
            <li key={slug} className="border-b border-[var(--border-hairline)] last:border-b-0">
              {row ? (
                <Link
                  href={`/legal/${slug}`}
                  className="flex min-h-[56px] items-center gap-3 p-[12px_15px] hover:bg-[var(--state-hover)]"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <span className="text-[15px] font-semibold text-[var(--text-primary)]">{row.title}</span>
                    {effective ? <span className="text-[12px] text-[var(--text-muted)]">Effective {effective}</span> : null}
                  </span>
                  <Icon name="ChevronRight" size={18} color="var(--text-muted)" />
                </Link>
              ) : (
                <div className="flex min-h-[56px] items-center gap-3 p-[12px_15px]">
                  <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <span className="text-[15px] font-semibold text-[var(--text-secondary)]">{name}</span>
                    <span className="text-[12px] text-[var(--text-muted)]">Not published yet</span>
                  </span>
                </div>
              )}
            </li>
          );
        })}
        <li className="border-b border-[var(--border-hairline)] last:border-b-0">
          <Link
            href="/legal/delete-account"
            className="flex min-h-[56px] items-center gap-3 p-[12px_15px] hover:bg-[var(--state-hover)]"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="text-[15px] font-semibold text-[var(--text-primary)]">Delete your account</span>
              <span className="text-[12px] text-[var(--text-muted)]">Ask for your account and data to be deleted</span>
            </span>
            <Icon name="ChevronRight" size={18} color="var(--text-muted)" />
          </Link>
        </li>
      </ul>
    </>
  );
}
