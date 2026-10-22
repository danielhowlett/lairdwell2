import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { launchBrowser, serveProduction } from './browser-helpers.mjs';
const site = await serveProduction();
const artifacts = process.env.TEST_ARTIFACT_DIR || '.test-artifacts/preloader';
await mkdir(artifacts,{recursive:true});
try {
 for (const name of (process.env.TEST_BROWSERS || 'chromium,firefox,webkit').split(',')) {
  const browser=await launchBrowser(name);
  try {
   for(const [width,height] of [[1440,900],[820,1180],[375,812],[844,390]]) {
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Keep cloud GPU variance separate from the intro behavior.
    await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)};});
    await page.goto(site.url,{waitUntil:'domcontentloaded'});
    const overlay=page.locator('body > .brand-preloader');await overlay.waitFor({state:'attached'});
    await page.waitForFunction(()=>{const img=document.querySelector('.brand-preloader-logo');return img?.complete&&img.naturalWidth>0&&+getComputedStyle(img).opacity>.1;});
    const geometry=await overlay.evaluate(el=>{const r=el.getBoundingClientRect(),i=el.querySelector('img').getBoundingClientRect();return{dx:Math.abs((i.left+i.right)/2-innerWidth/2),dy:Math.abs((i.top+i.bottom)/2-innerHeight/2),width:r.width,height:r.height,pointer:getComputedStyle(el).pointerEvents,inert:el.inert,hidden:el.getAttribute('aria-hidden')};});
    assert.ok(geometry.dx<1&&geometry.dy<1);assert.equal(geometry.width,width);assert.equal(geometry.height,height);assert.equal(geometry.pointer,'none');assert.equal(geometry.inert,true);assert.equal(geometry.hidden,'true');
    // Capture the running intro without changing its timing.
    await page.screenshot({path:`${artifacts}/${name}-${width}-intro.png`});
    await overlay.waitFor({state:'detached',timeout:2200});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.reload({waitUntil:'domcontentloaded'});assert.equal(await overlay.count(),0,'refresh skips');
    await page.goto(site.url+'?repeat',{waitUntil:'domcontentloaded'});assert.equal(await overlay.count(),0,'session revisit skips');
    assert.deepEqual(errors,[]);await context.close();
    console.log(`PASS ${name} ${width}x${height}: first visit, center, dismissal, refresh/session skip and readability`);
   }
   for(const mode of ['reduced','no-js','blocked-storage','deep-link','keyboard','live-reduced','failed-logo','slow-font','pagehide']) {
    const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
    if(mode==='blocked-storage')await p.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('Storage unavailable')};});
    if(mode==='failed-logo')await p.route('**/lairdwell-icon-dark.svg',r=>r.abort());
    const stalled=[];
    if(mode==='slow-font')await p.route('**/*.woff2',r=>{stalled.push(r)});
    await p.goto(site.url+(mode==='deep-link'?'#contact':''),{waitUntil:'domcontentloaded'});
    if(['keyboard','live-reduced','pagehide'].includes(mode)) {
     await p.locator('body > .brand-preloader').waitFor({state:'attached'});
     if(mode==='keyboard'){await p.keyboard.press('Tab');assert.equal(await p.locator('.skip-link').evaluate(e=>e===document.activeElement),true);}
     if(mode==='live-reduced')await p.emulateMedia({reducedMotion:'reduce'});
     if(mode==='pagehide')await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide')));
    }
    await p.locator('body > .brand-preloader').waitFor({state:'detached',timeout:2200});
    assert.equal(await p.locator('h1').textContent(),'Work, made simpler.');
    if(mode==='slow-font')for(const route of stalled)await route.abort().catch(()=>{});
    assert.deepEqual(errors,[],`${name} ${mode}: no uncaught failures`);
    await context.close();console.log(`PASS ${name}: ${mode}`);
   }
  }finally{await browser.close();}
 }
}finally{await site.close();}
