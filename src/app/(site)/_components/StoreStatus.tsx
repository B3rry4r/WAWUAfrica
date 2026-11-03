import { cn } from "@/lib/cn";
import { liveStores, type SiteApp } from "@/lib/site/stores";
import { DownloadIcon, PlayDotIcon } from "./Icons";

/**
 * Where to get an app. With no store link set (src/lib/site/stores.ts) this
 * names the two stores the app is headed for. A store with a link gets its
 * button instead, so turning a store on is one line.
 */
export function StoreStatus({
  app,
  tone = "dark",
  linkless = false,
  className,
}: {
  app: SiteApp;
  tone?: "dark" | "light";
  /** Inside a link (the home tiles) the live stores are named, not linked: an anchor cannot sit in an anchor. */
  linkless?: boolean;
  className?: string;
}) {
  const stores = liveStores(app);
  if (stores.length === 0) {
    return (
      <p
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[14px] font-bold",
          tone === "dark" ? "bg-white/12 text-white" : "bg-site-purple-tint text-site-deep",
          className,
        )}
      >
        <PlayDotIcon className={cn("h-3 w-3", tone === "dark" ? "text-site-lilac" : "text-site-purple")} />
        Coming soon on the App Store and Google Play
      </p>
    );
  }
  if (linkless) {
    return (
      <p className={cn("inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[14px] font-bold", tone === "dark" ? "bg-white/12 text-white" : "bg-site-purple-tint text-site-deep", className)}>
        <PlayDotIcon className={cn("h-3 w-3", tone === "dark" ? "text-site-lilac" : "text-site-purple")} />
        On {stores.map((store) => store.name).join(" and ")}
      </p>
    );
  }
  return (
    <ul className={cn("m-0 flex list-none flex-wrap gap-3 p-0", className)}>
      {stores.map((store) => (
        <li key={store.name}>
          <a
            href={store.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-h-[52px] items-center gap-2.5 rounded-full px-6 text-[16px] font-bold",
              tone === "dark" ? "on-dark bg-white text-site-deep hover:bg-site-lilac" : "bg-site-deep text-white hover:bg-site-ink",
            )}
          >
            <DownloadIcon className="h-5 w-5" />
            {store.name === "App Store" ? "Download on the App Store" : "Get it on Google Play"}
          </a>
        </li>
      ))}
    </ul>
  );
}
