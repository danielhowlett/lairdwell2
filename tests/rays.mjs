import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { launchBrowser, serveProduction } from './browser-helpers.mjs';
const site=await serveProduction(),artifacts=process.env.TEST_ARTIFACT_DIR||'.test-artifacts/rays';await mkdir(artifacts,{recursive:true});
try{
 for(const name of(process.env.TEST_BROWSERS||'chromium,firefox,webkit').split(',')){
  const browser=await launchBrowser(name);
  try{
   for(const[width,height]of[[375,812],[430,932],[844,390]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'no-preference'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
     sessionStorage.setItem('lairdwell-intro-seen','1');window.__rays={draws:0,lit:0};
     if(typeof WebGL2RenderingContext==='undefined')return;
     const original=WebGL2RenderingContext.prototype.drawArrays;
     WebGL2RenderingContext.prototype.drawArrays=function(...args){
      original.apply(this,args);const stats=window.__rays;stats.draws++;
      if(stats.draws===20){const pixels=new Uint8Array(this.canvas.width*this.canvas.height*4);this.readPixels(0,0,this.canvas.width,this.canvas.height,this.RGBA,this.UNSIGNED_BYTE,pixels);for(let i=0;i<pixels.length;i+=64)if(pixels[i]+pixels[i+1]+pixels[i+2]>30)stats.lit++;}
     };
    });
    await page.goto(site.url);await page.waitForFunction(()=>['static','animated'].includes(document.querySelector('#hero-side-rays').dataset.renderMode));
    const mode=await page.locator('#hero-side-rays').getAttribute('data-render-mode');
    if(process.env.REQUIRE_WEBGL==='1'&&name==='webkit')assert.equal(mode,'animated','Actual mobile WebGL must render');
    if(mode==='animated'){
     await page.waitForFunction(()=>window.__rays.draws>=20);
     const pixels=await page.locator('canvas').evaluate(c=>c.width*c.height);assert.ok(pixels<=181000,`Mobile pixel cap: ${pixels}`);assert.ok(await page.evaluate(()=>window.__rays.lit)>0,'Actual shader frame contains visible light');
     await page.screenshot({path:`${artifacts}/${name}-${width}-rays.png`});
     await page.locator('#contact').evaluate(e=>e.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(150);const count=await page.evaluate(()=>window.__rays.draws);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__rays.draws),count,'Offscreen GPU rendering pauses');
     await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(n=>window.__rays.draws>n,count);
     await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#hero-side-rays').dataset.renderMode==='static');
     assert.equal(await page.locator('canvas').evaluate(e=>getComputedStyle(e).visibility),'hidden');
     await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('#hero-side-rays').dataset.renderMode==='animated');
    }else{
     const background=await page.locator('#hero-side-rays').evaluate(e=>getComputedStyle(e).backgroundImage);assert.match(background,/side-rays-(mobile|desktop)\.webp/);
    }
    if(width<768){
     await page.locator('#story-step-1').scrollIntoViewIfNeeded();
     const gap=await page.locator('#story-step-1').evaluate(e=>e.querySelector('h3').getBoundingClientRect().top-e.querySelector('.workflow-bottom').getBoundingClientRect().bottom);
     assert.ok(gap>=27.5,`${name} ${width}: clear-next-action/heading gap (${gap})`);
     await page.screenshot({path:`${artifacts}/${name}-${width}-story-spacing.png`});
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${name} ${width}: ${mode} rays, mobile layout/spacing and lifecycle`);
   }
   for(const js of[true,false]){
    const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce',javaScriptEnabled:js}),p=await context.newPage();await p.goto(site.url);const bg=await p.locator('#hero-side-rays').evaluate(e=>getComputedStyle(e).backgroundImage);assert.match(bg,/side-rays-mobile.webp/);assert.equal(await p.locator('canvas').evaluate(e=>getComputedStyle(e).visibility),'hidden');await context.close();
   }
  }finally{await browser.close()}
 }
}finally{await site.close()}
