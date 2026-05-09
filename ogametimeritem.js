// ==UserScript==
// @name         OGame: Item & Officer Timers
// @namespace    https://greasyfork.org/users/nicolagalassi
// @version      2.0
// @description  Shows remaining time for active items and officers. Supports IT, EN, DE, FR, TR.
// @author       galax
// @match        https://*.ogame.gameforge.com/game/index.php?page=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ogame.gameforge.com
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/575226/OGame%3A%20Timer%20Visibili%20Item%20%20Ufficiali%20%28IT%29.user.js
// @updateURL https://update.greasyfork.org/scripts/575226/OGame%3A%20Timer%20Visibili%20Item%20%20Ufficiali%20%28IT%29.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const lang = (document.querySelector('meta[name="ogame-language"]')?.content || 'en').toLowerCase();

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

    // 2. PARSING UFFICIALI — regex per lingua + normalizzazione unità

    const OFFICER_REGEX = {
        it: /(\d+)\s+(giorn\w*|settiman\w*|or[ae]|minut\w*)/i,
        en: /(\d+)\s+(days?|weeks?|hours?|minutes?)/i,
        de: /(\d+)\s+(tage?n?|wochen?|stunden?|minuten?)/i,
        fr: /(\d+)\s+(jours?|semaines?|heures?|minutes?)/i,
        tr: /(\d+)\s+(gün|hafta|saat|dakika)/i,
    };

    function parseOfficerTooltip(tooltip) {
        const re = OFFICER_REGEX[lang] || OFFICER_REGEX.en;
        const match = tooltip.match(re);
        if (!match) return null;

        let amount = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        if (/^(settiman|week|woch|semain|hafta)/.test(unit)) return (amount * 7) + 'd';
        if (/^(giorn|day|tag|jour|gün)/.test(unit))          return amount + 'd';
        if (/^(or[ae]?|hour|stund|heur|saat)/.test(unit))    return amount + 'h';
        if (/^(minut|dakika)/.test(unit))                     return amount + 'm';
        return amount + unit[0];
    }

    // 3. PARSING ITEM — legge .js_duration (abbreviazioni singola lettera del gioco)

    function formatCompactTime(timeText) {
        const parts = timeText.trim().split(/\s+/);
        if (!parts.length) return '';

        const first = parts[0];
        const unit1 = first.slice(-1).toLowerCase();
        const val1 = parseInt(first, 10);

        // 'w' = settimane non ambigue (EN, DE)
        if (unit1 === 'w') return (val1 * 7) + 'd';

        // 's' ambiguo in IT: se seguito da 'g' (giorni) → settimane
        if (unit1 === 's' && parts.length > 1) {
            const unit2 = parts[1].slice(-1).toLowerCase();
            if (unit2 === 'g' || unit2 === 'd') {
                return (val1 * 7 + parseInt(parts[1], 10)) + unit2;
            }
        }

        return first;
    }

    // 4. AGGIORNAMENTO

    function updateTimers() {

        // --- ITEM ATTIVI ---
        document.querySelectorAll('li.activePage div[data-uuid]').forEach(container => {
            const link = container.querySelector('a.active_item');
            const durationDiv = container.querySelector('.js_duration');
            if (!link || !durationDiv) return;

            const timeText = durationDiv.innerText.trim();
            if (!timeText) return;

            let label = link.querySelector('.custom-timer-base');
            if (!label) {
                link.classList.add('timer-parent-ready');
                label = document.createElement('div');
                label.className = 'custom-timer-base custom-timer-item';
                link.appendChild(label);
            }
            label.innerText = formatCompactTime(timeText);
        });

        // --- UFFICIALI ---
        document.querySelectorAll('#officers a.on').forEach(officer => {
            if (officer.querySelector('.custom-timer-base')) return;

            const tooltip = officer.getAttribute('data-tooltip-title') || '';
            const timeStr = parseOfficerTooltip(tooltip);
            if (!timeStr) return;

            officer.classList.add('timer-parent-ready');
            const label = document.createElement('div');
            label.className = 'custom-timer-base custom-timer-officer';
            label.innerText = timeStr;
            officer.appendChild(label);
        });
    }

    setInterval(updateTimers, 2000);
    updateTimers();

})();
