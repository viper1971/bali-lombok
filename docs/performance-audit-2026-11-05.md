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
