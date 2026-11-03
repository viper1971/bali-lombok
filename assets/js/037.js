
    function updateGanttActiveRow(airlineKey) {
        document.querySelectorAll('.gantt-row').forEach(row => row.classList.remove('active'));

        const targetRowOutbound = document.getElementById('ganttRow_outbound_' + airlineKey);
        if (targetRowOutbound) targetRowOutbound.classList.add('active');

        const targetRowReturn = document.getElementById('ganttRow_return_' + airlineKey);
        if (targetRowReturn) targetRowReturn.classList.add('active');
    }

    function handleGanttClick(airlineKey) {
        if (typeof setFlightAirline === 'function') {
            setFlightAirline(airlineKey);
        }
        updateGanttActiveRow(airlineKey);
    }

    window.addEventListener('DOMContentLoaded', () => {
        if (typeof window.setFlightAirline === 'function') {
            const originalSetFlightAirline = window.setFlightAirline;
            window.setFlightAirline = function(airlineKey) {
                originalSetFlightAirline(airlineKey);
                updateGanttActiveRow(airlineKey);
            };
        }

        const activeBtn = document.querySelector('.flight-mode-btn.active, button.flight-mode-btn[class*="active"]');
        if (activeBtn) {
            const idAttr = activeBtn.id || '';
            const parts = idAttr.split('_');
            if (parts.length > 1) {
                const key = parts.slice(1).join('_');
                updateGanttActiveRow(key);
            }
        } else if (typeof currentFlightAirline !== 'undefined' && currentFlightAirline) {
            updateGanttActiveRow(currentFlightAirline);
        }
    });
