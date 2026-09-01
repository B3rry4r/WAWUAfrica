import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:3100';
const routes = fs.readFileSync(process.argv[2], 'utf8').split('\n')
  .map(r => r.trim()).filter(Boolean).filter(r => !r.includes('['));

const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();

// Sign in once as a Pro creator (the widest set of surfaces).
await p.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle', timeout: 90000 });
await p.getByLabel(/email/i).first().fill('creator-pro@test.wawu.dev').catch(()=>{});
await p.getByLabel(/password/i).first().fill('Test1234').catch(()=>{});
await p.getByRole('button', { name: /^sign in$/i }).first().click().catch(()=>{});
await p.waitForTimeout(6000);
console.log('signed in at', p.url());

const findings = [];
const consoleErrors = [];
p.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0,200)); });
const failedReqs = [];
p.on('response', r => {
  const s = r.status();
  if (s >= 400 && r.url().includes('/api/hub/')) failedReqs.push(`${s} ${r.url().replace(/https?:\/\/[^/]+/,'')}`);
});

for (const route of routes) {
  consoleErrors.length = 0; failedReqs.length = 0;
  let status = 0;
  try {
    const resp = await p.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
    status = resp?.status() ?? 0;
  } catch (e) {
    findings.push({ route, kind: 'NAV_FAILED', detail: String(e).slice(0,120) });
    continue;
  }
  await p.waitForTimeout(1200);
  const text = (await p.locator('body').innerText().catch(()=> '')).replace(/\s+/g,' ').trim();
  const url = p.url().replace(BASE, '');

  if (status >= 400) findings.push({ route, kind: 'HTTP_' + status, detail: url });
  else if (text.length < 40) findings.push({ route, kind: 'BLANK', detail: `${text.length} chars of text` });
  else if (/something went wrong|unexpected error|application error|Internal Server Error|Digest: \d/i.test(text))
    findings.push({ route, kind: 'ERROR_STATE', detail: text.slice(0,120) });
  if (failedReqs.length) findings.push({ route, kind: 'API_FAIL', detail: [...new Set(failedReqs)].join(' | ').slice(0,200) });
  const realErrs = consoleErrors.filter(e => !/favicon|Download the React|hydrat/i.test(e));
  if (realErrs.length) findings.push({ route, kind: 'CONSOLE', detail: [...new Set(realErrs)].join(' | ').slice(0,200) });
}

fs.writeFileSync(process.argv[3], JSON.stringify(findings, null, 2));
console.log(`\nswept ${routes.length} routes, ${findings.length} findings`);
const byKind = {};
for (const f of findings) byKind[f.kind] = (byKind[f.kind]||0)+1;
console.log(byKind);
await b.close();
