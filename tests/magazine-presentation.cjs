/* Browser regression of the editorial cover: entering the magazine must work on PC and phone. */
const {chromium}=require('playwright'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
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
  await page.waitForTimeout(1600);
  let state=await page.evaluate(()=>({
   open:!!document.querySelector('dialog.mg-entry[open]'),
   cover:!!document.querySelector('.mg-cover'),
   spacer:!!document.querySelector('.mg-entry-spacer'),
   cta:!!document.querySelector('.mg-cover-cta'),
   magazines:document.documentElement.dataset.magazine
  }));
  assert(state.cover&&state.cta&&state.magazines==='on',name+' has lost magazine cover');
  if(name==='desktop'){
   assert(state.open,'Desktop presentation dialog must remain open on first visit');
   assert(state.spacer,'Desktop dialog needs an in-flow placeholder to avoid CLS');
  }else{
   assert(!state.open&&!state.spacer,'Phone must show the regular in-flow cover');
  }
  await page.locator('.mg-cover-cta').click({timeout:10000});
  await page.waitForTimeout(350);
  state=await page.evaluate(()=>({
   open:!!document.querySelector('dialog.mg-entry[open]'),
   spacer:!!document.querySelector('.mg-entry-spacer'),
   cover:!!document.querySelector('.mg-cover'),
   story:!!document.getElementById('magazineStory'),
   hash:location.hash
  }));
  assert(!state.open&&!state.spacer,name+' leaves the entry dialog/spacer behind');
  assert(state.cover&&state.story,name+' lost cover or article after entering');
  assert(state.hash==='#magazineStory',name+' did not navigate to the story');
  assert(!errors.length,name+' page errors: '+errors.slice(0,3).join('; '));
  console.log(name+' magazine opening and close passed');
  await ctx.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close().catch(()=>{});server.kill()});
