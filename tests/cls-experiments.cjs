/* Compare startup layout shifts with and without the magazine entry dialog.
   Diagnostic only: does not change the published website. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=8790,host='http://127.0.0.1:'+port;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory','.'],{stdio:'ignore'});
let browser;
async function run(profile,disableDialog,earlyMagazineCSS){
 const context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:profile.dpr,isMobile:profile.mobile,hasTouch:profile.mobile,serviceWorkers:'block'});
 await context.addInitScript(({disable})=>{
   if(disable) Object.defineProperty(window,'HTMLDialogElement',{configurable:true,value:undefined});
   window.__clsEvents=[];
   try {
     new PerformanceObserver(list=>{
       for(const item of list.getEntries()){
         if(item.hadRecentInput)continue;
         window.__clsEvents.push({time:Math.round(item.startTime),value:+item.value.toFixed(5),
           nodes:(item.sources||[]).slice(0,6).map(s=>{
             const n=s.node;return n?(n.tagName.toLowerCase()+(n.id?'#'+n.id:'')+(typeof n.className==='string'?'.'+n.className.slice(0,60):'')):'unknown';
           })});
       }
     }).observe({type:'layout-shift',buffered:true});
   }catch(e){}
 },{disable:disableDialog});
 const page=await context.newPage();
 const failures=[];
 page.on('pageerror',e=>failures.push(e.message));
 await page.route('**/*',route=>{
   if(earlyMagazineCSS && route.request().url()===host+'/index.html'){
     const html=fs.readFileSync('index.html','utf8');
     const critical='<link rel="stylesheet" href="assets/build/css-73431e86df8d618e.css" data-cls-experiment="early-magazine">';
     return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html.replace('</head>',critical+'</head>')});
   }
   const req=route.request(),url=req.url();
   if(url.startsWith(host+'/bali-lombok/'))return route.continue({url:url.replace(host+'/bali-lombok/',host+'/')});
   if(url.startsWith(host+'/'))return route.continue();
   if(['xhr','fetch'].includes(req.resourceType()))return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{}'});
   return route.abort();
 });
 await page.goto(host+'/index.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForTimeout(4800);
 const state=await page.evaluate(()=>({
   clsEvents:window.__clsEvents,
   dialogOpen:!!document.querySelector('dialog.mg-entry[open]'),
   coverVisible:!!document.querySelector('.mg-cover')?.getBoundingClientRect().height,
   magazine:document.documentElement.dataset.magazine,
   fcp:Math.round(performance.getEntriesByType('paint').find(x=>x.name==='first-contentful-paint')?.startTime||0)
 }));
 await context.close();
 return {profile:profile.name,disableDialog,earlyMagazineCSS, ...state,
   cls:+state.clsEvents.reduce((n,x)=>n+x.value,0).toFixed(5),
   failures:failures.slice(0,8)};
}
(async()=>{
 await sleep(900);
 browser=await chromium.launch({headless:true});
 const values=[];
 for(const profile of [
  {name:'mobile',viewport:{width:390,height:844},dpr:2,mobile:true},
  {name:'desktop',viewport:{width:1440,height:1000},dpr:1,mobile:false}
 ])for(const variant of [{disabled:false,early:false},{disabled:true,early:false},{disabled:false,early:true},{disabled:true,early:true}])values.push(await run(profile,variant.disabled,variant.early));
 fs.mkdirSync('docs',{recursive:true});
 fs.writeFileSync('docs/cls-experiments.json',JSON.stringify({note:'Diagnostic synthetic test; disabled-dialog variant is never deployed.',values},null,2)+'\n');
 console.log(JSON.stringify(values.map(({profile,disableDialog,earlyMagazineCSS,cls,dialogOpen,failures})=>({profile,disableDialog,earlyMagazineCSS,cls,dialogOpen,errors:failures.length}))));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close().catch(()=>{});server.kill()});
