
    // Funkce pro zobrazení/skrytí mapy a seznamu půjčoven na Lomboku
    function toggleLombokRentals() {
        const wrapper = document.getElementById('lombokRentalsWrapper');
        const btnText = document.getElementById('toggleLombokText');
        const btnIcon = document.getElementById('toggleLombokIcon');

        if (wrapper.style.display === 'none' || wrapper.style.display === '') {
            wrapper.style.display = 'block';
            btnText.innerText = 'Skrýt přehled půjčoven a mapu';
            btnIcon.style.transform = 'rotate(180deg)';
        } else {
            wrapper.style.display = 'none';
            btnText.innerText = 'Zobrazit přehled půjčoven a mapu';
            btnIcon.style.transform = 'rotate(0deg)';
        }
    }
