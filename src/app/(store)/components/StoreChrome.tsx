import Link from "next/link";
import { LandingAuthCta } from "@/app/(marketing)/components/LandingAuthCta";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { Button } from "@/components/ui";

/**
 * The chrome around a public store (build brief C3).
 *
 * THERE IS NO REFERENCE IMAGE FOR THIS VIEW, so it is derived from the house
 * language in A5 rather than invented: neutral surfaces, one hairline rule,
 * purple reserved for the two things that are actually actions (the copy
 * control and the store-link glyph), white for the join button, which is the
 * emphatic thing on the page. See DECISIONS.md D14.
 *
 * It is deliberately thin. The store itself is the page: a visitor who
 * followed a link came for a person, not for WAWU, and anything stacked
 * above the cover photo is the interstitial C3 forbids. So the header is one
 * row, the join call sits in the header where it is reachable without
 * displacing anything, and everything else is below the storefront.
 */

/** Sticky, one row: the mark, and the way in. */
export function StoreHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-[var(--surface-chrome)] [backdrop-filter:var(--blur-chrome)]">
      <div className="mx-auto flex h-[58px] w-full max-w-[1120px] items-center justify-between gap-3 px-[16px] xl:h-[66px] xl:px-[26px]">
        <Link href="/" aria-label="WAWUAfrica home" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wawu-logo-white.png" alt="WAWU" className="h-[21px] w-auto object-contain xl:h-[23px]" />
        </Link>
        <div className="flex items-center gap-2">
          <LandingAuthCta />
        </div>
      </div>
    </header>
  );
}

/**
 * Under the storefront: the link itself, copyable, plus the ways on into the
 * rest of the platform that are readable WITHOUT an account.
 *
 * The join call is not repeated here. ProfileCrossSell already carries it
 * (C2/C10) a few hundred pixels above, and two "create an account" buttons
 * in one scroll is how a page starts nagging.
 */
export function StoreFooter({ handle, name }: { handle: string; name: string }) {
  return (
    <footer className="mt-[26px] border-t border-hairline bg-[var(--surface-elevated)]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-[20px] px-[16px] py-[24px] xl:flex-row xl:items-start xl:justify-between xl:gap-[40px] xl:px-[26px] xl:py-[30px]">
        <div className="flex min-w-0 flex-col gap-[10px] xl:max-w-[420px]">
          <h2 className="m-0 text-[15px] font-bold tracking-[-0.015em] text-text-primary">
            Share {name.split(" ")[0]}&apos;s store
          </h2>
          <ShareProfileButton handle={handle} display="row" />
        </div>

        <div className="flex flex-col gap-[12px] xl:items-end">
          <p className="m-0 max-w-[380px] text-[12.5px] leading-[1.5] text-text-secondary xl:text-right">
            WAWUAfrica is where African creators and professionals sell what they know. Creators keep 85% of
            what they earn.
          </p>
          <div className="flex flex-wrap items-center gap-[10px]">
            <Button size="sm" variant="secondary" href="/">
              How WAWU works
            </Button>
            <Link
              href="/terms"
              className="text-[12.5px] font-semibold text-text-muted no-underline transition-colors hover:text-text-primary"
            >
              Terms
            </Link>
            <Link
              href="/privacy/policy"
              className="text-[12.5px] font-semibold text-text-muted no-underline transition-colors hover:text-text-primary"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
