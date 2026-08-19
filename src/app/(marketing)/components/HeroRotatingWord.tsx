"use client";

import { useEffect, useState } from "react";

/**
 * The moodboard's five hero versions, each with a colour from the WAWU brand
 * sheet rather than all of them in the primary purple.
 *
 * The colour is paired to the line: income is green (growth), a movement is
 * pink (energy), an empire is lemon (optimism), legacy is sky (connection).
 * They cycle together, so the headline changes colour as it changes words.
 */
const PHRASES: { text: string; color: string }[] = [
  { text: "Into a Thing.", color: "var(--wawu-lilac)" },
  { text: "Into Income.", color: "var(--wawu-green)" },
  { text: "Into a Movement.", color: "var(--wawu-pink)" },
  { text: "Into an Empire.", color: "var(--wawu-lemon)" },
  { text: "Into Legacy.", color: "var(--wawu-sky)" },
];

export function HeroRotatingWord({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), 2600);
    return () => clearInterval(id);
  }, []);

  const phrase = PHRASES[index];

  return (
    <span
      key={index}
      className={`inline-block animate-[wawuFadeUp_0.45s_var(--ease-soft)] ${className ?? ""}`}
      style={{
        // Per-phrase, so it cannot be a Tailwind class: those are compiled
        // ahead of time and a dynamic class name would never be generated.
        color: phrase.color,
        textShadow: `0 0 60px color-mix(in srgb, ${phrase.color} 40%, transparent)`,
      }}
    >
      {phrase.text}
    </span>
  );
}
