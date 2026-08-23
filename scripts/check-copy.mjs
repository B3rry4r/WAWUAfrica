#!/usr/bin/env node
/**
 * Repo copy rules that keep getting re-broken.
 *
 * Every one of these was reported by the product owner, fixed, and then
 * reintroduced by new code written later in the same session. A grep the
 * author has to remember to run is not a rule; this is.
 *
 * Usage: node scripts/check-copy.mjs   (exits non-zero on a violation)
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
process.removeAllListeners("warning");

const RULES = [
  {
    id: "no-free",
    // "Free" is banned from user-visible copy. Say "at no charge", "included",
    // "costs nothing", or state the price as ₦0.
    test: /\bfree\b/i,
    allow: [
      /freeSlots|freeCourses|state=["']free["']|free=\{|:\s*["']free["']|===\s*["']free["']|"locked"\s*\|\s*"free"/,
      /free-|freeform|font-|prefers-reduced/,
    ],
  },
  {
    id: "no-dollars",
    // Naira only, never dollars.
    test: /\$\d|USD\b|dollars?\b/i,
    allow: [/\$\{/],
  },
  {
    id: "no-wallet",
    // No wallet, no cash balance, no cash-out. Ever.
    test: /\bwallet\b|cash out\b|cash-out\b|withdraw/i,
    // Copy that exists precisely to SAY there is no wallet is the point, not a
    // violation. Allow a negation anywhere in the same sentence.
    allow: [
      /\b(no|not|never|n't|cannot|can't|without)\b[^.]{0,80}(wallet|cash|withdraw)/i,
      /(wallet|cash|withdraw)[^.]{0,80}\b(no|not|never|n't|cannot|can't)\b/i,
    ],
  },
  {
    id: "credits-are-a-count",
    // Credits render as a COUNT, never a naira value.
    test: /₦[\d,]+\s*(worth of |in )?credits?\b/i,
    allow: [],
  },
];

// Only user-visible strings: JSX text nodes and quoted literals, minus comments.
function visibleStrings(src) {
  const noBlockComments = src.replace(/\/\*[\s\S]*?\*\//g, "");
  const noLineComments = noBlockComments.replace(/^\s*\/\/.*$/gm, "");
  const out = [];
  for (const m of noLineComments.matchAll(/>([^<>{}]*?)</gs)) {
    if (m[1].trim()) out.push([m[1], m.index]);
  }
  // Quoted literals, but NOT attribute values / union members — `state="free"`
  // and `variant="ghost"` are code, not copy. A real sentence has a space.
  for (const m of noLineComments.matchAll(/"([^"\n]{4,})"/g)) {
    if (!/\s/.test(m[1])) continue;
    out.push([m[1], m.index]);
  }
  return { out, cleaned: noLineComments };
}

const files = globSync("src/**/*.tsx");
let violations = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const { out, cleaned } = visibleStrings(src);
  for (const [text, idx] of out) {
    for (const rule of RULES) {
      if (!rule.test.test(text)) continue;
      if (rule.allow.some((a) => a.test(text))) continue;
      const line = cleaned.slice(0, idx).split("\n").length;
      console.error(`${file}:${line}  [${rule.id}]  ${text.trim().slice(0, 90)}`);
      violations++;
    }
  }
}
if (violations) {
  console.error(`\n${violations} copy violation(s). See scripts/check-copy.mjs for the rules and why each exists.`);
  process.exit(1);
}
console.log("copy rules: clean");
