// ==UserScript==
// @name         OGame: Timer Visibili Item & Ufficiali (IT)
// @namespace    https://greasyfork.org/users/tuo-profilo
// @version      1.6
// @description  Mostra il tempo maggiore rimanente per item e ufficiali. Converte le settimane in giorni e risolve il bug dei secondi.
// @author       [INSERISCI IL TUO NICKNAME QUI]
// @match        https://*.ogame.gameforge.com/game/index.php?page=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ogame.gameforge.com
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/575226/OGame%3A%20Timer%20Visibili%20Item%20%20Ufficiali%20%28IT%29.user.js
// @updateURL https://update.greasyfork.org/scripts/575226/OGame%3A%20Timer%20Visibili%20Item%20%20Ufficiali%20%28IT%29.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // 1. INIEZIONE STILI CSS
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-timer-base {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.85);
            color: #00ff00;
            font-size: 10px;
            font-family: Verdana, Arial, sans-serif;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 3px;
            border: 1px solid #444;
            white-space: nowrap;
            z-index: 9999;
            pointer-events: none;
            text-shadow: 1px 1px 0 #000;
            box-shadow: 0px 1px 3px rgba(0,0,0,0.8);
        }
        .custom-timer-item { bottom: 2px; }
        .custom-timer-officer { bottom: -14px; }
        .timer-parent-ready { position: relative !important; }
    `;
    document.head.appendChild(style);

    // 2. MOTORE DI PARSING TEMPO
    function formatCompactTime(timeText) {
        // Divide la stringa in blocchi (es. "1s 2g" diventa ["1s", "2g"])
        let parts = timeText.trim().split(/\s+/);
        if (parts.length === 0) return "";

        let firstPart = parts[0]; 
        let unit1 = firstPart.slice(-1).toLowerCase(); // Prende l'ultima lettera
        let val1 = parseInt(firstPart, 10);

        // Gestione del conflitto 's' (Settimane vs Secondi)
        if (unit1 === 's') {
            if (parts.length > 1) {
                let secondPart = parts[1];
                let unit2 = secondPart.slice(-1).toLowerCase();
                
                // Se la seconda unità è 'g' (giorni), la 's' significa Settimane
                if (unit2 === 'g') {
                    let val2 = parseInt(secondPart, 10);
                    return (val1 * 7 + val2) + "g";
                }
            }
            // Se c'è solo 's' (es: "40s"), sono secondi (o esattamente una settimana, in entrambi i casi non moltiplichiamo)
            return firstPart;
        }
        
        // Se inizia con g, o, m restituisce semplicemente quel blocco (ignorando i secondi successivi)
        return firstPart;
    }

    // 3. FUNZIONE PRINCIPALE DI AGGIORNAMENTO
    function updateTimers() {
        
        // --- SEZIONE 1: GESTIONE ITEM ATTIVI ---
        const itemContainers = document.querySelectorAll('li.activePage div[data-uuid]');
        
        itemContainers.forEach(container => {
            const targetLink = container.querySelector('a.active_item');
            const durationDiv = container.querySelector('.js_duration');
            
            if (targetLink && durationDiv) {
                let label = targetLink.querySelector('.custom-timer-base');
                let timeText = durationDiv.innerText.trim();
                
                if (timeText !== "") {
                    let compactTime = formatCompactTime(timeText);

                    if (!label) {
                        targetLink.classList.add('timer-parent-ready');
                        label = document.createElement('div');
                        label.className = 'custom-timer-base custom-timer-item';
                        targetLink.appendChild(label);
                    }
                    label.innerText = compactTime;
                }
            }
        });

        // --- SEZIONE 2: GESTIONE UFFICIALI ---
        const officers = document.querySelectorAll('#officers a.on');
        
        officers.forEach(officer => {
            if (officer.querySelector('.custom-timer-base')) return; 
            
            const tooltipTitle = officer.getAttribute('data-tooltip-title') || "";
            const match = tooltipTitle.match(/Attivo per altri\s+(\d+)\s+(giorn[oi]|settiman[ae]|or[ae]|minut[oi])/i);
            
            if (match) {
                let amount = parseInt(match[1], 10);
                let unit = match[2].charAt(0).toLowerCase(); 
                
                // Agli Ufficiali la parola è esplicita ("settimane"), quindi la conversione è sempre sicura
                if (unit === 's') {
                    amount = amount * 7;
                    unit = 'g';
                }

                officer.classList.add('timer-parent-ready');
                const label = document.createElement('div');
                label.className = 'custom-timer-base custom-timer-officer';
                label.innerText = amount + unit;
                
                officer.appendChild(label);
            }
        });
    }

    // 4. ESECUZIONE
    setInterval(updateTimers, 2000);
    updateTimers();

})();
