import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";

/**
 * WAWUBasket / WAWUBeauty are separate products with their own backends
 * (CLAUDE.md: handoff only, never rebuild their commerce engine). Neither is
 * deployed yet, so the shop page's server-side fetch throws — and it used to
 * render an ErrorState, which tells the reader the app is broken.
 *
 * It is not broken. The storefront is not open yet, and that is a different
 * sentence. This keeps each app's own mark and brand colour so the cards on
 * Explore still lead somewhere deliberate, rather than the cards being pulled
 * from Explore altogether.
 */
/** Enough to render each storefront's own identity before its backend exists. */
export const SHOP_PREVIEW: Record<"basket" | "beauty", { name: string; logo: string; tint: string; blurb: string }> = {
  basket: {
    name: "WAWUBasket",
    logo: "/wawubasket-logo.png",
    tint: "var(--brand-basket)",
    blurb:
      "Food, groceries and the fresh market — sellers are being onboarded now. It opens as its own app, and you will reach it from here.",
  },
  beauty: {
    name: "WAWUBeauty",
    logo: "/wawubeauty-logo.png",
    tint: "var(--brand-beauty)",
    blurb:
      "Afro beauty, textiles, shoes and art — sellers are being onboarded now. It opens as its own app, and you will reach it from here.",
  },
};

export function ShopComingSoon({
  name,
  logo,
  tint,
  blurb,
}: {
  name: string;
  logo: string;
  tint: string;
  blurb: string;
}) {
  return (
    <div className="mx-auto flex w-full flex-col gap-[18px] p-[16px_16px_96px] xl:max-w-[760px] xl:gap-[22px] xl:p-[30px_28px_64px]">
      <ProfileBackButton compact />

      <div
        className="flex flex-col items-start gap-[14px] rounded-[var(--radius-card)] border p-[22px] xl:flex-row xl:items-center xl:gap-[24px] xl:p-[28px]"
        style={{
          // Per-shop brand colours belonging to two OTHER products — runtime
          // values, which is the same reason --brand-basket / --brand-beauty
          // exist as variables rather than as app tokens.
          borderColor: `color-mix(in srgb, ${tint} 34%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${tint} 9%, transparent)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="h-[34px] w-auto object-contain xl:h-[40px]" />
        <div className="flex flex-1 flex-col gap-[7px]">
          <span className="text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            {name} opens soon
          </span>
          <p className="m-0 max-w-[54ch] text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">{blurb}</p>
        </div>
        <Button variant="secondary" href="/explore" className="xl:shrink-0">
          Back to Explore
        </Button>
      </div>

      <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
        {name} is its own app. When it opens, buying happens there and your WAWU account carries over —{" "}
        <Link href="/explore" className="font-semibold text-accent no-underline hover:text-text-primary">
          keep browsing WAWU
        </Link>{" "}
        in the meantime.
      </p>
    </div>
  );
}
