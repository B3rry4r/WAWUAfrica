import { HomeScreen } from "@/components/home/HomeScreen";

/**
 * `/home` — the signed-in home screen.
 *
 * This used to live at `/`, swapped in over the marketing page by a client
 * gate. That made the landing page unreachable for anyone signed in: there
 * was no URL that would show it, so a signed-in visitor could never get back
 * to it. The app now has its own address and `/` is always the landing page.
 *
 * The screen itself was `(app)/components/HomeFeed.tsx` and is now
 * `@/components/home/HomeScreen.tsx`: build brief C9 gives Home its own Home
 * tab (the TGIF card, the action row, the creator rail), so what used to be
 * the whole screen is one tab inside it, and the parts live under
 * `src/components/home/` with the rest of its pieces rather than in a
 * one-file folder beside the routes.
 *
 * AppShell (session context, chrome, RequireAuth) comes from the (app)
 * layout, so a signed-out visitor hitting this URL is redirected to sign-in.
 */
export default function HomePage() {
  return <HomeScreen />;
}
