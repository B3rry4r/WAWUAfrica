import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Button, EmptyState, ErrorState } from "@/components/ui";
import { PolicyBody } from "@/components/legal/PolicyBody";
import { getPolicy, isPolicySlug, policyName, type PolicyDocument, type PolicySlug } from "@/lib/api/policies";
import { formatLongDate } from "@/lib/format";

/**
 * /legal/<slug>: one legal document (privacy, terms, cookies,
 * creator-monetization, verification-refund, acceptable-use, partner-dpa,
 * community-guidelines, disclaimer). Any other slug is a 404.
 *
 * Rendered on the server for every request, so the stores' crawlers read the
 * text in the HTML, and the Hub is not asked at build time. A document the
 * Hub has not published shows a plain "not published yet" state; a Hub that
 * cannot be reached shows a different one, so a blip is never read as "there
 * is no policy".
 */
export const dynamic = "force-dynamic";

type Loaded = { state: "published"; doc: PolicyDocument } | { state: "unpublished" } | { state: "error" };

/** Deduped so the metadata read and the page read are one round trip. */
const load = cache(async (slug: PolicySlug): Promise<Loaded> => {
  try {
    const doc = await getPolicy(slug);
    return doc ? { state: "published", doc } : { state: "unpublished" };
  } catch {
    return { state: "error" };
  }
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  if (!isPolicySlug(params.slug)) return { title: "Not found", robots: { index: false, follow: true } };
  const slug = params.slug;
  const loaded = await load(slug);
  const path = `/legal/${slug}`;
  if (loaded.state !== "published") {
    return { title: policyName(slug), alternates: { canonical: path }, robots: { index: false, follow: true } };
  }
  const effective = formatLongDate(loaded.doc.effectiveDate);
  return {
    title: loaded.doc.title,
    description: effective
      ? `${loaded.doc.title} for WAWU and WHO MADE THIS?, effective ${effective}.`
      : `${loaded.doc.title} for WAWU and WHO MADE THIS?`,
    alternates: { canonical: path },
    openGraph: { type: "article", title: loaded.doc.title, url: path },
  };
}

export default async function LegalDocumentPage({ params }: { params: { slug: string } }) {
  if (!isPolicySlug(params.slug)) notFound();
  const slug = params.slug;
  const loaded = await load(slug);

  if (loaded.state === "published") return <PolicyBody doc={loaded.doc} />;

  if (loaded.state === "unpublished") {
    return (
      <>
        <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[30px]">
          {policyName(slug)}
        </h1>
        <EmptyState
          icon="FileText"
          title="Not published yet"
          caption="Check back soon."
          action="All legal documents"
          actionHref="/legal"
        />
      </>
    );
  }

  return (
    <>
      <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[30px]">
        {policyName(slug)}
      </h1>
      <ErrorState
        title="We could not load this document"
        body="Try again in a moment."
        action={
          <Button variant="secondary" href={`/legal/${slug}`}>
            Try again
          </Button>
        }
      />
    </>
  );
}
