# Audit BALI 2027 – 3. 11. 2026

> Jednotlivé etapy níže jsou historický záznam. Aktuální stav shrnuje poslední oddíl; starší počty a omezení nejsou výsledkem nejnovějšího buildu.

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

### Oprava opakovaných pokusů o obrázky bankovek
Rozšířená kontrola odhalila původní smyčku `imgScan → vložení obrázku → error → odstranění → MutationObserver → imgScan`. Karta si nyní pamatuje neúspěšnou URL a obnoví pokus při události online. Test ověřuje nejvýše tři pokusy pro tři bankovky při nedostupnosti. Pro vizuální srovnání se použijí skutečné místní kopie těchto tří obrázků v obou verzích, aby síťová chyba původní verze nezpůsobovala náhodné rozměry.

Stejná ochrana byla rozšířena na fotografické náhledy s více kandidáty: po vyčerpání kandidátů se další pokus omezí na nejvýše jednou za minutu, při návratu připojení se ochrana resetuje. Přechod na náhradní kandidát už nezůstane blokovaný lazy loadingem po chybě. Regrese používá uložené tři neplatné kandidáty a ověřuje omezený počet požadavků.


## Kompatibilita a CSS – další kontrola

- CSS minifikace odstraněním samotného formátování a samostatných komentářů: výstupy CSS/JS celkem 1 151 030 bajtů (před touto etapou 1 269 382). Zdrojové CSS zůstalo beze změny.
- Nový strukturální test parseru porovnává selektory, deklarace, jejich hodnoty, podmínky a pořadí před/po buildu. Vlastní CSS proměnné mají ponechané významové bílé znaky.
- Nově 7 statických testů; prohlížečová regrese má běžet také ve Firefoxu a WebKitu. Mobilní WebKit má zapnuté isMobile/hasTouch.
- Přidán skutečný síťový smoke test Leaflet, Google Fonts, ECB/Frankfurter, Wikimedia a základních výpočtů při živém připojení. Odděleně testuje lokální funkčnost při úplném výpadku externích CDN.
- Výsledek těchto nových běhů je uveden v PR; do úspěšného běhu nejde o potvrzenou kompatibilitu.


## Přechod mezi verzemi a obnova map

- Regresní test nejprve selhal na `upgrade lost offline photo`: stará verze cache obsahovala i média a při aktivaci nové verze se ztratila. Nově je stabilní runtime cache oddělená od kódu/HTML; starý kód se nekopíruje.
- Migrace z předchozích verzí vlastního scope a ze způsobilých položek původní cache. Mazání následuje až po úspěšném kopírování. Testované zachování novějšího runtime záznamu, vynechání HTML/JS, zachování vnořeného scope a původní sdílené cache, zachování starých dat při chybě kvóty.
- Opraveno rozpoznání `tile.openstreetmap.org` bez subdomény; test 603 importovaných dlaždic potvrzuje limit 600.
- Skutečná výměna starého a nového service workeru v prohlížeči, následně reload bez sítě/serveru a čtení uložené fotografie, původní legacy fotografie a API odpovědi. Spouští se ve všech třech enginech.
- Načítání Leaflet musí počkat i na CSS. Jednotkové testy potvrzují souběžné volání, výpadek JS, výpadek CSS po úspěšném JS, opakovaný pokus bez druhého stahování JS a zotavení po timeoutu. Živý test při dostupné CDN ověřuje skutečné otevření mapy po předchozím výpadku, bez duplikovaných tagů.
- Aktuální výsledky těchto kontrol a případná omezení jsou uvedené v PR #2.

Druhý reprodukovaný problém: síťově načtené HTML nové verze přepisovalo offline fallback staršího kompletního buildu. Jednotkový test nejprve selhal na `a new HTML release replaced the complete installed shell`. Builder nyní vkládá marker verze; worker při instalaci kontroluje shodu HTML s verzí a při běžné navigaci neukládá cizí build přes kompletní fallback. Test potvrzuje zachování fallbacku i odmítnutí a úklid neodpovídající instalace bez smazání aktivní verze.


## Kontrola skutečně uloženého stavu a navazující oprava

Ověřeno přímo přes GitHub a `git ls-remote`: PR #1 zůstává na počátečním rozdělení `457040d`; navazující práce je v PR #2 a větvi `audit/bali-2027`. Při navázání odpovídal místní checkout vzdálenému commitu `d98298d06e06305f17bd17dde72aaac68e305777`, bez neuložených změn. `main` zůstává `07b74cbd02ae11282634624384de2bbe675d20f0`.

- Poslední známý úspěšný běh všech tří enginů před navázáním: commit `e35d353`, https://github.com/viper1971/bali-lombok/actions/runs/41615798760 .
- Následující běh `d98298d`: https://github.com/viper1971/bali-lombok/actions/runs/41620598633 . Firefox včetně skutečné výměny workeru prošel; WebKit skončil na `page.reload` čekajícím na `load` ještě před odpojením origin serveru. To není úspěšný finální běh nejnovější verze. Chromium následně úspěšně dokončil funkční i rozšířenou regresi, výměnu workeru a živý síťový test.
- Offline test nově čeká na DOM, spuštění `TRIP`, neprázdný rozpočet a všechny místní stylesheety. Nečeká na globální `load`, který může zadržet externí zdroj obsluhovaný workerem mimo Playwright routing. Stejná strategie DOM je v testu výměny workeru. Srovnání rozpočtu a čtení uložených médií/API zůstává povinné. Průběžný report výpočtů se ukládá i před offline částí.
- Další reprodukovaná chyba: `precache` zpráva tlačítka Uložit pro offline obcházela kontrolu verze zavedenou pro navigaci. Nový regresní test nejprve selhal (`precache accepted HTML from another release`); po opravě odmítá rozdílné HTML pro kořen i `index.html`, včetně parametrů, a ověřuje zachování obou offline fallbacků. Správná verze se stále ukládá a počítají se skutečně uložené položky.
- Lokálně: 7 statických kontrol, test service workeru a test obnovy Leaflet. Prohlížečové výsledky této opravy se ověřují v novém běhu GitHub Actions a shrnují přímo v PR #2. Lokální úspěch těchto kontrol není tvrzením o úspěchu prohlížečů.
- Aktuální manifest: 78 místních CSS/JS požadavků, 1 151 816 bajtů; proti původním 136 požadavkům a 1 408 845 bajtům jde o pokles 42,6 % požadavků a 18,2 % bajtů bez HTTP komprese. Starší časová měření v PR se vztahují k označenému dřívějšímu commitu; po opravě workeru nebyla vydávána za nová měření.

Stav a výsledky dalších běhů: https://github.com/viper1971/bali-lombok/pull/2 a https://github.com/viper1971/bali-lombok/actions . Fyzické telefony, všechny kombinace externích služeb a ruční kontrola každého pixelu nejsou automatickými testy pokryty.


### Vývojové závislosti

`npm audit` při navázání hlásil jednu zranitelnou přímou závislost `postcss@8.5.6`, se čtyřmi advisories včetně vysoké závažnosti. PostCSS je použitý při buildu a testu CSS, není načítaný do produkčního prohlížeče. Aktualizován na přesně připnuté `8.5.32` v `package.json` i lockfile. Odkazy z registru: https://github.com/advisories/GHSA-qx2v-qp2m-jg93 , https://github.com/advisories/GHSA-6g55-p6wh-862q , https://github.com/advisories/GHSA-fxqj-rqcc-2cmp , https://github.com/advisories/GHSA-r28c-9q8g-f849 . Po aktualizaci je povinné ověřit opakovatelnost buildu a sémantiku CSS; samotná instalace není důkazem kompatibility. CI nyní kontroluje také `npm audit --audit-level=high`.
