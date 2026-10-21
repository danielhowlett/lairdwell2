import assert from 'node:assert/strict';
import { launchBrowser, serveProduction, settleScroll } from './browser-helpers.mjs';
const site = await serveProduction();
try {
 for (const name of (process.env.TEST_BROWSERS || 'chromium,firefox,webkit').split(',')) {
  const browser = await launchBrowser(name);
  try {
   for (const width of [1440,375]) {
    const context = await browser.newContext({ viewport: {width, height:900}, reducedMotion:'no-preference' });
    const page = await context.newPage(); const errors=[];
    page.on('console', message => {if (['error','warning'].includes(message.type())) errors.push(message.text());});
    page.on('pageerror', e=>errors.push(e.message));
    // Deterministic scroll tests; real WebGL is exercised separately.
    await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...a){return type.startsWith('webgl')?null:get.call(this,type,...a)};});
    await page.goto(site.url);await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(1300);
    assert.equal(await page.locator('h1').textContent(),'Work, made simpler.');
    assert.equal(await page.locator('h1').getAttribute('aria-label'),'Work, made simpler.');
    const total=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
    for (const step of [150,900,-650]) {
     if (step<0) await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),total);
     for(let i=0;i<Math.ceil(total/Math.abs(step));i++) {await page.mouse.wheel(0,step);await page.waitForTimeout(step===150?30:12);}
     await settleScroll(page);
    }
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('[data-reveal]').evaluateAll(es=>es.every(e=>getComputedStyle(e).visibility!=='hidden'&&+getComputedStyle(e).opacity===1)),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    if(width===375) assert.equal(await page.locator('.story-sticky').evaluate(e=>getComputedStyle(e).position),'static');
    const wrappers = await page.locator('h1 div').count();
    for(let cycle=0;cycle<3;cycle++) {
     await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide')));
     assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('lenis')),false,'Lenis is destroyed on pagehide');
     assert.equal(await page.locator('h1 div').count(),0,'SplitText reverts on pagehide');
     assert.equal(await page.locator('[data-parallax]').evaluateAll(es=>es.every(e=>getComputedStyle(e).transform==='none')),true,'Scrub transforms revert on pagehide');
     await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
     await page.waitForTimeout(1400);
     assert.equal(await page.locator('h1 [aria-hidden="true"]').count()>0,true);
     assert.equal(await page.locator('h1 div').count(),wrappers,'SplitText wrappers do not accumulate');
    }
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
    assert.equal(await page.locator('h1').textContent(),'Work, made simpler.');
    assert.equal(await page.locator('h1').getAttribute('aria-label'),null);
    assert.equal(await page.locator('.story-sticky').evaluate(e=>getComputedStyle(e).position),'static');
    assert.equal(await page.locator('[data-parallax]').evaluateAll(es=>es.every(e=>getComputedStyle(e).transform==='none')),true);
    assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('lenis')),false);
    assert.deepEqual(errors,[],`${name} ${width} console`);
    await context.close();
    console.log(`PASS ${name} ${width}: scroll/reverse, readability, overflow, SplitText accessibility, lifecycle and reduced motion; clean console`);
   }
  }finally{await browser.close();}
 }
}finally{await site.close();}
