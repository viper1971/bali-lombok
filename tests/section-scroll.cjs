// Opened section headers align just below the viewport top, even after switching sections.
const engines = require('playwright');
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const engine = process.env.BROWSER_ENGINE || 'chromium';
const baseline = !!process.env.SCROLL_BASELINE;
const root = process.env.SCROLL_TARGET_DIR || process.cwd();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = {engine, baseline, cases: [], passed: false};
(async () => {
    const port = 8792;
    const server = spawn('python3', ['-m', 'http.server', String(port), '--directory', root], {stdio: 'ignore'});
    let browser;
    fs.mkdirSync('test-results', {recursive: true});
    try {
        await sleep(700);
        browser = await engines[engine].launch();
        for (const width of [390, 1440]) {
            const context = await browser.newContext({viewport: {width, height: 900}, serviceWorkers: 'block',
                ...(width === 390 && engine === 'webkit' ? {isMobile: true, hasTouch: true} : {})});
            const origin = `http://127.0.0.1:${port}`;
            await context.route('**/*', route => {
                if (route.request().url().startsWith(origin)) return route.continue();
                if (['fetch', 'xhr'].includes(route.request().resourceType())) return route.fulfill({status: 503,
                    contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: '{}'});
                return route.abort();
            });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(origin, {waitUntil: 'domcontentloaded'});
            await sleep(3500);
            await page.evaluate(() => luxSetLock(false));
            const groups = await page.locator('.lux-part').evaluateAll(parts => parts.map(part => ({
                part: part.id, folds: [...part.querySelectorAll('.lux-fold[id]')].map(f => f.id)
            })).filter(group => group.folds.length));
            async function openFold(id) {
                await page.evaluate(id => {
                    const fold = document.getElementById(id);
                    luxPartFor(fold);
                    if (!fold.classList.contains('is-open')) luxToggle(id);
                }, id);
                await sleep(700);
            }
            async function clickHeader(selector, name, keyboard = false) {
                const locator = page.locator(selector);
                await locator.evaluate(header => window.scrollTo({top: window.scrollY + header.getBoundingClientRect().top - 240, behavior: 'instant'}));
                await sleep(650);
                if (keyboard) await locator.evaluate(header => header.focus({preventScroll: true}));
                const before = await locator.evaluate(header => header.getBoundingClientRect().top);
                assert(before >= 0 && before < 850, `${name}: header must be visible before activation`);
                if (keyboard) await page.keyboard.press('Enter');
                else {
                    // Use pointer coordinates: Locator.click may call the app's patched
                    // scrollIntoView, which opens a fold before the actual click.
                    const box = await locator.boundingBox();
                    const x = box.x + Math.min(100, box.width / 2), y = box.y + Math.min(20, box.height / 2);
                    if (width === 390 && engine === 'webkit') await page.touchscreen.tap(x, y);
                    else await page.mouse.click(x, y);
                }
                const samples = [];
                for (const delay of [80, 180, 300, 350]) {
                    await sleep(delay);
                    samples.push(await locator.evaluate(header => header.getBoundingClientRect().top));
                }
                const drift = Math.max(...samples.map(top => Math.abs(top - (baseline ? before : 8))));
                report.cases.push({width, name, keyboard, before, samples, drift});
                if (!baseline && drift > 4) {
                    await page.screenshot({path: `test-results/scroll-failure-${engine}-${width}.png`});
                    assert.fail(`${engine} ${width} ${name}: opened header missed the 8px top offset by ${drift.toFixed(1)}px: ${JSON.stringify({before, samples})}`);
                }
                const expanded = await locator.evaluate(header => header.matches('summary') ? header.parentElement.open : header.getAttribute('aria-expanded') === 'true');
                assert(expanded, `${name}: header expanded`);
            }
            // All closed: opening also aligns the header at the top.
            await page.evaluate(() => luxAll(null, false));
            await page.evaluate(id => luxPartFor(document.getElementById(id)), groups[0].folds[0]);
            await sleep(650);
            await clickHeader(`#${groups[0].folds[0]} > .lux-fold-h > .lux-fold-btn`, 'first opening');
            if (baseline) {
                await openFold('f-viza');
                await clickHeader('#f-sos > .lux-fold-h > .lux-fold-btn', 'read visas then open SOS');
            } else {
                // Every adjacent section in every part; animations remain enabled.
                for (const group of groups) {
                    for (let i = 1; i < group.folds.length; i++) {
                        await openFold(group.folds[i - 1]);
                        await clickHeader(`#${group.folds[i]} > .lux-fold-h > .lux-fold-btn`, `${group.folds[i - 1]} -> ${group.folds[i]}`);
                    }
                }
                // Earlier section and native keyboard activation.
                await openFold('f-sos');
                await clickHeader('#f-viza > .lux-fold-h > .lux-fold-btn', 'previous section', true);
            }
            // A part switch also closes an expanded, scrolled-through section.
            await openFold('f-baleni');
            await clickHeader('#osa > .lux-part-head', 'preparation -> itinerary');
            if (!baseline) {
                await page.emulateMedia({reducedMotion: 'reduce'});
                await openFold('f-viza');
                await clickHeader('#f-sos > .lux-fold-h > .lux-fold-btn', 'reduced motion');
                await openFold('f-viza');
                await clickHeader('#flightPick > summary', 'section -> flight selection');
                await clickHeader('#cast-priprava > .lux-part-head', 'flight selection -> preparation');
                // A reader's wheel input must stop the temporary position hold.
                await openFold('f-viza');
                const next = page.locator('#f-sos > .lux-fold-h > .lux-fold-btn');
                await next.evaluate(header => window.scrollTo({top: window.scrollY + header.getBoundingClientRect().top - 240, behavior: 'instant'}));
                await sleep(100);
                const box = await next.boundingBox();
                await page.mouse.click(box.x + 100, box.y + 20);
                await sleep(80);
                const scrollBeforeWheel = await page.evaluate(() => scrollY);
                if (width === 390 && engine === 'webkit') {
                    // Playwright mobile WebKit has no wheel API. A real tap must
                    // release the hold; probe its release with a controlled scroll.
                    await page.touchscreen.tap(2, 400);
                    await page.evaluate(() => window.scrollBy({top: 300, behavior: 'instant'}));
                } else await page.mouse.wheel(0, 300);
                await sleep(550);
                assert(await page.evaluate(y => scrollY > y + 100, scrollBeforeWheel), 'position hold must yield to user scrolling');
                // Explicit navigation during an active hold must reach its destination.
                await page.evaluate(() => {
                    luxToggle('f-esim');
                    const link = document.createElement('a'); link.href = '#f-leg-ubud';
                    document.body.appendChild(link); link.click(); link.remove();
                });
                await sleep(1000);
                assert(await page.locator('#f-leg-ubud').evaluate(f => f.classList.contains('is-open')));
                const targetTop = await page.locator('#f-leg-ubud').evaluate(f => f.getBoundingClientRect().top);
                report.navigation = report.navigation || [];
                report.navigation.push({width, targetTop});
                assert(targetTop >= 0 && targetTop < 160,
                    `explicit anchor navigation must reach the start of its target; got ${targetTop}px`);
                await sleep(650);
                assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('overflow-anchor')), '',
                    'temporary anchoring override must be restored');
                assert.deepEqual(errors, []);
            }
            await context.close();
        }
        if (baseline && engine === 'chromium') assert(report.cases.some(c => c.drift > 30), 'original scroll jump was not reproduced');
        report.passed = true;
        console.log(JSON.stringify(report));
    } finally {
        fs.writeFileSync(`test-results/section-scroll-${baseline ? 'baseline-' : ''}${engine}.json`, JSON.stringify(report, null, 2));
        if (browser) await browser.close();
        server.kill();
    }
})().catch(error => {console.error(error); process.exitCode = 1;});
