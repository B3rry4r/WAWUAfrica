import { ScreenTile } from "./ScreenTile";

/**
 * Two app screens, tilted, for the home hero. Purely a picture: the screens
 * are described in full on /who-made-this, so these are hidden from screen
 * readers.
 */
export function HeroScreens() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-[320px] w-full max-w-[340px] sm:h-[470px] sm:max-w-[420px] lg:h-[480px] lg:max-w-[480px]">
      <div className="absolute left-0 top-6 w-[56%] -rotate-[5deg]">
        <ScreenTile id="home" priority sizes="(min-width: 1024px) 270px, 200px" />
      </div>
      <div className="site-float absolute right-0 top-0 w-[56%] rotate-[4deg] [--site-tilt:4deg]">
        <ScreenTile id="feed" priority sizes="(min-width: 1024px) 270px, 200px" />
      </div>
    </div>
  );
}
