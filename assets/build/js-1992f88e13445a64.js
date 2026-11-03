
        window.currentSgHotel = window.currentSgHotel || {
            name: 'Hotel 81 Premier Princess',
            address: 'Hotel 81 Premier Princess Singapore'
        };
        window.currentSgMode = window.currentSgMode || 'r';

        function updateSgMapRoute(modeFlag, labelText, durationText, btnEl) {
            window.currentSgMode = modeFlag;
            const iframe = document.getElementById('sgTransferMapFrame');
            const note = document.getElementById('sgTransferNote');
            const badge = document.getElementById('sgTransferTimeBadge');

            iframe.src = `https://maps.google.com/maps?saddr=Changi+Airport+Singapore&daddr=${encodedDest}&dirflg=${modeFlag}&output=embed`;

            note.innerText = `Trasa (${labelText}) z Changi Airport do ${window.currentSgHotel.name}`;
            badge.innerText = `⏱️ ${durationText}`;

            const buttons = btnEl.parentElement.querySelectorAll('.sg-mode-btn');
            buttons.forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
        }

        window.updateSgHotelMap = function(hotelName, destinationAddress) {
            window.currentSgHotel.name = hotelName;
            window.currentSgHotel.address = destinationAddress || (hotelName + " Singapore");

            const iframe = document.getElementById('sgTransferMapFrame');
            const note = document.getElementById('sgTransferNote');
            const encodedDest = encodeURIComponent(window.currentSgHotel.address);

            iframe.src = `https://maps.google.com/maps?saddr=Changi+Airport+Singapore&daddr=${encodedDest}&dirflg=${window.currentSgMode}&output=embed`;
            note.innerText = `Trasa z Changi Airport do ${window.currentSgHotel.name}`;
        };

        if (typeof openIframeInModal !== 'function') {
            window.openIframeInModal = function(src, title) {
                window.open(src.replace('&output=embed', ''), '_blank');
            };
        }
    