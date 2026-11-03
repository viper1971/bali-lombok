
/* PREMIUM v6: navigace, režim, nastavení a živý rozpočet v jednom panelu. */
(function(){'use strict';
 function init(){
  var bar=document.getElementById('vipFloatingBar');
  if(!bar||document.getElementById('premiumMergedNav'))return;
  var nav=document.createElement('nav');nav.id='premiumMergedNav';nav.setAttribute('aria-label','Navigace a rozpočet');
  var actions=[
   ['⌕','Hledat',function(){var b=document.getElementById('uxSearchBtn');if(b)b.click();}],
   ['↑','Nahoru',function(){window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}],
   ['◐','Režim',function(){var b=document.getElementById('themeToggleBtn');if(b)b.click();}],
   ['⚙','Nastavení',function(){var b=document.getElementById('floatingSettingsBtn');if(b)b.click();}]
  ];
  actions.forEach(function(a){var b=document.createElement('button');b.type='button';b.className='pm-nav-btn';b.setAttribute('aria-label',a[1]);b.title=a[1];var ic=document.createElement('span');ic.className='pm-nav-icon';ic.textContent=a[0];var tx=document.createElement('span');tx.className='pm-nav-text';tx.textContent=a[1];b.append(ic,tx);b.addEventListener('click',a[2]);nav.appendChild(b);});
  var info=bar.querySelector('.vfb-info');var oldActions=bar.querySelector('.vfb-actions');
  var details=document.createElement('div');details.id='premiumBudgetDetails';
  if(info)details.appendChild(info);if(oldActions)details.appendChild(oldActions);
  bar.appendChild(nav);bar.appendChild(details);
  // Malý trvale viditelný souhrn čerpá částku z původního výpočtu, nic nepřepočítává.
  var summary=document.createElement('div');summary.id='premiumBudgetSummary';summary.innerHTML='<span class="pm-sum-caption">Cena za osobu</span><strong id="premiumBudgetAmount">—</strong>';
  bar.insertBefore(summary,nav);
  var amount=summary.querySelector('#premiumBudgetAmount');var source=document.getElementById('floatPricePerson');
  function sync(){if(source)amount.textContent=source.textContent.trim()||'—';}
  sync();if(source&&window.MutationObserver)new MutationObserver(sync).observe(source,{childList:true,characterData:true,subtree:true});
  // Staré skrývání panelu při rolování dolů se vypne: na mobilu zůstává jeden nízký ovládací pruh.
  bar.classList.add('pm-merged');
  if(window.MutationObserver)new MutationObserver(function(){if(bar.classList.contains('vfb-hide'))bar.classList.remove('vfb-hide');}).observe(bar,{attributes:true,attributeFilter:['class']});
  var search=document.getElementById('uxSearchBtn');if(search){search.tabIndex=-1;search.setAttribute('aria-hidden','true');}
  document.body.classList.add('premium-dock-ready','pm-merged-ready');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
