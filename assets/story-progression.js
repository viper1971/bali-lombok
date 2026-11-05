/* BALI 2027: pouze posun otevíraných podsekcí.
   Neřeší viditelnost kapitol, odemykání ani stav přečtení.
   Tyto funkce výhradně ovládá původní systém a přepínač v bočním menu. */
(function(){
  "use strict";
  var timer = 0;
  var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  function offset(){
    var value=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stick-top"))||0;
    return Math.max(12,Math.min(125,value+12));
  }
  function moveTo(fold){
    if(!fold || !fold.classList.contains("is-open"))return;
    var heading=fold.querySelector(":scope > .lux-fold-h") || fold;
    if(!heading.getClientRects().length)return;
    var y=Math.max(0,window.scrollY+heading.getBoundingClientRect().top-offset());
    window.scrollTo({top:y,behavior:prefersReduced && prefersReduced.matches ? "instant":"smooth"});
  }
  function schedule(fold,ms){
    clearTimeout(timer);
    timer=setTimeout(function(){moveTo(fold)},ms);
  }
  function clicked(e){
    var target=e.target;
    if(!target || !target.closest)return;
    var foldButton=target.closest(".lux-fold-btn");
    if(foldButton){
      var fold=foldButton.closest(".lux-fold[id]");
      if(fold && fold.closest(".lux-part") && !fold.classList.contains("is-open")){
        setTimeout(function(){if(fold.classList.contains("is-open"))schedule(fold,70)},100);
      }
      return;
    }
    var heading=target.closest(".lux-part > .lux-part-head");
    if(!heading)return;
    var nested=target.closest("a,button,input,select,textarea,[role=button],.trip-overview");
    if(nested && nested!==heading)return;
    var part=heading.closest(".lux-part");
    if(!part || part.classList.contains("is-open"))return;
    setTimeout(function(){
      if(part.classList.contains("is-open")){
        var first=part.querySelector(".lux-fold[id]");
        if(first){
          // Initial fold can be collapsed; align its header without opening it.
          var h=first.querySelector(":scope > .lux-fold-h")||first;
          var y=Math.max(0,window.scrollY+h.getBoundingClientRect().top-offset());
          window.scrollTo({top:y,behavior:prefersReduced && prefersReduced.matches ? "instant":"smooth"});
        }
      }
    },440);
  }
  function keyboard(e){
    if(e.key!=="Enter" && e.key!==" ")return;
    var heading=e.target && e.target.matches && e.target.matches(".lux-part > .lux-part-head") ? e.target:null;
    if(!heading)return;
    var part=heading.closest(".lux-part");
    if(!part || part.classList.contains("is-open"))return;
    setTimeout(function(){
      if(!part.classList.contains("is-open"))return;
      var first=part.querySelector(".lux-fold[id]");
      if(!first)return;
      var y=Math.max(0,window.scrollY+first.getBoundingClientRect().top-offset());
      window.scrollTo({top:y,behavior:prefersReduced && prefersReduced.matches ? "instant":"smooth"});
    },440);
  }
  document.addEventListener("click",clicked,true);
  document.addEventListener("keydown",keyboard,true);
  function init(){
    document.documentElement.classList.remove("bali-story-progressive");
    document.querySelectorAll(".lux-part.bali-story-concealed").forEach(function(p){p.classList.remove("bali-story-concealed")});
    // Preserve independent map markers inside the itinerary banner.
    document.querySelectorAll(".lux-part > .lux-part-head .trip-overview").forEach(function(map){
      map.addEventListener("click",function(e){e.stopPropagation()});
      map.addEventListener("keydown",function(e){e.stopPropagation()});
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
