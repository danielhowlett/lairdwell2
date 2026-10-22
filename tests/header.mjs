import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { launchBrowser, serveProduction, settleScroll } from './browser-helpers.mjs';
const site=await serveProduction(),artifacts=process.env.TEST_ARTIFACT_DIR||'.test-artifacts/header';
await mkdir(artifacts,{recursive:true});
try{
 for(const name of(process.env.TEST_BROWSERS||'chromium,firefox,webkit').split(',')){
  const browser=await launchBrowser(name);
  try{
   for(const [width,height] of[[375,900],[820,900],[1440,900],[844,390]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
    await page.goto(site.url);await page.evaluate(()=>document.fonts.ready);
    const edge=await page.locator('#home').evaluate(e=>e.offsetTop+e.offsetHeight);
    const assertState=async(past)=>{
     await page.waitForFunction(expected=>document.querySelector('#navbar').classList.contains('is-past-hero')===expected,past);
     const state=await page.locator('#navbar').evaluate(el=>{const s=getComputedStyle(el);return{bg:s.backgroundColor,blur:s.backdropFilter,shadow:s.boxShadow,position:s.position,top:el.getBoundingClientRect().top,height:el.getBoundingClientRect().height}});
     assert.equal(state.position,'fixed');assert.equal(state.top,0);assert.equal(state.height,80);assert.equal(state.blur,'none');assert.equal(state.shadow,'none');
     if(past)assert.equal(state.bg,'rgba(23, 27, 27, 0.96)');else assert.equal(state.bg,'rgba(0, 0, 0, 0)');
    };
    for(const [top,past]of[[0,false],[40,false],[edge/2,false],[edge-2,false],[edge,true],[edge+2,true],[edge+200,true],[edge-2,false],[0,false]]){
     await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top);await assertState(past);
    }
    // The boundary follows actual content geometry, including a taller resized hero.
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),edge+100);await assertState(true);
    await page.setViewportSize({width,height:1200});
    // Browsers may preserve the visible section with native scroll anchoring on resize.
    await assertState(await page.locator('#home').evaluate(e=>e.getBoundingClientRect().bottom<=0));
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),edge+100);await assertState(false);
    await page.setViewportSize({width,height});await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),edge+100);await assertState(true);
    await settleScroll(page);await page.reload();await settleScroll(page);
    // Saved-position restoration belongs to the browser; the header must match its actual result.
    await assertState(await page.locator('#home').evaluate(e=>e.getBoundingClientRect().bottom<=0));
    await page.goto(site.url+'#contact');await assertState(true);
    for(let i=0;i<3;i++)await page.evaluate(()=>{dispatchEvent(new PageTransitionEvent('pagehide'));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await assertState(false);
    await page.waitForFunction(()=>{const img=document.querySelector('#navbar img');return img.complete&&img.naturalWidth>0});
    const asset=await page.locator('#navbar img').evaluate(async e=>{const original=new Image();original.src=e.currentSrc;await original.decode();return{src:e.currentSrc,ratio:e.getBoundingClientRect().width/e.getBoundingClientRect().height,native:original.naturalWidth/original.naturalHeight}});
    assert.ok(asset.src.includes('/website-kit/'));assert.ok(Math.abs(asset.ratio-asset.native)<.01,'Unstretched art');assert.ok(asset.src.includes(width<1100?'icon_dark_':'primary_dark_'));
    await page.screenshot({path:`${artifacts}/${name}-${width}-hero-header.png`});
    if(width<1100){
     await page.locator('#mobile-menu-toggle').click();assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'),'false');
    }
    await page.locator('.footer-brand-logo').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const i=document.querySelector('.footer-brand-logo');return i.complete&&i.naturalWidth>0});
    await assertState(true);await page.screenshot({path:`${artifacts}/${name}-${width}-footer.png`});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${name} ${width}: exact hero boundary, reverse scroll, resize, saved scroll, deep link, lifecycle, logo loading/ratio, menu and clean console`);
   }
   const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'}),p=await context.newPage();
   await p.addInitScript(()=>{sessionStorage.setItem('lairdwell-intro-seen','1');const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)};});
   const normalErrors=[];p.on('pageerror',e=>normalErrors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type()))normalErrors.push(m.text())});
   await p.goto(site.url+'#contact');
   await p.waitForFunction(()=>document.querySelector('#navbar').classList.contains('is-past-hero'));
   assert.equal(await p.locator('#navbar').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(23, 27, 27, 0.96)','Initial deep-link backdrop is immediate');
   await p.goto(site.url);await p.evaluate(()=>document.fonts.ready);
   for(const delta of[200,500,700,-500,-900]){await p.mouse.wheel(0,delta);await p.waitForTimeout(40);}await settleScroll(p);
   await p.evaluate(()=>scrollTo({top:document.querySelector('#home').getBoundingClientRect().bottom+scrollY+10,behavior:'instant'}));
   await p.waitForFunction(()=>document.querySelector('#navbar').classList.contains('is-past-hero'));
   await p.waitForTimeout(300);assert.equal(await p.locator('#navbar').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(23, 27, 27, 0.96)');
   await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('#navbar').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');assert.deepEqual(normalErrors,[]);await context.close();
  }finally{await browser.close()}
 }
}finally{await site.close()}
