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
    id: "credits-never-cash",
    // WAS "no-wallet". Creators HAVE a wallet now (product owner, 5 Sep 2026):
    // a Flutterwave payout subaccount, which is an account at Flutterwave MFB
    // in the creator's own name under Flutterwave's banking licence. WAWU does
    // not custody it, so the CBN trigger the old rule guarded against still
    // does not apply, and the words "wallet" and "withdraw" are now ordinary
    // product vocabulary.
    //
    // What has NOT changed, and is what this rule now protects: WAWU CREDITS
    // are a count, never money. Nobody withdraws a credit, cashes one out, or
    // sees one priced in naira. That was always the separate half of the old
    // rule and it is the half with teeth.
    // Either order: "withdraw your credits" is the same claim as "credits you
    // can withdraw", and a one-directional regex catches only half of them.
    // cash/cashed/cashing out, withdraw/withdrawn/withdrawal, payout, paid out.
    // "cashed out" is the same claim as "cash out" and slipped a narrower one.
    test: /\bcredits?\b[^.]{0,40}\b(withdraw\w*|cash(?:ed|ing)?[\s-]?out|payout|paid out)\b|\b(withdraw\w*|cash(?:ed|ing)?[\s-]?out|payout|paid out)\b[^.]{0,40}\bcredits?\b/i,
    allow: [
      /\b(no|not|never|n't|cannot|can't)\b[^.]{0,60}(withdraw|cash)/i,
      /(withdraw|cash)[^.]{0,60}\b(no|not|never|n't|cannot|can't)\b/i,
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
