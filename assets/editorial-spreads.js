/* BALI 2027 · non-destructive hotel editorial spreads.
   Moves existing DOM nodes (never clones): original listeners, prices, selected
   hotel state, links, map embeds and Street View controls all stay attached. */
(function () {
  "use strict";
  var regionalNotes = {
    singapore: [
      "Singapur je první městskou zastávkou před odletem na Bali. Při výběru ubytování se vyplatí sledovat hlavně polohu vůči stanici MRT: podle ní poznáme, jak pohodlné budou večerní návraty i přesuny s batohem.",
      "Na programu jsou procházky městem, místní jídlo a zátoka Marina Bay. Z hotelových údajů nahoře zkontroluj čas příjezdu a odjezdu, případně zda je zahrnutá snídaně."
    ],
    uluwatu: [
      "Poloostrov Bukit na jihu Bali je výchozím bodem pro výlety k útesům, plážím Padang Padang a Suluban i k chrámu Uluwatu. Pro plánování dne je důležité počítat s přesuny mezi jednotlivými místy, nikoli jen se vzdušnou vzdáleností.",
      "Tato etapa navazuje na přílet do Denpasaru a převzetí skútrů. Při výběru pokoje proto porovnej nejen cenu a vybavení, ale také polohu vzhledem k plánovanému dennímu programu."
    ],
    ubud: [
      "Ubud slouží jako základna pro cesty do vnitrozemí Bali: k rýžovým terasám, vodopádům, chrámům a Opičímu pralesu. Na delší výlety je praktické vyrážet s časovou rezervou, protože vzdálenosti samy o sobě nevystihují délku přejezdu.",
      "U jednotlivých variant ubytování zvaž, zda ti více vyhovuje kontakt s centrem Ubudu, nebo klidnější zázemí mimo nejrušnější místa. Konkrétní vybavení a podmínky jsou uvedené v informacích o hotelu."
    ],
    lombokNorth: [
      "Severní Lombok je v itineráři odlišnou etapou od jihu ostrova. Při plánování pobytu je podstatné, jak bude hotel navazovat na příjezd na Lombok a na další přesun; cesta mezi jednotlivými oblastmi může tvořit významnou část dne.",
      "V této části cesty stojí za to porovnat polohu hotelu, možnosti okolních výletů a tempo, které skupině vyhovuje. Podrobnosti o konkrétním pokoji a rezervaci zůstávají v kartě nahoře."
    ],
    lombokSouth: [
      "Jižní Lombok nabízí odlišný charakter pobytu než sever ostrova. Do programu patří pobřeží, pláže a výlety na skútrech; při výběru základny proto hraje roli vzdálenost k jednotlivým zastávkám.",
      "Pokud chceš během dne projet více pláží, nech v programu prostor na zastávky a návrat. Informace o ceně, snídani a vybavení se řídí konkrétní zvolenou variantou hotelu."
    ],
    kutaLast: [
      "Poslední noc na Bali je především praktickou zastávkou před navazujícím letem. Vedle ceny pokoje je důležitá dostupnost letiště, čas odjezdu a to, zda se ubytování platí předem, nebo až na místě.",
      "Tuto noc je vhodné posuzovat jinak než delší pobytové etapy: přednost má jednoduchá logistika, sbalená zavazadla a dostatečná časová rezerva před odletem."
    ]
  };
  function enrichHotel(card) {
    var panel = card.querySelector(".bali-ed-hotel-spread > .uber-info-panel");
    if (!panel || panel.querySelector(".bali-ed-hotel-notes")) return;
    var identity = (card.id || "").replace(/^card-/, "").replace(/-[A-Z]$/, "");
    var notes = regionalNotes[identity];
    if (!notes) return;
    var out = document.createElement("aside");
    out.className = "bali-ed-hotel-notes";
    out.setAttribute("aria-label","Cestopisné informace o oblasti hotelu");
    var title = document.createElement("h4");
    title.textContent = "O hotelu, okolí a plánování pobytu";
    out.appendChild(title);
    notes.forEach(function (paragraph) {
      var p = document.createElement("p");
      p.textContent = paragraph;
      out.appendChild(p);
    });
    panel.appendChild(out);
  }
  function setup() {
    var root = document.getElementById("hlavni-obsah");
    if (!root) return;
    if (!window.matchMedia("(min-width: 1100px)").matches) {
      root.querySelectorAll(".bali-ed-hotel-spread").forEach(function (spread) {
        var parent = spread.parentNode;
        while (spread.firstChild) parent.insertBefore(spread.firstChild,spread);
        spread.remove();
      });
      return;
    }
    root.querySelectorAll(".uber-hotel-card").forEach(function (card, i) {
      if (card.querySelector(":scope > .bali-ed-hotel-spread")) { enrichHotel(card); return; }
      var media = card.querySelector(":scope > .uber-media-grid");
      var info = card.querySelector(":scope > .uber-info-panel");
      if (!media || !info) return;
      // Only pair the already-adjacent nodes. Unknown layouts are left untouched.
      if (media.nextElementSibling !== info) return;
      var spread = document.createElement("div");
      spread.className = "bali-ed-hotel-spread";
      if (i % 2) spread.classList.add("bali-ed-right");
      media.parentNode.insertBefore(spread, media);
      spread.appendChild(media);
      spread.appendChild(info);
      enrichHotel(card);
    });
    var pads = root.querySelectorAll(".lux-fold-pad:has(> .ph-strip)");
    pads.forEach(function (pad, i) {
      // Alternation uses stable chapter order instead of changeable photo order.
      pad.classList.toggle("bali-ed-right",i % 2 === 1);
    });
  }
  function boot() {
    setup();
    // Cards can be re-rendered after a hotel choice; catch those insertions.
    var root = document.getElementById("hlavni-obsah");
    if (!root || !window.MutationObserver) return;
    var queued = false;
    var observer = new MutationObserver(function (changes) {
      var relevant = changes.some(function (m) {
        return Array.prototype.some.call(m.addedNodes, function (node) {
          return node.nodeType === 1 &&
            (node.matches(".uber-hotel-card,.ph-strip") ||
             (node.querySelector && node.querySelector(".uber-hotel-card,.ph-strip")));
        });
      });
      if (!relevant || queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; setup(); });
    });
    observer.observe(root,{childList:true,subtree:true});
    // Restore the original DOM nesting if a desktop is resized to tablet/mobile.
    var mediaQuery = window.matchMedia("(min-width: 1100px)");
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change",setup);
    else if (mediaQuery.addListener) mediaQuery.addListener(setup);
    // Photo strips are inserted late by the existing photo loader.
    window.addEventListener("load",setup,{once:true});
    setTimeout(setup,1600);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();


/* Editorial destination notes — enriches the existing itinerary cards only.
   Original spot descriptions, navigation, maps and event listeners remain intact. */
(function () {
  "use strict";
  var guides = [
    [/happy sunset|batujaran/i,["Tady má smysl dorazit ještě za denního světla. Travnatý okraj útesu otevírá široký pohled k Indickému oceánu; večer se mění barvy vody i skal a stejná vyhlídka působí každou chvíli jinak.","Nejde o klasickou plážovou zastávku, ale o klidnou příležitost začít cestu po Bukitu mimo rušné pobřežní podniky. Před západem se dá fotografovat krajina a po setmění už je rozumné vracet se po známé přístupové cestě.","Počítej s nerovným terénem, větrem a nezajištěnými okraji. Pro fotografie zvol bezpečné místo dále od hrany útesu."]],
    [/suluban|blue point/i,["Suluban je jedno z nejpůsobivějších míst poloostrova Bukit: mezi vápencovými stěnami se sestupuje do skalního průchodu, kde se podle přílivu odhaluje písek, tůňky a výhled na oceán.","Návštěva stojí za to i bez koupání. Z horních teras je vidět surfařská oblast, dole naopak vynikne monumentální měřítko skal. Právě kontrast stínu v jeskyni a jasného moře je zdejší hlavní zážitek.","Přístup a velikost pláže závisí na přílivu; schody a kameny mohou klouzat. Do silných vln ani k útesům nevstupovat."]],
    [/karang boma/i,["Karang Boma nabízí dramatické panorama strmého pobřeží, kde se zelená horní hrana útesu náhle láme nad oceánem. Nejlépe vynikne při širších krajinných fotografiích, ne pouze při snímku osoby na vyhlídce.","Místo je vhodné zařadit do okruhu po Uluwatu společně s dalšími vyhlídkami. Dej si čas sledovat proměnlivou barvu moře a výšku vln; daleký horizont je výraznou součástí zdejšího výhledu.","Na odkrytém vrcholu bývá vítr a u okrajů není bezpečné zábradlí. Drž se v dostatečné vzdálenosti od srázu."]],
    [/tanah barak|melasti/i,["Příjezdová silnice mezi vysokými vápencovými stěnami patří k nejfotogeničtějším cestám na jižním Bali. Samotný průjezd je zážitek: skalní průřez se postupně otevírá směrem k moři a světlému pobřeží.","Na Melasti lze spojit panoramatické zastávky s chvílí na pláži. Rozdíl mezi suchou krajinou nahoře a tyrkysovou vodou dole dává tomuto místu typický charakter Bukitu.","Při fotografování silnice neblokuj provoz. Na pláži respektuj vlajky, proudy a aktuální podmínky koupání."]],
    [/uluwatu.*chrám|pura luhur uluwatu|kecak/i,["Chrám Pura Luhur Uluwatu stojí vysoko nad mořem a patří k nejznámějším duchovním místům Bali. Přístupové cesty vedou podél útesů a nabízejí pohled na otevřený Indický oceán.","Večer je atmosféra ještě výraznější díky tradičnímu představení Kecak, při kterém rytmus vytváří sbor hlasů. Chrám a vystoupení je lepší vnímat jako kulturní zastávku, nikoli jen jako rychlý fotospot.","Při vstupu dodržuj pravidla oblékání. Dávej pozor na opice, především na brýle, telefony a volné předměty."]],
    [/padang padang/i,["Padang Padang je ukrytá písečná zátoka, ke které se sestupuje mezi skalami. Na malém prostoru se tu střídá světlý písek, vápencové útvary a tropické pobřeží.","Právě menší rozměry pláže vytvářejí osobitý charakter, ale také znamenají, že v nejnavštěvovanějších hodinách může být rušno. Hodí se pro krátkou zastávku během okruhu po jižních plážích.","Vstupní podmínky a možnost koupání se mohou měnit s počasím, vlnami a přílivem."]],
    [/monkey forest|opičí prales/i,["Sacred Monkey Forest v Ubudu není pouze setkání s opicemi: cesty vedou zeleným lesem mezi starými stromy, kamennými sochami a chrámovou architekturou. Celý areál působí jako spojení přírody s balijskou tradicí.","Při procházce je zajímavé sledovat detaily reliéfů, kořenů a mostků. Vyplatí se zpomalit a nenechat se soustředit jen na fotografování zvířat.","Opice jsou divoké. Neukazuj jim jídlo, nesahej na ně a chraň brýle, láhve i telefon."]],
    [/královský palác|centrum ubudu|ubud palace/i,["Centrum Ubudu nabízí jinou tvář Bali než pobřežní letoviska: tradiční architekturu, nádvoří, obchody s řemeslnými výrobky a místní gastronomii. Královský palác je přirozeným orientačním bodem pro procházku.","Dopřej si čas všimnout si zdobení bran, kamenných reliéfů a drobných obětin před domy. Mezi jednotlivými zastávkami se hodí zařadit posezení v místní kavárně nebo warungu.","V centru bývá hustý provoz. Na kratší úseky se zpravidla vyplatí chodit pěšky a hlídat si osobní věci."]],
    [/kanto lampo/i,["Kanto Lampo je známé vodou, která stéká po široce členěných tmavých skalních stupních. Na rozdíl od vysokého úzkého vodopádu zde vzniká téměř přírodní kamenná kaskáda.","Nejzajímavější pohled se nabízí zespodu, kde dobře vynikne textura skály a proudění vody. Světlo pod korunami stromů vytváří výrazné kontrasty pro fotografie.","Mokré kameny kloužou, proud může po dešti zesílit a přístup k vodě nemusí být vždy bezpečný."]],
    [/tirta empul/i,["Tirta Empul je významné balijské chrámové místo spojené s posvátnými prameny a očistnými rituály. Návštěva umožňuje pozorovat živou tradici, která je pro místní obyvatele důležitou součástí náboženského života.","Vedle vodních nádrží stojí za pozornost architektura nádvoří a detaily chrámových bran. K fotografování přistupuj ohleduplně, zejména pokud se lidé účastní obřadů.","Dodržuj místní pravidla pro vstup, oděv a případné zapojení do očistného rituálu."]],
    [/glass bridge|skleněný most/i,["Skleněný most přináší úplně jiný typ výhledu než vodopády a chrámy: pohled do krajiny se zde otevírá i přímo pod nohama. Prosklená konstrukce vytváří neobvyklou perspektivu okolního údolí.","Jde o zážitkovou zastávku, při které je vhodné dát prostor jak samotné vyhlídce, tak fotografování mostu z odstupu. Dobře doplňuje celodenní výlet v okolí Ubudu.","Před vstupem se řiď aktuálními pokyny provozovatele, omezeními a počasím."]],
    [/tegalalang|tegallalang/i,["Rýžové terasy severně od Ubudu ukazují charakteristickou kulturní krajinu Bali. Stupňovitá pole kopírují svah, mezi nimi vedou úzké pěšiny a proměnlivé světlo zdůrazňuje zelené kontury jednotlivých pater.","Návštěva není jen o ikonické fotografii. Stojí za to pozorovat zavlažování, práci na polích a způsob, jakým se zde po generace přizpůsobuje zemědělství terénu.","Na terasách používej vyznačené cesty a respektuj soukromé pozemky. Po dešti bývá půda kluzká."]],
    [/bali pulina|kávová plantáž/i,["Zastávka na kávové plantáži přidává do itineráře vůni pražených zrn a poznání místního pěstování. Může nabídnout pohled na tropické rostliny i různé způsoby přípravy kávy a čaje.","Při ochutnávce má smysl porovnávat jednotlivé nápoje a zjistit, odkud suroviny pocházejí. Pokud se nabízí kopi luwak, je vhodné zajímat se také o původ produktu a dobré životní podmínky zvířat.","Ochutnávky a případné nákupy jsou dobrovolné; cenu a podmínky si ověř předem."]],
    [/alas harum/i,["Alas Harum spojuje krajinu rýžových teras s upravenými vyhlídkami a zážitkovými atrakcemi. Na rozdíl od klidných zemědělských cest jde o živější místo zaměřené na panoramata a fotografie.","Může se hodit jako kontrast k přirozenějším terasám Tegalalang. Vyber si, zda tě láká výhled, krátká procházka, nebo některá z nabízených atrakcí; není nutné absolvovat vše.","U houpaček a dalších aktivit respektuj pravidla obsluhy a případné bezpečnostní omezení."]],
    [/gili meno|nest|podvodní sochy/i,["Gili Meno je známé klidnější atmosférou a podmořskou instalací soch NEST. Pod hladinou vzniká neobvyklé spojení umění a mořského života, které patří k nejzajímavějším zastávkám kolem ostrovů Gili.","Při šnorchlování si nech čas i na pozorování ryb a korálových struktur v okolí. Viditelnost a zážitek závisí na počasí, stavu moře a vytížení lokality.","Nedotýkej se korálů ani soch, nestoupej na mořské dno a používej vybavení vhodné pro svou plaveckou úroveň."]],
    [/sendang gile/i,["Sendang Gile leží v zelené oblasti pod sopkou Rinjani a patří mezi známé vodopády severního Lomboku. Voda padá ze skalního stupně do lesního prostředí a vytváří příjemný kontrast k horkému pobřeží.","Cesta k vodopádu je součástí zážitku: schody a vegetace postupně přivedou návštěvníky do chladnějšího, vlhčího prostředí. V okolí Senaru lze výlet spojit s poznáním místní horské krajiny.","Po dešti mohou být schody a kameny kluzké. K proudící vodě se přibližuj jen tam, kde je to bezpečné."]],
    [/senaru/i,["Senaru je horská vesnice na severní straně Rinjani, kde se krajina i tempo života výrazně liší od pobřeží. Tradiční domy a výhledy do zelených svahů ukazují každodennost místních komunit.","Tato zastávka dobře doplňuje návštěvu vodopádů: není zaměřena na jednu atrakci, ale na poznání prostředí, architektury a příběhů místa.","Při návštěvě obytných částí respektuj soukromí místních a před fotografováním lidí požádej o svolení."]],
    [/pusuk/i,["Cesta přes Pusuk vede kopcovitou zelenou krajinou severního Lomboku. Výhledy na svahy a lesní úseky jsou příjemnou změnou po pobytu na pláži a ukazují méně turistickou tvář ostrova.","V oblasti se mohou pohybovat opice, které jsou zvyklé na přítomnost lidí. Zastav se pouze tam, kde je bezpečné parkovat, a nech si prostor na pozorování krajiny.","Divoká zvířata nekrm a při silničních zastávkách dávej pozor na provoz."]],
    [/malimbu|nipah/i,["Vyhlídky na pobřeží Malimbu otevírají pohled na členité západní pobřeží Lomboku a moře směrem k ostrovům Gili. Zatáčky pobřežní silnice vytvářejí několik různých úhlů na zátoky a svahy.","Za dobré viditelnosti vynikne členitost pobřeží i vzdálené ostrovy. Zastávku lze pojmout klidně: krátká procházka, fotografie a pohled na západní část Lomboku.","Parkuj jen na bezpečném místě a počítej s větrem na otevřených vyhlídkách."]],
    [/batu bolong/i,["Pura Batu Bolong je pobřežní chrám, jehož okolí spojuje náboženskou architekturu s výhledem na moře. Menší měřítko areálu umožňuje vnímat detaily prostředí a klidnější atmosféru.","Zajímavý je kontrast mezi chrámovými zdmi, skalnatým pobřežím a horizontem. Vhodná zastávka při cestě podél západního pobřeží Lomboku.","Chrám je živým náboženským místem. Respektuj pravidla vstupu a průběh případných obřadů."]],
    [/pink beach|růžová pláž/i,["Pink Beach na východním Lomboku je vyhledávaná kvůli jemně narůžovělému odstínu písku, který vzniká smíšením světlého písku s drobnými úlomky červeně zbarvených mořských organismů.","Barva se na fotografiích mění podle světla a vlhkosti, takže na místě může působit subtilněji než na reklamních snímcích. Hlavní zážitek tvoří klidné pobřeží, průzračná voda a okolní suché kopce.","Při koupání zohledni proudy a podmínky na moři; nic z pláže ani podmořského prostředí neodnášej."]],
    [/tanjung ringgit/i,["Tanjung Ringgit tvoří dramatické pobřežní útesy na východě Lomboku. Krajina zde působí otevřeněji a divočeji než v letoviscích, s dalekými výhledy na moře a skalnaté hrany mysu.","Je to místo pro pomalé pozorování pobřeží, fotografování a vnímání měnícího se světla. V kombinaci s výletem na Pink Beach ukáže jinou podobu jižního a východního Lomboku.","V okolí srázů bývá nerovný terén, místy chybí zábradlí a ve větru je potřeba zvýšená opatrnost."]],
    [/desa sade|desa ende|sasak/i,["Tradiční vesnice Sasak nabízí možnost poznat místní architekturu, řemesla a kulturní zvyklosti původních obyvatel Lomboku. Důležitý není jen vzhled domů, ale i jejich uspořádání a každodenní využití.","Návštěvu lze využít k rozhovoru s místními průvodci a porozumění tomu, jak se uchovávají řemeslné a rodinné tradice. Není nutné spěchat od jednoho fotomísta k druhému.","Fotografování obyvatel a vstup do soukromých prostor vždy konzultuj s místními."]],
    [/tanjung aan/i,["Tanjung Aan je široká pobřežní oblast jižního Lomboku se světlým pískem, tyrkysovým mořem a okolními kopci. Různé části zátoky nabízejí rozdílné pohledy na vodu i krajinu.","Vyplatí se projít kousek podél pobřeží a najít místo, které vyhovuje pro odpočinek nebo fotografie. Zátoka působí jinak z písku a jinak z některé blízké vyhlídky.","Podmínky koupání se mohou měnit; sleduj vlny, proudy a místní upozornění."]],
    [/mawi/i,["Mawi představuje divočejší tvář jižního Lomboku, kde se skalnaté pobřeží střídá s plážemi a surfařskými vlnami. Atmosféra bývá odlišná od upravených turistických pláží.","Zajímavé je pozorovat příboj z bezpečného odstupu a vnímat otevřenou krajinu kolem. Místo se hodí pro fotografování dramatických vln i členitého pobřeží.","Silné vlny a proudy nejsou vhodné pro nezkušené plavce; k vodě přistupuj obezřetně."]],
    [/marina bay|merlion/i,["Marina Bay ukazuje nejznámější moderní panorama Singapuru: nábřežní promenády, výraznou architekturu a výhledy přes zátoku. Každých několik minut nabízí trochu jinou kompozici budov a jejich odrazů na hladině.","Večer se vyplatí projít větší část promenády a porovnat pohledy z obou břehů. Zážitek vytváří nejen samotné dominanty, ale i živý veřejný prostor podél vody.","Na večerní fotografování si nech časovou rezervu; osvětlení a případný program se mohou měnit."]],
    [/gardens by the bay|supertree/i,["Gardens by the Bay propojují tropickou zeleň s futuristickou architekturou. Obří konstrukce Supertrees se během dne proměňují a večerní osvětlení jim dává zcela jinou atmosféru.","Při procházce si všímej přechodu mezi upravenými zahradami, vodními plochami a výraznými vertikálními prvky. Večerní světelná show bývá hlavním bodem návštěvy.","Aktuální čas show a dostupnost jednotlivých částí zahrad ověř podle oficiálního programu."]],
    [/little india|sri veeramakaliamman/i,["Little India je čtvrť plná barev, vůní koření a kontrastů mezi tradičními obchody a moderním městem. Chrám Sri Veeramakaliamman patří k výrazným orientačním bodům této oblasti.","Pěší procházka umožní všimnout si zdobených fasád, pouličních obchodů a místní gastronomie. Na rozdíl od Marina Bay je zde zážitek především v detailech a každodenním životě ulice.","Při návštěvě chrámu respektuj pravidla oděvu a fotografování, zejména během obřadů."]],
    [/haji lane|arabská čtvrť|kampong glam/i,["Kampong Glam a okolí Haji Lane představují živou směs historie, malých obchodů, kaváren a pouličního umění. Úzké ulice kontrastují s velkými bulváry moderního Singapuru.","Vyplatí se projít okolí mešity Sultan Mosque, všímat si barevných průčelí a na chvíli se zastavit v některém z místních podniků.","V okolí náboženských památek respektuj místní pravidla oblékání a případné omezení vstupu."]],
    [/jewel changi|rain vortex/i,["Jewel Changi je velkolepý krytý prostor u letiště, jehož hlavní dominantou je vnitřní vodopád Rain Vortex obklopený zelení. Na rozdíl od běžného terminálu zde stojí za pozornost samotná architektura.","Z různých pater se mění perspektiva vodopádu i zahrad; proto stojí za to vyjít o úroveň výš a podívat se na prostor z odstupu.","Při návštěvě před odletem počítej s přesunem k terminálu, kontrolami a rezervou na odbavení."]]
  ];
  guides.push(
    [/sentos|lanovka/i,["Lanovka na Sentosu nabídne neobvyklý pohled na přístavní část Singapuru, zelené svahy a pobřeží. Z výšky vynikne, jak blízko sebe leží hustě zastavěné město, námořní infrastruktura a rekreační ostrov.","Samotná cesta je zážitkem, nejen dopravou mezi dvěma body. Při dobré viditelnosti stojí za to sledovat střídání výhledu na město a moře; fotografie z kabiny ukážou jinou perspektivu než z pěší promenády.","Před cestou ověř provozní dobu, trasu a aktuální cenu. V případě bouřek může být provoz omezen."]],
    [/shi hao|hotpot|bbq/i,["Večeře ve stylu hotpot a BBQ je společným zážitkem, při kterém se jídlo připravuje přímo u stolu. Na rozdíl od běžné restaurace se tu večer přirozeně protáhne do sdílení chutí a přípravy jednotlivých surovin.","Vyplatí se kombinovat zeleninu, maso, houby a přílohy s různými omáčkami. Zajímavé je ochutnat místní styl stolování a přitom si po dni ve městě dopřát klidnější tempo.","Před objednávkou si ověř složení jídel, pálivost, alergeny a případné časové či cenové podmínky nabídky."]],
    [/gwk|garuda wisnu/i,["Kulturní park Garuda Wisnu Kencana představuje monumentální podobu balijského umění a mytologie. Jeho dominantou je obří socha boha Višnua na bájném ptáku Garudovi, která je viditelná i z okolních vyvýšených míst.","Areál umožňuje vnímat nejen samotnou sochu, ale také velké prostory mezi vápencovými stěnami, kulturní motivy a panoramata poloostrova Bukit. Hodí se jako odlišný program mezi plážemi a útesy.","Prohlídka probíhá zčásti na slunci; vezmi vodu a ověř případný čas kulturních vystoupení."]],
    [/bukit merese/i,["Bukit Merese je travnatý pahorek nad jižním pobřežím Lomboku, odkud se otevírá široký pohled na zátoky, pláže a vlnící se linii pobřeží. Krajina je zde otevřená a výrazně jiná než v zeleném vnitrozemí.","Při krátkém výstupu se postupně mění úhel pohledu. Není potřeba spěchat k jednomu konkrétnímu místu: jednotlivé hřebeny nabízejí vlastní kompozice pro fotografie i klidné pozorování moře.","Na slunném odkrytém svahu počítej s větrem a minimem stínu; u okrajů útesů se drž bezpečně dál."]],
    [/mandalika|moto\s?gp/i,["Závodní okruh Mandalika ukazuje moderní sportovní tvář Lomboku. Motorsport se tu potkává s tropickým pobřežím a kopcovitou krajinou jižní části ostrova.","Pro fanoušky motocyklů má zastávka zvláštní význam díky spojení s mezinárodními závody MotoGP. Zajímavá je nejen samotná závodní infrastruktura, ale i její poloha v rychle se rozvíjející oblasti.","Možnosti vstupu do areálu závisejí na provozu, akcích a aktuálních podmínkách. Před návštěvou ověř přístupnost."]],
    [/goa bangkang|netopýří jeskyně/i,["Goa Bangkang patří mezi neobvyklé přírodní zastávky jižního Lomboku. Skalní prostor se svou atmosférou výrazně liší od otevřených pláží a vyhlídek; zajímavou roli zde hraje světlo pronikající do jeskyně.","Při prohlídce vyniknou tvary skal a kontrast mezi osvětlenými a tmavými částmi. Pokud jsou v jeskyni netopýři, je důležité zůstat tiše a nezasahovat do jejich prostředí.","Vstupuj jen do přístupných částí, používej vhodnou obuv a řiď se pokyny místních průvodců."]],
    [/lau pa sat|satay street/i,["Lau Pa Sat je výrazná historická tržnice v centru Singapuru, známá pestrou gastronomií a večerní atmosférou. Satay Street přidává k městskému výletu vůni grilovaných špízů a živý ruch kolem stolů.","Místo je vhodné pro společnou večeři a ochutnávku několika různých jídel. Kontrast starší tržní budovy a moderních mrakodrapů v okolí patří k jeho největšímu kouzlu.","Provoz stánků a organizace venkovního sezení se mohou měnit; na místě si ověř aktuální nabídku a ceny."]],
    [/trasa mrt|changi.*lau pa sat/i,["Cesta metrem MRT z letiště Changi do centra je zároveň jednoduchou ukázkou fungování singapurské veřejné dopravy. Pohodlný přestup na městské linky umožňuje zařadit gastronomickou zastávku i do kratšího pobytu.","Při jízdě se vyplatí sledovat směry linek, názvy konečných stanic a návaznosti na pěší trasu. Systém je přehledný, ale u větších přestupních stanic je dobré počítat s delší chůzí.","Před cestou ověř poslední spoje a ponech bezpečnou rezervu na návrat k letišti."]]
  );

  // Fact-checked place descriptions; more specific than any generic regional wording.
  var verified = [
    [/kulturní park gwk|garuda wisnu kencana/i,
      ["Garuda Wisnu Kencana Cultural Park leží v Ungasanu na poloostrově Bukit. Jeho dominantou je 121 metrů vysoký monument (včetně podstavce), který zachycuje hinduistického boha Višnua na mytickém ptáku Garudovi. Autorem sochy je indonéský sochař I Nyoman Nuarta.",
       "Park zabírá přibližně 60 hektarů. Vedle hlavního monumentu zde najdeme rozsáhlý prostor Lotus Pond mezi vápencovými stěnami, samostatné sochy Višnua a Garudy, amfiteátr i místa pro kulturní představení. Nejde tedy o vyhlídku na moře, ale o rozsáhlý areál věnovaný balijskému umění a hinduistické mytologii.",
       "Prakticky: Park je v oblasti Ungasan v jižním Bali. Přístupné části monumentu, vstupné a čas vystoupení je vhodné ověřit před návštěvou."],
      "https://sita.badungkab.go.id/en/destinations/gwk-garuda-wisnu-kencana-an-iconic-park-in-badung-bali"],
    [/jeskyně a pláž suluban|suluban beach/i,
      ["Suluban, označovaná také jako Blue Point, je malá zátoka pod vápencovými útesy v oblasti Pecatu. Název souvisí s balijským slovem „mesulub“, tedy sklonit se či podlézt: na pláž se sestupuje po schodech a úzkými průchody mezi skalami.",
       "Zátoka je vstupním místem k proslulým surfařským vlnám Uluwatu. Při odlivu se objeví písek a skalní tůně, zatímco při přílivu může být většina spodní části zatopená. Nad útesy jsou podniky s pohledem na oceán a surfařská místa.",
       "Prakticky: Pro průchod jeskyní sleduj příliv a odliv. Vlny nad útesovým dnem jsou vhodné pro zkušené surfaře, nikoli jako běžná pláž ke koupání."],
      "https://www.indonesia.travel/my/en/destination/bali-nusa-tenggara/bali/bali---suluban-beach"],
    [/útes karang boma|karang boma/i,
      ["Karang Boma je vyhlídkový útes u Pecatu na západní straně poloostrova Bukit. Vápencová hrana tu prudce padá k Indickému oceánu a poskytuje široký pohled na přerušovanou linii skalnatého pobřeží.",
       "Jde o otevřenou přírodní vyhlídku, nikoli o pláž nebo vybudovanou vyhlídkovou plošinu. Na pevninské straně jsou nízké porosty a pěšiny; na mořské straně odkryté skalní hrany a pohled na příboj hluboko pod nimi.",
       "Prakticky: Přístup je od Jalan Batu Lesung. Okraje útesu nemají souvislé jištění; fotografuj z bezpečné vzdálenosti."],
      "https://smartbali.com/en/places/karang-boma-cliff"],
    [/skalní silnice tanah barak|tanah barak.*melasti/i,
      ["Tanah Barak je známý silniční průřez mezi vysokými světlými vápencovými stěnami v jižním Bali. Je součástí oblasti Kutuh, zatímco nedaleká pláž Melasti leží v Ungasanu; obě místa se často spojují do jednoho výletu, ale nejsou totožná.",
       "Na Tanah Barak je zajímavá samotná cesta vytesaná mezi skalami. Melasti nabízí silniční sjezd pod vápencovými útesy, světlý písek a pobřeží spojené s tradičním očistným obřadem Melasti, který se koná před balijským Novým rokem Nyepi.",
       "Prakticky: Nezastavuj kvůli fotografování uprostřed vozovky. V Melasti respektuj případné náboženské obřady; koupání závisí na mořských podmínkách."],
      "https://www.indonesia.travel/uk/en/travel-ideas/heritage/tanah-barak-a-hidden-treasure-in-bali-you-must-visit"],
    [/chrám uluwatu.*kecak|pura luhur uluwatu/i,
      ["Pura Luhur Uluwatu je hinduistický mořský chrám na jihozápadním okraji poloostrova Bukit. Stojí nad přibližně 70 metrů vysokým útesem a patří k významným posvátným místům Bali.",
       "Večerní představení Kecak se koná v amfiteátru poblíž chrámu. Skupina mužů vytváří rytmický zpěv „cak-cak-cak“ bez běžného instrumentálního doprovodu, zatímco tanečníci ztvárňují výjevy z indického eposu Rámájana.",
       "Prakticky: V chrámu je nutné respektovat pravidla oblékání. Volně žijící makakové mohou brát návštěvníkům brýle a telefony; vstupenky na Kecak a čas vystoupení ověř předem."],
      "https://www.indonesia.travel/id/id/travel-ideas/culture/cultural-experience-in-bali-uluwatu-kecak-dance"],
    [/sacred monkey forest|opičí prales/i,
      ["Sacred Monkey Forest Sanctuary, balijsky Mandala Suci Wenara Wana, leží v centrální části Ubudu. Jde o lesní svatyni obývanou makaky jávskými (Macaca fascicularis), nikoli o zoologickou zahradu.",
       "V areálu se nacházejí tři hinduistické chrámy: Dalem Agung Padangtegal, Holy Spring a Prajapati. Pěší cesty vedou mezi tropickými stromy, mosty a tradičními kamennými sochami.",
       "Prakticky: Opice nekrm a nedotýkej se jich. Jídlo, brýle a volné předměty měj zabezpečené; posvátná místa mohou mít zvláštní pravidla vstupu."],
      "https://www.indonesia.travel/my/en/travel-ideas/adventure/5-interesting-places-to-visit-where-you-can-meet-the-monkeys-in-bali"],
    [/chrám tirta empul|tirta empul/i,
      ["Pura Tirta Empul je chrám posvátných pramenů v Manukayi u Tampaksiringu, severovýchodně od Ubudu. Místo je doložené starobalijským nápisem z 10. století a dodnes slouží hinduistickým obřadům.",
       "Voda z pramene napájí očistné bazény s řadou kamenných chrličů. Věřící zde provádějí rituál melukat; součástí areálu jsou také vnitřní chrámová nádvoří a svatyně. Nedaleko stojí prezidentský palác Tampaksiring.",
       "Prakticky: Při návštěvě se používá sarong a platí pravidla pro účast v rituálních bazénech. Ne všechny vodní výtoky jsou určeny pro návštěvníky."],
      "https://diparda.gianyarkab.go.id/destinasi/tirta-empul-temple"],
    [/gardens by the bay|supertree/i,
      ["Gardens by the Bay je rozsáhlý zahradní komplex u Marina Bay. V části Supertree Grove stojí konstrukce vysokých umělých „stromů“ osázených rostlinami, které se večer proměňují díky světelným efektům.",
       "Večerní představení Garden Rhapsody kombinuje hudbu a osvětlení jednotlivých Supertrees. Vedle venkovního areálu patří ke známým atrakcím kryté zahradní skleníky, které však mají vlastní vstupní režim.",
       "Garden Rhapsody se pravidelně koná každý večer v 19:45 a 20:45 v Supertree Grove. Vstup na venkovní světelnou a hudební show je zdarma; placené atrakce v zahradách mají vlastní vstupenky."],
      "https://www.gardensbythebay.com.sg/en/things-to-do/calendar-of-events/garden-rhapsody.html"]
  ];
  // Verified entries take precedence; remaining entries must match an exact attraction.
  guides.unshift.apply(guides,verified);
  var regional = {
    singapore:["Singapur stojí za objevování v pomalém tempu: moderní čtvrti se tu během krátké procházky střídají s historickými ulicemi, chrámy a místy místní gastronomie.","Při cestě mezi jednotlivými zastávkami se vyplatí sledovat architekturu, život ulic a dostupnost stanic MRT. Pro fotografování bývá zajímavé měnící se denní světlo i večerní osvětlení.","Nech si prostor na neplánovanou zastávku a před přesunem ověř aktuální provoz a otevírací dobu."],
    uluwatu:["Poloostrov Bukit je charakteristický vápencovými útesy, pobřežními cestami a vyhlídkami na otevřený oceán. Každá zastávka nabízí jiný úhel pohledu na dramatickou krajinu jižního Bali.","Vedle hlavní atrakce stojí za pozornost i okolní cesta, drobné výhledy a kontrast světlých skal s modrou vodou. Fotografie bývají nejpůsobivější při měkčím ranním či pozdním odpoledním světle.","Na skalnatém pobřeží dej přednost bezpečnému přístupu a počítej s větrem, vlnami a změnami počasí."],
    ubud:["Okolí Ubudu ukazuje zelené vnitrozemí Bali s chrámovou architekturou, rýžovými poli a tropickou vegetací. Zajímavá není jen cílová atrakce, ale také krajina na cestě.","Věnuj čas detailům: tradičním branám, rostlinám, zavlažovacím kanálům a místním řemeslům. Právě ty dodávají jednotlivým zastávkám vlastní charakter.","Při návštěvách přírodních míst počítej s vlhkostí, schody a kluzkým povrchem; v chrámech respektuj místní pravidla."],
    lombok:["Lombok nabízí kontrast mezi horskou zelení, tradičními vesnicemi a otevřeným pobřežím. Každá zastávka umožňuje poznat jinou podobu ostrova než známé pláže Bali.","Vyplatí se nespěchat, zastavit se u výhledu a vnímat proměny krajiny. Při cestách po ostrově mohou být samotné přesuny součástí zážitku.","Na delší výlety vezmi vodu, ochranu před sluncem a počítej s proměnlivými podmínkami na místních silnicích."],
    kuta:["Závěrečná část cesty po Bali je příležitostí poznat další tvář ostrova: rušnější pobřeží, místní podniky i klidnější místa mimo hlavní proud turistů.","U každé zastávky stojí za to ponechat trochu času navíc na fotografování a nenucenou procházku. Při pobytu před odletem má zároveň význam dobrá návaznost na dopravu.","Před cestou ověř čas přesunů a aktuální podmínky na místě."]
  };
  function regionOf(card) {
    var content=card.closest('[id$="AccContent"]'), id=(content&&content.id||"").toLowerCase();
    if(/singapore|singapur/.test(id))return "singapore";
    if(/ulu/.test(id))return "uluwatu";
    if(/ubud/.test(id))return "ubud";
    if(/lombok|tanjung|senaru|selong/.test(id))return "lombok";
    if(/kuta/.test(id))return "kuta";
    return "lombok";
  }
  function enrich() {
    if(document.documentElement.dataset.magazine!=="on")return;
    document.querySelectorAll('#hlavni-obsah [class*="spot-card"]').forEach(function(card) {
      if(card.classList.contains("uber-hotel-card")||card.querySelector(".mg-place-essay"))return;
      var media=card.querySelector(".sv-card,.hotel-location-map,.map-container-wrapper,iframe,.trip-show");
      if(!media)return;
      var heading=card.querySelector('[class*="spot-title"],.spot-name,h4,h3');
      if(!heading)return;
      var title=heading.textContent.replace(/^\s*\d+[.)]\s*/,"").trim();
      var textBox=heading.parentElement;
      if(!textBox||textBox===card||textBox.contains(media))return;
      var existing=(textBox.textContent||"").trim();
      if(existing.length>1100)return;
      var entry=guides.find(function(g){return g[0].test(title);});
      if(!entry)return; // Never substitute generic regional filler for an unknown attraction.
      var paras=entry[1];
      var section=document.createElement("div");
      section.className="mg-place-essay";
      section.setAttribute("aria-label","Cestopisné informace a tipy k místu");
      var kicker=document.createElement("div");
      kicker.className="mg-place-kicker";
      kicker.textContent="CESTOVATELSKÝ PRŮVODCE";
      section.appendChild(kicker);
      paras.forEach(function(str,i){
        var p=document.createElement("p");
        if(i===paras.length-1){p.className="mg-place-practical";var strong=document.createElement("strong");strong.textContent="Prakticky: ";p.appendChild(strong);}
        p.appendChild(document.createTextNode(str));
        section.appendChild(p);
      });
      if(entry[2]) {
        var source=document.createElement("a");
        source.className="mg-place-source";
        source.href=entry[2];
        source.target="_blank";source.rel="noopener noreferrer";
        source.textContent="Ověřený zdroj k místu";
        section.appendChild(source);
      }
      textBox.appendChild(section);
      card.classList.add("mg-enriched-spot");
    });
  }
  function start() {
    enrich();
    var root=document.getElementById("hlavni-obsah");
    if(!root||!window.MutationObserver)return;
    var scheduled=false;
    new MutationObserver(function(records){
      if(scheduled||!records.some(function(r){return Array.prototype.some.call(r.addedNodes,function(n){return n.nodeType===1&&!n.classList?.contains("mg-place-essay")&&!n.classList?.contains("mg-place-kicker")});}))return;
      scheduled=true;
      requestAnimationFrame(function(){scheduled=false;enrich();});
    }).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
