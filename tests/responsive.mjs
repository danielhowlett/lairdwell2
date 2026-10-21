import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { serveProduction, launchBrowser, settleScroll } from './browser-helpers.mjs';

const widths = process.env.TEST_SCENARIOS_ONLY === '1' ? [] : [[320,740],[360,800],[375,812],[390,844],[430,932],[768,1024],[820,1180],[1024,768],[1280,800],[1440,900],[1920,1080],[2560,1440],[844,390],[1024,600]];
const names = (process.env.TEST_BROWSERS || 'chromium,firefox,webkit').split(',');
const artifacts = resolve(process.env.TEST_ARTIFACT_DIR || '.test-artifacts');
await mkdir(artifacts, { recursive: true });
const site = await serveProduction();
const results = [];
let browser;
try {
  for (const name of names) {
    browser = await launchBrowser(name);
    for (const [width,height] of widths) {
      const context = await browser.newContext({ viewport: { width,height }, reducedMotion: 'reduce', hasTouch: width < 1024, ...(name !== 'firefox' ? { isMobile: width < 768 } : {}) });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(site.url);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => document.querySelector('#calculator').dataset.savingsReady === 'true');
      const font = await page.evaluate(() => [...document.fonts].filter(f => f.family.includes('Inter') && f.status === 'loaded').length > 0);
      if (process.env.REQUIRE_INTER === '1') assert.equal(font, true, `${name} ${width}: Inter loaded`);
      const geometry = await page.evaluate(() => {
        const h = document.querySelector('h1'), r = document.createRange(); r.selectNodeContents(h);
        const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
        const clipped = [...document.querySelectorAll('h1,h2,h3,p,button,a,strong,small,.sav-3-number,.lc-v2-node,.lc-v2-flow,.plan-card,.story-frame,.story-step-label')]
          .filter(el => visible(el) && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2)
          .map(el => ({ tag:el.tagName, class:el.className, text:el.textContent.trim().slice(0,70), client:el.clientWidth, scroll:el.scrollWidth }));
        const logo=document.querySelector('#navbar>a') || document.querySelector('#navbar a[href="#home"]');
        const actions=document.querySelector('#navbar > div > .flex.items-center:last-child');
        return { headlineLines:r.getClientRects().length, clipped, overflow:document.documentElement.scrollWidth>innerWidth,
          headerOverlap:logo.getBoundingClientRect().right > actions.getBoundingClientRect().left - 2,
          headerOutside:actions.getBoundingClientRect().right > innerWidth,
          heroBox:getComputedStyle(document.querySelector('.hero-copy-wrap')).backgroundColor };
      });
      assert.deepEqual(geometry.clipped, [], `${name} ${width}: clipped components`);
      assert.equal(geometry.overflow, false, `${name} ${width}: page overflow`);
      assert.equal(geometry.headerOverlap, false, `${name} ${width}: header overlap`);
      assert.equal(geometry.headerOutside, false, `${name} ${width}: header fits`);
      assert.equal(geometry.heroBox, 'rgba(0, 0, 0, 0)', 'No hero text rectangle');
      if (width >= 1024) assert.equal(geometry.headlineLines, 1, `${name} ${width}: single-line desktop headline`);
      const heights=[];
      for (const index of [1,2,0]) {
        await page.locator(`[data-lc-index="${index}"]`).click();
        await page.waitForFunction(index => document.querySelector('[data-lc-count]').textContent.startsWith(String(index+1).padStart(2,'0')), index);
        // In reduced motion, copy updates synchronously, without a delayed fade.
        const box=await page.locator('#cases').boundingBox(); heights.push(box.height);
      }
      assert.ok(Math.max(...heights)-Math.min(...heights)<2, `${name} ${width}: workflow switching changes section height (${heights})`);
      for (const [field,value] of [['tasks','1000'],['minutes','60'],['rate','150'],['percent','90']]) {
        await page.locator(`input[type="number"][data-field="${field}"]`).fill(value);
      }
      assert.equal(await page.locator('[data-out="annual"]').textContent(), '$6,480,000');
      assert.equal(await page.locator('[data-out="annual"]').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,`${name} ${width}: maximum estimate fits`);
      for (const step of [2,3,1]) {
        await page.locator(`[data-step-label="${step-1}"]`).focus(); await page.keyboard.press('Enter');
        await page.waitForFunction(index=>document.querySelector(`[data-step-label="${index}"]`).getAttribute('aria-current')==='step',step-1);
        const top=await page.locator(`#story-step-${step}`).evaluate(el=>el.getBoundingClientRect().top);
        assert.ok(top>=100&&top<=125, `${name} ${width}: story step ${step} clears header (${top})`);
      }
      if (width>=1100&&height>640) {
        const sticky=await page.locator('.story-sticky').boundingBox();
        assert.ok(sticky.y>=95&&sticky.y+sticky.height<=height+1,`${name} ${width}: sticky sidebar fits viewport`);
      }
      // A content-only fallback must remain usable with no JavaScript.
      if (width===390||width===1440) {
        await page.screenshot({path:resolve(artifacts,`${name}-${width}-story.png`)});
        for (const id of ['home','cases','calculator','contact']) {
          await page.locator(`#${id}`).scrollIntoViewIfNeeded(); await settleScroll(page);
          await page.screenshot({path:resolve(artifacts,`${name}-${width}-${id}.png`)});
        }
      }
      assert.deepEqual(errors, [], `${name} ${width}: browser errors`);
      results.push({browser:name,width,height,font,headlineLines:geometry.headlineLines,status:'passed'});
      console.log(`PASS ${name} ${width}x${height}: layout, headline, workflows, maximum calculator estimate and story alignment${font?' (Inter)':''}`);
      await context.close();
    }
    // Test motion with the hero disabled only here to isolate scroll behavior from cloud GPU drivers.
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    const page=await context.newPage(); page.setDefaultTimeout(10000);
    const motionErrors=[];page.on('pageerror',error=>motionErrors.push(error.message));
    await page.addInitScript(()=>{
      const native=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:native.call(this,type,...args)};
    });
    await page.goto(site.url); await page.evaluate(()=>document.fonts.ready);
    for(const step of [2,3,1,3]) {
      await page.locator(`[data-step-label="${step-1}"]`).click(); await settleScroll(page);
      assert.ok(Math.abs(await page.locator(`#story-step-${step}`).evaluate(el=>el.getBoundingClientRect().top)-116)<3, `${name}: smooth card alignment`);
    }
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollSnapType),'none');
    // Rapid wheel/trackpad-style deltas and reversal leave content visible and progress valid.
    await page.locator('#story-step-1').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
    for(const delta of [90,90,700,500,-850,1000,-500]) {
      await page.mouse.wheel(0,delta);
      await page.waitForTimeout(40);
    }
    await settleScroll(page);
    const stableY=await page.evaluate(()=>scrollY); await page.waitForTimeout(200);
    assert.ok(Math.abs(await page.evaluate(()=>scrollY)-stableY)<1,`${name}: no late scroll jumps`);
    const transforms=await page.locator('.story-frame').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).transform));
    assert.ok(transforms.every(t=>t==='none'),`${name}: story geometry remains stable during animation`);
    const active=await page.locator('[data-step-label][aria-current="step"]').count(); assert.equal(active,1);
    for(const id of ['services','about','cases','calculator','contact','home','about']){
      await page.locator(`#navbar nav[aria-label="Primary navigation"] a[href="#${id}"]`).click();
      await settleScroll(page);
      const top=await page.locator(`#${id}`).evaluate(el=>el.getBoundingClientRect().top);
      assert.ok(id==='home'?Math.abs(top)<2:top>=95&&top<=125,`${name}: ${id} anchor clears header (${top})`);
    }
    await page.setViewportSize({width:820,height:1180});
    await page.locator('#mobile-menu-toggle').click();
    await page.setViewportSize({width:1440,height:900});
    await page.waitForFunction(()=>document.querySelector('#mobile-menu-toggle').getAttribute('aria-expanded')==='false');
    await page.goto(site.url);
    await page.locator('[data-step-label="2"]').click();
    await page.emulateMedia({reducedMotion:'reduce'}); await settleScroll(page);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
    const revealed=await page.locator('h1,.plan-card,.story-frame,.lc-v2-visual,.sav-3-dashboard').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).visibility!=='hidden'&&Number(getComputedStyle(el).opacity)===1));
    assert.equal(revealed,true);
    assert.deepEqual(motionErrors,[],`${name}: motion browser errors`);
    await context.close();
    const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce',...(name!=='firefox'?{isMobile:true}:{})});
    const touchPage=await touch.newPage();await touchPage.goto(site.url);
    await touchPage.locator('#mobile-menu-toggle').tap();
    await touchPage.locator('#mobile-menu a[href="#cases"]').tap();
    await touchPage.locator('[data-lc-index="2"]').tap();
    await touchPage.waitForFunction(()=>document.querySelector('[data-lc-count]').textContent==='03 / 03');
    await touchPage.locator('#navbar a[aria-label="Lairdwell Home"]').tap();await settleScroll(touchPage);
    if(name==='chromium'){
      const cdp=await touch.newCDPSession(touchPage);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:650}]});
      for(let y=600;y>=150;y-=50){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y}]});
        await touchPage.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await settleScroll(touchPage);
      assert.ok(await touchPage.evaluate(()=>scrollY)>100,'Native touch swipe scrolls the page');
      await cdp.detach();
    }
    await touchPage.setViewportSize({width:844,height:390});
    assert.equal(await touchPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Touch landscape has no overflow');
    await touch.close();
    const fallback=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const nojs=await fallback.newPage();await nojs.goto(site.url);
    assert.equal(await nojs.locator('h1').textContent(),'Work, made simpler.');
    assert.equal(await nojs.locator('.story-frame').count(),3);
    assert.equal(await nojs.locator('#mobile-menu').isVisible(),true);
    await nojs.locator('#mobile-menu a[href="#calculator"]').click();
    assert.ok(await nojs.locator('#calculator').evaluate(el=>el.getBoundingClientRect().top)>=20);
    assert.equal(await nojs.locator('[data-out="annual"]').textContent(),'$16,128');
    await fallback.close();
    results.push({browser:name,scenario:'motion, resize, reversal, touch, orientation, reduced-motion and no-JavaScript fallback',status:'passed'});
    console.log(`PASS ${name}: motion, fast/reverse scrolling, resize, anchors, reduced motion, no-JavaScript content`);
    await browser.close();browser=null;
  }
} catch(error) {
  results.push({status:'failed',error:error.stack}); throw error;
} finally {
  await writeFile(resolve(artifacts,'responsive-results.json'),JSON.stringify(results,null,2));
  await browser?.close(); await site.close();
}
