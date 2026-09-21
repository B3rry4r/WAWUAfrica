"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getServices, getOtherApplications } from "@/lib/api/services";
import { listProfessionals } from "@/lib/api/professionals";
import type { PartnerService, ServiceApplication } from "@/types/services";
import type { ProfessionalListing } from "@/types/professional";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import {
  Button,
  ChoiceChips,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  ListRow,
  SectionHeader,
  Sheet,
  Skeleton,
  TileCard,
} from "@/components/ui";
import {
  orderedServices,
  SERVICE_GROUP_LABEL,
  SERVICE_GROUP_ORDER,
  type PlatformService,
  type ServiceGroup,
} from "@/lib/platform-services";
import { FlowHeader } from "@/components/layout/FlowHeader";

const eyebrow = "px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]";

/** Chip value: a real group, or the "everything" chip the design draws first. */
type GroupFilter = ServiceGroup | "all";
/** The filter sheet's second question. */
type Availability = "all" | "open";

/**
 * One service, as a DESCRIPTIVE CARD.
 *
 * This was a bare icon and a name in a four-across grid, and it was wrong.
 * Build brief A5 killed the colour-block tile after the owner rejected the
 * BILLS PAYMENT screen - a wall of full-bleed purple/teal/red/amber blocks -
 * and the "bare icons, no cards" treatment that replaced it there was applied
 * to this screen too, which A5 never asked for. The approved design
 * (refs/mobile/ref-services.png) draws a two-column grid of cards, each with
 * a small coloured icon at the top left, a bold title and a two-line
 * description. A5 removed the COLOUR BLOCK, not the description.
 *
 * `layout="action"` is exactly that shape and already exists, so this passes
 * a prop rather than growing a fifth layout: icon badge top left, title,
 * subtitle that WRAPS instead of truncating.
 *
 * A service the product has not launched is deliberately not a link, and
 * carries its status as a line of its own rather than only being dimmed. A
 * card that navigates nowhere is worse than one that tells you why.
 */
function ServiceCard({ s, open }: { s: PlatformService; open: boolean }) {
  // A service the catalogue carries always has a detail screen at
  // /services/<slug>, even when the list itself names no href. Without this,
  // a service the catalogue had switched on (Loans, Pensions) sorted into
  // the open group and then rendered dimmed and unclickable, which reads as
  // broken rather than as open.
  const href = s.href ?? (s.slug ? `/services/${s.slug}` : undefined);
  return (
    <TileCard
      layout="action"
      title={s.brand}
      subtitle={s.blurb}
      icon={s.icon}
      iconImageSrc={s.iconImageSrc}
      {...(open ? {} : { meta: "Coming soon" })}
      {...(open && href ? { href } : { disabled: true })}
    />
  );
}

/**
 * The hero banner, top of the approved design.
 *
 * The art is WAWU's own landing poster rather than a commissioned Services
 * banner, because the repo has no such asset: see the report on this change.
 * It is anchored to the right half with the person's face in frame, and the
 * accent wash carries the headline on the left, which is the composition the
 * design draws.
 *
 * The search field sits INSIDE the banner, as drawn, rather than under it.
 */
function ServicesHero({
  query,
  onQuery,
  onOpenFilters,
  filtered,
}: {
  query: string;
  onQuery: (v: string) => void;
  onOpenFilters: () => void;
  filtered: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--accent-deep)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/services-hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[64%_50%]"
      />
      {/* The wash is what keeps the headline legible over a photograph, and
          what leaves the right of the frame as a photograph rather than a
          purple rectangle: solid behind the words, gone by the far edge. */}
      <span className="absolute inset-0 bg-[linear-gradient(90deg,var(--accent-deep)_26%,color-mix(in_srgb,var(--accent-deep)_78%,transparent)_52%,color-mix(in_srgb,var(--accent-deep)_18%,transparent)_84%,transparent)]" />

      <div className="relative flex flex-col gap-[14px] p-[16px] dt:p-[22px]">
        <h2 className="m-0 max-w-[15ch] text-[19px] font-bold leading-[1.22] tracking-[-0.02em] text-white dt:max-w-[26ch] dt:text-[26px]">
          Find trusted professionals and access services
        </h2>

        <div className="flex items-center gap-[10px] dt:max-w-[560px]">
          <Input
            shape="pill"
            icon="Search"
            type="search"
            aria-label="Search for a service"
            placeholder="Search for a service..."
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={onOpenFilters}
            aria-label="Filter services"
            className={[
              "grid h-[52px] w-[52px] shrink-0 place-items-center rounded-input border bg-[var(--surface-input)] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]",
              filtered
                ? "border-[var(--border-selected)] text-[var(--accent)]"
                : "border-[var(--border-hairline)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]",
            ].join(" ")}
          >
            <Icon name="SlidersHorizontal" size={19} strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Top Professionals, as drawn under the service grid.
 *
 * The design puts a star rating and a review count on every row. Nothing on
 * the contract carries either, so the rows show what is real (verified,
 * what the first message costs, how long they have to reply) and the stars
 * are absent rather than invented. See ProfessionalCard's `variant="row"`.
 *
 * No mock fallback is reached for here beyond the one `listProfessionals`
 * already owns: a fabricated lawyer is the single thing a directory of
 * certified people exists to prevent.
 */
function TopProfessionals() {
  const [pros, setPros] = useState<ProfessionalListing[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    listProfessionals()
      .then((res) => {
        if (alive) setPros(res);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null;

  return (
    <section className="flex flex-col gap-[12px]">
      <SectionHeader title="Top Professionals" action="See all" actionHref="/professionals" />
      {!pros ? (
        <div className="flex flex-col gap-[10px]">
          <Skeleton variant="row" />
          <Skeleton variant="row" />
        </div>
      ) : pros.length === 0 ? (
        <EmptyState
          icon="BriefcaseBusiness"
          title="No professionals listed yet"
          caption="If you do this work, apply to be listed here."
          action="Apply to be listed"
          actionHref="/professionals/apply"
        />
      ) : (
        <div className="flex flex-col gap-[10px] dt:grid dt:grid-cols-2">
          {pros.slice(0, 4).map((pro) => (
            <ProfessionalCard key={pro.id} pro={pro} variant="row" />
          ))}
        </div>
      )}
    </section>
  );
}

const TIMELINE_DOT: Record<"done" | "current" | "upcoming", string> = {
  done: "bg-[var(--success)]",
  current: "bg-[var(--warning)]",
  upcoming: "bg-[var(--surface-tag)]",
};

export default function ServicesPage() {
  const [services, setServices] = useState<PartnerService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // SEAM: no dedicated "list my applications" endpoint exists yet — getOtherApplications("")
  // with a non-matching id returns the full mock set. Swap for GET /api/hub/services/applications.
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupFilter>("all");
  const [availability, setAvailability] = useState<Availability>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setError(null);
    getServices()
      .then((res) => {
        if (active) setServices(res);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "We couldn't load services.");
      });
    getOtherApplications("")
      .then((res) => {
        if (active) setApplications(res);
      })
      .catch(() => {
        if (active) setApplications([]);
      });
    return () => {
      active = false;
    };
  }, []);

  /*
    What exists comes from PLATFORM_SERVICES; whether it is OPEN comes from
    the catalogue.

    The two used to be the same thing, and the result was that /services and
    the landing page disagreed about what WAWU offers: the landing listed
    eight, the catalogue returned five, and Events and Shop appeared on one
    surface and not the other. Product owner, 21 Sep 2026: "services should
    carry only the services that shows in the landing page."

    A service the catalogue does not carry (Events, Shop, BNPL are WAWU's own
    surfaces, not partner services) keeps the list's own `soon` flag.
  */
  const isOpen = useMemo(() => {
    const statusOf = (slug?: string) =>
      slug ? services?.find((c) => (c.slug ?? c.id) === slug)?.status : undefined;
    return (s: PlatformService) => {
      /*
        `soon` WINS. The catalogue can CLOSE a service, never open one.

        This had it backwards and the bug was visible: PLATFORM_SERVICES marks
        Pensions and Loans `soon: true`, the partner catalogue returns both as
        `live`, and because the catalogue was consulted first they rendered as
        open and tappable on /services while the landing page and Explore, which
        read `soon` directly, still showed them as coming soon. Three surfaces,
        two answers, from the one list that exists to stop exactly that.

        The two flags are not the same question. `soon` is OUR product decision
        about whether a service is launched at all; catalogue `status` is the
        PARTNER's answer about whether their side is up right now. A partner
        being ready cannot launch a product we have not launched, so `soon` is
        checked first and short-circuits.
      */
      if (s.soon) return false;
      const catalogue = statusOf(s.slug);
      return catalogue ? catalogue === "live" : true;
    };
  }, [services]);

  const ordered = useMemo(() => orderedServices(isOpen), [isOpen]);
  const live = ordered.filter(isOpen);
  const coming = ordered.filter((s) => !isOpen(s));

  /*
    The chip rail is built from the groups that actually carry a service, so
    a chip never leads to an empty grid. The design's own labels (Business,
    Creative) name services WAWU does not offer; see ServiceGroup.
  */
  const groupOptions = useMemo(() => {
    const present = SERVICE_GROUP_ORDER.filter((g) => ordered.some((s) => s.group === g));
    return [
      { value: "all" as GroupFilter, label: "All" },
      ...present.map((g) => ({ value: g as GroupFilter, label: SERVICE_GROUP_LABEL[g] })),
    ];
  }, [ordered]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordered.filter((s) => {
      if (group !== "all" && s.group !== group) return false;
      if (availability === "open" && !isOpen(s)) return false;
      if (!q) return true;
      return `${s.brand} ${s.label} ${s.blurb}`.toLowerCase().includes(q);
    });
  }, [ordered, group, availability, query, isOpen]);

  const filtered = group !== "all" || availability !== "all" || query.trim().length > 0;
  const featured =
    applications.find((a) => a.status === "under_review" || a.status === "pending") ?? applications[0] ?? null;

  if (error) {
    return <ErrorState title="We couldn't load services." body={error} />;
  }

  if (!services) {
    return (
      <div className="flex flex-col gap-[12px] p-[14px_16px_96px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[76px] rounded-[var(--radius-card)] bg-[var(--surface-tag)]" />
        ))}
      </div>
    );
  }

  /*
    The screen body, drawn once and shared by both widths. Mobile is the
    approved design (refs/mobile/ref-services.png); desktop is the same
    panels in a wider column, so the two cannot drift apart again.
  */
  const body = (
    <>
      <ServicesHero
        query={query}
        onQuery={setQuery}
        onOpenFilters={() => setFiltersOpen(true)}
        filtered={filtered}
      />

      {/* One scrolling line, never a wrapping wall of pills (brief C5). */}
      <ChoiceChips
        ariaLabel="Filter services by kind"
        scroll
        fill
        value={group}
        onSelect={(v) => setGroup(v)}
        options={groupOptions}
      />

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-[12px] dt:grid-cols-3 2xl:grid-cols-4">
          {visible.map((s) => (
            <ServiceCard key={s.brand} s={s} open={isOpen(s)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="SearchX"
          title="Nothing matches that yet"
          caption="Try another word, or clear the filters to see everything WAWU offers."
          action="Clear filters"
          onAction={() => {
            setQuery("");
            setGroup("all");
            setAvailability("all");
          }}
        />
      )}

      <TopProfessionals />
    </>
  );

  return (
    <>
      {/*
        Two bars, one body. The mobile bar is the approved design's: back
        chevron, title, search. The desktop bar drops the chevron (the
        sidebar is the way back at that width) and carries the open count.
        The BODY below is rendered once, so the two widths cannot drift into
        two different Services screens again, and the professionals call is
        made once rather than by a hidden copy as well.
      */}
      <FlowHeader
        title="Services"
        className="xl:hidden"
        right={
          <Link
            href="/search"
            aria-label="Search"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-state-hover active:bg-state-press"
          >
            <Icon name="Search" size={19} strokeWidth={2.2} />
          </Link>
        }
      />
      <FlowHeader
        title="Services"
        back={false}
        sticky
        className="hidden xl:flex"
        right={
          <span className="text-[13.5px] text-text-muted">
            {live.length} open{coming.length ? `, ${coming.length} coming soon` : ""}
          </span>
        }
      />

      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-[18px] p-[14px_16px_96px] xl:gap-[22px] xl:p-[26px]">
        {body}

        {/* D13 frame 1 — the applications tracker, alongside rather than on its own screen. */}
        <div className="hidden grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px] xl:grid">
          <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px]">
            <span className={eyebrow}>Included with any account</span>
            <ListRow title="Business playbook" subtitle="The full guide, yours to download" icon="BookOpen" href="/learn/playbook" />
          </div>

          <div className="flex flex-col gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px]">
            <span className={eyebrow}>Your applications</span>
            {featured ? (
              <>
                <div className="flex flex-col gap-[11px]">
                  {featured.timeline.map((t) => (
                    <div key={t.stage} className="flex items-center gap-[11px]">
                      <span className={`h-[9px] w-[9px] shrink-0 rounded-full ${TIMELINE_DOT[t.status]}`} />
                      <span className={`text-[13.5px] ${t.status === "upcoming" ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"}`}>
                        {t.stage}
                        {t.date ? ` · ${t.date}` : ""}
                      </span>
                      {t.status === "current" && (
                        <span className="ml-auto whitespace-nowrap text-[12.5px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
                          reference {featured.reference}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <span className="pt-[4px] text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
                  Rejected applications are refunded in full.
                </span>
                <Link href={`/services/applications/${featured.id}`} className="text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary">
                  View full tracking →
                </Link>
              </>
            ) : (
              <span className="text-[13px] leading-[1.5] text-[var(--text-muted)]">You haven&apos;t started an application yet.</span>
            )}
          </div>
        </div>
      </div>

      {/*
        What the filter button opens. Both questions are real: which kind of
        service, and whether to show the ones that are not open yet. Chips
        rather than a bespoke toggle, so the sheet uses the same control the
        rail does.
      */}
      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter services"
        caption="Narrow the list down to what you are looking for."
        desktop="modal"
      >
        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-[10px]">
            <span className={eyebrow}>Kind</span>
            <ChoiceChips
              ariaLabel="Filter services by kind"
              value={group}
              onSelect={(v) => setGroup(v)}
              options={groupOptions}
            />
          </div>

          <div className="flex flex-col gap-[10px]">
            <span className={eyebrow}>Availability</span>
            <ChoiceChips
              ariaLabel="Filter services by availability"
              value={availability}
              onSelect={(v) => setAvailability(v)}
              options={[
                { value: "all" as Availability, label: "Everything" },
                { value: "open" as Availability, label: "Open now" },
              ]}
            />
          </div>

          <div className="flex gap-[10px]">
            <Button
              variant="secondary"
              full
              onClick={() => {
                setQuery("");
                setGroup("all");
                setAvailability("all");
              }}
            >
              Clear
            </Button>
            <Button full onClick={() => setFiltersOpen(false)}>
              Show {visible.length} {visible.length === 1 ? "service" : "services"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
