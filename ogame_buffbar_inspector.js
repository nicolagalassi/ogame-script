// ==UserScript==
// @name         OGame: Buffbar Inspector (diagnostica)
// @namespace    https://greasyfork.org/users/nicolagalassi
// @version      1.0
// @description  Legge js_duration di tutti gli item attivi e stampa i dati grezzi in console. Solo per diagnostica.
// @author       galax
// @match        https://*.ogame.gameforge.com/game/index.php?page=*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    function dumpBuffbar() {
        const lang = document.querySelector('meta[name="ogame-language"]')?.content || '??';

        const items = [...document.querySelectorAll('#buffBar div[data-uuid][data-id]')].map(el => {
            const durationEl = el.querySelector('.js_duration');
            return {
                name:          el.querySelector('img')?.alt || '?',
                duration_text: durationEl?.innerText?.trim() || '',
                active_until:  el.getAttribute('ogt-active-until'),
            };
        });

        if (!items.length) return false;

        console.log('=== BUFFBAR INSPECTOR ===');
        console.log('lingua:', lang);
        console.log('items:', JSON.stringify(items, null, 2));
        return true;
    }

    if (!dumpBuffbar()) {
        const obs = new MutationObserver(() => {
            if (dumpBuffbar()) obs.disconnect();
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

})();
