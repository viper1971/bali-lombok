
        /* Globální úložiště hotelů pro přesun z Uluwatu do Ubudu */
        window.currentUbudRouteHotels = window.currentUbudRouteHotels || {
            originName: 'Uluwatu Jungle Villa',
            originAddress: 'Uluwatu Jungle Villa Bali',
            destName: 'Gandatera Ubud',
            destAddress: 'Gandatera Ubud Bali'
        };
        window.currentUbudRouteMode = window.currentUbudRouteMode || 'd';

        function updateUbudMapRoute(modeFlag, labelText, durationText, btnEl) {
            window.currentUbudRouteMode = modeFlag;
            const iframe = document.getElementById('uluwatuUbudMapFrame');
            const note = document.getElementById('ubudTransferNote');
            const badge = document.getElementById('ubudTransferTimeBadge');

            const encodedOrigin = encodeURIComponent(window.currentUbudRouteHotels.originAddress);
            const encodedDest = encodeURIComponent(window.currentUbudRouteHotels.destAddress);

            iframe.src = `https://maps.google.com/maps?saddr=${encodedOrigin}&daddr=${encodedDest}&dirflg=${modeFlag}&output=embed`;

            note.innerText = `Trasa (${labelText}) z ${window.currentUbudRouteHotels.originName} do ${window.currentUbudRouteHotels.destName}`;
            badge.innerText = `⏱️ ${durationText}`;

            const buttons = btnEl.parentElement.querySelectorAll('.ubud-mode-btn');
            buttons.forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
        }

        /* Funkce pro dynamickou změnu výchozího i cílového hotelu v mapě */
        window.updateUbudRouteHotelsMap = function(originName, originAddress, destName, destAddress) {
            if (originName) window.currentUbudRouteHotels.originName = originName;
            if (originAddress) window.currentUbudRouteHotels.originAddress = originAddress;
            if (destName) window.currentUbudRouteHotels.destName = destName;
            if (destAddress) window.currentUbudRouteHotels.destAddress = destAddress;

            const iframe = document.getElementById('uluwatuUbudMapFrame');
            const note = document.getElementById('ubudTransferNote');

            const encodedOrigin = encodeURIComponent(window.currentUbudRouteHotels.originAddress);
            const encodedDest = encodeURIComponent(window.currentUbudRouteHotels.destAddress);

            iframe.src = `https://maps.google.com/maps?saddr=${encodedOrigin}&daddr=${encodedDest}&dirflg=${window.currentUbudRouteMode}&output=embed`;
            note.innerText = `Trasa z ${window.currentUbudRouteHotels.originName} do ${window.currentUbudRouteHotels.destName}`;
        };

        if (typeof openIframeInModal !== 'function') {
            window.openIframeInModal = function(src, title) {
                window.open(src.replace('&output=embed', ''), '_blank');
            };
        }
    