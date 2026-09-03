import { chromium } from 'playwright-core';
const SITE = process.argv[2];
const email = `boss-repro-${Date.now()}@example.com`;
const phone = '80' + String(Date.now()).slice(-9);
const b = await chromium.launch({ channel:'chrome' });
const p = await b.newPage({ viewport:{width:430,height:950}, deviceScaleFactor:2 });
const api=[];
p.on('response', async r => { if (/api\/hub|auth\//.test(r.url())) {
  let t=''; if (r.status()>=400){ try{t=(await r.text()).slice(0,140);}catch{} }
  api.push(`${r.status()} ${r.request().method()} ${r.url().replace(/https?:\/\/[^/]+/,'').split('?')[0]}${t?' '+t:''}`);
}});

await p.goto(`${SITE}/sign-up?ref=LOGIC`, { waitUntil:'networkidle', timeout:90000 });
await p.waitForTimeout(3500);
console.log('STEP 1 (with ?ref=LOGIC):', (await p.locator('body').innerText()).replace(/\s+/g,' ').slice(0,300));
await p.screenshot({ path: process.argv[3]+'/boss-1.png' });

await p.getByText(/I want to create and earn/i).first().click().catch(()=>{});
await p.getByRole('button',{name:/^continue$/i}).first().click();
await p.waitForTimeout(2000);
await p.getByLabel(/first name/i).fill('Boss');
await p.getByLabel(/last name/i).fill('Repro');
await p.getByLabel(/email/i).fill(email);
await p.getByLabel(/password/i).fill('Test1234');
await p.locator('input[inputmode=tel]').fill(phone).catch(()=>{});
await p.getByRole('button',{name:/^continue$/i}).first().click();
await p.waitForTimeout(2500);
await p.locator('select').nth(1).selectOption({ label:'Lagos' }).catch(()=>{});
await p.locator('input:not([type=checkbox])').last().fill('Tester').catch(()=>{});
const terms = p.locator('label:has-text("I agree to the")').first();
const box = await terms.boundingBox();
if (box) await p.mouse.click(box.x + 11, box.y + 12);
await p.waitForTimeout(600);
await p.getByRole('button',{name:/create account/i}).first().click();
await p.waitForTimeout(9000);
console.log('\nAFTER CREATE:', (await p.locator('body').innerText()).replace(/\s+/g,' ').slice(0,260));
console.log('url:', p.url().replace(SITE,''));
await p.screenshot({ path: process.argv[3]+'/boss-2.png' });
console.log('\nAPI:', [...new Set(api)].slice(-8).join('\n     '));
console.log('email:', email);
await b.close();
