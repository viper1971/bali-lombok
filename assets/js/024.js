
    function openBoatFullscreen() {
        const currentSrc = document.getElementById('boatMapFrame').src;
        const titleText = document.getElementById('boatMapTitle')?.textContent || 'Mapa: Plavba lodí na Lombok';
        if (typeof openIframeInModal === 'function') {
            openIframeInModal(currentSrc, titleText);
        } else {
            const elem = document.getElementById('boatMapWrapper');
            if (elem.requestFullscreen) elem.requestFullscreen();
        }
    }
