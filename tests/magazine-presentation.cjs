/* Browser regression: magazine hero scrolls naturally with the mouse wheel. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const port=8792,host='http://127.0.0.1:'+port;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory','.'],{stdio:'ignore'});
let browser;
(async()=>{
 await sleep(1100);
 browser=await chromium.launch();
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const req=route.request(),u=req.url();
   if(u.startsWith(host+'/bali-lombok/'))return route.continue({url:u.replace(host+'/bali-lombok/',host+'/')});
   if(u.startsWith(host+'/'))return route.continue();
   if(['xhr','fetch'].includes(req.resourceType()))return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{}'});
   return route.abort();
  });
  await page.goto(host+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1200);
  const state=await page.evaluate(()=>({
   cover:!!document.querySelector('.mg-cover')?.getBoundingClientRect().height,
   modal:!!document.querySelector('dialog.mg-entry[open]'),
   spacer:!!document.querySelector('.mg-entry-spacer'),
   cta:!!document.querySelector('.mg-cover-cta'),
   fullscreen:!!document.querySelector('.mg-cover-fullscreen'),
   story:!!document.getElementById('magazineStory'),
   magazine:document.documentElement.dataset.magazine,
   scrollBehavior:getComputedStyle(document.documentElement).scrollBehavior
  }));
  assert(state.cover&&state.story&&state.magazine==='on',name+' magazine content must remain');
  assert(!state.modal&&!state.spacer&&!state.cta,name+' must not show entry modal or Explore button');
  assert(state.fullscreen,name+' fullscreen control must remain');
  assert.equal(state.scrollBehavior,'auto',name+' must have native scrolling');
  if(name==='desktop'){
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.mouse.move(240,340);
   await page.mouse.wheel(0,640);
   await page.waitForTimeout(400);
   const y=await page.evaluate(()=>window.scrollY);
   assert(y>60,'desktop mouse wheel must scroll normally; got '+y);
  }
  assert(!errors.length,name+' page errors: '+errors.slice(0,3).join('; '));
  console.log('PASS: '+name+' magazine hero in normal flow without scroll trap');
  await ctx.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close().catch(()=>{});server.kill()});
