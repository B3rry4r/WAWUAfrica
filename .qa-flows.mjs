import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = 'http://127.0.0.1:3100';
const S = process.argv[2];
const results = [];
const ok = (flow, step, pass, detail='') => { results.push({flow, step, pass, detail}); console.log(`  ${pass?'PASS':'FAIL'}  ${flow} :: ${step}${detail?'  ('+detail+')':''}`); };

const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const apiFails = [];
p.on('response', r => { if (r.status() >= 400 && r.url().includes('/api/hub/')) apiFails.push(`${r.status()} ${r.url().replace(/https?:\/\/[^/]+/,'').split('?')[0]}`); });

async function signIn(email) {
  await p.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle', timeout: 60000 });
  await p.getByLabel(/email/i).first().fill(email);
  await p.getByLabel(/password/i).first().fill('Test1234');
  await p.getByRole('button', { name: /^sign in$/i }).first().click();
  await p.waitForTimeout(5000);
  return p.url();
}
const txt = async () => (await p.locator('body').innerText().catch(()=> '')).replace(/\s+/g,' ');
const go = async (path) => { await p.goto(BASE+path, { waitUntil:'networkidle', timeout:60000 }); await p.waitForTimeout(1200); };

// ---------- SIGN IN ----------
const landed = await signIn('creator-pro@test.wawu.dev');
ok('auth', 'a creator can sign in and lands in the app', /\/home/.test(landed), landed);

// ---------- EXPLORE / DISCOVERY ----------
await go('/explore');
ok('explore', 'explore shows something to explore', (await txt()).length > 200);
await go('/explore/categories');
const catText = await txt();
ok('explore', 'categories are listed', /Agriculture|Technology|Finance/.test(catText));
const firstCat = p.locator('a[href*="/explore/creators?category="]').first();
if (await firstCat.count()) {
  await firstCat.click(); await p.waitForTimeout(2500);
  ok('explore', 'a category opens a creator list', /\/explore\/creators/.test(p.url()), p.url().replace(BASE,''));
} else ok('explore', 'a category opens a creator list', false, 'no category link found');

// ---------- SHOP ----------
await go('/shop');
const shopText = await txt();
ok('shop', 'the shop renders', shopText.length > 200);
const prod = p.locator('a[href*="/shop/product/"]').first();
if (await prod.count()) {
  await prod.click(); await p.waitForTimeout(2500);
  ok('shop', 'a product page opens', /\/shop\/product\//.test(p.url()));
  const addBtn = p.getByRole('button', { name: /add to (wow|cart|basket)/i }).first();
  ok('shop', 'the product offers a way to buy', await addBtn.count() > 0);
} else {
  ok('shop', 'a product page opens', false, 'no products in stock locally');
}

// ---------- EVENTS ----------
await go('/events');
ok('events', 'the events calendar renders', (await txt()).length > 150);
await go('/tickets');
ok('events', 'my tickets renders', (await txt()).length > 80);

// ---------- COMMUNITIES ----------
await go('/communities');
ok('communities', 'communities render', (await txt()).length > 150);

// ---------- MESSAGES ----------
await go('/messages');
ok('messages', 'inbox renders', (await txt()).length > 80);

// ---------- CREATOR ----------
await go('/creator');
ok('creator', 'the creator dashboard renders', (await txt()).length > 200);
await go('/create');
const createText = await txt();
ok('creator', 'a creator is offered a way to publish', /upload|create|publish|video|audio|pdf/i.test(createText));

// ---------- SERVICES ----------
await go('/services');
const svcText = await txt();
ok('services', 'services are listed', /Legal|Bills/i.test(svcText));
ok('services', 'closed services are separated from open ones', /coming soon/i.test(svcText));
await go('/services/legal');
ok('services', 'the legal catalogue lists services', /CAC|Tax|Contract/i.test(await txt()));

// ---------- SETTINGS / PROFILE ----------
await go('/settings');
ok('settings', 'settings render', (await txt()).length > 150);
await go('/profile');
ok('profile', 'own profile renders', (await txt()).length > 120);
await go('/profile/edit');
ok('profile', 'profile is editable', await p.locator('input,textarea').count() > 2);

// ---------- PLAIN USER ----------
await ctx.clearCookies();
await p.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} }).catch(()=>{});
const userLanded = await signIn('user@test.wawu.dev');
ok('auth', 'a plain user can sign in', /\/home/.test(userLanded), userLanded);
await go('/creator');
const gated = await txt();
ok('gates', 'a plain user does not get the creator dashboard', !/Earned this month/i.test(gated) || /become a creator|subscribe/i.test(gated), p.url().replace(BASE,''));

fs.writeFileSync(S+'/flows.json', JSON.stringify({results, apiFails:[...new Set(apiFails)]}, null, 2));
const failed = results.filter(r=>!r.pass);
console.log(`\n${results.length - failed.length}/${results.length} capability checks passed`);
console.log('distinct API failures seen:', [...new Set(apiFails)].join(' | ') || 'none');
await b.close();
