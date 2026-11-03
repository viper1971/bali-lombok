
/* V58: starý skript pouze založí tlačítko. Kliknutí ovládá výhradně bali-v54-left-budget-control. */
(function(){
 'use strict';
 function init(){
  if(document.getElementById('v29BottomTab'))return;
  var bar=document.getElementById('vipFloatingBar');if(!bar)return;
  var button=document.createElement('button');
  button.type='button';button.id='v29BottomTab';
  button.setAttribute('aria-controls','vipFloatingBar');
  button.setAttribute('aria-expanded','false');
  button.innerHTML='<span class="v29-chevron" aria-hidden="true">▸</span><span>MENU</span>';
  document.body.appendChild(button);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
})();
