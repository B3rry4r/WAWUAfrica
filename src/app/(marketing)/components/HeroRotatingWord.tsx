"use client";

import { useEffect, useState } from "react";

/** The moodboard's five hero versions: Default, Earn, Grow, Build, Thrive. */
const PHRASES = ["Into a Thing.", "Into Income.", "Into a Movement.", "Into an Empire.", "Into Legacy."];

/**
 * The headline stays in the brand purple. The rest of the page carries the
 * wider palette; the hero is the one place that should read as unmistakably
 * WAWU rather than changing colour underneath the reader.
 */
export function HeroRotatingWord({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <span key={index} className={`inline-block animate-[wawuFadeUp_0.45s_var(--ease-soft)] ${className ?? ""}`}>
      {PHRASES[index]}
    </span>
  );
}
