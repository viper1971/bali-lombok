# Singapur · Bali · Lombok 2027

Statický web, bez závislostí Node.js v produkci. Publikovaná stránka je `index.html`.

## Úpravy

- `src/index.html`: zdroj HTML; upravovat zde, ne generovaný `index.html`.
- `assets/css/`: původní styly v pořadí kaskády. Historické vrstvy zatím zachovány.
- `assets/js/`: původní funkční bloky; samostatné klasické skripty sdílí globální API.
- `src/sw.js`: zdroj offline workeru.
- `assets/build/`: generované soubory s hashem obsahu, neupravovat ručně.
- `assets/build-manifest.json`: mapování každého výstupu na zdroje.
- `tools/build.py`: deterministický build bez externích Python balíčků; vyžaduje Node.js a `npm ci`.
- `tests/`: kontroly struktury, workeru a prohlížečové regrese.

Před buildem nainstalovat vývojové závislosti přes `npm ci`. Po každé změně spustit `python3 tools/build.py` a commitnout zdroje i výstupy.
Build spojuje pouze sousední CSS bloky; nepřesouvá je přes skripty nebo obsah.
Zachovává ID původních stylesheetů jako prázdné style kotvy a hranice JS skriptů.
Devět ověřených prázdných skriptů bylo odstraněno; seznam je v `docs/removed-scripts.json`. ID kotvy zůstávají zachované. JavaScript minifikuje Terser bez compression a mangling; scope i funkce zůstávají zachované.

## Testy

`npm ci`, `npm test`. Pro prohlížečové testy navíc `npx playwright install --with-deps chromium` a `npm run test:browser`.
Volitelné `BASELINE_DIR` označuje checkout výchozí verze PR #1 pro porovnání výpočtů a stavu.
Workflow ukládá snímky pro rozlišení 390 × 844 a 1440 × 1000 a JSON s výsledky.
Testy emulují viewport; nenahrazují kontrolu na fyzickém Androidu/iOS.

## Nasazení a offline

Nahrát `index.html`, `sw.js`, manifest, ikony, `assets/` a ostatní používané soubory se zachováním adresářů. HTTPS je nutné pro service worker (localhost je výjimka).
Worker před aktivací atomicky uloží místní aplikační shell. Jméno cache zahrnuje scope a verzi.
Cizí cache nemaže. Starou původní cache `cesta-offline-v57` záměrně nemaže, protože nesdílí identitu nového scope.
Obrázky, externí písma a mapové dlaždice se ukládají při použití, případně přes „Uložit pro offline“.
Živé mapy, externí iframe a API bez předchozího uložení nelze slibovat offline.
`.htaccess` zapíná kompresi a cache pravidla pouze na Apache. GitHub Pages jej nepoužívá.

Po nasazení ponechat soubory předchozí verze `assets/build/` po dobu přechodu existujících klientů. Novou verzi nejdřív ověřit na testovacím hostingu. Tento PR se neslučuje automaticky.

Rozšířená kontrola: `BASELINE_DIR=baseline node tests/extended.cjs`. Porovnává geometrii a vybrané computed styles všech rozbalených sekcí na dvou šířkách, ukládá snímky a měří tři studené návštěvy pro desktop a simulovaný mobil. Externí služby jsou zablokované shodně, soubory se přenášejí bez komprese. Výsledky nejsou produkční Core Web Vitals.

CSS výstupy odstraňují pouze formátovací bílé znaky a samostatné komentáře. Selektory, hodnoty, podmínky, pořadí i vlastní CSS proměnné kontroluje `tests/css-semantics.cjs` porovnáním stromu parseru. Zdrojové CSS zůstává čitelné.

Kompatibilita: `BROWSER_ENGINE=firefox npm run test:browser` nebo `BROWSER_ENGINE=webkit npm run test:browser`. CI instaluje příslušné prohlížeče a používá stejný výchozí checkout. Mobilní WebKit zapíná dotykový mobilní režim. Nejde o fyzický iPhone/Safari.

`node tests/live.cjs` kontroluje živé veřejné CDN/API a základní provoz webu. Neukládá ani neodesílá formuláře. Výpadky jednotlivých cizích služeb jsou v reportu oddělené od funkčnosti místní aplikace; navíc se ověřuje deterministický výpadek všech externích zdrojů.

### Offline obsah při aktualizaci

Kód a HTML jsou v cache s verzí buildu, fotografie, písma a veřejná data v oddělené stabilní runtime cache. Aktivace nejdřív převede způsobilý obsah předchozí verze a teprve potom smaže její kód. Umí načíst odpovídající obsah také z původních `cesta-offline-v*` a `cesta-tiles-v1`; sdílené původní cache nemaže. Cache vnořeného webu se nemaže. Při selhání kopírování zůstanou původní data zachovaná. Mapové dlaždice mají limit 600 včetně základního hostu `tile.openstreetmap.org`.

`node tests/upgrade.cjs` ověřuje skutečnou výměnu workeru, zachování médií a API dat, oddělení starého HTML/JS a reload bez dostupného serveru. Lze přidat `BROWSER_ENGINE=firefox` nebo `webkit`.

Načítání Leaflet čeká na skript i stylesheet. Selhání odstraní dočasné elementy, uvolní společný promise a dovolí další pokus; existuje časový limit 12 s. Návrat připojení obnoví sledování viditelnosti map.

HTML má generovaný marker `bali-build`. Worker při instalaci vyžaduje shodu markeru s verzí; nověji načtené HTML se může zobrazit online, ale nepřepíše offline fallback jiné kompletní verze. Proto upravovat `src/index.html` a spouštět build, neupravovat generovaný marker ručně.

Síťové čekání přes worker je omezené: 5 s pro kód, HTML, CSS a API, 30 s pro média. Časovač se ukončuje až po zpracování těla a zápisu do cache; při chybě zůstává použitelná uložená odpověď, pokud existuje.
