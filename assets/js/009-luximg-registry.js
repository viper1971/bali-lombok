
/* Žádná fotka se na stránce nesmí objevit dvakrát: každý soubor z Wikimedia Commons si modul "zabere" (claim) a další ho už nedostane. */
(function () {
    var used = {};
    function key(src, page) {
        var s = page || src || '', m = /\/wiki\/(?:File|Soubor|Datei):([^?#]+)/i.exec(s), n = m ? m[1] : null;
        if (!n) { m = /\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^\/?#]+)/i.exec(src || s); n = m ? m[1] : null; }
        if (!n) { m = /([^\/?#]+\.(?:jpe?g|png|webp|gif))(?:[?#]|$)/i.exec(src || ''); n = m ? m[1] : null; }
        if (!n) return ''; try { n = decodeURIComponent(n); } catch (e) {} return n.replace(/_/g, ' ').toLowerCase();
    }
    window.LUXIMG = {
        key: key,
        claim: function (c, owner) { var k = key(c.src || c.u, c.page || c.d); if (!k) return true; if (used[k] && used[k] !== owner) return false; used[k] = owner; return true; },
        taken: function (c, owner) { var k = key(c.src || c.u, c.page || c.d); return !!(k && used[k] && used[k] !== owner); }
    };
})();
