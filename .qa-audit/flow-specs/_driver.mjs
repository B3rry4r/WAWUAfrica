import pw from "/workspace/projects/WAWU-Web/node_modules/playwright-core/index.js";
const { chromium } = pw;
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const SC = "/tmp/claude-1001/-workspace-projects-WAWU-Web/eb75080b-5cfd-411e-b096-e1ddfb820c55/scratchpad";
const OUT = "/workspace/projects/WAWU-Web/.qa-audit/captures";
const BASE = "http://127.0.0.1:3418";
mkdirSync(OUT, { recursive: true });

const ACTORS = {
  guest: null,
  user: { f: "qauser", accountType: "user", creator: null },
  creator_unpaid: { f: "qacreatorunpaid", accountType: "creator", creator: { tier: "basic", subscriptionPaid: false, kyc: "not_started", slotsUsed: 0, slotsTotal: 3, dmPrice: 0, dmEnabled: false } },
  creator_kycpending: { f: "qacreatorkyc", accountType: "creator", creator: { tier: "basic", subscriptionPaid: true, kyc: "pending", slotsUsed: 0, slotsTotal: 3, dmPrice: 500, dmEnabled: true } },
  creator_pro: { f: "qacreatorpro", accountType: "creator", creator: { tier: "pro", subscriptionPaid: true, kyc: "approved", slotsUsed: 2, slotsTotal: 7, dmPrice: 1500, dmEnabled: true } },
  creator_rejected: { f: "qacreatorrej", accountType: "creator", creator: { tier: "basic", subscriptionPaid: true, kyc: "rejected", slotsUsed: 0, slotsTotal: 3, dmPrice: 0, dmEnabled: false } },
};

const tokenCache = new Map();
async function freshTokens(f) {
  if (tokenCache.has(f)) return tokenCache.get(f);
  const r = await fetch("http://127.0.0.1:4001/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: `qa.${f}@wawu.test`, password: "WawuTest-9f4Kq2Lm" }) });
  if (!r.ok) throw new Error("relogin failed for " + f + ": " + r.status);
  const j = await r.json();
  tokenCache.set(f, j);
  return j;
}
async function sessionFor(name) {
  const a = ACTORS[name];
  if (!a) return null;
  const j = await freshTokens(a.f);
  const p = JSON.parse(Buffer.from(j.accessToken.split(".")[1], "base64").toString());
  return {
    accessToken: j.accessToken, refreshToken: j.refreshToken,
    accountType: a.accountType,
    user: { wawuId: p.sub, fullName: `${p.firstName} ${p.lastName}`, email: p.email, accountType: a.accountType, interests: [], verification: "basic", creator: a.creator },
  };
}

const specs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const viewport = process.argv[3] === "desktop" ? { width: 1440, height: 900 } : { width: 430, height: 932 };
const tag = process.argv[3] === "desktop" ? "desktop" : "mobile";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const results = [];
for (const s of specs) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, ...(tag==="mobile"?{isMobile:true,hasTouch:true}:{}) });
  const errs = [];
  ctx.on("weberror", e => errs.push("pageerror: " + String(e.error()).slice(0,200)));
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type()==="error") errs.push("console: "+m.text().slice(0,200)); });
  const sess = await sessionFor(s.actor ?? "guest");
  let status = "ok", note = "";
  try {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
    if (sess) {
      await page.evaluate(v => { localStorage.setItem("wawu-web-session", v); }, JSON.stringify(sess));
      await ctx.addCookies([{ name: "wawu_account_type", value: sess.accountType, url: BASE }]);
    }
    if (s.clock) await page.clock.setFixedTime(new Date(s.clock));
    await page.goto(BASE + s.route, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(s.settle ?? 1400);
    for (const step of (s.steps ?? [])) {
      const [op, ...rest] = step;
      const arg = rest[0];
      try {
        if (op === "click") { const l = page.getByText(arg, { exact: false }).filter({ visible: true }).first(); await l.scrollIntoViewIfNeeded({timeout:6000}); await l.click({ timeout: 10000 }); }
        else if (op === "clickRole") { await page.getByRole(arg, { name: rest[1] }).first().click({ timeout: 8000 }); }
        else if (op === "clickSel") { await page.locator(arg).first().click({ timeout: 8000 }); }
        else if (op === "fill") { await page.locator(arg).first().fill(rest[1], { timeout: 8000 }); }
        else if (op === "wait") { await page.waitForTimeout(arg); }
        else if (op === "scroll") { await page.evaluate(y => window.scrollTo(0, y), arg); }
        else if (op === "press") { await page.keyboard.press(arg); }
        await page.waitForTimeout(step[2] === undefined ? 900 : 900);
      } catch (e) { status = "broken-drive"; note += `step ${op}(${String(arg).slice(0,40)}) failed: ${String(e.message).split("\n")[0].slice(0,160)}; `; break; }
    }
    const body = (await page.locator("body").innerText().catch(()=> "")) || "";
    if (/Application error|client-side exception|This page could not be found|404/i.test(body.slice(0,600))) { status = status==="ok" ? "fallback" : status; note += "landed on error/404 view; "; }
    const file = `${OUT}/${s.id}__${tag}.png`;
    await page.screenshot({ path: file, fullPage: !!s.fullPage });
    results.push({ id: s.id, actor: s.actor ?? "guest", route: s.route, status, note, url: page.url(), file, textHead: body.replace(/\s+/g," ").slice(0, 600), errors: errs.slice(0,6) });
  } catch (e) {
    results.push({ id: s.id, actor: s.actor ?? "guest", route: s.route, status: "unreachable", note: String(e.message).split("\n")[0].slice(0,200), errors: errs.slice(0,6) });
  }
  await ctx.close();
}
await browser.close();
writeFileSync(process.argv[4] ?? `${SC}/drive-results.json`, JSON.stringify(results, null, 2));
for (const r of results) console.log(`${r.status.padEnd(13)} ${r.id.padEnd(38)} ${r.note||""}`);
