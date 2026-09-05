#!/usr/bin/env node
/**
 * Imports the TGIF devotional from the product owner's .docx into the JSON
 * the app reads.
 *
 *   node scripts/build-tgif.mjs /path/to/TGIF_SCRIPTURES_AND_PRAYERS_365.docx
 *
 * Committed rather than run once and forgotten, because it is the only record
 * of what was changed on the way in. Three things are, and each is a decision
 * somebody may want to revisit:
 *
 *  1. "Day 47" is dropped. The source's own cover note says the heading should
 *     be the date, so the app shows one, and the day number survives only as
 *     the index that picks the entry.
 *  2. "Good morning, {Name}!" is dropped, again per that note ("Change All
 *     Good morning to Dear {Name}"). The screen writes the greeting itself, so
 *     it can say "Dear Ada," at 9pm without lying.
 *  3. Em-dashes are converted, per the house rule in CLAUDE.md: a dash before
 *     a capital becomes a full stop, before a lowercase word a comma, and a
 *     matched pair around a clause becomes a pair of commas. 759 of them in
 *     the devotional prose.
 *
 *     THE SCRIPTURE QUOTATIONS ARE LEFT EXACTLY AS THEY ARE. Fifteen verses
 *     carry an em-dash that belongs to the translation, and rewriting the
 *     punctuation of a quoted verse is editing somebody's quotation, not
 *     applying a house style to our own copy. If the owner wants those changed
 *     too, it is one line here, but it should be their call and not a silent
 *     side effect of an import script.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { join } from "node:path";

/** Reads one file out of a .docx (a zip) without pulling in a zip library. */
function readZipEntry(buf, wanted) {
  // Walk the central directory from the end-of-central-directory record.
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip file");
  let p = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < count; i++) {
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const localOff = buf.readUInt32LE(p + 42);
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    if (name === wanted) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const raw = buf.subarray(start, start + compSize);
      return method === 0 ? raw : inflateRawSync(raw);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${wanted} not found in the document`);
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** Word paragraphs, flattened to plain text, blanks dropped. */
function paragraphs(xml) {
  const out = [];
  for (const [, body] of xml.matchAll(/<w:p[ >]([\s\S]*?)<\/w:p>/g)) {
    let text = "";
    for (const [, run] of body.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)) text += run;
    text = text.replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENTITIES[e]).trim();
    if (text) out.push(text);
  }
  return out;
}

/**
 * The house rule on em-dashes, applied to our own prose only.
 * Order matters: the paired form has to be matched before the single one eats
 * its opening dash.
 */
function dedash(s) {
  return s
    .replace(/(?<=[a-z,])—([^—.!?]{1,80}?)—(?=[a-z])/g, ", $1, ")
    .replace(/([a-z0-9,!"')])—([A-Z])/g, "$1. $2")
    .replace(/([a-z0-9"')])—([a-z])/g, "$1, $2")
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const FIELDS = [
  ["verse", "Today in Christ:"],
  ["reality", "The Reality:"],
  ["remember", "Remember:"],
  ["prayer", "Today's Prayer:"],
  ["takeaway", "Take It With You:"],
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function main() {
  const docx = process.argv[2];
  if (!docx) {
    console.error("usage: node scripts/build-tgif.mjs <TGIF...docx>");
    process.exit(2);
  }
  const xml = readZipEntry(readFileSync(docx), "word/document.xml").toString("utf8");
  const lines = paragraphs(xml);

  const entries = [];
  let block = null;
  let awaitingTheme = false;
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^MONTH (\d+): (.+?) \(Days \d+[–-]\d+\)$/);
    if (heading) {
      block = { title: heading[2], theme: null };
      awaitingTheme = true;
      continue;
    }
    // The line straight after a month heading is that month's theme.
    if (awaitingTheme && !/^Day \d/.test(line)) {
      // A theme is a title, so its dash is a colon rather than a full stop:
      // "Christ in You: The Hope of Glory", not "Christ in You. The Hope...".
      block.theme = dedash(line.replace(/\s*—\s*/g, ": "));
      awaitingTheme = false;
      continue;
    }
    const day = line.match(/^Day (\d+)\s*(.*)$/);
    if (day) {
      // The cover note's own instruction line ("Day 1, etc should be DATE OF
      // THE MONTH AND") starts with "Day 1" too. A real entry is followed by
      // its greeting on the same paragraph; the note is not.
      if (!/^Good morning/.test(day[2])) continue;
      current = { day: Number(day[1]), block };
      entries.push(current);
      continue;
    }
    if (!current) continue;
    const field = FIELDS.find(([, label]) => line.startsWith(label));
    if (field) {
      current[field[0]] = line.slice(field[1].length).trim();
    } else {
      (current.outro ??= []).push(line);
    }
  }

  if (entries.length !== 365) throw new Error(`expected 365 entries, parsed ${entries.length}`);

  const byDay = new Map();
  for (const e of entries) {
    const quoted = e.verse.match(/^[“"](.*)[”"]\s*[—–-]\s*(.+)$/);
    if (!quoted) throw new Error(`day ${e.day}: could not split the verse from its reference`);
    byDay.set(e.day, {
      quote: quoted[1].trim(), // verbatim: see the header note
      ref: quoted[2].trim(),
      reality: dedash(e.reality),
      remember: dedash(e.remember),
      prayer: dedash(e.prayer),
      takeaway: dedash(e.takeaway),
      series: e.block.title,
      seriesTheme: e.block.theme,
      /*
        ONLY THE LAST DAY GETS AN OUTRO, and it loses its own heading.

        Loose lines turn up under exactly two days, and only one of them is
        content. Day 365 closes the year properly. Day 90 carries this, left in
        the document by whatever wrote it:

          "I'll continue with Months 4-12 in the next section. Would you like
           me to proceed with the remaining 275 days?"

        On a date-keyed screen that is 31 March, and it would have been shown
        to every reader on 31 March as though it were their devotional. Nothing
        but day 365 may carry loose text out of this importer.

        The heading line ("THE END OF DAY 365") goes too: the screen counts in
        dates, not day numbers, so a heading that says "day 365" is the one
        place the old numbering would have leaked back in.
      */
      ...(e.day === 365
        ? { outro: e.outro.filter((l) => !/^THE END OF DAY/i.test(l)).map(dedash) }
        : {}),
    });
  }

  // One file per CALENDAR month, so a reader downloads about 30KB rather than
  // the whole year. The source's own "months" are blocks of 29-35 days and do
  // not line up with a calendar, which is why they travel on each entry as
  // `series` instead of deciding the file layout.
  const dir = join(process.cwd(), "public", "tgif");
  mkdirSync(dir, { recursive: true });
  let dayOfYear = 0;
  for (let m = 0; m < 12; m++) {
    const days = [];
    for (let d = 1; d <= DAYS_IN_MONTH[m]; d++) {
      days.push({ d, ...byDay.get(++dayOfYear) });
    }
    const file = join(dir, `${String(m + 1).padStart(2, "0")}.json`);
    writeFileSync(file, JSON.stringify({ month: m + 1, days }));
    console.log(`${file}  ${days.length} days  ${(readFileSync(file).length / 1024).toFixed(1)}KB`);
  }
  console.log(`\n${dayOfYear} days written.`);
}

main();
