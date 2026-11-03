
/* Přehled etap je sestaven z existujících nadpisů; původní funkce luxToggle zůstává beze změny. */
(function(){'use strict';
 function init(){
  var spine=document.querySelector('#osa .lux-spine');
  if(!spine||document.getElementById('premiumStageNavigator'))return;
  var folds=Array.from(spine.children).filter(function(el){return el.classList&&el.classList.contains('lux-fold')&&el.id;});
  if(!folds.length)return;
  return; // v13: duplicitní navigace etap odstraněna; itinerář má vlastní časovou osu
  var panel=document.createElement('nav');panel.id='premiumStageNavigator';panel.setAttribute('aria-label','Rychlý výběr etapy itineráře');
  var heading=document.createElement('div');heading.className='psn-heading';
  var title=document.createElement('strong');title.textContent='Přeskočit na etapu';
  var hint=document.createElement('small');hint.textContent='Vyber místo nebo přesun';heading.append(title,hint);panel.appendChild(heading);
  var grid=document.createElement('div');grid.className='psn-grid';
  folds.forEach(function(fold,i){
   var heading=fold.querySelector('.lux-fold-t');if(!heading)return;
   var link=document.createElement('a');link.className='psn-link';link.href='#'+fold.id;
   var num=document.createElement('span');num.className='psn-num';num.textContent=fold.classList.contains('is-transfer')?'↗':String(i+1);
   var name=document.createElement('span');name.className='psn-name';name.textContent=heading.textContent.trim();
   link.append(num,name);
   link.addEventListener('click',function(e){
    e.preventDefault();
    var button=fold.querySelector('.lux-fold-btn');
    if(button&&button.getAttribute('aria-expanded')==='false')button.click();
    fold.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    if(window.history&&history.replaceState)history.replaceState(null,'','#'+fold.id);
   });
   grid.appendChild(link);
  });
  panel.appendChild(grid);spine.parentNode.insertBefore(panel,spine);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
