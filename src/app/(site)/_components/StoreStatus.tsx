import { cn } from "@/lib/cn";
import { liveStores, WEB_LINKS, type SiteApp } from "@/lib/site/stores";
import { ArrowIcon, DownloadIcon, PlayDotIcon } from "./Icons";

/**
 * Where to get an app: the live web link button (src/lib/site/stores.ts, WEB_LINKS),
 * and a store's button beside it once that store has a link, so turning a store
 * on is one line.
 */
export function StoreStatus({
  app,
  tone = "dark",
  linkless = false,
  className,
}: {
  app: SiteApp;
  tone?: "dark" | "light";
  /** Inside a link (the home tiles) the web app and live stores are named, not linked: an anchor cannot sit in an anchor. */
  linkless?: boolean;
  className?: string;
}) {
  const stores = liveStores(app);
  const web = WEB_LINKS[app];
  const pill = cn("inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[14px] font-bold", tone === "dark" ? "bg-white/12 text-white" : "bg-site-purple-tint text-site-deep", className);
  const dot = <PlayDotIcon className={cn("h-3 w-3", tone === "dark" ? "text-site-lilac" : "text-site-purple")} />;
  if (linkless) {
    return (
      <p className={pill}>
        {dot}
        {stores.length === 0 ? `Open now at ${web.href.replace("https://", "")}` : `On ${stores.map((store) => store.name).join(" and ")}`}
      </p>
    );
  }
  const button = cn(
    "inline-flex min-h-[52px] items-center gap-2.5 rounded-full px-6 text-[16px] font-bold",
    tone === "dark" ? "on-dark bg-white text-site-green-deep hover:bg-site-mint" : "bg-site-deep text-white hover:bg-site-ink",
  );
  return (
    <ul className={cn("m-0 flex list-none flex-wrap gap-3 p-0", className)}>
      <li>
        <a href={web.href} className={button}>
          {web.label}
          <ArrowIcon className="h-[18px] w-[18px]" />
        </a>
      </li>
      {stores.map((store) => (
        <li key={store.name}>
          <a href={store.href} target="_blank" rel="noopener noreferrer" className={button}>
            <DownloadIcon className="h-5 w-5" />
            {store.name === "App Store" ? "Download on the App Store" : "Get it on Google Play"}
          </a>
        </li>
      ))}
    </ul>
  );
}
