import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfessional } from "@/lib/api/professionals";
import { CATEGORIES } from "@/lib/categories";
import { CREDENTIAL_LABEL, isRegulatedCategory } from "@/types/professional";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { ProfessionalContact } from "@/components/professionals/ProfessionalContact";

export const dynamic = "force-dynamic";

function categoryName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id.replace(/_/g, " ");
}

export default async function ProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let pro;
  try {
    pro = await getProfessional(id);
  } catch {
    // The API only returns approved, listed professionals, so anything else
    // genuinely is not here — including one who has just paused enquiries.
    notFound();
  }

  const regulated = isRegulatedCategory(pro.category);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="xl:hidden">
        <ScreenHeader title="Professional" />
      </div>

      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-[18px] p-[14px_16px_96px] xl:p-[26px]">
        <div className="flex items-start gap-[14px]">
          <Avatar src={pro.avatarUrl} initial={pro.name.charAt(0)} size={64} />
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <span className="flex items-center gap-[7px]">
              <span className="truncate text-[19px] font-bold text-[var(--text-primary)]">
                {pro.name}
              </span>
              <VerificationBadge tier={pro.verification} size={17} />
            </span>
            <span className="text-[14px] text-[var(--text-secondary)]">{pro.headline}</span>
            <Link
              href={`/professionals?category=${pro.category}`}
              className="w-fit text-[12.5px] font-semibold text-accent hover:text-text-primary"
            >
              {categoryName(pro.category)}
            </Link>
          </div>
        </div>

        <ProfessionalContact
          creator={{
            wawuId: pro.wawuId,
            name: pro.name,
            handle: pro.handle ?? pro.wawuId,
            avatarUrl: pro.avatarUrl,
            dmPrice: pro.dmPrice ?? 0,
            dmResponseHours: pro.dmResponseHours,
            verification: pro.verification,
          }}
          dmEnabled={pro.dmEnabled}
          responseHours={pro.dmResponseHours}
        />

        <section className="flex flex-col gap-[8px]">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            About
          </h2>
          <p className="whitespace-pre-line text-[14px] leading-[1.6] text-[var(--text-secondary)]">
            {pro.about}
          </p>
        </section>

        {pro.services.length > 0 ? (
          <section className="flex flex-col gap-[8px]">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              What they take on
            </h2>
            <div className="flex flex-wrap gap-[7px]">
              {pro.services.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)] px-[11px] py-[5px] text-[12.5px] text-[var(--text-secondary)]"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/*
          Credentials. The licence NUMBER is never sent to this app — a buyer
          is entitled to know who certified someone so they can check the
          register themselves, but the number is an identifier that could be
          used to impersonate its holder.
        */}
        <section className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px]">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Credentials
          </h2>
          <div className="flex items-start gap-[10px]">
            <Icon name="ShieldCheck" size={16} color="var(--text-secondary)" strokeWidth={2} className="mt-[2px]" />
            <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
              {CREDENTIAL_LABEL[pro.credentialKind]}
              {pro.issuingBody ? (
                <>
                  , issued by{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {pro.issuingBody}
                  </span>
                </>
              ) : null}
              , checked by WAWU before this listing went live.
            </span>
          </div>
          {regulated ? (
            <div className="flex items-start gap-[10px]">
              <Icon name="Scale" size={16} color="var(--text-secondary)" strokeWidth={2} className="mt-[2px]" />
              <span className="flex-1 text-[13.5px] leading-[1.45] text-[var(--text-secondary)]">
                {categoryName(pro.category)} is a regulated field, so their
                licence was confirmed with the body that issued it.
              </span>
            </div>
          ) : null}
        </section>

        <p className="text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
          WAWU is where the conversation starts. Anything you agree beyond the
          first message (fees, scope, timelines) is between you and{" "}
          {pro.name.split(" ")[0]}.
        </p>
      </div>
    </div>
  );
}
