const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),assert=require('node:assert/strict');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),servers=[];
const base=process.env.BASELINE_DIR;if(!base)throw Error('BASELINE_DIR required');
function serve(dir,port){servers.push(spawn('python3',['-m','http.server',port+'','--directory',dir],{stdio:'ignore'}));return 'http://127.0.0.1:'+port;}
(async()=>{
const urls={baseline:serve(base,8775),current:serve('.',8776)};await sleep(1000);fs.mkdirSync('test-results/sections',{recursive:true});
const browser=await chromium.launch();const results={sections:[],performance:[]};
try{
for(const width of [390,1440]){
 const states={};
 for(const [label,url] of Object.entries(urls)){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.route('**/*',r=>{
   const name=new URL(r.request().url()).pathname.split('/').pop();
   if(['SINdolar.jpg','USAdolar.jpg','IDRbankovka.jpg'].includes(name))return r.fulfill({contentType:'image/jpeg',body:fs.readFileSync(name)});
   return r.request().url().startsWith(url)?r.continue():r.abort();
  });
  const page=await context.newPage();await page.clock.setFixedTime(new Date('2026-11-03T10:00:00Z'));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await sleep(3500);await page.evaluate(()=>luxSetLock(false));
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'});
  const ids=await page.locator('.lux-fold[id]').evaluateAll(ns=>ns.map(n=>n.id));const sections=[];
  for(const id of ids){
   await page.evaluate(id=>{const node=document.getElementById(id);luxPartFor(node);if(!node.classList.contains('is-open'))luxToggle(id);node.scrollIntoView({block:'start'});},id);
   await page.waitForFunction(id=>document.getElementById(id).classList.contains('is-settled'),id);
   await sleep(150);
   sections.push(await page.evaluate(id=>{
    const node=document.getElementById(id),origin=node.getBoundingClientRect();
    const nodes=[node,...node.querySelectorAll(':scope > .lux-fold-h, :scope > .lux-fold-body, :scope > .lux-fold-body > *')];
    const round=x=>Math.round(x*2)/2;
    return {id,open:node.classList.contains('is-open'),nodes:nodes.map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {tag:n.tagName,id:n.id,rect:[round(r.x-origin.x),round(r.y-origin.y),round(r.width),round(r.height)],css:[s.display,s.visibility,s.color,s.backgroundColor,s.fontSize,s.fontFamily,s.gridTemplateColumns,s.padding,s.borderRadius]};})};
   },id));
   await page.screenshot({path:`test-results/sections/${label}-${width}-${id}.png`});
  }
  const controls=[];
  for(const mode of ['all','none','def']){
   await page.locator('#aktivity [data-bulk="'+mode+'"]').first().evaluate(n=>n.click());await sleep(150);
   controls.push(await page.evaluate(mode=>({kind:'activities',mode,total:TRIP.sums({solo:false}).kc,budget:document.getElementById('bxGrand_pers').textContent}),mode));
  }
  const packing=await page.locator('.packing-checkbox:not(:disabled)').evaluateAll(ns=>ns.map(n=>n.id).filter(Boolean));
  for(const id of packing){
   await page.locator('#'+id).evaluate(n=>n.click());
   controls.push(await page.evaluate(id=>({kind:'packing',id,badge:document.getElementById('totalWeightBadge').textContent}),id));
  }
  for(const id of ['cxBuf','cxFoodCash','cxAir']){
   if(await page.locator('#'+id).count()){
    await page.locator('#'+id).evaluate(n=>{n.value=Number(n.value)+1;n.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(400);
    controls.push(await page.evaluate(id=>({kind:'cash',id,stored:localStorage.getItem('cash_plan_v1'),summary:document.getElementById('cxSumSub')?.textContent}),id));
   }
  }
  await page.evaluate(()=>toggleSettingsModal());assert(await page.locator('#settingsModalOverlay').evaluate(n=>n.classList.contains('open')));await page.evaluate(()=>toggleSettingsModal());
  const stored=await page.evaluate(()=>localStorage.getItem('cash_plan_v1'));await page.reload();await sleep(3500);assert.equal(await page.evaluate(()=>localStorage.getItem('cash_plan_v1')),stored);
  assert.equal(errors.length,0,JSON.stringify(errors));assert(sections.every(s=>s.open));states[label]={sections,controls};await context.close();
 }
 fs.writeFileSync(`test-results/layout-${width}.json`,JSON.stringify(states,null,2));
 for(let i=0;i<states.current.sections.length;i++)assert.deepEqual(states.current.sections[i],states.baseline.sections[i],`section ${states.current.sections[i].id} at ${width}px`);
 assert.deepEqual(states.current.controls,states.baseline.controls,`section layout differs at ${width}px`);results.sections.push({width,count:states.current.sections.length,controlScenarios:states.current.controls.length,layoutsEqual:true});
}
// A failed banknote image must not be reinserted by the mutation observer.
{
 const context=await browser.newContext({serviceWorkers:'block'});let attempts=0;
 await context.route('**/*',r=>{if(/(?:SINdolar|USAdolar|IDRbankovka)\.jpg/.test(r.request().url()))attempts++;return r.request().url().startsWith(urls.current)?r.continue():r.abort();});
 const page=await context.newPage();await page.goto(urls.current);await sleep(3500);await page.evaluate(()=>{luxSetLock(false);luxPartFor(document.getElementById('f-hotovost'));luxToggle('f-hotovost');document.getElementById('f-hotovost').scrollIntoView();});await sleep(2000);
 assert(attempts>0&&attempts<=3,`banknote request loop: ${attempts}`);assert.equal(await page.locator('#hotovost .tj-own').count(),0);results.failedImages={attempts,retryLoop:false};await context.close();
}
// Controlled cold-cache measurements. External resources are blocked identically.
// Python serves uncompressed files. These are lab measurements, not production CWV.
for(const profile of ['desktop','mobile'])for(let sample=0;sample<3;sample++)for(const label of (sample%2?['current','baseline']:['baseline','current'])){
 const url=urls[label],context=await browser.newContext({viewport:{width:profile==='mobile'?390:1440,height:900},serviceWorkers:'block'});
 await context.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
 const page=await context.newPage(),cdp=await context.newCDPSession(page);
 if(profile==='mobile'){
  await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:200000,uploadThroughput:100000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 }
 await page.addInitScript(()=>{window.__auditLCP=0;new PerformanceObserver(list=>{for(const e of list.getEntries())window.__auditLCP=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});});
 await page.goto(url);await sleep(2000);
 const metrics=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0],r=performance.getEntriesByType('resource').filter(e=>e.name.startsWith(location.origin)&&/\.(css|js)(\?|$)/.test(e.name));return {domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd,lcp:window.__auditLCP,scriptStyleRequests:r.length,scriptStyleBytes:r.reduce((a,e)=>a+e.encodedBodySize,0)};});
 results.performance.push({profile,sample,label,...metrics});await context.close();
}
fs.writeFileSync('test-results/extended.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>servers.forEach(s=>s.kill()));
