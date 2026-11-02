"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const WORDS = [
  { text: "Make it.", tone: "bg-white text-site-deep" },
  { text: "Say it.", tone: "bg-site-green text-white" },
  { text: "Earn it.", tone: "bg-site-lilac text-site-deep" },
  { text: "Own it.", tone: "bg-site-purple text-white" },
] as const;

/**
 * The highlighted word in the home headline. All four words sit in one grid
 * cell, so the chip is as wide as the widest and nothing moves when the word
 * changes. A screen reader gets the four words once; the changing chip is
 * hidden from it. With "reduce motion" on, it stays on the first word.
 */
export function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((n) => (n + 1) % WORDS.length), 2400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <span className="sr-only">Make it. Say it. Earn it. Own it.</span>
      <span aria-hidden="true" className="mt-[0.1em] inline-grid -rotate-[1.5deg] rounded-[0.16em]">
        {WORDS.map((word, i) => (
          <span
            key={word.text}
            className={cn(
              "col-start-1 row-start-1 rounded-[0.16em] px-[0.16em] pb-[0.06em]",
              word.tone,
              i === index ? "site-pop" : "opacity-0",
            )}
          >
            {word.text}
          </span>
        ))}
      </span>
    </>
  );
}
