const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const baseline=process.env.BASELINE_DIR;
const servers=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function serve(dir,port){const p=spawn('python3',['-m','http.server',String(port),'--directory',dir],{stdio:'ignore'});servers.push(p);return 'http://127.0.0.1:'+port;}
(async()=>{
 const current=serve(process.cwd(),8765),original=baseline?serve(baseline,8766):null;
 fs.mkdirSync('test-results',{recursive:true});await sleep(1000);
 const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
 const report=[];
 try{
 for(const viewport of [{width:390,height:844},{width:1440,height:1000}]){
  const snapshots=[];
  for(const [label,url] of [['baseline',original],['current',current]]){
   if(!url)continue;
   const ctx=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'reduce'});
   await ctx.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.waitForTimeout(3500);
   await page.screenshot({path:`test-results/${label}-${viewport.width}.png`});
   const state=()=>page.evaluate(()=>({budget:document.getElementById('bxGrand_pers')?.textContent,food:TRIP.level(),sum:TRIP.sums({solo:false}).kc,folds:[...document.querySelectorAll('.lux-fold')].map(n=>n.id),theme:document.documentElement.dataset.theme}));
   const initial=await state();assert(initial.budget,'budget must render');assert(initial.folds.length>5);
   // Native click handlers remain reachable even while the mobile rail is hidden.
   await page.locator('#v29BottomTab').evaluate(n=>n.click());assert(await page.locator('body').evaluate(n=>n.classList.contains('v29-bottom-open')));
   await page.locator('#floatingMenuBtn').evaluate(n=>n.click());assert(await page.locator('body').evaluate(n=>n.classList.contains('bali-content-mode')));
   await page.locator('#baliProgressTab').evaluate(n=>n.click());assert(await page.locator('body').evaluate(n=>n.classList.contains('bali-progress-mode')));
   await page.keyboard.press('Escape');
   if(viewport.width===390){await page.locator('#baliMobileHamburger').click();assert.equal(await page.locator('#baliMobileHamburger').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');}
   await page.evaluate(()=>luxSetLock(false));
   assert.equal(await page.locator('.lux-fold.lux-locked').count(),0);
   await page.evaluate(()=>luxSetLock(true));assert(await page.locator('.lux-fold.lux-locked').count()>0);
   await page.evaluate(()=>luxSetLock(false));
   const levels=await page.evaluate(()=>Object.keys(TRIP.FOOD));
   const budgets=[];
   for(const level of levels){await page.evaluate(l=>TRIP.setLevel(l),level);await page.waitForTimeout(250);budgets.push(await state());}
   assert(new Set(budgets.map(s=>s.budget)).size>1,'food changes budget');
   const chosen=levels.at(-1);await page.reload();await page.waitForTimeout(3500);assert.equal(await page.evaluate(()=>TRIP.level()),chosen,'food choice persists');
   await page.locator('#uxSearchBtn').evaluate(n=>n.click());await page.locator('#uxSearchInput').fill('Ubud');await page.waitForTimeout(500);
   assert(await page.locator('.uxResult').count()>0,'search results');
   if(label==='current'){
    // A collapsed fold body is inert for keyboard access, but is not a lock.
    await page.evaluate(()=>{const f=document.querySelector('.lux-fold:not(.lux-locked) .lux-fold-body');const n=document.createElement('p');n.textContent='AuditUniqueSearchTarget';f.appendChild(n);});
    await page.locator('#uxSearchInput').fill('AuditUniqueSearchTarget');await page.waitForTimeout(500);
    assert.equal(await page.locator('.uxResultLocked').count(),0);await page.locator('.uxResult').first().click();assert.equal(await page.locator('mark.uxFoundMark').textContent(),'AuditUniqueSearchTarget');
   }
   snapshots.push({label,initial,budgets,errors});await ctx.close();
  }
  if(snapshots.length===2){assert.deepEqual(snapshots[1].initial,snapshots[0].initial);assert.deepEqual(snapshots[1].budgets,snapshots[0].budgets);assert.deepEqual(snapshots[1].errors,snapshots[0].errors);}
  report.push({viewport,snapshots});
 }
 // Offline first load, full shell, and reload without network.
 const context=await browser.newContext();await context.route('**/*',r=>r.request().url().startsWith(current)?r.continue():r.abort());const p=await context.newPage();await p.goto(current,{waitUntil:'domcontentloaded'});await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.waitForTimeout(3500);
 const before=await p.locator('#bxGrand_pers').textContent();await context.setOffline(true);await p.reload();await p.waitForTimeout(3500);assert.equal(await p.locator('#bxGrand_pers').textContent(),before);assert(await p.evaluate(()=>!!window.TRIP));await context.close();
 fs.writeFileSync('test-results/browser.json',JSON.stringify({passed:true,report},null,2));
 console.log('PASS: desktop/mobile regression, navigation, locking, food calculations, persistence, search and offline reload');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>servers.forEach(p=>p.kill()));
