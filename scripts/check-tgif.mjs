#!/usr/bin/env node
/**
 * Guards the TGIF devotional data that ships in `public/tgif/`.
 *
 * It is 365 days of somebody else's writing, imported once from a .docx by
 * `scripts/build-tgif.mjs`. Nobody is going to read it again before a deploy,
 * so the things worth catching are the ones a reader would find first:
 *
 *  - a date with no reading behind it, on any day of any year;
 *  - a line the document's author left in for themselves rather than for a
 *    reader (the import found one: "I'll continue with Months 4-12... Would
 *    you like me to proceed?", which would have been shown as the reading for
 *    31 March);
 *  - a `{Name}` slot the screen forgot to fill;
 *  - an em-dash in our own prose, per CLAUDE.md. The verses are exempt and
 *    deliberately so: their punctuation belongs to the translation, and
 *    rewriting a quotation is not a style fix.
 *
 * Usage: node scripts/check-tgif.mjs   (exits non-zero on a violation)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "public", "tgif");
const PROSE = ["reality", "remember", "prayer", "takeaway"];
const REQUIRED = ["quote", "ref", "series", "seriesTheme", ...PROSE];

/** Phrasing that addresses the document's author, not its reader. */
const NOT_FOR_A_READER = [
  /would you like me to/i,
  /\bI'll continue\b/i,
  /\bnext section\b/i,
  /\bremaining \d+ days\b/i,
  /\blorem ipsum\b/i,
  /\bTODO\b/,
  /\[(insert|placeholder)/i,
];

const problems = [];
const months = [];

for (let m = 1; m <= 12; m++) {
  const file = join(DIR, `${String(m).padStart(2, "0")}.json`);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    problems.push(`${file}: could not be read (${e.message})`);
    continue;
  }
  months[m] = parsed;

  if (parsed.month !== m) problems.push(`${file}: says it is month ${parsed.month}`);

  parsed.days.forEach((entry, i) => {
    const where = `${file} day ${entry.d}`;
    if (entry.d !== i + 1) problems.push(`${where}: days are out of order`);
    for (const key of REQUIRED) {
      if (typeof entry[key] !== "string" || !entry[key].trim()) problems.push(`${where}: ${key} is missing`);
    }
    for (const key of PROSE) {
      if ((entry[key] ?? "").includes("—")) problems.push(`${where}: an em-dash survived in ${key}`);
    }
    for (const line of [...PROSE.map((k) => entry[k] ?? ""), ...(entry.outro ?? [])]) {
      const smell = NOT_FOR_A_READER.find((r) => r.test(line));
      if (smell) problems.push(`${where}: a note to the author is being shown to readers: ${line.slice(0, 80)}`);
    }
    // Only the last day of the year closes the year.
    if (entry.outro && !(m === 12 && entry.d === 31)) problems.push(`${where}: has a closing note but is not 31 December`);
  });
}

const total = months.slice(1).reduce((n, mo) => n + (mo?.days.length ?? 0), 0);
if (total !== 365) problems.push(`expected 365 readings, found ${total}`);

/*
  EVERY DATE RESOLVES, in a leap year and a common one.

  This is the whole "properly looped" claim, so it is checked rather than
  reasoned about: walk all 366 days of a leap year and all 365 of a common
  one, and make sure each lands on a reading. 29 February is expected to
  share 28 February's, which is what keeps every date after it in place.
*/
for (const year of [2026, 2028]) {
  for (const d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const mo = months[d.getMonth() + 1];
    // 29 February is the ONE date allowed to borrow another day's reading.
    const leapDay = d.getMonth() === 1 && d.getDate() === 29;
    const day = leapDay ? 28 : d.getDate();
    if (!mo.days.find((e) => e.d === day)) problems.push(`${d.toDateString()}: no reading`);
  }
}

// The screen fills {Name}; nothing else may.
const stray = months.slice(1).flatMap((mo) =>
  mo.days.flatMap((e) => Object.entries(e).filter(([k, v]) => typeof v === "string" && v.includes("{") && !v.includes("{Name}") && k)),
);
for (const [k, v] of stray) problems.push(`an unfilled placeholder in ${k}: ${v.slice(0, 60)}`);

if (problems.length) {
  for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
  console.error(`\n${problems.length} problem(s) in the TGIF devotional data.`);
  process.exit(1);
}
console.log(`TGIF: ${total} readings, every date in a leap and a common year resolves.`);
