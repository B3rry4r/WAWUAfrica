import { orderedServices } from "@/lib/platform-services";
import { Button, ICON_GRID, TileCard } from "@/components/ui";

/**
 * The platform entry points every profile carries (build brief C2 and C10).
 *
 * C2: "The profile is a storefront, and a storefront is an entry point.
 * Beyond the user's own listings, a profile must also surface platform-wide
 * entry points: bills payment, events, trainings available, shop, plus a call
 * to join. A visitor arriving from a shared link must be able to reach the
 * rest of the platform from there."
 *
 * That visitor is the whole reason this block exists. A shared profile link is
 * the most common way somebody meets this product, and before this the page
 * they landed on had exactly two destinations: the creator's own pieces, and
 * back. C10's rule is that no screen is a dead end, and a storefront with no
 * way into the shop it sits inside is the clearest dead end in the app.
 *
 * The services come from PLATFORM_SERVICES, the same list the landing page,
 * /services and Explore render, so this block cannot start advertising a
 * service the rest of the app has stopped offering.
 *
 * The join call is shown to a VISITOR only: the owner is already joined, and
 * a "create your account" banner on your own profile is the kind of thing
 * that makes an app feel unaware of who is using it.
 */
export function ProfileCrossSell({ isOwner, name }: { isOwner: boolean; name: string }) {
  const services = orderedServices();

  return (
    <section className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[16px] xl:p-[20px]">
      <div className="flex flex-col gap-[3px]">
        <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.015em] text-[var(--text-primary)]">
          More on WAWU
        </h2>
        <p className="m-0 text-[12.5px] text-[var(--text-muted)]">
          Pay a bill, find an event, learn something, shop the marketplace
        </p>
      </div>

      <div className={ICON_GRID}>
        {services.map((s) => (
          <TileCard
            key={s.brand}
            layout="stacked"
            size="sm"
            title={s.brand}
            icon={s.icon}
            iconImageSrc={s.iconImageSrc}
            {...(s.soon || !s.href ? { disabled: true } : { href: s.href })}
          />
        ))}
      </div>

      {/*
        The two entry points with no icon of their own. They were hand-rolled
        `rounded-full` links in a wrapping container, which the repo's own
        pill_walls gate failed - correctly: that is the pattern C5 removes,
        and "only two of them" is not a reason to keep writing it. These are
        the shared Button, which is the house control for an action.
      */}
      <div className="flex gap-[8px] border-t border-[var(--border-hairline)] pt-[14px]">
        <Button size="sm" variant="secondary" href="/learn" className="flex-1">
          Trainings available
        </Button>
        <Button size="sm" variant="secondary" href="/explore/creators" className="flex-1">
          More creators
        </Button>
      </div>

      {!isOwner ? (
        <div className="flex flex-col gap-[10px] rounded-[var(--radius-input)] bg-[var(--accent-tint)] p-[14px] sm:flex-row sm:items-center sm:justify-between">
          <span className="flex flex-col gap-[2px]">
            <span className="text-[14px] font-bold text-[var(--text-primary)]">
              Sell your own work on WAWU
            </span>
            <span className="text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">
              Joining costs nothing, and you keep 85% of what you earn.
            </span>
          </span>
          <Button size="sm" href="/sign-up?type=creator" className="shrink-0">
            Create an account
          </Button>
        </div>
      ) : null}
    </section>
  );
}
