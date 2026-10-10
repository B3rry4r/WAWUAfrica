"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Callout } from "@/components/ui";

/** How long the button says "Copied" before it goes back to "Copy code". */
const COPIED_FOR_MS = 2_500;

/**
 * Everything on the screen after payment that comes under the heading: the
 * code, the button that copies it, and the owner's words (10 Oct 2026), kept
 * exactly: the capitals, the curly apostrophes, the emoji and the figure in
 * the IMPORTANT line.
 *
 * The code is the short reference of the registration ("XXXX XXXX"), shown
 * large in a monospace face so it is easy to read out and to write down.
 *
 * "Copy code" writes the code to the clipboard and says "Copied" only once the
 * browser has accepted it. Where the clipboard is missing or refuses (an
 * in-app browser, a denied permission) the code is selected instead, so the
 * person can copy it by hand and nothing pretends it worked.
 */
export function LaunchAccessCode({ code }: { code: string }) {
  const codeRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function selectCode() {
    const el = codeRef.current;
    const selection = typeof window === "undefined" ? null : window.getSelection();
    if (!el || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copy() {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") throw new Error("no clipboard");
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_FOR_MS);
    } catch {
      setCopied(false);
      selectCode();
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex w-full flex-col items-center gap-3">
        <div className="w-full rounded-input border border-accent bg-input px-4 py-4 text-center dt:py-5">
          <span
            ref={codeRef}
            data-testid="short-reference"
            className="select-all font-mono text-[34px] font-bold leading-[1.15] tracking-[0.1em] text-text-primary dt:text-[44px]"
          >
            {code}
          </span>
        </div>
        <Button
          variant="secondary"
          icon={copied ? "Check" : "Copy"}
          onClick={() => void copy()}
          className="min-w-[172px]"
        >
          {copied ? "Copied" : "Copy code"}
        </Button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? "Copied" : ""}
        </span>
      </div>

      <p className="m-0 text-[18px] font-bold leading-[1.3] tracking-[-0.01em] text-text-primary">Keep your unique ID safe! 🔐</p>

      <p className="m-0">
        Your code is your key to redeeming your subscription discount when WHO MADE THIS? officially launches on October
        17, 2026.
      </p>

      <Callout tone="warning" size="md" full className="text-left">
        <strong className="font-bold text-text-primary">IMPORTANT:</strong> Without this code, you’ll pay the standard
        subscription fee of ₦10,000.
      </Callout>

      <p className="m-0 text-[15.5px] font-semibold leading-[1.45] text-text-primary">
        Keep it safe. Don’t lose it. Your code, your discount!
      </p>
    </div>
  );
}
