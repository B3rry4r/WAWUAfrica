"use client";

import { useEffect, useState } from "react";
import { getService } from "@/lib/api/services";
import type { PartnerService } from "@/types/services";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Button, ErrorState, Icon } from "@/components/ui";
import { PageColumn } from "@/components/layout/PageColumn";
import type { IconName } from "@/components/ui/Icon";

/*
  NEPC IS A CONVERSATION WITH LEGAL, NOT A FORM OF ITS OWN.

  This page used to open a five-step application at /services/nepc/apply that
  collected documents, took payment, and posted an application. It was the
  wrong shape for the product: export certification is one of the things the
  legal desk handles, and legal already has a real intake that ends with a
  consultant reading a brief. A second bespoke form beside it meant two ways
  in, two sets of copy to keep true, and one of them quietly inventing a CAC
  record for whoever opened it.

  So this hands off to the legal intake on `cross_border`, which is the matter
  that covers export. Nothing about NEPC is lost: the intake asks what you
  make and where you sell, and it reaches somebody who can answer.
*/
const STEPS = [
  { title: "Say what you export", note: "A few questions about your product and your markets." },
  { title: "A consultant reads it", note: "Your answers reach the legal desk as a brief." },
  { title: "They take it from there", note: "You talk it through, and they handle the NEPC side." },
];

export default function NepcServicePage() {
  const [service, setService] = useState<PartnerService | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getService("nepc")
      .then((s) => {
        if (!active) return;
        if (!s) setError(true);
        else setService(s);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="p-[16px]">
        <ErrorState title="Service not found" />
      </div>
    );
  }

  if (loading || !service) {
    return (
      <div className="flex flex-col gap-[12px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:p-[30px_28px_64px]">
        <div className="h-[56px] w-[56px] rounded-[16px] bg-[var(--surface-tag)]" />
        <div className="h-[120px] rounded-[var(--radius-card)] bg-[var(--surface-tag)]" />
      </div>
    );
  }

  return (
    <PageColumn>
      <div className="flex items-center gap-[10px]">
        <ProfileBackButton compact />
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          {service.name}
        </span>
      </div>

      <div className="flex flex-col gap-[12px]">
        <span className="grid h-[56px] w-[56px] place-items-center rounded-[16px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name={service.icon as IconName} size={24} color="var(--accent)" />
        </span>
        <span className="text-[24px] font-extrabold tracking-[-0.025em] text-[var(--text-primary)]">
          {service.name}
        </span>
        <span className="text-[13.5px] text-[var(--text-muted)]">{service.priceFrom} · {service.turnaround}</span>
      </div>

      <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">{service.blurb}</p>

      <section className="flex flex-col gap-[8px]">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">How it works</span>
        <div className="flex flex-col gap-[8px]">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-[12px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] p-[12px_14px]">
              <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)] text-[13px] font-bold text-[var(--accent)]">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">{s.title}</span>
                <span className="text-[12.5px] leading-[1.4] text-[var(--text-muted)]">{s.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Natural width at desktop — see PageColumn. */}
      <Button full size="lg" href="/services/legal/intake?matter=cross_border" className="xl:w-auto xl:self-start">
        Talk to the legal desk
      </Button>
    </PageColumn>
  );
}
