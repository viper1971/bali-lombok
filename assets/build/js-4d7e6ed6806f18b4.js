
        // Skrytí/Zobrazení celého katalogu motorek
        function toggleBikesCatalog() {
            const wrapper = document.getElementById('bikesCatalogWrapper');
            const btnText = document.getElementById('toggleCatalogText');
            const btnIcon = document.getElementById('toggleCatalogIcon');

            if (wrapper.style.display === 'none' || wrapper.style.display === '') {
                wrapper.style.display = 'block';
                btnText.innerText = 'Skrýt nabídku motorek';
                btnIcon.style.transform = 'rotate(180deg)';
            } else {
                wrapper.style.display = 'none';
                btnText.innerText = 'Zobrazit nabídku motorek';
                btnIcon.style.transform = 'rotate(0deg)';
            }
        }

        // Filtrování s okamžitým skrytím ostatních modelů
        function filterBikes(ccValue, btnElement) {
            const buttons = document.querySelectorAll('.filter-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            btnElement.classList.add('active');

            const cards = document.querySelectorAll('.giant-bike-card');
            cards.forEach(card => {
                if (ccValue === 'all' || card.getAttribute('data-cc') === ccValue) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // Globální Lightbox pro zvětšení obrázku na celou obrazovku
        if (!document.getElementById('globalImageLightbox')) {
            const lightboxHTML = `
                <div id="globalImageLightbox" style="display: none; position: fixed; z-index: 999999; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); align-items: center; justify-content: center; padding: 2rem; box-sizing: border-box;" onclick="closeGlobalLightbox(event)">
                    <span style="position: absolute; top: 2rem; right: 2rem; color: #ffffff; font-size: 2.5rem; font-weight: bold; cursor: pointer; background: rgba(255, 255, 255, 0.1); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.2);" onclick="closeGlobalLightboxForce()">&times;</span>
                    <img decoding="async" loading="lazy" id="globalLightboxImg" style="max-width: 95vw; max-height: 90vh; object-fit: contain; border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);" src="" alt="Zvětšený detail">
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        }

        function openGlobalLightbox(imgSrc) {
            const modal = document.getElementById('globalImageLightbox');
            const modalImg = document.getElementById('globalLightboxImg');
            modalImg.src = imgSrc;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeGlobalLightbox(event) {
            if (event.target.id === 'globalImageLightbox') {
                const modal = document.getElementById('globalImageLightbox');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }

        function closeGlobalLightboxForce() {
            const modal = document.getElementById('globalImageLightbox');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    