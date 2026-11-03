
/* Datum a čas odletu z Prahy podle vybrané letecké společnosti */
window.getSelectedFlight = function () {
    try {
        if (typeof flightOptions === 'undefined') return null;
        var key = (typeof currentAirline !== 'undefined' && currentAirline) || localStorage.getItem('user_flight_airline');
        return flightOptions[key] || null;
    } catch (e) { return null; }
};
window.getDepartureDate = function () {
    var f = window.getSelectedFlight();
    var d = f && /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/.exec(f.outDate || '');
    var t = f && /(\d{1,2}):(\d{2})/.exec(f.outDep || '');
    if (!d) return new Date('2027-08-06T00:00:00+02:00');
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return new Date(d[3] + '-' + pad(d[2]) + '-' + pad(d[1]) + 'T' + (t ? pad(t[1]) + ':' + t[2] : '00:00') + ':00+02:00');
};
