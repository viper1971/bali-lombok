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
