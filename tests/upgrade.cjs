// Real worker replacement: saved media survives; previous application code does not.
const engines=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const engine=process.env.BROWSER_ENGINE||'chromium',sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 let phase='old';const root=process.cwd();
 const oldWorker="self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));";
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  res.setHeader('Cache-Control','no-store');
  if(pathname==='/seed.html'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><title>Upgrade fixture</title>');return;}
  if(pathname==='/sw.js'&&phase==='old'){res.setHeader('Content-Type','application/javascript');res.end(oldWorker);return;}
  const file=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(r=>server.listen(8781,'127.0.0.1',r));const origin='http://127.0.0.1:8781',scope=origin+'/';
 const browser=await engines[engine].launch();const report={engine};
 try{
  const context=await browser.newContext();
  await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():['fetch','xhr'].includes(r.request().resourceType())?r.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{}'}):r.abort());
  const p=await context.newPage();await p.goto(origin+'/seed.html');
  await p.evaluate(async scope=>{
   const cache=await caches.open('bali2027-'+scope+'0123456789abcdef');
   await cache.put(scope+'saved-photo.jpg',new Response('saved-photo'));
   await cache.put(scope+'old-page.html',new Response('OLD_APP_CODE'));
   await cache.put(scope+'assets/build/js-0000000000000000.js',new Response('OLD_JS_CODE'));
   await cache.put('https://api.frankfurter.dev/v1/audit-upgrade?base=EUR',new Response('{"saved":true}',{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}}));
   const legacy=await caches.open('cesta-offline-v57');await legacy.put(scope+'legacy-photo.png',new Response('legacy-photo'));
   const nested=await caches.open('bali2027-'+scope+'nested/0123456789abcdef');await nested.put(scope+'nested/private.json',new Response('other app'));
   await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;
  },scope);
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
  phase='new';
  await p.evaluate(()=>new Promise(async(resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('worker replacement timeout')),45000);
   navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve();},{once:true});
   try{const reg=await navigator.serviceWorker.getRegistration();await reg.update();}catch(e){clearTimeout(timer);reject(e);}
  }));
  await p.goto(origin,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.TRIP);await sleep(3500);
  report.cacheKeys=await p.evaluate(()=>caches.keys());
  assert(report.cacheKeys.includes('bali2027-'+scope+'::runtime-v1'));assert(report.cacheKeys.includes('bali2027-'+scope+'nested/0123456789abcdef'));
  assert(!report.cacheKeys.includes('bali2027-'+scope+'0123456789abcdef'));
  assert(await p.evaluate(async scope=>{
   const cache=await caches.open('bali2027-'+scope+'::runtime-v1');
   return !(await cache.match(scope+'old-page.html'))&&!(await cache.match(scope+'assets/build/js-0000000000000000.js'));
  },scope),'old application code was migrated into runtime');
  const before=await p.locator('#bxGrand_pers').textContent();
  if(engine==='chromium')await context.setOffline(true);
  else await new Promise(r=>server.close(r));
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.TRIP);await sleep(3500);
  assert.equal(await p.locator('#bxGrand_pers').textContent(),before);
  const saved=await p.evaluate(async scope=>({photo:await(await fetch(scope+'saved-photo.jpg')).text(),legacy:await(await fetch(scope+'legacy-photo.png')).text(),api:await(await fetch('https://api.frankfurter.dev/v1/audit-upgrade?base=EUR')).json()}),scope);
  assert.equal(saved.photo,'saved-photo');assert.equal(saved.legacy,'legacy-photo');assert.equal(saved.api.saved,true);
  report.saved=saved;report.passed=true;await context.close();console.log(JSON.stringify(report));
 }finally{
  fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/upgrade.json',JSON.stringify(report,null,2));
  await browser.close();if(server.listening)await new Promise(r=>server.close(r));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
