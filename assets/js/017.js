
        window.currentUluHotel = window.currentUluHotel || {
            name: 'Uluwatu Jungle Villa',
            address: 'Uluwatu Jungle Villa Bali'
        };
        window.currentUluMode = window.currentUluMode || 'd';

        function updateUluwatuMapRoute(modeFlag, labelText, durationText, btnEl) {
            window.currentUluMode = modeFlag;
            const iframe = document.getElementById('uluwatuMapFrame');
            const note = document.getElementById('uluTransferNote');
            const badge = document.getElementById('uluTransferTimeBadge');

            const encodedDest = encodeURIComponent(window.currentUluHotel.address);
            iframe.src = `https://maps.google.com/maps?saddr=I+Gusti+Ngurah+Rai+International+Airport&daddr=${encodedDest}&dirflg=${modeFlag}&output=embed`;

            note.innerText = `Trasa (${labelText}) z letiště DPS do ${window.currentUluHotel.name}`;
            badge.innerText = `⏱️ ${durationText}`;

            const buttons = btnEl.parentElement.querySelectorAll('.ulu-mode-btn');
            buttons.forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
        }

        window.updateUluwatuHotelMap = function(hotelName, destinationAddress) {
            window.currentUluHotel.name = hotelName;
            window.currentUluHotel.address = destinationAddress || (hotelName + " Uluwatu Bali");

            const iframe = document.getElementById('uluwatuMapFrame');
            const note = document.getElementById('uluTransferNote');
            const encodedDest = encodeURIComponent(window.currentUluHotel.address);

            iframe.src = `https://maps.google.com/maps?saddr=I+Gusti+Ngurah+Rai+International+Airport&daddr=${encodedDest}&dirflg=${window.currentUluMode}&output=embed`;
            note.innerText = `Trasa z letiště DPS do ${window.currentUluHotel.name}`;
        };

        if (typeof openIframeInModal !== 'function') {
            window.openIframeInModal = function(src, title) {
                window.open(src.replace('&output=embed', ''), '_blank');
            };
        }
    