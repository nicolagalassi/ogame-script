// ==UserScript==
// @name         OGLight - Shared Report Integration
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Cattura il prefill dal simulatore, lo applica ai report alleanza (lista e dettagli) e nasconde i cloni
// @author       Tu
// @match        https://*.ogame.gameforge.com/game/index.php*
// @match        https://trashsim.universeview.be/*
// @match        https://simulator.ogame-tools.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;

    // =========================================================================
    // PARTE 1: ESECUZIONE SUL SIMULATORE (Il furto dei dati al traguardo)
    // =========================================================================
    if (currentUrl.includes('trashsim.universeview.be') || currentUrl.includes('simulator.ogame-tools.com')) {
        const hash = window.location.hash; 
        
        if (hash && hash.includes('prefill=')) {
            GM_setValue('custom_ogtools_prefill', hash);
            console.log("[Simulatore Alleanza] Dati Forme di Vita e Ricerche catturati con successo!");
            
            if (currentUrl.includes('trashsim.universeview.be')) {
                const urlParams = new URLSearchParams(window.location.search);
                const srKey = urlParams.get('SR_KEY');
                if (srKey) {
                    window.location.replace(`https://simulator.ogame-tools.com/it?SR_KEY=${srKey}${hash}`);
                }
            }
        }
        return; 
    }


    // =========================================================================
    // PARTE 2: ESECUZIONE SU OGAME (Iniezione del tasto in Alleanza)
    // =========================================================================
    
    const style = document.createElement('style');
    style.innerHTML = `
        message-footer-actions:has(.ogl_trashsim) .custom_ogtools_wrapper {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    function processActionContainers() {
        const actionContainers = document.querySelectorAll('message-footer-actions:not(.ogtools_processed)');
        
        actionContainers.forEach(container => {
            let apiKey = null;

            // METODO 1: Cerchiamo l'API Key nel popup espanso (Più Dettagli)
            const rawData = container.closest('.ui-dialog, #messagedetails')?.querySelector('.rawMessageData');
            if (rawData) {
                apiKey = rawData.getAttribute('data-raw-hashcode');
            }

            // METODO 2: Cerchiamo l'API Key nella visualizzazione a lista (fuori dal popup)
            if (!apiKey) {
                const apiKeyBtn = container.querySelector('.msgApiKeyBtn');
                if (apiKeyBtn) {
                    apiKey = apiKeyBtn.getAttribute('data-api-code');
                    
                    if (!apiKey) {
                        const match = apiKeyBtn.outerHTML.match(/value='(sr-[^']+)'/);
                        if (match) apiKey = match[1];
                    }
                }
            }

            if (!apiKey) {
                container.classList.add('ogtools_processed'); 
                return;
            }

            const gradientBtn = document.createElement('gradient-button');
            gradientBtn.setAttribute('sq28', '');
            gradientBtn.className = 'custom_ogtools_wrapper'; 

            const button = document.createElement('button');
            button.className = 'custom_btn tooltip ogl_simulator_custom ogl_ready';
            button.setAttribute('data-tooltip-title', 'Simula con OGame-Tools (Dati OGLight)');
            
            button.onclick = function(e) {
                e.preventDefault();
                
                let currentPrefill = GM_getValue('custom_ogtools_prefill', '');
                let simulatorUrl = 'https://simulator.ogame-tools.com/it?SR_KEY=' + apiKey;
                
                if (currentPrefill) {
                    simulatorUrl += currentPrefill;
                } else {
                    alert("Dati non trovati!\n\nVai alla pagina Messaggi, apri un normale report di spionaggio e clicca sul simulatore di OGLight. Il nostro script catturerà i dati appena si aprirà la nuova scheda, e poi potrai usarli qui in Alleanza.");
                }
                
                window.open(simulatorUrl, '_blank');
            };

            button.innerHTML = `<div class="material-icons notranslate" style="font-size: 20px; line-height: 20px;">play_arrow</div>`;
            gradientBtn.appendChild(button);
            
            container.appendChild(gradientBtn);
            container.classList.add('ogtools_processed');
        });
    }

    const observer = new MutationObserver(() => {
        processActionContainers();
    });

    if (document.body) {
        processActionContainers(); 
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            processActionContainers();
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

})();
