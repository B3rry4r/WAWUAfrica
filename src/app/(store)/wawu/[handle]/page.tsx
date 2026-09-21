import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreProfile, toProfileView } from "@/lib/api/profile";
import { PROFILE_TAB_LABEL, type ProfileTab } from "@/types/profile";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { StoreFooter, StoreHeader } from "../../components/StoreChrome";

/**
 * `/wawu/<handle>` — the shareable store link (build brief C3).
 *
 * WHAT THE LINK IS. C3: "every user gets a copyable profile link in the form
 * wawu/their-name". Taken literally, because the alternative is a label that
 * reads `wawu/adaezeokonkwo` sitting on a URL that reads
 * `/profile/9f2c-...`, and the first person to paste one into a browser
 * finds out. Strip the origin off this route and what is left IS the string
 * the brief specifies. See DECISIONS.md D14.
 *
 * WHY IT IS OUTSIDE `(app)`. Everything under `(app)` is wrapped in
 * AppShell, which mounts RequireAuth and redirects a visitor with no session
 * to /sign-in. This route group has no shell, no gate and no session
 * requirement: C3's "no login wall, no registration prompt, no interstitial"
 * is a routing decision before it is a design one.
 *
 * ONE TEMPLATE, STILL. This renders ProfileScreen, the same component the
 * owner's /profile and the signed-in /profile/:id both render, normalised
 * through the same toProfileView. C2 forbids a second profile template and a
 * "public version" of the profile is exactly the fork it forbids. The only
 * differences here are the chrome around it and the tab links, which is what
 * `basePath` is for.
 *
 * Server-rendered on purpose. A shared link is pasted into WhatsApp and X
 * before it is ever opened, so the name, the bio and the photograph have to
 * be in the HTML rather than fetched after hydration (see generateMetadata).
 */

/**
 * The store is read fresh per request: a creator who publishes a piece and
 * sends the link two minutes later must not be served a shelf baked at build
 * time.
 */
export const dynamic = "force-dynamic";

/** Deduped so the metadata read and the page read are one round trip. */
const loadStore = cache(async (handle: string) => {
  try {
    return await getStoreProfile(handle);
  } catch {
    // Any failure is "there is no store at this link" as far as an anonymous
    // visitor is concerned. notFound() renders not-found.tsx beside this file.
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const store = await loadStore(params.handle);
  if (!store) {
    return { title: "Store not found", robots: { index: false, follow: true } };
  }
  const path = `/wawu/${store.handle || params.handle}`;
  const description =
    store.bio ||
    `${store.name} sells on WAWUAfrica. Open the store, no account needed.`;
  return {
    title: `${store.name}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      title: `${store.name} on WAWU`,
      description,
      url: path,
      images: store.avatarUrl ? [{ url: store.avatarUrl, alt: store.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${store.name} on WAWU`,
      description,
    },
  };
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: { handle: string };
  searchParams: { tab?: string };
}) {
  const store = await loadStore(params.handle);
  if (!store) notFound();

  // The screen decides which tabs EXIST (they depend on what this account
  // actually has), so this only rejects a ?tab= that is not a tab at all.
  const tabParam = searchParams.tab;
  const tab: ProfileTab =
    tabParam && tabParam in PROFILE_TAB_LABEL ? (tabParam as ProfileTab) : "overview";

  const handle = store.handle || params.handle;

  return (
    <>
      <StoreHeader />
      <main className="mx-auto w-full max-w-[1120px]">
        {/*
          isOwner is false whoever is looking. This is the public face of the
          store, so it shows what a visitor sees, which is also the one thing
          an owner opening their own link wants to check. Editing lives at
          /profile, where the session that proves ownership exists.
        */}
        <ProfileScreen
          view={toProfileView(store)}
          isOwner={false}
          tab={tab}
          basePath={`/wawu/${handle}`}
        />
      </main>
      <StoreFooter handle={handle} name={store.name} />
    </>
  );
}
