import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

// Serve the actual production build; API responses below are explicitly mocked.
const html = await readFile(new URL('../public/index.html', import.meta.url));
const server = createServer((req, res) => {
  if (req.url !== '/' && req.url !== '/index.html') { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
let executablePath = process.env.CHROMIUM_PATH;
if (!executablePath) { try { await access('/usr/bin/chromium'); executablePath = '/usr/bin/chromium'; } catch {} }
let browser;
try {
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  for (const [name, options] of [
    ['desktop', { viewport: { width: 1440, height: 1000 } }],
    ['tablet', { viewport: { width: 1024, height: 768 } }],
    ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
    ['400% reflow equivalent', { viewport: { width: 320, height: 800 } }],
  ]) {
    const context = await browser.newContext({ ...options, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    async function scan(state) {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      assert.deepEqual(result.violations.map(v => ({ rule: v.id, elements: v.nodes.map(n => n.target) })), [], `${name}: ${state}`);
    }
    await scan('initial');
    assert.equal(await page.locator('main').count(), 1);
    assert.match(await page.locator('#navbar').innerText(), /lairdwell/);
    assert.match(await page.locator('footer').innerText(), /Lairdwell consulting LLC/);
    const headerFits=await page.locator('#navbar > div:first-child > .flex.items-center:last-child').evaluate(el=>el.getBoundingClientRect().right<=innerWidth);
    assert.equal(headerFits,true,'Header actions remain inside viewport');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('main').evaluate(el => el === document.activeElement), true);
    if (name !== 'desktop') {
      await page.locator('#mobile-menu-toggle').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'true');
      await scan('mobile menu open');
      await page.keyboard.press('Tab');
      // Escape works when focus is anywhere in the navigation header.
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('#mobile-menu-toggle').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Enter');
      await page.locator('#mobile-menu a[href="#calculator"]').click();
      assert.equal(await page.locator('#calculator').evaluate(el => el === document.activeElement), true);
    }
    await page.locator('#sav-tasks-number').focus();
    await page.locator('#sav-tasks-number').fill('240');
    assert.equal(await page.locator('[data-out="annual"]').textContent(), '$32,256');
    await page.waitForFunction(() => document.querySelector('#calculator-status').textContent.includes('$32,256'));
    await page.locator('[data-field="percent"][type="range"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#sav-percent-number').inputValue(), '65');
    const outline = await page.locator('[data-field="percent"][type="range"]').evaluate(el => getComputedStyle(el).outlineStyle);
    assert.equal(outline, 'solid');
    await page.locator('[data-chart-mode="hours"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-chart-mode="hours"]').getAttribute('aria-pressed'), 'true');
    await page.locator('.lc-next').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-lc-count]').textContent === '02 / 03');
    await scan('changed calculator and workflow');
    for(const step of [2,3,1]){
      await page.locator(`[data-step-label="${step-1}"]`).focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(index=>document.querySelector(`[data-step-label="${index}"]`).getAttribute('aria-current')==='step',step-1);
      assert.equal(await page.locator(`#story-step-${step}`).evaluate(el=>el===document.activeElement),true);
    }
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollSnapType),'none','Reduced motion disables snapping');
    await page.locator('#lead-submit').click();
    assert.equal(await page.locator('[name="name"]').evaluate(el => el === document.activeElement), true);
    await page.locator('[name="name"]').fill('Accessibility test');
    await page.locator('[name="email"]').fill('invalid');
    await page.locator('#lead-submit').click();
    assert.equal(await page.locator('[name="email"]').evaluate(el => el === document.activeElement), true);
    await page.locator('[name="email"]').fill('test@example.com');
    await page.locator('[name="message"]').fill('Testing the accessible form.');
    await page.route('**/api/contact', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Test failure. Please try again.' }) }));
    await page.locator('#lead-submit').click();
    await page.waitForFunction(() => document.querySelector('#lead-status').textContent.includes('Test failure'));
    await scan('form server error');
    assert.equal(await page.locator('[name="message"]').inputValue(), 'Testing the accessible form.');
    await page.unroute('**/api/contact');
    await page.route('**/api/contact', route => route.fulfill({ contentType: 'application/json', body: '{"ok":true}' }));
    await page.locator('#lead-submit').click();
    await page.waitForFunction(() => document.querySelector('#lead-status').textContent.includes('received'));
    assert.equal(await page.locator('[name="message"]').inputValue(), '');
    await scan('form success (mocked)');
    await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No horizontal page overflow with text spacing');
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}: axe, keyboard, calculator, mocked form outcomes, reflow and text spacing`);
    await context.close();
  }
  // Isolate scroll/reveal behavior from GPU variability in the decorative hero.
  const motionContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  const motionPage=await motionContext.newPage();
  await motionPage.addInitScript(()=>{
    const native=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:native.call(this,type,...args)};
  });
  await motionPage.goto(url);
  await motionPage.locator('[data-step-label="1"]').click();
  await motionPage.waitForFunction(()=>Math.abs(document.querySelector('#story-step-2').getBoundingClientRect().top-116)<5);
  assert.match(await motionPage.evaluate(()=>getComputedStyle(document.documentElement).scrollSnapType),/^y(?: proximity)?$/);
  await motionPage.locator('[data-step-label="2"]').click();
  await motionPage.waitForFunction(()=>document.querySelector('[data-step-label="2"]').getAttribute('aria-current')==='step'&&Math.abs(document.querySelector('#story-step-3').getBoundingClientRect().top-116)<5);
  await motionPage.evaluate(()=>window.scrollTo({top:document.querySelector('#cases').offsetTop,behavior:'instant'}));
  await motionPage.waitForFunction(()=>!document.documentElement.classList.contains('story-snap-active'));
  await motionPage.goto(url);
  await motionPage.evaluate(()=>window.scrollTo({top:document.querySelector('.plan-card').getBoundingClientRect().top+scrollY-150,behavior:'instant'}));
  await motionPage.waitForFunction(()=>document.getAnimations().some(a=>a.effect.target.matches('.plan-card')&&a.playState==='running'));
  await motionPage.emulateMedia({reducedMotion:'reduce'});
  await motionPage.waitForFunction(()=>!document.getAnimations().some(a=>a.effect?.target.matches('.plan-card')&&a.playState==='running'));
  console.log('PASS desktop motion: smooth card alignment, proximity snapping, section exit, reveal animation and live reduced-motion cancellation');
  await motionContext.close();
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
