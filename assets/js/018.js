
    const uluwatuMapJungle = "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d63087.471773426754!2d115.09465310703057!3d-8.789171813183412!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x2dd2441650216933%3A0xdf71da6ddd7bcc1f!2sI%20Gusti%20Ngurah%20Rai%20International%20Airport%2C%20Jl.%20Airport%20Ngurah%20Rai%2C%20Tuban%2C%20South%20Kuta%2C%20Badung%2C%20Regency%2C%20Bali%2080361%2C%20Indon%C3%A9sie!3m2!1d-8.7469933!2d115.1681655!4m5!1s0x2dd25001b6305589%3A0xd34fcb164fdb4207!2sUluwatu%20Jungle%2520Villa%2C%20Pecatu%2C%20South%20Kuta%2C%20Badung%2C%20Regency%2C%20Bali%2080361%2C%20Indon%C3%A9sie!3m2!1d-8.8218566!2d115.0906933!5e0!3m2!1scs!2scz!4v1792495991260!5m2!1scs!2scz";

    const uluwatuMapUlulani = "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d63088.16236207312!2d115.12804005701767!3d-8.785114414183427!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x2dd2441650216933%3A0xdf71da6ddd7bcc1f!2sI%20Gusti%20Ngurah%20Rai%20International%20Airport%2C%20Jl.%20Airport%20Ngurah%20Rai%2C%20Tuban%2C%20South%20Kuta%2C%20Badung%2C%20Regency%2C%20Bali%2080361%2C%20Indon%C3%A9sie!3m2!1d-8.7469933!2d115.1681655!4m5!1s0x2dd24500718357eb%3A0x2c8ffee651aa48b!2sThe%20Ululani%2C%20Indah%20Resort%2C%20Jl.%20New%20Kuta%20Raya%2C%20Pecatu%2C%20Kec.%20Kuta%20Sel.%2C%20Kabupaten%20Badung%2C%20Bali%2080361%2C%20Indon%C3%A9sie!3m2!1d-8.7977052!2d115.1228172!5e0!3m2!1scs!2scz!4v1792495342549!5m2!1scs!2scz";

    function updateUluwatuMapBasedOnDeck() {
        const iframe = document.getElementById('uluwatuMapFrame');
        const titleEl = document.getElementById('uluwatuMapTitle');
        const noteSpan = document.getElementById('uluwatuTransferNote');
        if (!iframe) return;

        if (titleEl) titleEl.style.setProperty('color', 'var(--text-main)', 'important');
        if (noteSpan) noteSpan.style.setProperty('color', 'var(--text-muted)', 'important');

        const deckHtml = document.getElementById('selectedHotelsDeck')?.innerHTML || '';

        const isUlulaniActive = (
            deckHtml.includes('Ululani') ||
            deckHtml.includes('uluwatu-B') ||
            document.querySelector('#card-uluwatu-B.hotel-active, #card-uluwatu-B.active')?.classList.contains('hotel-active') ||
            document.querySelector('#card-uluwatu-B.hotel-active, #card-uluwatu-B.active')?.classList.contains('active')
        );

        const targetUrl = isUlulaniActive ? uluwatuMapUlulani : uluwatuMapJungle;
        if (iframe.src !== targetUrl) {
            iframe.src = targetUrl;
        }

        if (isUlulaniActive) {
            if (titleEl) titleEl.textContent = "📍 Trasa z letiště do hotelu The Ululani";
            if (noteSpan) noteSpan.textContent = "📍 Trasa z letiště Ngurah Rai do hotelu The Ululani (Uluwatu)";
        } else {
            if (titleEl) titleEl.textContent = "📍 Trasa z letiště do hotelu Uluwatu Jungle Villa";
            if (noteSpan) noteSpan.textContent = "📍 Trasa z letiště Ngurah Rai do hotelu Uluwatu Jungle Villa";
        }
    }

    const observer = new MutationObserver(() => {
        updateUluwatuMapBasedOnDeck();
    });

    document.addEventListener('DOMContentLoaded', () => {
        const deck = document.getElementById('selectedHotelsDeck');
        if (deck) {
            observer.observe(deck, { childList: true, subtree: true, characterData: true });
        }
        updateUluwatuMapBasedOnDeck();
    });

    setTimeout(updateUluwatuMapBasedOnDeck, 50);

    document.addEventListener('click', () => {
        setTimeout(updateUluwatuMapBasedOnDeck, 100);
    });

    function openUluwatuFullscreenModal() {
        const iframeSrc = document.getElementById('uluwatuMapFrame').src;
        const titleText = document.getElementById('uluwatuMapTitle')?.textContent || "Mapa: Trasa z letiště do Uluwatu";
        if (typeof openIframeInModal === 'function') {
            openIframeInModal(iframeSrc, titleText);
        } else {
            const elem = document.getElementById('uluwatuMapFrame');
            if (elem.requestFullscreen) elem.requestFullscreen();
        }
    }
