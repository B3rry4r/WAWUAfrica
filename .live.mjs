import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel:'chrome' });
const p = await b.newPage({ viewport:{width:430,height:950} });
const chunks = [];
p.on('response', r => { if (r.url().includes('/_next/static/chunks/')) chunks.push(r.url()); });
await p.goto('https://wawuafrica.com/onboarding', { waitUntil:'networkidle', timeout:90000 });
await p.waitForTimeout(3000);
const t = (await p.locator('body').innerText()).replace(/\s+/g,' ');
console.log('page:', t.slice(0,200));
console.log('\nPro Max visible on page:', /Pro Max/.test(t));
let found = { proMax:0, free:0, support:0 };
for (const u of [...new Set(chunks)]) {
  const body = await (await fetch(u)).text().catch(()=> '');
  if (/Pro Max/.test(body)) found.proMax++;
  if (/init\.free|\.free&&/.test(body)) found.free++;
  if (/support@wawuafrica/.test(body)) found.support++;
}
console.log('chunks loaded:', new Set(chunks).size, JSON.stringify(found));
await b.close();
