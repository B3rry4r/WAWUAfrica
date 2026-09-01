import { chromium } from 'playwright-core';
const BASE='http://127.0.0.1:3100';
const b = await chromium.launch({ channel:'chrome' });
// A brand-new context per actor: this app keeps its session in localStorage,
// so clearing cookies does NOT sign anybody out.
const ctx = await b.newContext({ viewport:{width:1280,height:900}, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto(`${BASE}/sign-in`, {waitUntil:'networkidle',timeout:60000});
await p.getByLabel(/email/i).first().fill('user@test.wawu.dev');
await p.getByLabel(/password/i).first().fill('Test1234');
await p.getByRole('button',{name:/^sign in$/i}).first().click();
await p.waitForTimeout(5000);
console.log('signed in as plain user, landed:', p.url().replace(BASE,''));
for (const [path,name] of [['/creator','creator'],['/earnings','earnings'],['/create','create'],['/subscription','subscription']]) {
  await p.goto(BASE+path,{waitUntil:'networkidle',timeout:60000});
  await p.waitForTimeout(1800);
  const t=(await p.locator('body').innerText().catch(()=>'')).replace(/\s+/g,' ');
  const sidebarSaysPro = /PRO \d+ of/.test(t);
  console.log(`\n=== ${path} -> ${p.url().replace(BASE,'')}   sidebarShowsCreatorRail=${sidebarSaysPro}`);
  console.log('   ', t.slice(0,240));
  await p.screenshot({ path: `${process.argv[2]}/gate-${name}.png` });
}
await b.close();
