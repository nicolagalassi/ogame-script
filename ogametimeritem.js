// ==UserScript==
// @name         OGame: Item & Officer Timers
// @namespace    https://greasyfork.org/users/nicolagalassi
// @version      1.7.8
// @description  Displays remaining time on active items and officers. Supports IT, EN, DE, FR, TR.
// @author       galax
// @match        https://*.ogame.gameforge.com/game/index.php?page=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ogame.gameforge.com
// @grant        none
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/575226/OGame%3A%20Item%20%26%20Officer%20Timers.user.js
// @updateURL    https://update.greasyfork.org/scripts/575226/OGame%3A%20Item%20%26%20Officer%20Timers.meta.js
// ==/UserScript==

(function () {
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
            border-radius: 2px;
            border: 1px solid #444;
            white-space: pre-line;
            text-align: center;
            line-height: 1.0;
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

    // 2. PARSING TOOLTIP UFFICIALI (multi-lingua)

    const OFFICER_REGEX = {
        it: /(\d+)\s+(giorn\w*|settiman\w*|or[ae]|minut\w*)/i,
        en: /(\d+)\s+(days?|weeks?|hours?|minutes?)/i,
        de: /(\d+)\s+(tage?n?|wochen?|stunden?|minuten?)/i,
        fr: /(\d+)\s+(jours?|semaines?|heures?|minutes?)/i,
        tr: /(\d+)\s+(gün|hafta|saat|dakika)/i,
    };

    function parseOfficerTooltip(tooltip) {
        // 1. Prova a cercare una data esplicita (più precisa)
        const dateMatch = tooltip.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
        if (dateMatch) {
            const [_, d, m, y, h, min, s] = dateMatch;
            const expiry = new Date(y, m - 1, d, h, min, s).getTime();
            return formatRemainingTime(expiry);
        }

        // 2. Fallback: parsing della durata (multi-parte)
        let totalDays = 0;
        let totalHours = 0;
        let totalMinutes = 0;
        let found = false;

        for (const re of Object.values(OFFICER_REGEX)) {
            const globalRe = new RegExp(re.source, 'gi');
            let match;
            while ((match = globalRe.exec(tooltip)) !== null) {
                found = true;
                const amount = parseInt(match[1], 10);
                const unit = match[2].toLowerCase();

                if (/^(settiman|week|woch|semain|hafta)/.test(unit)) totalDays += (amount * 7);
                else if (/^(giorn|day|tag|jour|gün)/.test(unit)) totalDays += amount;
                else if (/^(or[ae]?|hour|stund|heur|saat)/.test(unit)) totalHours += amount;
                else if (/^(minut|dakika)/.test(unit)) totalMinutes += amount;
            }
            if (found) break;
        }

        if (!found) return null;

        // Normalizzazione tempi
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes %= 60;
        totalDays += Math.floor(totalHours / 24);
        totalHours %= 24;

        if (totalDays >= 7) return totalDays + "d";
        if (totalDays > 0) return totalDays + "d\n" + totalHours + "h";
        if (totalHours > 0) return totalHours + "h\n" + totalMinutes + "m";
        return totalMinutes + "m";
    }

    // 3. CALCOLO TEMPO DA TIMESTAMP (language-agnostic)
    function formatRemainingTime(activeUntilMs) {
        const remaining = activeUntilMs - Date.now();
        if (remaining <= 0) return null;

        const totalSec = Math.floor(remaining / 1000);
        const totalDays = Math.floor(totalSec / 86400);
        const hours = Math.floor((totalSec % 86400) / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);

        if (totalDays >= 7) return totalDays + "d";
        if (totalDays > 0) return totalDays + "d\n" + hours + "h";
        if (hours > 0) return hours + "h\n" + minutes + "m";
        return minutes + "m";
    }

    // 4. FUNZIONE PRINCIPALE DI AGGIORNAMENTO
    function updateTimers() {

        // --- SEZIONE 1: GESTIONE ITEM ATTIVI ---
        const itemContainers = document.querySelectorAll('li.activePage div[data-uuid][ogt-active-until]');

        itemContainers.forEach(container => {
            const targetLink = container.querySelector('a.active_item');
            if (!targetLink) return;

            const activeUntil = container.getAttribute('ogt-active-until');
            if (!activeUntil || activeUntil === 'permanent') return;

            const timeStr = formatRemainingTime(parseInt(activeUntil, 10));
            if (!timeStr) return;

            let label = targetLink.querySelector('.custom-timer-base');
            if (!label) {
                targetLink.classList.add('timer-parent-ready');
                label = document.createElement('div');
                label.className = 'custom-timer-base custom-timer-item';
                targetLink.appendChild(label);
            }
            label.innerText = timeStr;
        });

        // --- SEZIONE 2: GESTIONE UFFICIALI ---
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

    // 4. ESECUZIONE
    setInterval(updateTimers, 2000);
    updateTimers();

})();
