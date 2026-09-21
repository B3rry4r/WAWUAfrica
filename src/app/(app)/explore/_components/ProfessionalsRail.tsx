import Link from "next/link";
import { Icon, type IconName } from "@/components/ui";

/**
 * Professional Services, built to the reference
 * (refs/target-explore-desktop-structure.jpg).
 *
 * WHAT THE REFERENCE DRAWS, and what I got wrong first time. Four ROW cards
 * across: an icon tile on the left, a title with a two-line description, and
 * a chevron. They are ENTRY POINTS into the professional side of the
 * platform, not a rail of individual practitioners with their rates on. I
 * built the rail of practitioners; the reference asks for the four doors.
 *
 * Each one goes somewhere real. "Business Support" is the partner services
 * catalogue (registration, finance, insurance) and "Legal Services" is the
 * legal tool, both of which exist; neither is a new screen invented to fill
 * a fourth slot.
 */
interface Door {
  title: string;
  caption: string;
  icon: IconName;
  href: string;
}

const DOORS: readonly Door[] = [
  {
    title: "Find a professional",
    caption: "Lawyers, accountants, marketers and more",
    icon: "BriefcaseBusiness",
    href: "/professionals",
  },
  {
    title: "Offer your services",
    caption: "Get listed in your field and start earning",
    icon: "IdCard",
    href: "/professionals/apply",
  },
  {
    title: "Business support",
    caption: "Register, finance, insurance and more",
    icon: "ChartNoAxesColumn",
    href: "/services",
  },
  {
    title: "Legal services",
    caption: "Contracts, IP, business registration",
    icon: "Scale",
    href: "/services/legal",
  },
];

export function ProfessionalsRail() {
  return (
    <section className="flex flex-col gap-[12px]">
      <div className="flex items-end justify-between gap-3 px-[2px]">
        <div className="flex flex-col gap-[2px]">
          <h2 className="m-0 text-[18px] font-bold tracking-[-0.02em] text-[var(--text-primary)] dt:text-[21px]">
            Professional services
          </h2>
          <p className="m-0 text-[12.5px] text-[var(--text-muted)]">
            Access trusted professionals to support your creative and business journey
          </p>
        </div>
        <Link
          href="/professionals"
          className="shrink-0 text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
        >
          See all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 dt:grid-cols-4">
        {DOORS.map((d) => (
          <Link
            key={d.title}
            href={d.href}
            className="flex items-center gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px] no-underline transition-colors hover:border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]"
          >
            <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-input bg-[var(--accent-tint)]">
              <Icon name={d.icon} size={18} color="var(--accent)" strokeWidth={1.9} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
                {d.title}
              </span>
              <span className="line-clamp-2 text-[11.5px] leading-[1.35] text-[var(--text-muted)]">
                {d.caption}
              </span>
            </span>
            <Icon name="ChevronRight" size={16} color="var(--text-muted)" className="shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
