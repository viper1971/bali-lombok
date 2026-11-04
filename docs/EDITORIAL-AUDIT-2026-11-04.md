# Rozložení a struktura cestovatelského magazínu

Stav kontroly: 4. 11. 2026. Kontrola zdrojové struktury celé stránky, veřejného desktopového náhledu a cílených interakcí; nejde o potvrzení dostupnosti každého vzdáleného panoramatu Google.

## Co bylo ověřeno

- 27 hlavních sekcí, 745 jedinečných ID, 57 vložených Street View, 59 obrázků ve zdrojovém HTML.
- Před a po této úpravě zůstaly zachovány všechny texty, odkazy a ID. Zmizely pouze čtyři dekorativní šipky rozbalovacích návodů.
- Návody SG Arrival Card, e-VoA, Bali Tourist Levy a e-CD jsou nyní běžné sekce místo `details/summary`. Karty jsou pod sebou, na PC je uvnitř vedle stručného popisu kompletní návod. Na mobilu je vše v jednom sloupci. Oficiální portály i živé termínové štítky zůstaly.
- Pět odpovědí v části „Než poprvé ťukneš na bráně“ je rovnou viditelných. Výpočty Revolutu, doporučovací odkaz a podmínky nabídky zůstaly.
- Ve veřejném desktopovém náhledu bylo u WhatsAppu naměřeno písmo 0,356133 px a šířka tlačítka 23,36 px. Opakovaný přepočet 80% velikosti se potkával s `transition: all`. Přepočet nyní během měření vypíná přechody a vynechává boční ovladače. WhatsApp má vlastní stabilní velikost a popisek pro asistivní technologie. V nově zveřejněném desktopovém náhledu bylo ověřeno 14px písmo a tlačítko 339 × 46 px. Čtyři dokumentové návody byly viditelné bez dalších rozbalovacích prvků, pod sebou a bez vodorovného přetečení.
- Fotografie slideshow na široké obrazovce nově obtéká okolní redakční text. Na menších obrazovkách se použije původní mřížka / jeden sloupec. Iframy Google se nefragmentují do novinových sloupců ani se nepřesouvají mezi rodiči při scrollování.
- Správa Street View udržuje nejvýše šest blízkých panoramat. Vzdálená a skrytá se uvolňují, při návratu se vytváří nové iframe. Krátká simulace ověřila návrat scrollováním, znovuotevření, limit, chybové stavy a zrušení zastaralých callbacků. Při kontrole se ukázalo, že i uvnitř zavřených alternativ hotelů vracejí vnořené prvky nenulové rozměry. Načítání je proto nově výslovně vylučuje a sleduje změnu aktivní hotelové karty. Nejvýše dva souběžné požadavky brání tomu, aby jeden pomalý náhled blokoval všechny ostatní. Vzdálené vykreslení všech panoramat ani jejich stabilita na uživatelově PC nebyly potvrzeny; kontrolní cloudový prohlížeč při procházení Google náhledů přestal odpovídat a vyžadoval obnovení stránky.

## Doporučený další směr

| Priorita | Nález | Navržená změna | Přínos |
|---|---|---|---|
| 1 | 75 načítaných zdrojů CSS a 701 inline stylů v HTML; mnoho historických přepisů téhož prvku | Postupně převést jednotlivé komponenty na jeden zdroj stylů: navigace, ubytování, dokumenty, návštěvní místa, finance. Každou migraci porovnat s původním obsahem a funkcemi | Předvídatelné zobrazení; méně chyb při dalších úpravách |
| 1 | Globální zmenšení textů stále používá JS a měření DOM | Nahradit ho postupně explicitní typografickou škálou v CSS; zvlášť čtený text, titulky, čísla a ovládací prvky | Menší práce pro prohlížeč, stabilní velikosti, méně blikání |
| 1 | Obsah vložených Google iframe nelze z rodičovské stránky spolehlivě diagnostikovat | Zachovat omezený počet aktivních panoramat; ověřovat reprezentativní místa přímo v prohlížeči, zejména při návratu. `load` sám nepotvrzuje vykreslení scény | Oddělení chyby webu od neplatného panoramatu, sítě či grafiky |
| 2 | Více navigačních přehledů a opakované titulky zabírají místo | Sjednotit obsah do jedné navigace a u kapitol ponechat jeden silný nadpis; odstranit až po výslovném rozhodnutí, které opakované prvky sloučit | Klidnější čtení bez ztráty orientace |
| 2 | Dlouhé články kombinují informační text a ovládání | Pro každou etapu zavést stejnou osnovu: charakter místa, praktické poznámky, ubytování, tipy k návštěvě, doprava a ceny | Čtenář předem ví, kde co najde |
| 2 | Některé původní doprovodné fotografie jsou celé informační tabulky v obrázku | Zachovat původní obrázek a doplnit přepis technických údajů do HTML, až budou údaje ověřené | Čitelnější motorky a nabídky na mobilu, vyhledatelnost |
| 3 | Fotografické prvky závisí na více vzdálených poskytovatelích | Připravit přehled licence, autora a náhradního textu u každého redakčního snímku. Fotografie z uživatelova serveru dál používat jen v původních určených místech | Konzistentní autorské údaje a srozumitelný stav při výpadku |
| 3 | Tisk hlavní interaktivní stránky se liší od čtení v prohlížeči | Zachovat samostatný deník pro A4, který bere obsah a částky ze stejného datového zdroje jako magazín | Jedna sada informací, dva vhodné způsoby použití |

## Zásady pro další rozvoj

- Šetřit místem přeskládáním obsahu, nikoliv zmenšením textu pod čitelnou velikost.
- Používat obtékání u fotografií; u interaktivních map stabilní obdélníkové kontejnery a responzivní mřížky.
- Nenechat celostránkové změny typografie, observerů nebo resize událostí restartovat zdravé mapy.
- Datum letů, ceny, názvy hotelů, varianty, výpočty a oficiální odkazy zachovat při změnách rozložení.
- Vizuální kontrola širokého desktopu nenahrazuje kontrolu fyzického telefonu. Změny mobilních pravidel jsou zde ověřeny zdrojově; dostupnost Google na uživatelově zařízení nelze touto kontrolou garantovat.
