import pw from "/workspace/projects/WAWU-Web/node_modules/playwright-core/index.js"; const { chromium } = pw;
import { mkdirSync } from "node:fs";
import path from "node:path";
const CANVAS = path.resolve("/tmp/claude-1001/-workspace-projects-WAWU-Web/eb75080b-5cfd-411e-b096-e1ddfb820c55/scratchpad/dcanvas");
const OUT = path.resolve("/workspace/projects/WAWU-Web/build/design_shots");
const slug = (s)=>s.trim().replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);
mkdirSync(OUT,{recursive:true});
const browser = await chromium.launch({args:["--no-sandbox"]});
for (const file of ["WAWU Desktop Shell.dc.html"]) {
  const page = await browser.newPage({viewport:{width:2200,height:1400},deviceScaleFactor:1});
  await page.goto(`file://${path.join(CANVAS,file)}`,{waitUntil:"networkidle"});
  await page.waitForFunction(()=>document.querySelectorAll("x-import").length===0,null,{timeout:30000})
    .catch(()=>console.warn(`  ! ${file}: components never finished registering`));
  await page.waitForTimeout(2000);
  const boards = await page.evaluate(()=>{
    const out=[];
    const frames=[...document.querySelectorAll("div")].filter(el=>{
      const st=el.getAttribute("style")||""; const r=el.getBoundingClientRect();
      return /width:\s*(1440|700|430)px/.test(st) && r.width>=400 && r.height>=600;
    });
    for(const el of frames){
      // caption: nearest preceding text node in a sibling above, else next sibling
      let cap = el.previousElementSibling?.textContent?.trim() || "";
      if(!cap) cap = el.nextElementSibling?.textContent?.trim() || "";
      if(!cap){ let p=el.parentElement; cap = p?.previousElementSibling?.textContent?.trim()||""; }
      el.setAttribute("data-artboard",out.length);
      out.push({i:out.length,title:cap.split("\n")[0].slice(0,80)||`board-${out.length}`,w:el.getBoundingClientRect().width});
    }
    return out;
  });
  for(const b of boards){
    const el=page.locator(`[data-artboard="${b.i}"]`);
    const name=`${slug(file.replace(".dc.html",""))}__${slug(b.title)}-${b.i}.png`;
    try{ await el.screenshot({path:path.join(OUT,name)}); console.log("  "+name+" ("+Math.round(b.w)+"px)"); }
    catch(e){ console.log("  FAIL "+name+" "+e.message.slice(0,80)); }
  }
  console.log(`${file}: ${boards.length} artboard(s)`);
  await page.close();
}
await browser.close();
