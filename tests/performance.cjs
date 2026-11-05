/* Non-invasive cold-load benchmark for the published HTML, mobile and desktop. */
const {chromium} = require('playwright');
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const PORT = 8789;
const URL = 'http://127.0.0.1:' + PORT + '/index.html';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = spawn('python3', ['-m','http.server', String(PORT), '--bind','127.0.0.1','--directory','.'], {stdio:'ignore'});
const snapshots = [];
let browser;
async function main() {
  await sleep(1200);
  browser = await chromium.launch({headless: true});
  for (const profile of [
    {name:'mobile', viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true},
    {name:'desktop', viewport:{width:1440,height:1000}, deviceScaleFactor:1, isMobile:false, hasTouch:false}
  ]) {
    const context = await browser.newContext({viewport:profile.viewport, deviceScaleFactor:profile.deviceScaleFactor, isMobile:profile.isMobile, hasTouch:profile.hasTouch, serviceWorkers:'block'});
    const page = await context.newPage();
    const errors = [], failedLocal = [];
    let transferred = 0, requests = 0, imageBytes = 0, imageRequests = 0;
    let wikimediaApiOnStartup = 0, thirdPartyRequests = 0;
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', req => {
      if (!req.url().startsWith('http://127.0.0.1:' + PORT + '/')) {
        thirdPartyRequests++;
        if (/commons[.]wikimedia[.]org\/w\/api[.]php/.test(req.url())) wikimediaApiOnStartup++;
      }
    });
    page.on('requestfailed', req => {
      if (req.url().startsWith(URL.slice(0, URL.indexOf('/index.html')))) {
        failedLocal.push({url:req.url(), error:req.failure()?.errorText || 'request failed'});
      }
    });
    await page.route('**/*', route => {
      const req = route.request();
      if (req.url().startsWith('http://127.0.0.1:' + PORT + '/')) return route.continue();
      // Ensure deterministic layout and no remote API request noise.
      if (['fetch','xhr'].includes(req.resourceType())) return route.fulfill({
        status:503, contentType:'application/json',
        headers:{'Access-Control-Allow-Origin':'*'}, body:'{}'
      });
      return route.abort();
    });
    await page.addInitScript(() => {
      window.__webVitals = {lcp: null, cls:0, longTasks:0, longTaskMs:0};
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) window.__webVitals.lcp = Math.round(entry.startTime);
        }).observe({type:'largest-contentful-paint', buffered:true});
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__webVitals.cls += entry.value;
          }
        }).observe({type:'layout-shift', buffered:true});
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            window.__webVitals.longTasks++;
            window.__webVitals.longTaskMs += entry.duration;
          }
        }).observe({type:'longtask', buffered:true});
      } catch (_) {}
    });
    page.on('response', async response => {
      if (!response.url().startsWith('http://127.0.0.1:' + PORT + '/')) return;
      requests++;
      const req = response.request();
      const headers = await response.allHeaders().catch(()=>({}));
      const size = Number(headers['content-length'] || 0);
      if (Number.isFinite(size)) transferred += size;
      if (req.resourceType() === 'image') {imageRequests++;imageBytes += size;}
      if (response.status() >= 400) failedLocal.push({url:response.url(),status:response.status()});
    });
    const t0 = Date.now();
    await page.goto(URL, {waitUntil:'domcontentloaded', timeout:60000});
    const domContentLoadedWallMs = Date.now()-t0;
    await page.waitForTimeout(4500);
    const data = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      return {
        domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd || 0),
        loadMs: Math.round(nav?.loadEventEnd || 0),
        firstContentfulPaintMs: Math.round(paint.find(e=>e.name==='first-contentful-paint')?.startTime || 0),
        lcpCandidateMs: window.__webVitals.lcp,
        cumulativeLayoutShift: Number(window.__webVitals.cls.toFixed(4)),
        longTasks: window.__webVitals.longTasks,
        totalLongTaskDurationMs: Math.round(window.__webVitals.longTaskMs),
        heroImage: document.querySelector('.mg-cover-photo')?.currentSrc || null,
        heroComplete: !!document.querySelector('.mg-cover-photo')?.complete,
        heroNaturalWidth: document.querySelector('.mg-cover-photo')?.naturalWidth || 0
      };
    });
    snapshots.push({profile:profile.name, viewport:profile.viewport,
      synthetic:true, thirdPartyNetwork:'blocked', serviceWorkers:'blocked',
      domContentLoadedWallMs, requests, transferredBytesFromContentLength:transferred,
      imageRequests, imageBytesFromContentLength:imageBytes,
      thirdPartyRequests, wikimediaApiOnStartup,
      errors:errors.slice(0,20), failedLocal:failedLocal.slice(0,30), ...data});
    await context.close();
  }
  fs.mkdirSync('docs',{recursive:true});
  fs.writeFileSync('docs/performance-metrics.json', JSON.stringify({
    caveat:'Synthetic local HTTP test; not production RUM or PageSpeed. Third-party services intentionally disabled. Timings depend on CI runner.',
    timestamp:new Date().toISOString(), snapshots
  },null,2)+'\n');
  console.log(JSON.stringify(snapshots,null,2));
  if (snapshots.some(s=>s.failedLocal.length || !s.heroNaturalWidth || s.wikimediaApiOnStartup))
    process.exitCode = 1;
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{
  if (browser) await browser.close().catch(()=>{});
  server.kill();
});
