# Audit výkonu BALI 2027 — 2026-11-05

## Provedené změny
- Záloha výchozího stavu: větev `backup-before-performance-2026-11-05`.
- Zdrojové a publikované HTML: absolutní odkazy na vlastní obrazové soubory `viper1971.github.io/bali-lombok/` převedeny na relativní cesty.
- Do HTML obrázků pod začátkem dokumentu přidáno nativní `loading="lazy" decoding="async"`.
- Zrušena automatická registrace service workeru (`assets/js/041.js` a publikovaný JS).
- Z menu odstraněna akce „Uložit pro offline“ (`assets/js/049.js` a publikovaný JS).
- HTML odregistruje service worker daného scope a odstraní aplikační cache s prefixem `bali2027-`.

## Ověřené nálezy
- Build manifest obsahuje 140 zdrojových souborů: 61 JS a 79 CSS.
- V `src/index.html` je stále 7 výskytů `images.unsplash.com` a 4 výskyty `images.pexels.com` (výskyty nejsou nutně unikátní obrázky).
- Další odkazy mohou být v CSS a JS; bez úplného seznamu a binárních kopií nejde tvrdit, že jsou všechny externí obrázky migrovány.
- V hlavičce je mnoho samostatných synchronních skriptů, což může blokovat parsování HTML.
- Externí Google Maps a Street View jsou záměrně ponechány jako externí interaktivní služby.

## Další opatření podle priority
1. Inventarizovat všechny CSS `url(...)`, JS adresy a HTML `src/srcset/poster`. Každou fotografii ověřit z hlediska licence; vhodné obrázky stáhnout a uložit pod `assets/images/`, názvy i původ zaznamenat.
2. Obrázky převést na WebP/AVIF s rozměry odpovídajícími zobrazení; vytvořit menší varianty pro mobil pomocí `srcset` a `sizes`.
3. Prohlížečově ověřit, které JS skripty lze odložit přes `defer`, spojit nebo spouštět až po interakci. Nenarušit sdílené globální funkce a pořadí skriptů.
4. Omezit počáteční načítání iframe map: až na zobrazení či interakci, pouze tam, kde je to slučitelné s chováním UI.
5. Upravit a spustit deterministický build `tools/build.py`; přegenerovat build artefakty a manifest hashů. Změny publikovaných JS byly nyní aplikovány přímo kvůli okamžitému znefunkčnění offline funkce.
6. Provést regresní testy `npm test` a `npm run test:browser`, ověřit desktop i mobil a měřit LCP/INP/CLS a síťové přenosy při studeném načtení.

## Omezení dosavadní kontroly
- Zatím nebyly staženy ani nahrány binární fotografie z Unsplash/Pexels či jiných externích serverů.
- Nebyly spuštěny lokální build, automatizované browser testy ani produkční Lighthouse měření.
- Předchozí obrázky dostupné přímo na GitHub Pages nyní používají relativní cesty, neznamená to automaticky optimalizaci jejich velikosti.

## Nález při pokračování – kritická divergence produkce a manifestu
- Publikovaný `index.html` obsahuje 61 JavaScriptových odkazů; 5 z nich míří na ručně udržované produkční soubory `assets/build/js-1650a0000000000*.js`, zatímco `assets/build-manifest.json` eviduje odlišné hashe.
- Prosté spuštění `tools/build.py` by mohlo tyto produkční výjimky přepsat a ztratit funkční opravy. Migrace obrázků proto do vyřešení rozporu nemá automaticky rebuildovat web.
- V produkčním JavaScriptu pro položky 041 a 049 odstraněna aktivní registrace offline workeru a tlačítko offline; předchozí úprava samotného manifestového výstupu nestačila.
- Produkční manifest eviduje 88 výstupních souborů (61 JS + 27 CSS), dohromady přibližně 1,28 MB bez přenosové komprese; samotné CSS tvoří přibližně 771 kB. To jsou velikosti souborů, nikoli naměřená síťová data.
- Upravený nástroj `tools/vendor_images.py` prochází také opravdu nasazené `index.html` a `assets/build`, aniž by při migraci měnil strukturu skriptů; změněným assetům v publikované HTML přidá verzi kvůli cache.

## Stav po úspěšné migraci fotografií
- GitHub Actions dokončil převod **19 fotografických souborů** do `assets/images/external/*.webp` (18 Unsplash/Pexels + 1 Wikimedia Commons).
- Kontrolní report `docs/external-image-migration.json` uvádí **0 chyb stahování**; ověřena existence nového Wikimedia WebP souboru a jeho lokální URL v produkčním i zdrojovém skriptu `047.js`.
- Wikimedia fotografie Gili Meno: Enrico Strocchi, CC BY-SA 2.0; atributy a informace o zmenšení jsou v `docs/image-credits.md`.
- Zbylé položky automatického inventáře tvoří **OpenStreetMap mapové dlaždice** (nutně externí pro živou mapu) a **doména Wikimedia v preconnect odkazu**, nikoli další pevná URL fotografie.
- `index.html` nyní neobsahuje externí Unsplash/Pexels URL.
- HTML má 63 skriptových a 30 CSS odkazů včetně externích služeb, 26 iframe map se `loading="lazy"`, 60 obrázkových tagů (59 lazy a 1 prioritní titulní obrázek). Jde o statickou inspekci, nikoliv browser trace.
- Dodán `tools/check_migrated_images.py`; CI kontrola má při další migraci zabránit zmizení lokálních souborů a návratu externích URL do kódu.
- Reálnou produkční rychlost ani funkčnost na fyzickém telefonu zatím nebylo možné změřit; další optimalizace vyžaduje Lighthouse/Playwright regresi a analýzu síťového waterfallu.

## Další optimalizace prvotního zobrazení
- Oba HTML vstupy přednačítají konkrétní lokální WebP titulní fotografie pomocí `<link rel="preload" as="image" ... fetchpriority="high">`; samotné HTML `img` má `loading="eager"`, `fetchpriority="high"`.
- Obrázek pro náhled při sdílení (`og:image`) má absolutní HTTPS URL na vlastní GitHub Pages, nikoli odkaz na cizí server.
- Odstraněno 6 spekulativních spojení v hlavičce pro Google Maps, Wikimedia a unpkg; živé mapy zůstávají funkčně beze změny, pouze spojení se neotevírají předem při prvním renderu.
- Přidán nezávislý skript `tools/audit_production_resources.py` pro kontrolu lokálních cest a stavu načítání a workflow `.github/workflows/production-audit.yml`, který se spustí při změnách publikovaného HTML a dalších assetů.
- Workflow neprovádí automatickou rekonstrukci stránky ani mazání kódu. Případné selhání kontroly musí být ověřeno ve výstupu GitHub Actions.

## Responzivní titulní fotografie – další dokončená optimalizace
- Automatizace vytvořila a publikovala 3 lokální WebP varianty původní 542 426 B fotografie: **640 px / 113 992 B**, **960 px / 239 574 B**, **1280 px / 388 162 B**.
- `index.html` a `src/index.html` používají `srcset`, `sizes="100vw"`, prioritní `fetchpriority="high"` i propojený responzivní preload. Původní fotografie zůstává jako fallback.
- Pro volbu 640 px varianta zmenšuje přenos tohoto jednoho obrázku přibližně o **79 %** proti původnímu souboru; konkrétní volbu prohlížeče určují viewport a DPR.
- Komplet výstupů a jejich velikosti jsou v `docs/responsive-cover.json`. GitHub commit vznikl automaticky: `68b1006c6ff5e957e7c0aff3f87ffb84054f15f8`.
- Produkční kontrola `tools/audit_production_resources.py` nyní ověřuje i zdroje `srcset` a `imagesrcset`; chybějící místní soubor způsobí selhání testu.
- **Stále nelze prokázat zkrácení času načtení celé stránky** bez měření Core Web Vitals v reálném prohlížeči; snížení velikosti jednoho souboru není totéž jako zrychlení celé stránky.

## Automatizované browser měření (nově přidané)
- `tests/performance.cjs`: studený start stránky v Chromiu, viewport 390×844 a 1440×1000, bez service workeru, s blokovanými externími službami.
- Zaznamenává FCP, kandidáta LCP, CLS, dlouhé úlohy main threadu, velikost přenosů podle `Content-Length`, síťové chyby lokálních souborů a skutečně vybranou variantu titulní fotografie.
- `.github/workflows/browser-performance.yml` spouští test přes GitHub Actions a při úspěchu ukládá `docs/performance-metrics.json`; podrobná data archivuje také jako artifact.
- Test je záměrně syntetický: nelze jej zaměňovat za měření reálných návštěvníků (RUM), produkční Lighthouse skóre nebo srovnání rychlosti před a po změnách.
- Při poslední kontrole dosud nebyl v repozitáři výsledný `docs/performance-metrics.json` ověřen, proto nezveřejňujeme nezjištěné časy.

## Optimalizace galerií a jejich časovačů – 5. 11. 2026
- Odstraněna plošná postupná příprava všech galerií z `assets/js/047.js` a skutečně používaného `assets/build/js-2a84e1c14c764d64.js`, která se automaticky spouštěla po `window.load`.
- Přípravu fotografií nyní vyvolává původní `IntersectionObserver` při viditelnosti galerie a původní `pointerenter/touchstart/focus` při interakci s příslušným tlačítkem.
- Pouze první fotografie nově vykreslené galerie má atribut `loading=eager`; ostatní jsou `lazy` a dosavadní slideshow přepínáním aktivuje dvě následující.
- Slideshow intervaly se nyní vypínají, jakmile galerie opustí viewport, když návštěvník pozastaví přehrávání a při přepnutí na kartu prohlížeče na pozadí. Při návratu se obnoví.
- Publikovaný `index.html` používá cache-busting verzi `visible-gallery-timers-20261105`.
- `tests/gallery-lazy.cjs` ověřuje zachování interakčních událostí, vypnutí background prefetch a viditelnostních časovačů; syntaxi zdrojového i publikovaného JS jsem ověřil. Reálné browser regresní testy dosud nebyly ověřeny.
- Přínos: méně zbytečných síťových požadavků a menší běžná zátěž CPU. Přesný počet ušetřených požadavků závisí na počtu otevřených galerií a výsledek nelze číselně tvrdit bez browser síťové stopy.

## Lokální dynamické galerie – hotový katalog (5. 11. 2026)
- Původní galerie `assets/js/047.js` obsahují 7 skupin × 10 témat. Inventura: `docs/dynamic-gallery-inventory.json`.
- Pro **69 témat** nyní existuje lokální licencovaná fotografie uložená v `assets/images/gallery/` ve WebP a přiřazená v `assets/data/gallery-catalog.js`; 19 předchozích statických fotografií zůstává samostatně v `assets/images/external/`.
- Pro poslední téma **Tibumana waterfall** nebyla nalezena ověřená vhodně licencovaná fotografie. Skript jej označuje `BALI_GALLERY_MISSING` a nezahajuje externí požadavek. Fotografie tedy nebude v galerii zobrazena; text itineráře zůstává zachován. Není použit nesouvisející či nelicencovaný snímek.
- Katalog se načítá **před** skriptem galerií v obou verzích HTML. Pokud je lokální fotka dostupná, `candidates(query)` vůbec nevolá Wikimedia Commons API. Původní API zůstává jako záloha pro nová, dosud nezaregistrovaná témata.
- Atribuce fotografií, konkrétní licence a informace o převodu do WebP jsou uložené v `docs/gallery-photo-credits.md`; kontrola `tests/gallery-local.cjs` validuje cesty a licence.
- Přesný počet místních fotografií z obou etap je **19 + 69 = 88 souborů**; nevypovídá to o vizuální kvalitě či tematické přesnosti každého snímku. Tu je vhodné zkontrolovat ručně před cestou.
- Závěrečné měření Core Web Vitals na veřejném webu stále nebylo potvrzeno; úbytek externích požadavků je technicky ověřen ve zdrojovém kódu, nikoliv vyčíslen měřením.

## Ověřená syntetická měření prohlížeče – 5. 11. 2026, 16:33 UTC

Přístup k souboru `docs/performance-metrics.json` potvrdil následující výsledky po opravě testovací cesty `/bali-lombok/` a odložení Wikimedia dotazů z `assets/js/049.js`:

| Metrika | Mobil 390×844 | PC 1440×1000 |
| --- | ---: | ---: |
| První vykreslení (FCP) | 184 ms | 320 ms |
| Kandidát LCP | 1 100 ms | 320 ms |
| DOMContentLoaded | 1 214 ms | 1 129 ms |
| CLS | 1,0162 | 1,5692 |
| Wikimedia API dotazy při úvodu | **0** | **0** |
| Lokální HTTP 404 | **0** | **0** |
| Pokusy o třetí strany (zablokované) | 40 | 57 |

Předchozí syntetické měření evidovalo **19 Wikimedia API požadavků na mobilu i PC**. Po odložení iniciace požadavků nyní benchmark ukazuje **0**, bez změny základního ovládání sekcí. Rozdíl není produkční měření návštěvnického síťového času.

### Kritické nálezy z layout-shift observeru
- Největší položka CLS = **1,0** na obou rozlišeních; přechod zahrnuje `.mg-cover`, `.hero-meeting` a hlavní lištu, které při inicializaci mění geometrii.
- PC přidává přibližně **0,5658** další posun zahrnující `#magazineStory` a navigaci. Příčinou může být přesunutí titulní strany do dialogu při inicializaci magazínu v `assets/js/068-magazine-layout.js`. Zatím je to **hypotéza podpořená pozorovanými uzly**, nikoliv potvrzený výsledek izolovaného A/B testu.
- Zbývající třetí strany jsou zejména Google Maps iframe, fonty a TOPlist. Jsou důležité pro obsah / měření, nesmí se bez testů mechanicky odstranit.

Syntetický test blokuje externí služby, používá místní HTTP server bez běžné produkční přenosové komprese, a ve výpisu zaznamenává i požadavky, které by reálný prohlížeč mohl vyhodnotit jinak. Nevyhodnocovat výsledky jako PageSpeed skóre ani procentuální změnu rychlosti veřejného webu.
