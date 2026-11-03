
(function(){
 if(!window.matchMedia || !window.matchMedia('(max-width: 760px)').matches) return;
 document.querySelectorAll('#hotovost details.p21-cash-breakdown').forEach(function(d){ d.open=false; });
})();
