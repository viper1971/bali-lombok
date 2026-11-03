
(function(){'use strict';
function init(){
 var overview=document.getElementById('premium2027Overview');if(!overview)return;
 function sync(){[['floatPricePerson','p12Person'],['floatPriceFamily','p12Pair']].forEach(function(ids){var a=document.getElementById(ids[0]),b=document.getElementById(ids[1]);if(a&&b)b.textContent=a.textContent.trim();});}
 sync();var prices=document.querySelectorAll('#floatPricePerson,#floatPriceFamily');if(window.MutationObserver){var obs=new MutationObserver(sync);prices.forEach(function(p){obs.observe(p,{childList:true,subtree:true,characterData:true});});}
 overview.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href').slice(1),target=document.getElementById(id);if(!target)return;e.preventDefault();
 var part=target.closest('.lux-part'),fold=target.closest('.lux-fold');
 if(part&&part.classList.contains('is-collapsed')){var partButton=part.querySelector(':scope > .lux-part-h button');if(partButton)partButton.click();}
 if(fold&&!fold.classList.contains('is-open')){var btn=fold.querySelector(':scope > .lux-fold-h > .lux-fold-btn');if(btn)btn.click();}
 if(target.tagName==='DETAILS')target.open=true;
 window.setTimeout(function(){target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});},70);
 });});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
