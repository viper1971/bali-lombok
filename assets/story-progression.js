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
  function scrollTarget(part) {
    // A chapter can contain ordinary content without any accordion.
    // Only direct chapter content counts, not nested accordions from other components.
    var first = part.querySelector(":scope > .lux-part-body .lux-fold[id]");
    return first ? (first.querySelector(":scope > .lux-fold-h") || first)
                 : (part.querySelector(":scope > .lux-part-head") || part);
  }
  // The last chapters are shorter than the viewport. Without a temporary tail
  // Chrome clamps scrollY before their first accordion reaches the top.
  var tail=null, activeChapter=null;
  function ensureTail(){
    if(!tail){
      tail=document.createElement("div");
      tail.id="bali-chapter-scroll-tail";
      tail.setAttribute("aria-hidden","true");
      tail.style.cssText="height:0;min-height:0;pointer-events:none;flex:none;overflow:hidden";
      document.body.appendChild(tail);
    }
    return tail;
  }
  function clearTail(){
    if(tail)tail.style.height="0px";
    activeChapter=null;
  }
  function position(el) {
    if (!el || !el.getClientRects().length) return;
    var part=el.closest(".lux-part");
    var y=Math.max(0,window.scrollY+el.getBoundingClientRect().top-offset());
    var gap=offset();
    y=Math.max(0,y-gap);
    var extension=ensureTail();
    extension.style.height="0px";
    var maxY=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    // Add exactly the missing scrollable space, not a permanent blank page.
    var missing=Math.ceil(y-maxY);
    if(missing>0)extension.style.height=(missing+20)+"px";
    activeChapter=part;
    window.scrollTo({top:y,behavior:prefersReduced && prefersReduced.matches ? "instant" : "smooth"});
  }
  function afterChapterOpen(part) {
    // Existing accordion code preserves header position during the opening animation.
    // Scroll afterwards, when the part has settled and layout is measurable.
    clearTimeout(timer);
    timer=setTimeout(function(){
      if(part.isConnected && part.classList.contains("is-open")) {
        position(scrollTarget(part));
      }
    },470);
  }
  function clicked(e){
    var target=e.target;
    if(!target || !target.closest)return;
    if(target.closest(".lux-part > .lux-part-head")) clearTail();
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
    afterChapterOpen(part);
  }
  function keyboard(e){
    if(e.key!=="Enter" && e.key!==" ")return;
    var heading=e.target && e.target.matches &&
      e.target.matches(".lux-part > .lux-part-head") ? e.target:null;
    if(!heading)return;
    var part=heading.closest(".lux-part");
    if(!part || part.classList.contains("is-open"))return;
    afterChapterOpen(part);
  }
  document.addEventListener("click",clicked,true);
  document.addEventListener("keydown",keyboard,true);
  // Remove temporary page extension when the original system closes a chapter.
  document.addEventListener("click",function(){
    if(!activeChapter)return;
    window.setTimeout(function(){
      if(activeChapter && !activeChapter.classList.contains("is-open"))clearTail();
    },600);
  },true);
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
