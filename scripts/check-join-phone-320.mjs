#!/usr/bin/env node
/**
 * SWEEP-JOIN r2-1: at 320 px wide, the /join WhatsApp number field must hold a
 * Nigerian number typed with its leading zero ("08031234567", 11 digits)
 * without the text scrolling inside the field. The zero is only taken off when
 * the field blurs, so the box has to be wide enough for all 11 digits first.
 *
 *   node scripts/check-join-phone-320.mjs [origin] [screenshot.png]
 *
 * It opens the page in a real Chromium (PLAYWRIGHT_BROWSERS_PATH, /opt/pw-browsers
 * or ~/.cache/ms-playwright), answers the page's one offer request itself (no
 * backend is called), types the number and reads the field. Exit 0 when the
 * text fits (scrollWidth is not wider than clientWidth) and the page does not
 * scroll sideways; exit 1 when it does not.
 */
import { chromium } from "playwright-core";
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const origin = process.argv[2] ?? "http://127.0.0.1:3000";
const shot = process.argv[3];
const NUMBER = "08031234567";

function chromiumPath() {
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers", path.join(os.homedir(), ".cache/ms-playwright")].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root).filter((d) => d.startsWith("chromium-")).sort().reverse()) {
      const exe = path.join(root, dir, "chrome-linux", "chrome");
      if (existsSync(exe)) return exe;
    }
  }
  return undefined;
}

const browser = await chromium.launch({ executablePath: chromiumPath() });
try {
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
  // The page asks for the open offer on load; answer it here.
  await page.route("**/waitlist/offers/current", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        statusCode: 200,
        message: "",
        data: { id: "event", name: "Event", priceKobo: 200000, tierName: "Plan", products: 5, days: 30, closesAt: null },
      }),
    }),
  );
  await page.goto(`${origin}/join`, { waitUntil: "networkidle" });
  const field = page.locator("#phone");
  await field.waitFor({ state: "visible", timeout: 60000 });
  await field.scrollIntoViewIfNeeded();
  await field.click();
  await field.pressSequentially(NUMBER, { delay: 20 });
  const m = await field.evaluate((el) => ({
    value: el.value,
    clientWidth: el.clientWidth,
    scrollWidth: el.scrollWidth,
    scrollLeft: el.scrollLeft,
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  if (shot) await page.locator("form").screenshot({ path: shot });
  console.log(JSON.stringify(m));
  const fits = m.value === NUMBER && m.scrollWidth <= m.clientWidth && m.scrollLeft === 0 && m.pageOverflow <= 0;
  console.log(fits ? "OK: the number fits at 320 px" : "FAIL: the number scrolls inside the field, or the page scrolls sideways, at 320 px");
  process.exitCode = fits ? 0 : 1;
} finally {
  await browser.close();
}
