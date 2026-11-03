
(function(){
    'use strict';
    var buttons=function(){return document.querySelectorAll('.page-fullscreen-btn')};
    function isFullscreen(){return !!(document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement)}
    function updateButtons(){
        var active=isFullscreen();
        buttons().forEach(function(btn){
            btn.innerHTML=active?'⛶ Vypnout fullscreen':'⛶ Zapnout fullscreen';
            btn.setAttribute('aria-label',active?'Vypnout režim celé obrazovky':'Zapnout režim celé obrazovky');
            btn.setAttribute('aria-pressed',active?'true':'false');
        });
    }
    window.togglePageFullscreen=function(){
        var el=document.documentElement, request=el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen;
        var exit=document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen;
        try{
            if(isFullscreen()){
                if(exit){var result=exit.call(document);if(result&&result.catch)result.catch(function(){});}
            }else if(request){
                var result=request.call(el,{navigationUI:'hide'});if(result&&result.catch)result.catch(function(){});
            }else{
                alert('Režim celé obrazovky tento prohlížeč nepodporuje.');
            }
        }catch(e){console.warn('Fullscreen není dostupný:',e);}
    };
    document.addEventListener('fullscreenchange',updateButtons);
    document.addEventListener('webkitfullscreenchange',updateButtons);
    document.addEventListener('MSFullscreenChange',updateButtons);
    document.addEventListener('DOMContentLoaded',updateButtons);
    updateButtons();
})();
