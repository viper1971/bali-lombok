
        /* Jednotný Street View: načtení až po kliknutí + plná obrazovka */
        function svLoad(id) {
            var el = document.getElementById(id);
            if (!el || el.querySelector('iframe')) return false;
            var url = el.getAttribute('data-sv-url');
            if (!url) return false;
            var f = document.createElement('iframe');
            f.title = 'Google Street View';
            f.src = url;
            f.allowFullscreen = true;
            // svLoad is already called on click or when this view becomes visible.
            // A second lazy gate can leave embeds waiting after a section opens.
            f.loading = 'eager';
            f.referrerPolicy = 'strict-origin-when-cross-origin';
            el.appendChild(f);
            el.classList.add('is-loaded');
            var b = el.querySelector('.sv-play');
            if (b) b.remove();
            return true;
        }
        function svFullscreen(id) {
            var el = document.getElementById(id);
            if (!el) return;
            svLoad(id);
            var rq = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
            if (rq) { var p = rq.call(el); if (p && p.catch) p.catch(function () {}); }
        }
