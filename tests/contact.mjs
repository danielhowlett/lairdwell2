import assert from 'node:assert/strict';
import { launchBrowser, serveProduction } from './browser-helpers.mjs';
const endpoint='https://formspree.io/f/xvkzeloo';
const site=await serveProduction();
try{
 for(const name of(process.env.TEST_BROWSERS||'chromium,firefox,webkit').split(',')){
  const browser=await launchBrowser(name);
  try{
   const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   let scenario='success',posts=[],release;
   // Intercept the whole service: no test inquiry leaves the browser.
   await context.route('https://formspree.io/**',async route=>{
    const request=route.request();
    if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':site.url.slice(0,-1),'Access-Control-Allow-Headers':'accept,content-type','Access-Control-Allow-Methods':'POST'}});return;}
    assert.equal(request.url(),endpoint);posts.push({method:request.method(),headers:request.headers(),body:request.postData()});
    const reply=(status,body,contentType='application/json')=>route.fulfill({status,contentType,headers:{'Access-Control-Allow-Origin':site.url.slice(0,-1)},body:typeof body==='string'?body:JSON.stringify(body)});
    if(scenario==='pending'){await new Promise(resolve=>{release=resolve});return reply(200,{ok:true});}
    if(scenario==='validation')return reply(422,{errors:[{field:'email',message:'Please use a valid email address.'}]});
    if(scenario==='rate')return reply(429,{});
    if(scenario==='html-error')return reply(500,'Service temporarily unavailable','text/plain');
    if(scenario==='network')return route.abort('failed');
    if(scenario==='timeout')return; // Leave transport pending so AbortController must recover.
    if(scenario==='empty-success')return reply(200,'');
    return reply(200,{ok:true});
   });
   await page.goto(site.url);
    const phone=page.locator('#contact a[href="tel:+16157016955"]');
    assert.equal(await phone.textContent(),'(615) 701-6955');
    assert.equal(await page.locator('footer a[href="tel:+16157016955"]').count(),1);
   const form=page.locator('#lead-form'),button=page.locator('#lead-submit');
   assert.equal(await form.getAttribute('action'),endpoint);
   assert.equal(await form.getAttribute('method'),'post');
   const fill=async()=>{
    await page.locator('[name="name"]').fill('Test Business Owner');
    await page.locator('[name="email"]').fill('test@example.com');
    await page.locator('[name="company"]').fill('Test Company');
    await page.locator('[name="message"]').fill('Please help connect our business software.');
   };
   await button.click();assert.equal(posts.length,0,'Native required validation prevents submission');
   await fill();scenario='validation';await button.click();
   await page.waitForFunction(()=>document.querySelector('#lead-status').textContent.includes('valid email'));
   assert.equal(await page.locator('[name="email"]').getAttribute('aria-invalid'),'true');
   assert.equal(await page.locator('[name="email"]').evaluate(e=>e===document.activeElement),true);
   assert.match(await page.locator('[name="email"]').getAttribute('aria-describedby'),/lead-status/);
   assert.equal(await page.locator('[name="message"]').inputValue(),'Please help connect our business software.');
   await page.locator('[name="email"]').fill('corrected@example.com');assert.equal(await page.locator('[name="email"]').getAttribute('aria-invalid'),null);
   for(const [mode,fragment]of[['rate','wait a few minutes'],['html-error','could not be sent'],['network','connection']]){
    scenario=mode;await button.click();await page.waitForFunction(text=>document.querySelector('#lead-status').textContent.includes(text),fragment);
    assert.equal(await button.isEnabled(),true);assert.equal(await form.getAttribute('aria-busy'),null);assert.equal(await page.locator('[name="company"]').inputValue(),'Test Company');
   }
   scenario='pending';const count=posts.length;await button.click();await page.waitForFunction(()=>document.querySelector('#lead-submit').disabled);
   assert.equal(await form.getAttribute('aria-busy'),'true');
   // A second synthetic submit must not bypass the disabled-button protection.
   await form.evaluate(e=>e.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
   await page.waitForTimeout(50);assert.equal(posts.length,count+1);release();
   await page.waitForFunction(()=>document.querySelector('#lead-status').textContent.includes('received'));
   assert.equal(await page.locator('[name="message"]').inputValue(),'');assert.equal(await button.isEnabled(),true);
   const payload=posts.at(-1);assert.equal(payload.method,'POST');assert.equal(payload.headers.accept,'application/json');assert.match(payload.headers['content-type'],/multipart\/form-data; boundary=/);
   for(const field of['name','email','company','interest','message','_gotcha','_subject'])assert.ok(payload.body.includes(`name="${field}"`));
   assert.match(payload.body,/corrected@example.com/);assert.match(payload.body,/Test Company/);
   // Calculator-generated inquiry context survives the same FormData submission.
   await page.locator('[data-discuss]').click();assert.match(await page.locator('[name="message"]').inputValue(),/tasks\/week/);
   await page.locator('[name="name"]').fill('Estimator user');await page.locator('[name="email"]').fill('estimate@example.com');scenario='empty-success';await button.click();
   await page.waitForFunction(()=>document.querySelector('#lead-status').textContent.includes('received'));
   assert.match(posts.at(-1).body,/tasks\/week/);assert.equal(await page.locator('[name="message"]').inputValue(),'');
   await page.clock.install();await fill();scenario='timeout';await button.click();
   await page.clock.fastForward(21000);
   await page.waitForFunction(()=>document.querySelector('#lead-status').textContent.includes('too long'));
   assert.equal(await button.isEnabled(),true);assert.equal(await form.getAttribute('aria-busy'),null);
   assert.equal(await page.locator('[name="message"]').inputValue(),'Please help connect our business software.');
   assert.deepEqual(errors,[]);await context.close();
   const native=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});const p=await native.newPage();let nativePost;
   await native.route('https://formspree.io/**',route=>{nativePost=route.request();return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><title>Mock Formspree</title><p>Inquiry received</p></html>'});});
   await p.goto(site.url);await p.locator('[name="name"]').fill('Native form user');await p.locator('[name="email"]').fill('native@example.com');await p.locator('[name="message"]').fill('Testing the native HTML form fallback.');
   await p.locator('#lead-submit').click();await p.waitForURL(endpoint);assert.equal(nativePost.method(),'POST');assert.match(nativePost.postData(),/email=native%40example.com/);assert.match(nativePost.postData(),/_gotcha=/);await native.close();
   console.log(`PASS ${name}: AJAX payload, validation/focus, rate limit, network/server errors, timeout recovery, duplicate protection, success/reset, estimator context and native POST (all mocked)`);
  }finally{await browser.close();}
 }
}finally{await site.close();}
