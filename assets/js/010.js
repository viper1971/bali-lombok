
/* sdílená varianta: ?plan=… přepíše uložené nastavení (plán hotovosti, jídlo, aktivity), než ho načtou ostatní skripty */
(function () {
    try {
        var m = /[?&]plan=([A-Za-z0-9_-]+)/.exec(location.search); if (!m || m[1].length > 24000) return;
        var b = m[1].replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
        var o = JSON.parse(decodeURIComponent(escape(atob(b))));
        ['cash_plan_v1', 'trip_extras_v2'].forEach(function (k) {
            var v = o && o[k]; if (v && typeof v === 'object' && !Array.isArray(v)) localStorage.setItem(k, JSON.stringify(v));
        });
        window.__luxPlanApplied = true;
    } catch (e) {}
})();
/* instalace na plochu: prohlížeč událost pošle brzy, proto ji zachytíme hned a tlačítko ji použije později */
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__luxInstall = e; if (window.luxInstallUpdate) window.luxInstallUpdate(); });
window.addEventListener('appinstalled', function () { window.__luxInstall = null; window.__luxInstalled = true; if (window.luxInstallUpdate) window.luxInstallUpdate(); });
