
        try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); }
        catch (e) {
            try {
                var __mem = {};
                Object.defineProperty(window, 'localStorage', { configurable: true, value: {
                    getItem: function (k) { return Object.prototype.hasOwnProperty.call(__mem, k) ? __mem[k] : null; },
                    setItem: function (k, v) { __mem[k] = String(v); },
                    removeItem: function (k) { delete __mem[k]; },
                    clear: function () { __mem = {}; }
                }});
            } catch (e2) {}
        }
    