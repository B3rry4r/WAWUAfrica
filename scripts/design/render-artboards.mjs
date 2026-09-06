#!/usr/bin/env node
/**
 * Renders every artboard in the design canvas to a PNG, so a built screen can
 * be compared against a PICTURE of its design instead of against the design's
 * source code.
 *
 *   node scripts/design/render-artboards.mjs                 # all of them
 *   node scripts/design/render-artboards.mjs "WAWU Auth"     # one file
 *   -> build/design_shots/<file>__<artboard title>.png
 *
 * WHY NOT THE PYTHON ONE THAT SHIPS WITH THE SKILL. That script isolates an
 * artboard by its `id="s22"` and screenshots the whole window. This canvas has
 * no ids on anything: an artboard here is a bare
 * `<div style="position:relative;width:430px;height:932px;...">` with its title
 * in the nearest preceding <h2>. Run as-is it found zero ids, rendered zero
 * files, and printed "rendered 0 artboard(s)" without listing a single failure,
 * which is the silent half-render this whole phase exists to prevent.
 *
 * Two things this has to get right, and both are why it drives a real browser:
 *
 *  - RELATIVE PATHS. The canvas loads its design system, fonts and images from
 *    paths relative to its own directory. Copy the markup anywhere else and
 *    every one of them 404s, leaving text on a blank ground that still looks
 *    enough like a design to be compared against. So the original file is
 *    opened in place, unmodified.
 *  - THE DESIGN SYSTEM IS A RUNTIME. `support.js` walks the DOM turning
 *    <x-import> elements into real components. Screenshot too early and every
 *    icon is missing while the text renders fine. So this waits for the
 *    <x-import> elements to actually resolve before shooting, and says so
 *    loudly if they never do.
 */
import { chromium } from "playwright-core";
import { readdirSync, mkdirSync } from "node:fs";
import path from "node:path";

const CANVAS = path.resolve("design/screens");
const OUT = path.resolve("build/design_shots");

/** Filename-safe, and stable so a re-run overwrites rather than accumulates. */
const slug = (s) => s.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

const only = process.argv.slice(2);
const files = readdirSync(CANVAS)
  .filter((f) => f.endsWith(".dc.html"))
  .filter((f) => !only.length || only.some((o) => f.includes(o)));

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
let shot = 0;
const empty = [];

for (const file of files) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
  await page.goto(`file://${path.join(CANVAS, file)}`, { waitUntil: "networkidle" });

  // The runtime replaces <x-import> in place. While any remain, components
  // have not finished registering and a shot would be missing its icons.
  await page
    .waitForFunction(() => document.querySelectorAll("x-import").length === 0, null, { timeout: 20000 })
    .catch(() => console.warn(`  ! ${file}: components never finished registering, shots may lack icons`));
  await page.waitForTimeout(1200);

  // An artboard is a phone-sized frame. Title it from the nearest heading
  // above it, which is what a human reads it by.
  /*
    An artboard here is a PHONE FRAME: a fixed 430-wide, ~930-tall rounded div.
    The canvas also groups those frames under section headings, and an earlier
    version of this selector caught the groups, producing one PNG holding four
    screens. A group is not comparable to a single built screen, so the frame
    is the unit, and each one is named from the caption printed under it plus
    the section it sits in - which is exactly how a person refers to it.
  */
  const boards = await page.evaluate(() => {
    const out = [];
    const frames = [...document.querySelectorAll("div")].filter((el) => {
      const st = el.getAttribute("style") || "";
      const r = el.getBoundingClientRect();
      return /width:\s*4\d\dpx/.test(st) && r.width >= 380 && r.width <= 500 && r.height >= 600;
    });
    for (const el of frames) {
      // The caption sits in the next sibling; the section heading is the
      // nearest <h2> above the group this frame belongs to.
      const cap = el.nextElementSibling?.textContent?.trim() || "";
      let sec = "", n = el;
      while (n && !sec) { n = n.previousElementSibling ?? n.parentElement; if (n?.tagName === "H2") sec = n.textContent.trim(); }
      el.setAttribute("data-artboard", out.length);
      out.push({ i: out.length, title: [sec, cap].filter(Boolean).join(" - ") || `board-${out.length}` });
    }
    return out;
  });

  for (const b of boards) {
    const el = page.locator(`[data-artboard="${b.i}"]`);
    const name = `${slug(file.replace(".dc.html", ""))}__${slug(b.title)}-${b.i}.png`;
    await el.screenshot({ path: path.join(OUT, name) });
    shot++;
  }
  if (!boards.length) empty.push(file);
  console.log(`${file}: ${boards.length} artboard(s)`);
  await page.close();
}
await browser.close();

console.log(`\nrendered ${shot} artboard(s) into build/design_shots`);
// Never a silent zero: a canvas file that produced nothing is a set of screens
// nobody can compare, and it has to be visible as that rather than absent.
if (empty.length) console.log(`NO ARTBOARDS FOUND, so NOT comparable: ${empty.join(", ")}`);
