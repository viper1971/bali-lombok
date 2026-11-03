// Read-only live smoke test: no form submissions, messages, booking or publishing.
const {chromium,request}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn('python3',['-m','http.server','8780'],{stdio:'ignore'});await sleep(1000);
 const browser=await chromium.launch(),api=await request.newContext({timeout:15000});const result={checkedAt:new Date().toISOString(),resources:[]};const bodies={};
 try{
  const urls=[
   'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
   'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
   'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
   'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=CZK,SGD,IDR,USD',
   'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&titles=File:Example.jpg'
  ];
  await Promise.all(urls.map(async url=>{
   try{const r=await api.get(url);const body=await r.body();if(r.ok())bodies[url]=body;result.resources.push({url,status:r.status(),ok:r.ok(),bytes:body.length});}
   catch(e){result.resources.push({url,ok:false,error:e.message.split('\n')[0]});}
  }));
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}}),page=await context.newPage(),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>{if(failed.length<100)failed.push({url:r.url(),error:r.failure()?.errorText});});
  await page.goto('http://127.0.0.1:8780',{waitUntil:'domcontentloaded',timeout:60000});await sleep(12000);
  await page.waitForFunction(()=>window.TRIP&&document.getElementById('bxGrand_pers')?.textContent.includes('Kč'));
  result.budgetBefore=await page.locator('#bxGrand_pers').textContent();
  result.leaflet=await page.evaluate(()=>Promise.race([ensureLeaflet().then(()=>({ok:!!window.L?.map})).catch(e=>({ok:false,error:e.message})),new Promise(r=>setTimeout(()=>r({ok:false,error:'timeout'}),15000))]));
  await page.evaluate(()=>{luxSetLock(false);setFlightAirline('finnair');TRIP.setLevel(Object.keys(TRIP.FOOD).at(-1));});await sleep(1000);
  result.budgetAfter=await page.locator('#bxGrand_pers').textContent();assert.notEqual(result.budgetBefore,result.budgetAfter);
  assert.equal(errors.length,0,JSON.stringify(errors));result.errors=errors;result.failedRequests=failed;
  result.currency=await page.evaluate(()=>window.luxFx?{fallback:luxFx.fallback,rates:luxFx.mid,status:luxFx.status}:null);
  await page.screenshot({path:'test-results/live-mobile.png'});result.passed=true;await context.close();
  // Deterministic failure of all external sources must retain core functionality.
  const offlineCDN=await browser.newContext({serviceWorkers:'block'});
  await offlineCDN.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8780')?r.continue():r.abort());
  const p=await offlineCDN.newPage();await p.goto('http://127.0.0.1:8780');await sleep(3500);
  await p.evaluate(()=>openMapFullscreen('flight'));await p.waitForFunction(()=>document.getElementById('mapFsContainer')?.textContent.includes('nepodařilo'));
  assert(await p.evaluate(()=>!!window.TRIP&&Number.isFinite(TRIP.sums({solo:false}).kc)));result.cdnFailureFallback=true;
  assert.equal(await p.locator('link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]').count(),0,'failed CSS attempt leaked');
  assert.equal(await p.locator('script[src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]').count(),0,'failed JS attempt leaked');
  if(bodies[urls[0]]&&bodies[urls[1]]){
   await offlineCDN.route('https://unpkg.com/leaflet@1.9.4/dist/leaflet.*',r=>r.fulfill({contentType:r.request().url().endsWith('.css')?'text/css':'application/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:bodies[r.request().url()]}));
   await p.evaluate(()=>openMapFullscreen('flight'));
   await p.waitForFunction(()=>document.getElementById('activeFsMap')?.classList.contains('leaflet-container'));
   assert.equal(await p.locator('link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]').count(),1);
   await p.evaluate(()=>closeMapFullscreen());result.mapRecovery=true;
  }else result.mapRecovery='not verified: live CDN download unavailable';
  await offlineCDN.close();
 }finally{fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/live.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await api.dispose();await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
