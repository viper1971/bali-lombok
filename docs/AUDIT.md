# Audit BALI 2027 – 3. 11. 2026

Základ: PR #1, commit `457040d35ca72436f02a7a03b524cdb7fb6c5b50`. Práce v `audit/bali-2027`; `main` beze změny.

## Provedené změny

| Oblast | Zjištění a oprava |
|---|---|
| Načítání | 71 CSS + 65 JS požadavků nahrazeno 18 CSS + 57 JS = 75 požadavků (−44,9 %). Počet zahrnuje pouze místní CSS/JS, nikoli obrázky a CDN. |
| Kaskáda | Spojují se pouze sousední CSS; pořadí deklarací je shodné. Nepoužívá se odhad „nepoužitých“ selektorů. |
| JS | Osm bloků s pouhými komentáři/bílými znaky se již nestahuje. Ostatní skripty zůstávají oddělené kvůli scope, strict mode a okamžiku vykonání. |
| Cache | Hashované názvy zdrojů brání smíchání verzí; worker před aktivací uloží kompletní místní shell. Již uložené hashované soubory čte přímo z cache bez dalšího stahování. |
| Worker | Mazání omezeno na vlastní scope, zápisy na pozadí mají waitUntil, HTTP chyby navigace vrací uloženou kopii, precache počítá úspěch až po zápisu a neomezuje seznam na prvních 400 položek. |
| Vyhledávání | Sbalený `.lux-fold-body[inert]` již není považovaný za zámek; zamčená `.lux-fold` i `.lux-part` zůstávají chráněné. |
| Offline UI | MessageChannel se uzavře a timeout se zruší po odpovědi. |
| HTML | UTF-8 deklarace přesunuta před skripty; apple ikona má relativní adresu vhodnou pro testovací nasazení. |
| Hosting | Apache: komprese textů, revalidace HTML/workeru, dlouhá cache hashovaných souborů. |

## Ověření závislostí

Prohledány všechny extrahované CSS a JS, jejich odkazy z HTML, použití currentScript/document.write, přístup k ID stylesheetů, relativní URL, závislosti offline přednačítání a sdílená API TRIP, rozpočtu, navigace a zámků.

Původní CSS i JavaScript kromě dvou cílených oprav zůstávají obsahově zachované. Automatické kontroly porovnávají obsah, pořadí zdrojů, všechny ID a značky obsahové části HTML. Žádné obrázky, historické HTML soubory ani jejich závislosti nebyly smazány. Žádná shoda hashe obrázků sama o sobě není důkazem bezpečného smazání.

## Výsledky dostupné v lokálním prostředí

- 6/6 statických testů: opakovatelnost buildu, zachování ID/obsahu, pořadí zdrojů, existence souborů, syntaxe všech 65 původních JS + workeru + transportních dat, úplnost offline shellu.
- Test service workeru: shell, izolované mazání cache, síť/offline/HTTP 503, zápisy na pozadí a validace precache – prošel. Jde o simulaci Cache API, nikoli důkaz chování konkrétního prohlížeče.
- Syntaxe inline JavaScriptu vedlejších stránek: `Index2.html` 45 bloků, `test.html` 32 bloků, `skola.html` 0 bloků; vše prošlo.
- Vstupní HTML nemá duplicitní ID ani chybějící místní statické zdroje.
- 47/49 obrázků má lazy loading; zbývající jsou měřicí pixel a prázdný fullscreen náhled. Nezměněno.

## Prohlížečová regrese

Lokální Chrome nelze spustit: systém odmítá socket pro process singleton (`Operation not permitted`). Připraven workflow pro skutečný Chromium v GitHub Actions: desktop/mobil, počáteční rozpočet a všechny úrovně jídla proti výchozímu PR, ukládání volby, menu/obsah/přehled, hamburger, zámky, hledání a offline reload. Snímky slouží k vizuální kontrole; automatická pixelová shoda se netvrdí.

**První prohlížečová sada prošla v GitHub Actions:** https://github.com/viper1971/bali-lombok/actions/runs/41608914479 (commit `3d0acaf`). Mobil i desktop: shodný výchozí rozpočet 47 612 Kč, shoda všech úrovní jídla proti PR #1, žádné pageerror v žádné ze čtyř stránek. Navigace, zámky, hledání, persistence a offline reload prošly. Následující rozšíření testů navíc pokrývá všechny aerolinky, všechny hotelové varianty, pět rozpočtových režimů, téma a prezentaci.

Zkontrolovány snímky úvodního viewportu pro oba rozměry. Rozdíly odpovídají odpočtu času a QR kódu jiné testovací adresy; rozložení je zachované. Toto není vizuální kontrola všech rozbalených sekcí. Snímky: https://github.com/viper1971/bali-lombok/actions/runs/41608914479/artifacts/13218346267 Testy pokrývají vyjmenované scénáře, nikoli všechny kombinace každé volby. Fyzický Android, iOS/Safari, externí mapy/API a ruční kontrola snímků zůstávají samostatným ověřením.

## Omezení a další práce

- Čas do vykreslení/LCP/INP nebyl změřen; menší počet požadavků není tvrzení o naměřeném zrychlení.
- Rozpočtové funkce a výběry nebyly přepsány; cílená regrese proti základu chrání jejich dosavadní chování, neprokazuje správnost všech cestovních cen.
- Historické override vrstvy a dlouhé funkční bloky vyžadují komponentové testy před dalším odstraňováním. Označit celý projekt za kompletně vyčištěný by nebylo podložené.
- Vedlejší `Index2.html`, `test.html`, `skola.html` jsou ponechány jako samostatné stránky; tento refaktoring mění hlavní aplikaci, ne jejich veřejné adresy.
- Externí CDN zůstávají závislostí při prvním načtení. Úplný offline režim externích iframe nelze garantovat.


## Navazující etapa

- Devět skriptů bez funkčního těla odstraněno z disku i HTML; zachována ID kotva. Osm obsahovalo pouze komentáře/bílé znaky, devátý jen prázdnou podmínku `typeof loadStreetViewCustom`. Závislosti ověřeny prohledáním zdrojů; přesný seznam je v `removed-scripts.json`.
- JavaScript minifikován parserem Terser s `compress:false`, `mangle:false`: bez přejmenování a bez odstraňování funkcí. Výstupy zůstávají v samostatných scopech a pořadí.
- Místní zdroje CSS/JS: 136 → 78 požadavků. Přenášený obsah těchto zdrojů: přibližně 1,41 → 1,27 MB proti první etapě (bez HTTP komprese). Výkonové testy obsahují vlastní počty a přesné velikosti.
- CSS audit parserem PostCSS: žádné přesně totožné deklarace v rámci jednoho jednoduchého pravidla ani totožná pravidla ve stejném kontextu bez překročení at-rule hranice. Výsledek v `css-cleanup.json`. Různé override deklarace nejsou automaticky považovány za duplicity.
- Nová sada `tests/extended.cjs` porovnává rozbalené sekce a laboratorní výkon proti původnímu PR #1. Výsledky a snímky jsou v artefaktu GitHub Actions. Dokud tento běh není zelený, novou etapu nepovažovat za regresně ověřenou.

Velikost slučovaných CSS skupin je omezena na 64 kB (jednotlivé větší původní soubory se nedělí). Důvodem je měření prvního vykreslení; finální časové výsledky uvádí popis PR. Rozbalené sekce se měří až po dokončení jejich časovaného stavu `is-settled`.
