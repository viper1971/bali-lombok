
/* V54 - jediný levý panel: rozpočet a tlačítka, Obsah pouze jako vnořený seznam. */
(function(){
 'use strict';
 function init(){
  var bar=document.getElementById('vipFloatingBar');
  var nav=document.getElementById('premiumMergedNav');
  var original=document.getElementById('bottomNav');
  if(!bar||!nav||!original)return;
  var tab=document.getElementById('v29BottomTab');
  if(!tab){
    tab=document.createElement('button');
    tab.type='button';tab.id='v29BottomTab';
    tab.innerHTML='<span class="v29-chevron" aria-hidden="true">▸</span><span>MENU</span>';
    document.body.appendChild(tab);
  }
  // Odstranit historické posluchače kliknutí, které se u obou oušek střetávaly.
  var cleanTab=tab.cloneNode(true);tab.replaceWith(cleanTab);tab=cleanTab;
  tab.setAttribute('aria-controls','vipFloatingBar');
  // Druhé samostatné ouško OBSAH, bez sdílení pozice s tlačítkem MENU.
  var contentTab=document.getElementById('floatingMenuBtn');
  if(contentTab){
    var cleanContentTab=contentTab.cloneNode(true);
    contentTab.replaceWith(cleanContentTab);contentTab=cleanContentTab;
    contentTab.innerHTML='<span aria-hidden="true">☰</span><span>OBSAH</span>';
    contentTab.setAttribute('aria-label','Otevřít obsah cesty');
    contentTab.setAttribute('aria-controls','baliLeftNavSection');
    contentTab.onclick=null;
    contentTab.addEventListener('click',function(ev){
      ev.preventDefault();ev.stopPropagation();
      setContents(!document.body.classList.contains('bali-content-mode'));
    });
  }
  var header=document.createElement('div');
  header.id='baliLeftBudgetHeader';
  header.innerHTML='<strong>Rozpočet a ovládání</strong><button type="button" id="baliLeftBudgetClose" aria-label="Zavřít panel">×</button>';
  bar.insertBefore(header,bar.firstChild);
  // Zrcadlený graf: jediným zdrojem dat zůstává existující rozpočtová kalkulace.
  var financePanel=document.createElement('section');
  financePanel.id='baliMenuFinanceChart';
  financePanel.setAttribute('aria-label','Graf rozložení financí');
  financePanel.innerHTML='<h3>Rozložení financí</h3><div class="bali-menu-finance-body" aria-live="polite">Načítání rozpočtu…</div>';
  bar.insertBefore(financePanel,nav);
  function syncFinanceChart(){
    var source=document.querySelector('#rozpocet .pf18-breakdown .pf18-chart-body');
    var host=financePanel.querySelector('.bali-menu-finance-body');
    if(!source||!host)return;
    var copy=source.cloneNode(true);
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach(function(node){node.removeAttribute('id');});
    host.replaceChildren(copy);
  }
  syncFinanceChart();
  var sourceChart=document.querySelector('#rozpocet .pf18-breakdown .pf18-chart-body');
  if(sourceChart&&window.MutationObserver){
    var financeRefresh=0;
    new MutationObserver(function(){
      if(financeRefresh)cancelAnimationFrame(financeRefresh);
      financeRefresh=requestAnimationFrame(function(){financeRefresh=0;syncFinanceChart();});
    }).observe(sourceChart,{attributes:true,childList:true,subtree:true,characterData:true,attributeFilter:['style','aria-label']});
  }
  var sub=document.createElement('section');
  sub.id='baliLeftNavSection';
  sub.setAttribute('aria-label','Obsah cesty');
  sub.hidden=true;
  var heading=document.createElement('div');
  heading.className='bali-left-nav-heading';
  heading.innerHTML='<strong>Obsah cesty</strong><button type="button" id="baliLeftNavClose" aria-label="Skrýt obsah">×</button>';
  sub.appendChild(heading);
  sub.appendChild(original);
  bar.appendChild(sub);
  // Staré modální okno se nepoužívá. Obsah je součástí jediného levého panelu.
  var overlay=document.getElementById('menuModalOverlay');
  if(overlay){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');}
  function setOpen(on){
    document.body.classList.toggle('v29-bottom-open',on);
    tab.setAttribute('aria-expanded',String(on));
    tab.setAttribute('aria-label',on?'Zavřít rozpočet a ovládání':'Otevřít rozpočet a ovládání');
    var arrow=tab.querySelector('.v29-chevron');if(arrow)arrow.textContent=on?'◂':'▸';
    if(!on){
      document.body.classList.remove('bali-content-mode');
      sub.hidden=true;bar.classList.remove('bali-nav-open');
      if(contentTab)contentTab.setAttribute('aria-expanded','false');
    }
  }
  function setContents(on){
    if(on){
      setOpen(true);
      document.body.classList.add('bali-content-mode');
      sub.hidden=false;
      bar.classList.add('bali-nav-open');
      bar.scrollTop=0;
    }else{
      document.body.classList.remove('bali-content-mode');
      sub.hidden=true;
      bar.classList.remove('bali-nav-open');
    }
    if(contentTab)contentTab.setAttribute('aria-expanded',String(!!on));
  }
  setOpen(false);
  window.setMenuModalOpen=function(on){setContents(!!on);};
  window.toggleMenuModal=function(){setContents(!document.body.classList.contains('bali-content-mode'));};
  window.closeMenuModal=function(){setContents(false);};
  tab.addEventListener('click',function(ev){
    ev.preventDefault();ev.stopPropagation();
    var isMenuOpen=document.body.classList.contains('v29-bottom-open') && !document.body.classList.contains('bali-content-mode');
    setOpen(!isMenuOpen);
    setContents(false);
  });
  document.getElementById('baliLeftBudgetClose').addEventListener('click',function(){setOpen(false);});
  document.getElementById('baliLeftNavClose').addEventListener('click',function(){setContents(false);});
  // Zavírat oba panely po aktivaci jakékoliv navigační položky.
  original.addEventListener('click',function(ev){
    if(ev.target.closest('a,button,[role="button"]')){setOpen(false);}
  });
  // Ovládací akce: provést původní click handler a následně panel zavřít.
  nav.addEventListener('click',function(ev){
    var action=ev.target.closest('button,a,[role="button"]');
    if(!action)return;
    if(action.getAttribute('aria-controls')==='baliLeftNavSection')return;
    setOpen(false);
  });
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'){setContents(false);setOpen(false);}});
  document.addEventListener('pointerdown',function(ev){
    if(!document.body.classList.contains('v29-bottom-open'))return;
    if(ev.target.closest('#vipFloatingBar,#premiumMergedNav,#v29BottomTab,#floatingMenuBtn'))return;
    setOpen(false);
  });
  // Přesunutí skutečných tlačítek mimo rolovací panel zachová všechny click handlery.
  // Sourozenecký fixed dock už neposouvá vnitřní scroll a nepodléhá jeho overflow.
  nav.setAttribute('aria-label','Pevné ovládání vysunutého MENU');
  nav.classList.add('bali-menu-edge-actions');
  document.body.appendChild(nav);
  // Ošetření případných starých skriptů nastavujících .open na nepoužívaném překryvu.
  if(overlay&&window.MutationObserver){
    new MutationObserver(function(){
      if(overlay.classList.contains('open')){overlay.classList.remove('open');setContents(true);}
    }).observe(overlay,{attributes:true,attributeFilter:['class']});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
