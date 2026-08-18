import { HomeFeed } from "../components/HomeFeed";

/**
 * `/home` — the signed-in home feed.
 *
 * This used to live at `/`, swapped in over the marketing page by a client
 * gate. That made the landing page unreachable for anyone signed in: there
 * was no URL that would show it, so a signed-in visitor could never get back
 * to it. The app now has its own address and `/` is always the landing page.
 *
 * AppShell (session context, chrome, RequireAuth) comes from the (app)
 * layout, so a signed-out visitor hitting this URL is redirected to sign-in.
 */
export default function HomePage() {
  return <HomeFeed />;
}
