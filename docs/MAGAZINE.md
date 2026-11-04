# Časopisový vzhled a návrat

Výchozí vzhled od této verze je cestovatelský magazín. Nahoře je přepínač
**Původní vzhled / Časopisový vzhled**. Volba se ukládá pouze pod klíčem
`bali_magazine_appearance_v1`; výběry hotelů, letů, jídla, aktivit a hotovosti
se nemění. Nové styly původních částí jsou omezené na `html[data-magazine="on"]`.
Pergamenový deník zůstává samostatným zjednodušeným zobrazením.

Původní vzhled lze otevřít také parametrem `?vzhled=puvodni`, časopisový
parametrem `?vzhled=casopis`. Parametr platí pro otevřený odkaz. Přepínač pak
odstraní pouze tento parametr, ostatní parametry a kotvu odkazu zachová.

## Úplná obnova předchozího vydání

- Poslední vydání před časopisovým vzhledem: `1ec0e9da7f62663417bf72fe8c485debf7a617b8`.
- Záložní větev: `backup/pred-casopisem-2026-11-04`.
- https://github.com/viper1971/bali-lombok/tree/backup/pred-casopisem-2026-11-04

Pro úplné vrácení nasazení obnovit soubory z této větve v novém commitu
(nepřepisovat historii `main`). Vrátit zdroje i generované HTML, manifest a worker
společně. Pouhý přepínač vzhledu žádné nasazení ani změnu kódu nepotřebuje.

## Fotografie

Lokální WebP kopie pro titulní stránku a úvodní kapitoly:

- Bali, Nusa Penida: https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8
- Singapur, Marina Bay: https://images.unsplash.com/photo-1525625293386-3f8f99389edd
- Balijský chrám: https://images.unsplash.com/photo-1537996194471-e657df975ab4
- Lombok, Starsand Resort v Sekotongu: dosavadní projektový soubor `4a.jpg`.

Fotografie jsou ilustrační. Titulní fotografie neznamená přidání Nusa Penida
do itineráře. Skutečné časy, hotely, rozpočet a program mají původní datové zdroje.
