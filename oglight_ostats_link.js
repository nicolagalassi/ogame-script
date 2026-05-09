// ==UserScript==
// @name         OGLight - Ostats Link
// @namespace    https://greasyfork.org/users/nicolagalassi
// @version      1.0
// @description  Aggiunge il link Ostats nella barra dei link in alto a destra, accanto agli altri link OGLight
// @author       galax
// @match        https://*.ogame.gameforge.com/game/index.php*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    function addOstatsLink() {
        const linkBar = document.querySelector('div.fright.textRight');
        if (!linkBar || linkBar.querySelector('.ostats-link')) return;

        const mmorpgLink = linkBar.querySelector('a[href*="mmorpg-stat.eu"]');
        if (!mmorpgLink) return;

        const playerMatch = mmorpgLink.href.match(/ftr=(\d+)\.dat/);
        if (!playerMatch) return;

        const universe = window.location.hostname.split('.')[0];
        const playerId = playerMatch[1];
        const ostatsUrl = `https://ostats.eu/universes/${universe}/player/${playerId}`;

        const link = document.createElement('a');
        link.href = ostatsUrl;
        link.target = '_blank';
        link.textContent = 'Ostats';
        link.className = 'ostats-link';

        linkBar.appendChild(document.createTextNode('\n| '));
        linkBar.appendChild(link);
    }

    // OGLight inietta i propri link dopo il caricamento del DOM: aspettiamo che il link
    // mmorpg-stat (marker affidabile dell'iniezione OGLight) compaia nel div
    const observer = new MutationObserver(() => {
        const bar = document.querySelector('div.fright.textRight');
        if (bar && bar.querySelector('a[href*="mmorpg-stat.eu"]')) {
            observer.disconnect();
            addOstatsLink();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
