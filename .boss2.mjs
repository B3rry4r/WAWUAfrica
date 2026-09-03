import { chromium } from 'playwright-core';
const SITE='https://wawuafrica.com';
const EMAIL=process.argv[2], OUT=process.argv[3];
const b = await chromium.launch({ channel:'chrome' });
const p = await b.newPage({ viewport:{width:430,height:1000}, deviceScaleFactor:2 });
const api=[];
p.on('response', async r => { if (/api\/hub|auth\//.test(r.url())) {
  let t=''; if (r.status()>=400){ try{t=(await r.text()).slice(0,150);}catch{} }
  api.push(`${r.status()} ${r.request().method()} ${r.url().replace(/https?:\/\/[^/]+/,'').split('?')[0]}${t?' '+t:''}`);
}});
await p.goto(`${SITE}/sign-in`, {waitUntil:'networkidle',timeout:90000});
await p.getByLabel(/email/i).first().fill(EMAIL);
await p.getByLabel(/password/i).first().fill('Test1234');
await p.getByRole('button',{name:/^sign in$/i}).first().click();
await p.waitForTimeout(7000);
console.log('landed:', p.url().replace(SITE,''));
// The onboarding/tier screen is where the ₦ figure appears.
await p.goto(`${SITE}/onboarding`, {waitUntil:'networkidle',timeout:90000});
await p.waitForTimeout(4000);
let t = (await p.locator('body').innerText()).replace(/\s+/g,' ');
console.log('\nONBOARDING:', t.slice(0,420));
await p.screenshot({ path: OUT+'/boss-tier-1.png', fullPage:true });
// advance to the tier step if there is an intro
for (let i=0;i<2;i++) {
  const cont = p.getByRole('button',{name:/continue|become a creator|next|choose/i}).first();
  if (await cont.count()) { await cont.click().catch(()=>{}); await p.waitForTimeout(3000); }
}
t = (await p.locator('body').innerText()).replace(/\s+/g,' ');
console.log('\nTIER STEP:', t.slice(0,500));
const naira = [...t.matchAll(/₦[\d,]+/g)].map(m=>m[0]);
console.log('\nAMOUNTS ON SCREEN:', naira.join(' | ') || 'none');
await p.screenshot({ path: OUT+'/boss-tier-2.png', fullPage:true });
console.log('\nAPI:', [...new Set(api)].slice(-6).join('\n     '));
await b.close();
