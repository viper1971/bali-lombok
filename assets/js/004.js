/* Called either when a panorama enters view or when the reader requests a retry. */
function svLoad(id, retry) {
    var stage = document.getElementById(id);
    if (!stage) return false;
    var previous = stage.querySelector('iframe');
    if (previous && !retry) return false;
    var source = stage.getAttribute('data-sv-url');
    if (!source) return false;
    if (previous) previous.remove();

    var frame = document.createElement('iframe');
    frame.title = 'Google Street View';
    frame.allowFullscreen = true;
    // IntersectionObserver already defers this request until the stage is visible.
    frame.loading = 'eager';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    stage.classList.remove('is-loaded', 'is-failed');
    stage.classList.add('is-loading');
    var button = stage.querySelector('.sv-play');
    var timer;
    var settled = false;

    function finish(loaded) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        frame.removeEventListener('load', onLoad);
        frame.removeEventListener('error', onError);
        stage.classList.remove('is-loading');
        stage.classList.toggle('is-loaded', loaded);
        stage.classList.toggle('is-failed', !loaded);
        if (loaded) {
            if (button) button.remove();
        } else {
            frame.remove();
            if (button) {
                button.disabled = false;
                button.textContent = 'Zkusit znovu načíst Street View';
            }
        }
        stage.dispatchEvent(new Event('sv:request-finished'));
    }
    function onLoad() { finish(true); }
    function onError() { finish(false); }
    frame.addEventListener('load', onLoad);
    frame.addEventListener('error', onError);
    if (button) {
        button.disabled = true;
        button.textContent = 'Načítání Street View…';
    }
    timer = setTimeout(onError, 20000);
    frame.src = source;
    stage.appendChild(frame);
    return true;
}
function svFullscreen(id) {
    var stage = document.getElementById(id);
    if (!stage) return;
    svLoad(id);
    var request = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (request) {
        var result = request.call(stage);
        if (result && result.catch) result.catch(function () {});
    }
}
