import { Button } from "@/components/ui/Button";

/**
 * The small page an app link shows when the WAWU app did not open (LINKS-01):
 * the app is not installed, or the phone opened the link in a browser. Dark
 * only, like the rest of the site (the light tokens apply only under
 * data-theme="light", which nothing here sets).
 *
 * The button uses the app's own address (wawu://...), which opens the app
 * whenever it is installed. It is there because a phone does not hand a link to
 * the app when that link is followed from a page on the same website, or after
 * a redirect, so the tap on this button is the reliable way in.
 *
 * `secondLink` is an optional second action under the app button (a receipt's
 * public check page). The app button stays first, so a phone with the app still
 * gets the hand-off.
 */
export function OpenInApp({
  message,
  appAddress,
  secondLink,
}: {
  message: string;
  appAddress: string;
  secondLink?: { label: string; href: string };
}) {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-page px-4 py-10 text-text-primary">
      <div
        className="pointer-events-none absolute -right-[20%] -top-[30%] -z-10 h-[620px] w-[900px] bg-[radial-gradient(closest-side,var(--accent-tint-strong),transparent)]"
        aria-hidden="true"
      />
      <div className="flex w-full max-w-[420px] flex-col items-center gap-6 text-center">
        <img
          src="/who-made-this-white.png"
          alt="Who Made This"
          width={1009}
          height={295}
          className="h-[44px] w-auto object-contain"
        />
        <h1 className="m-0 text-[28px] font-bold leading-[1.15] tracking-[-0.03em]">Open in the WAWU app</h1>
        <p className="m-0 max-w-[32ch] text-[16px] leading-normal text-text-secondary">{message}</p>
        <div className="flex w-full flex-col gap-3">
          <Button href={appAddress} size="lg" full>
            Open the app
          </Button>
          {secondLink ? (
            <Button href={secondLink.href} variant="secondary" size="lg" full>
              {secondLink.label}
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
