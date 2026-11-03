
function updatePackingWeight() {
    const checkboxes = document.querySelectorAll('.packing-checkbox');
    let totalWeight = 0;
    checkboxes.forEach(cb => {
        if (cb.checked) {
            totalWeight += parseInt(cb.getAttribute('data-weight'), 10) || 0;
        }
    });

    const limit = 7000;
    const percentage = Math.min(Math.round((totalWeight / limit) * 100), 100);

    document.getElementById('totalWeightBadge').innerText = `Celkem: ${totalWeight} g / ${limit} g`;
    document.getElementById('weightPercentage').innerText = `${percentage} %`;

    const progressBar = document.getElementById('weightProgressBar');
    progressBar.style.width = `${percentage}%`;

    const statusText = document.getElementById('weightStatusText');
    if (totalWeight > limit) {
        progressBar.style.backgroundColor = '#dc2626';
        statusText.style.color = '#dc2626';
        statusText.innerText = `Překročen limit o: ${totalWeight - limit} g!`;
    } else {
        progressBar.style.backgroundColor = '#059669';
        statusText.style.color = 'var(--text-main)';
        statusText.innerText = `Zbývá do limitu: ${limit - totalWeight} g`;
    }
}
