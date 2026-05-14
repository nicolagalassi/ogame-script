// ==UserScript==
// @name         OGLight v13
// @namespace    https://greasyfork.org/
// @version      1.1.0
// @description  OGLight reimplementato per OGame v13 — empire, spy table, galaxy, fleet, stats
// @author       adattato da OGLight (Oz)
// @license      MIT
// @match        https://*.ogame.gameforge.com/game/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_getTab
// @grant        GM_saveTab
// @grant        GM_notification
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // ─── CSS ──────────────────────────────────────────────────────────────────
    // Usa le stesse variabili colore di OGLight per coerenza visiva
    GM_addStyle(`
        :root {
            --ogl: #ffb800;
            --metal: #9a9ac1;
            --crystal: #8dceec;
            --deut: #41aa9c;
            --food: #c3a2ba;
            --msu: #c7c7c7;
            --mission1: #ef5f5f;
            --mission3: #66cd3d;
            --mission4: #00c5b2;
            --mission5: #d97235;
            --mission6: #e9c74b;
            --mission7: #5ae8ea;
            --mission8: #0cc14a;
            --mission15: #527dcb;
        }

        /* ── Planet list ─────────────────────────────── */
        .ogl_available {
            display: flex; gap: 3px; padding: 1px 2px;
            font-size: 9px; line-height: 1.2; flex-wrap: wrap;
        }
        .ogl_available span { color: #aaa; white-space: nowrap; }
        .ogl_available .ogl_metal   { color: var(--metal); }
        .ogl_available .ogl_crystal { color: var(--crystal); }
        .ogl_available .ogl_deut    { color: var(--deut); }
        .ogl_available .ogl_warn    { color: #ffaa00 !important; }
        .ogl_available .ogl_danger  { color: #ff4444 !important; }

        .ogl_refreshTimer {
            font-size: 8px; color: #555; padding: 0 2px;
            display: block;
        }
        .ogl_refreshTimer.ogl_danger { color: #ff6666; }

        .ogl_sideIconTop, .ogl_sideIconBottom {
            display: flex; gap: 1px; padding: 1px 0;
            flex-wrap: wrap; min-height: 2px;
        }
        .ogl_fleetIcon {
            width: 13px; height: 13px; border-radius: 2px;
            display: flex; align-items: center; justify-content: center;
            font-size: 8px; cursor: default; font-style: normal;
            font-family: monospace;
        }
        .ogl_fleetIcon[data-mission="1"]  { background: #3a0808; color: var(--mission1); }
        .ogl_fleetIcon[data-mission="2"]  { background: #3a0808; color: var(--mission1); }
        .ogl_fleetIcon[data-mission="3"]  { background: #0a2a0a; color: var(--mission3); }
        .ogl_fleetIcon[data-mission="4"]  { background: #0a2a2a; color: var(--mission4); }
        .ogl_fleetIcon[data-mission="5"]  { background: #2a1a0a; color: var(--mission5); }
        .ogl_fleetIcon[data-mission="6"]  { background: #2a2a0a; color: var(--mission6); }
        .ogl_fleetIcon[data-mission="7"]  { background: #0a2a2a; color: var(--mission7); }
        .ogl_fleetIcon[data-mission="8"]  { background: #0a2a0a; color: var(--mission8); }
        .ogl_fleetIcon[data-mission="15"] { background: #0a0a2a; color: var(--mission15); }
        .ogl_fleetIcon.ogl_return { opacity: .5; }

        .ogl_recap {
            padding: 4px 6px; border-top: 1px solid #1a2530;
            font-size: 10px; color: #888;
        }
        .ogl_recap .ogl_icon {
            display: flex; justify-content: space-between;
            padding: 1px 0;
        }
        .ogl_recap .ogl_metal   { color: var(--metal); }
        .ogl_recap .ogl_crystal { color: var(--crystal); }
        .ogl_recap .ogl_deut    { color: var(--deut); }
        .ogl_recap .ogl_msu     { color: var(--msu); }

        /* ── Topbar ──────────────────────────────────── */
        .ogl_topbar {
            display: flex; align-items: center; gap: 3px;
            padding: 2px 4px; background: #0d1117;
            border-bottom: 1px solid #1a2530;
        }
        .ogl_topbar i, .ogl_topbar button.ogl_topbarBtn {
            cursor: pointer; color: #888; font-size: 14px;
            padding: 2px; border-radius: 2px; background: none; border: none;
            transition: color .15s;
        }
        .ogl_topbar i:hover, .ogl_topbar button.ogl_topbarBtn:hover { color: var(--ogl); }
        .ogl_topbar .ogl_syncBtn { margin-left: auto; }

        /* ── Side panel ──────────────────────────────── */
        .ogl_side {
            position: fixed; top: 0; right: 0; width: 290px; height: 100vh;
            background: #0d1117; border-left: 1px solid #1a2a3a;
            z-index: 9999; display: flex; flex-direction: column;
            transform: translateX(100%); transition: transform .2s;
            font-size: 11px; color: #ccc; overflow: hidden;
        }
        .ogl_side.ogl_open { transform: translateX(0); }
        .ogl_sideHeader {
            display: flex; align-items: center; justify-content: space-between;
            padding: 5px 8px; background: #111923; border-bottom: 1px solid #1a2a3a;
            font-size: 11px; font-weight: bold; color: var(--ogl); flex-shrink: 0;
        }
        .ogl_sideClose { cursor: pointer; color: #555; font-size: 15px; }
        .ogl_sideClose:hover { color: #ccc; }
        .ogl_sideTabs {
            display: flex; flex-shrink: 0;
            background: #090d14; border-bottom: 1px solid #1a2530;
        }
        .ogl_sideTab {
            flex: 1; padding: 5px 4px; text-align: center; cursor: pointer;
            font-size: 10px; color: #666; border-right: 1px solid #1a2530;
        }
        .ogl_sideTab:last-child { border-right: none; }
        .ogl_sideTab:hover { color: #aaa; }
        .ogl_sideTab.ogl_active { color: var(--ogl); background: #0d1523; }
        .ogl_sideContent { overflow-y: auto; flex: 1; }

        /* ── Spy table ───────────────────────────────── */
        .ogl_spytable {
            margin-bottom: 6px; font-size: 10px; color: #ccc;
            background: #0d1117; border: 1px solid #1a2a3a;
            border-radius: 3px; overflow: hidden;
        }
        .ogl_spyHeader {
            display: grid;
            grid-template-columns: 24px 42px 18px 18px 72px 1fr 72px 60px 60px auto;
            background: #111923; border-bottom: 1px solid #1a2530;
            font-size: 10px;
        }
        .ogl_spyHeader b {
            padding: 4px 5px; color: #88aaff; cursor: pointer;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ogl_spyHeader b:hover { color: var(--ogl); }
        .ogl_spyHeader b.ogl_active { color: var(--ogl); }
        .ogl_spyHeader b.ogl_textCenter { text-align: center; }
        .ogl_spytableSettings { display: flex; gap: 2px; padding: 2px; }
        .ogl_spyLine {
            display: grid;
            grid-template-columns: 24px 42px 18px 18px 72px 1fr 72px 60px 60px auto;
            border-bottom: 1px solid #111820; cursor: default;
        }
        .ogl_spyLine > span, .ogl_spyLine > div, .ogl_spyLine > a {
            padding: 3px 5px; overflow: hidden; text-overflow: ellipsis;
            white-space: nowrap; display: flex; align-items: center;
        }
        .ogl_spyLine:hover > * { background: #111e2e; }
        .ogl_spyLine.ogl_highlighted > * { background: #0a1f0a; }
        .ogl_spyLine.ogl_ignored { opacity: .4; }
        .ogl_spyLine .ogl_textRight { justify-content: flex-end; }
        .ogl_spyLine .ogl_textCenter { justify-content: center; }
        .ogl_spyLine .ogl_loot { color: #8be08b; text-decoration: none; }
        .ogl_spyLine .ogl_loot:hover { text-decoration: underline; }
        .ogl_spyLine .ogl_warning { color: #ffaa44; }
        .ogl_spyLine .ogl_danger  { color: #ff5555; }
        .ogl_spyLine .ogl_actions { display: flex; gap: 2px; align-items: center; padding: 2px 4px; }
        .ogl_spyLine .ogl_button {
            font-size: 12px; cursor: pointer; color: #666;
            background: none; border: none; padding: 0 1px;
        }
        .ogl_spyLine .ogl_button:hover { color: var(--ogl); }
        .ogl_spySum { background: #111520; }
        .ogl_spySum > * { font-weight: bold; color: #ccc !important; }
        .ogl_lineWrapper {}
        .ogl_more { padding: 4px 8px; background: #090d14; }
        .ogl_more div { display: flex; gap: 6px; font-size: 10px; padding: 2px 0; }
        .ogl_more a { color: #88aaff; text-decoration: none; font-size: 10px; }
        .ogl_spyTableName { display: flex; align-items: center; overflow: hidden; }
        .ogl_spyTableName a { color: #88aaff; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ogl_spyTableName a:hover { text-decoration: underline; }

        /* ── Galaxy ──────────────────────────────────── */
        .ogl_tagBtn {
            display: inline-block; width: 10px; height: 10px; border-radius: 2px;
            cursor: pointer; margin-left: 3px; vertical-align: middle;
            border: 1px solid rgba(255,255,255,.15);
        }
        .ogl_pinBtn { cursor: pointer; margin-left: 3px; vertical-align: middle; font-size: 10px; color: #555; }
        .ogl_pinBtn.ogl_pinned { color: var(--ogl); }
        .ogl_tagPicker {
            position: fixed; z-index: 10001; background: #0d1117;
            border: 1px solid #2a3a4a; border-radius: 4px; padding: 5px;
            display: flex; gap: 4px; flex-wrap: wrap; width: 110px;
        }
        .ogl_tagPicker span {
            width: 20px; height: 20px; border-radius: 3px; cursor: pointer;
            border: 1px solid rgba(255,255,255,.2); display: block;
        }
        .ogl_tagPicker span:hover { border-color: #fff; transform: scale(1.1); }
        .ogl_pinPicker {
            position: fixed; z-index: 10001; background: #0d1117;
            border: 1px solid #2a3a4a; border-radius: 4px; padding: 5px;
            display: flex; flex-direction: column; gap: 2px;
        }
        .ogl_pinPicker span {
            padding: 2px 6px; font-size: 10px; cursor: pointer;
            color: #aaa; border-radius: 2px;
        }
        .ogl_pinPicker span:hover { background: #1a2a3a; color: #fff; }
        .ogl_ranking { font-size: 9px; color: #555; margin-left: 3px; }

        /* tag colori */
        .ogl_tag_red    { background: #aa2222 !important; }
        .ogl_tag_orange { background: #aa6622 !important; }
        .ogl_tag_yellow { background: #aaaa22 !important; }
        .ogl_tag_green  { background: #22aa22 !important; }
        .ogl_tag_cyan   { background: #22aaaa !important; }
        .ogl_tag_blue   { background: #2244aa !important; }
        .ogl_tag_purple { background: #8822aa !important; }
        .ogl_tag_pink   { background: #aa2288 !important; }
        .ogl_tag_white  { background: #aaaaaa !important; }
        .ogl_tag_none   { background: #333 !important; }

        /* ── Fleet dispatch ──────────────────────────── */
        .ogl_capacityBar {
            margin: 6px 0; height: 7px; background: #1a2530;
            border-radius: 3px; overflow: hidden;
        }
        .ogl_capacityFill {
            height: 100%; background: #2a7a2a; border-radius: 3px; transition: width .3s;
        }
        .ogl_capacityFill.ogl_over { background: #8a2a2a; }
        .ogl_capacityInfo { font-size: 10px; color: #666; display: flex; justify-content: space-between; }

        /* ── Side panel content ──────────────────────── */
        .ogl_accountTable { width: 100%; border-collapse: collapse; font-size: 10px; }
        .ogl_accountTable th { background: #111923; padding: 3px 5px; color: #88aaff; border-bottom: 1px solid #1a2530; text-align: left; }
        .ogl_accountTable td { padding: 2px 5px; border-bottom: 1px solid #0d1320; color: #aaa; }
        .ogl_accountTable td:last-child { text-align: right; }
        .ogl_accountTable .ogl_total td { color: #fff; font-weight: bold; }
        .ogl_accountTable .ogl_metal   { color: var(--metal); }
        .ogl_accountTable .ogl_crystal { color: var(--crystal); }
        .ogl_accountTable .ogl_deut    { color: var(--deut); }
        .ogl_accountTable .ogl_msu     { color: var(--msu); }

        .ogl_pinnedItem {
            display: flex; align-items: center; justify-content: space-between;
            padding: 4px 8px; border-bottom: 1px solid #0d1320; cursor: pointer; font-size: 10px;
        }
        .ogl_pinnedItem:hover { background: #111923; }
        .ogl_pinnedItem .ogl_pName { color: #88aaff; }
        .ogl_pinnedItem .ogl_pInfo { color: #555; font-size: 9px; }
        .ogl_pinType { font-size: 9px; padding: 1px 3px; border-radius: 2px; margin-right: 4px; }
        .ogl_pin_friend { background: #1a4a1a; color: #aaffaa; }
        .ogl_pin_rush   { background: #4a2a1a; color: #ffccaa; }
        .ogl_pin_danger { background: #4a1a1a; color: #ffaaaa; }
        .ogl_pin_trade  { background: #1a2a4a; color: #aaccff; }

        .ogl_statsRow { display: flex; justify-content: space-between; padding: 3px 8px; border-bottom: 1px solid #0d1320; font-size: 10px; }
        .ogl_statsRow:hover { background: #111923; }
        .ogl_statsLabel { color: #777; }
        .ogl_statsVal { color: var(--ogl); }

        .ogl_settingsBlock { padding: 8px; }
        .ogl_settingsBlock h3 { color: #88aaff; font-size: 11px; margin: 8px 0 4px; border-bottom: 1px solid #1a2530; padding-bottom: 3px; }
        .ogl_settingsBlock label { display: flex; align-items: center; gap: 6px; margin: 4px 0; cursor: pointer; font-size: 10px; color: #aaa; }
        .ogl_settingsBlock input[type=number], .ogl_settingsBlock input[type=text] {
            background: #111; border: 1px solid #2a3a4a; color: #ccc;
            padding: 2px 4px; font-size: 10px; border-radius: 2px; width: 70px;
        }
        .ogl_settingsBlock .ogl_btn {
            padding: 4px 10px; background: #1a3a5a; border: 1px solid #2a5a8a;
            color: #88aaff; cursor: pointer; border-radius: 3px; font-size: 10px; margin-top: 4px;
        }
        .ogl_settingsBlock .ogl_btn:hover { background: #2a4a7a; }
        .ogl_settingsBlock .ogl_btnDanger { background: #3a1a1a; border-color: #6a2a2a; color: #ff8888; }

        /* ── Toast ───────────────────────────────────── */
        .ogl_toast {
            position: fixed; bottom: 20px; right: 20px; z-index: 99999;
            background: #111923; border: 1px solid #2a5a8a;
            border-radius: 4px; padding: 8px 14px; font-size: 11px; color: #ccc;
            animation: ogl_fadein .3s; max-width: 260px; pointer-events: none;
        }
        .ogl_toast.ogl_error   { border-color: #6a2a2a; color: #ff8888; }
        .ogl_toast.ogl_success { border-color: #2a6a2a; color: #88ff88; }
        @keyframes ogl_fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    `);

    // ─── COSTANTI ─────────────────────────────────────────────────────────────
    const TAG_COLORS = ['red','orange','yellow','green','cyan','blue','purple','pink','white','none'];
    const PIN_TYPES  = ['friend','rush','danger','skull','trade','money','star','ptre','none'];
    const MISSION_LETTERS = { 1:'A',2:'A',3:'T',4:'S',5:'H',6:'E',7:'C',8:'R',9:'D',10:'M',15:'X',18:'?',0:'?' };

    // ─── UTILITIES ────────────────────────────────────────────────────────────
    const Util = {
        formatNum(n) {
            if (n == null || isNaN(n)) return '-';
            const abs = Math.abs(n);
            if (abs >= 1e9) return (n / 1e9).toFixed(1) + 'G';
            if (abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
            if (abs >= 1e3) return (n / 1e3).toFixed(0) + 'K';
            return String(Math.round(n));
        },
        formatTime(sec) {
            sec = Math.abs(Math.round(sec));
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            if (h > 0) return `${h}h${String(m).padStart(2,'0')}m`;
            if (m > 0) return `${m}m${String(s).padStart(2,'0')}s`;
            return `${s}s`;
        },
        coordsToId(g, s, p) {
            return String(g).padStart(3,'0') + String(s).padStart(3,'0') + String(p).padStart(2,'0');
        },
        parseCoords(str) {
            const m = String(str || '').match(/(\d+)[:\s](\d+)[:\s](\d+)/);
            return m ? { g:+m[1], s:+m[2], p:+m[3] } : null;
        },
        serverNow() {
            try {
                const st = unsafeWindow.serverTime;
                if (st instanceof Date) return Math.floor(st.getTime() / 1000);
            } catch(e) {}
            return Math.floor(Date.now() / 1000);
        },
        msu(m, c, d) { return (m / 3) + (c * 2 / 3) + d; },
        fleetLink(g, s, p, type, mission) {
            return `/game/index.php?page=ingame&component=fleetdispatch&galaxy=${g}&system=${s}&position=${p}&type=${type}&mission=${mission}`;
        },
        galaxyLink(g, s) { return `/game/index.php?page=ingame&component=galaxy&galaxy=${g}&system=${s}`; },
        toast(msg, type, duration) {
            const el = document.createElement('div');
            el.className = `ogl_toast${type ? ' ogl_' + type : ''}`;
            el.textContent = msg;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), duration || 3000);
        },
        qs(sel, ctx)  { return (ctx || document).querySelector(sel); },
        qsa(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; },
        el(tag, cls, html) {
            const e = document.createElement(tag);
            if (cls)  e.className = cls;
            if (html) e.innerHTML = html;
            return e;
        },
        storageRatio(val, stor) {
            if (!stor) return 0;
            return val / stor;
        },
    };

    // ─── META ──────────────────────────────────────────────────────────────────
    const Meta = {
        _c: {},
        _m(n) { return this._c[n] ?? (this._c[n] = document.querySelector(`meta[name="${n}"]`)?.content || ''); },
        get playerId()   { return parseInt(this._m('ogame-player-id')) || 0; },
        get playerName() { return this._m('ogame-player-name'); },
        get planetId()   { return parseInt(this._m('ogame-planet-id')) || 0; },
        get planetType() { return this._m('ogame-planet-type') || 'planet'; },
        get planetCoords(){ return this._m('ogame-planet-coordinates'); },
        get language()   { return this._m('ogame-language') || 'en'; },
        get universe()   { return this._m('ogame-universe'); },
        get token() { try { return unsafeWindow.token || ''; } catch(e) { return ''; } },
        get dbKey() {
            const u = this.universe.replace(/https?:\/\//, '').split('.')[0];
            return `ogl13_${this.playerId}_${u}`;
        },
        get page() {
            const p = new URLSearchParams(location.search);
            return p.get('component') || p.get('page') || '';
        },
        get isFleet()    { return this.page === 'fleetdispatch'; },
        get isGalaxy()   { return this.page === 'galaxy'; },
        get isMessages() { return this.page === 'messages'; },
        reset() { this._c = {}; },
    };

    // ─── DB ───────────────────────────────────────────────────────────────────
    class DB {
        constructor() { this._key = null; this.data = null; }

        _defaults() {
            return {
                myPlanets: {},
                udb: {},
                pdb: {},
                tdb: {},
                messageDb: {},
                stats: {},
                options: {
                    showResources: true,
                    showFleetIcons: true,
                    showSpyTable: true,
                    showGalaxyEnhancements: true,
                    probeCount: 6,
                    browserNotif: false,
                    ptreTK: '',
                },
                lastEmpireUpdate: 0,
                fleetEvents: [],
            };
        }

        init() {
            this._key = Meta.dbKey;
            if (!this._key || !Meta.playerId) return false;
            try {
                const raw = GM_getValue(this._key, null);
                this.data = raw ? { ...this._defaults(), ...JSON.parse(raw) } : this._defaults();
            } catch(e) { this.data = this._defaults(); }
            return true;
        }

        save() {
            if (!this._key || !this.data) return;
            try { GM_setValue(this._key, JSON.stringify(this.data)); } catch(e) {}
        }

        updatePlanet(id, data) {
            if (!this.data) return;
            this.data.myPlanets[id] = { ...(this.data.myPlanets[id] || {}), ...data, lastRefresh: Util.serverNow() };
        }

        saveReport(hash, data) {
            if (!this.data) return;
            this.data.messageDb[hash] = { ...data, savedAt: Util.serverNow() };
            const keys = Object.keys(this.data.messageDb);
            if (keys.length > 600) {
                keys.sort((a,b) => (this.data.messageDb[a].savedAt||0) - (this.data.messageDb[b].savedAt||0))
                    .slice(0, keys.length - 600).forEach(k => delete this.data.messageDb[k]);
            }
        }

        getOpt(k, def) { return this.data?.options?.[k] ?? (def ?? true); }
        setOpt(k, v) { if (this.data) this.data.options[k] = v; }

        todayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }

        addStat(type, data) {
            if (!this.data) return;
            const k = this.todayKey();
            if (!this.data.stats[k]) this.data.stats[k] = {};
            if (!this.data.stats[k][type]) this.data.stats[k][type] = { metal:0, crystal:0, deut:0, count:0 };
            const s = this.data.stats[k][type];
            s.metal   += data.metal   || 0;
            s.crystal += data.crystal || 0;
            s.deut    += data.deut    || 0;
            s.count   += 1;
        }
    }

    // ─── PLANET LIST MANAGER ──────────────────────────────────────────────────
    // Usa i selettori esatti di OGLight: .smallplanet → .planetlink / .moonlink
    class PlanetListManager {
        constructor(db) { this.db = db; this.fleetEvents = []; }

        init() {
            this._injectTopbar();
            this._setupPlanets();
            this._updateAllResources();
            this._updateRecap();
        }

        _injectTopbar() {
            const planetList = Util.qs('#planetList');
            if (!planetList || Util.qs('.ogl_topbar', planetList)) return;

            const bar = Util.el('div', 'ogl_topbar');
            const btns = [
                { text:'◈', title:'Account Summary',     fn: () => window.ogl13?.ui?.openTab('account') },
                { text:'▣', title:'Tagged Planets',      fn: () => window.ogl13?.ui?.openTab('tagged') },
                { text:'◉', title:'Pinned Players',      fn: () => window.ogl13?.ui?.openTab('pinned') },
                { text:'●', title:'Statistiche',         fn: () => window.ogl13?.ui?.openTab('stats') },
                { text:'⚙', title:'Impostazioni',        fn: () => window.ogl13?.ui?.openTab('settings') },
                { text:'↺', title:'Sincronizza Empire', fn: () => window.ogl13?.empire?.fetchAll(), cls:'ogl_syncBtn' },
            ];
            btns.forEach(b => {
                const btn = document.createElement('button');
                btn.className = 'ogl_topbarBtn' + (b.cls ? ' ' + b.cls : '');
                btn.textContent = b.text;
                btn.title = b.title;
                btn.addEventListener('click', b.fn);
                bar.appendChild(btn);
            });
            planetList.prepend(bar);
        }

        // Inietta struttura OGLight su ogni .smallplanet
        _setupPlanets() {
            if (!this.db.getOpt('showResources') && !this.db.getOpt('showFleetIcons')) return;

            Util.qsa('#planetList .smallplanet').forEach(line => {
                const planet = line.querySelector('.planetlink');
                const moon   = line.querySelector('.moonlink');

                if (planet) {
                    if (!planet.querySelector('.ogl_available')) {
                        Util.el('div', 'ogl_available'); // sarà riempito dopo
                        planet.insertAdjacentElement('beforeend', Util.el('div', 'ogl_available'));
                    }
                    if (!line.querySelector('.ogl_refreshTimer.ogl_planet')) {
                        line.insertAdjacentElement('beforeend', Util.el('div', 'ogl_refreshTimer ogl_planet'));
                    }
                    if (!line.querySelector('.ogl_sideIconTop')) {
                        line.insertAdjacentElement('beforeend', Util.el('div', 'ogl_sideIconTop'));
                    }
                }
                if (moon) {
                    if (!moon.querySelector('.ogl_available')) {
                        moon.insertAdjacentElement('beforeend', Util.el('div', 'ogl_available'));
                    }
                    if (!line.querySelector('.ogl_sideIconBottom')) {
                        line.insertAdjacentElement('beforeend', Util.el('div', 'ogl_sideIconBottom'));
                    }
                }
            });
        }

        _updateAllResources() {
            if (!this.db.getOpt('showResources')) return;
            const now = Util.serverNow();

            Util.qsa('#planetList .smallplanet').forEach(line => {
                const planet = line.querySelector('.planetlink');
                const moon   = line.querySelector('.moonlink');

                if (planet) {
                    const idMatch = (planet.getAttribute('href') || '').match(/cp=(\d+)/);
                    if (idMatch) this._fillResources(planet, parseInt(idMatch[1]), now, line.querySelector('.ogl_refreshTimer.ogl_planet'));
                }
                if (moon) {
                    const idMatch = (moon.getAttribute('href') || '').match(/cp=(\d+)/);
                    if (idMatch) this._fillResources(moon, parseInt(idMatch[1]), now, null);
                }
            });
        }

        _fillResources(link, pid, now, timerEl) {
            const resDiv = link.querySelector('.ogl_available');
            if (!resDiv) return;
            const p = this.db.data?.myPlanets?.[pid];
            if (!p) { resDiv.innerHTML = ''; return; }

            const age  = now - (p.lastRefresh || 0);
            const prod = p.lastRefresh ? age : 0;
            const m = (p.metal   || 0) + (p.prodMetal   || 0) * prod;
            const c = (p.crystal || 0) + (p.prodCrystal || 0) * prod;
            const d = (p.deut    || 0) + (p.prodDeut    || 0) * prod;

            const cls = (val, stor) => {
                const r = Util.storageRatio(val, stor);
                if (r > .9) return ' ogl_danger';
                if (r > .75) return ' ogl_warn';
                return '';
            };

            resDiv.innerHTML =
                `<span class="ogl_metal${cls(m, p.metalStorage)}">${Util.formatNum(m)}</span>` +
                `<span class="ogl_crystal${cls(c, p.crystalStorage)}">${Util.formatNum(c)}</span>` +
                `<span class="ogl_deut${cls(d, p.deutStorage)}">${Util.formatNum(d)}</span>`;

            if (timerEl && p.lastRefresh) {
                const min = Math.floor(age / 60);
                timerEl.textContent = min < 60 ? `${min}m` : `${Math.floor(min/60)}h`;
                timerEl.className = `ogl_refreshTimer ogl_planet${min > 120 ? ' ogl_danger' : ''}`;
            }
        }

        _updateFleetIcons() {
            if (!this.db.getOpt('showFleetIcons')) return;
            const myPlanets = this.db.data?.myPlanets || {};

            // costruisce mappa coords → id
            const coordToId = {};
            Object.entries(myPlanets).forEach(([id, p]) => {
                if (p.coords) coordToId[`${p.coords}:${p.type === 'moon' ? 3 : 1}`] = parseInt(id);
            });

            Util.qsa('#planetList .smallplanet').forEach(line => {
                const topDiv = line.querySelector('.ogl_sideIconTop');
                const botDiv = line.querySelector('.ogl_sideIconBottom');
                if (topDiv) topDiv.innerHTML = '';
                if (botDiv) botDiv.innerHTML = '';

                const planet = line.querySelector('.planetlink');
                const moon   = line.querySelector('.moonlink');
                const getPid = (el) => {
                    const m = (el?.getAttribute('href') || '').match(/cp=(\d+)/);
                    return m ? parseInt(m[1]) : null;
                };
                const pid = getPid(planet);
                const mid = getPid(moon);

                this.fleetEvents.forEach(ev => {
                    const isDest   = ev.destId === pid || ev.destId === mid;
                    const isOrigin = ev.originId === pid || ev.originId === mid;
                    if (!isDest && !isOrigin) return;

                    const targetDiv = (ev.destId === mid || ev.originId === mid) ? botDiv : topDiv;
                    if (!targetDiv) return;

                    const icon = Util.el('i', `ogl_fleetIcon${ev.returning ? ' ogl_return' : ''}`);
                    icon.dataset.mission = ev.mission;
                    icon.title = `Missione ${ev.mission}${ev.returning ? ' (ritorno)' : ''} — ${new Date(ev.arrivalTime * 1000).toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'})}`;
                    icon.textContent = MISSION_LETTERS[ev.mission] || '?';
                    targetDiv.appendChild(icon);
                });
            });
        }

        _updateRecap() {
            const planetList = Util.qs('#planetList');
            if (!planetList) return;
            Util.qs('.ogl_recap', planetList)?.remove();

            const planets = Object.values(this.db.data?.myPlanets || {});
            if (!planets.length) return;

            const now = Util.serverNow();
            let totM = 0, totC = 0, totD = 0;
            planets.forEach(p => {
                const age = now - (p.lastRefresh || 0);
                totM += (p.metal   || 0) + (p.prodMetal   || 0) * (p.lastRefresh ? age : 0);
                totC += (p.crystal || 0) + (p.prodCrystal || 0) * (p.lastRefresh ? age : 0);
                totD += (p.deut    || 0) + (p.prodDeut    || 0) * (p.lastRefresh ? age : 0);
            });

            const recap = Util.el('div', 'ogl_recap');
            recap.innerHTML =
                `<div class="ogl_icon ogl_metal"><span>M</span><span>${Util.formatNum(totM)}</span></div>` +
                `<div class="ogl_icon ogl_crystal"><span>C</span><span>${Util.formatNum(totC)}</span></div>` +
                `<div class="ogl_icon ogl_deut"><span>D</span><span>${Util.formatNum(totD)}</span></div>` +
                `<div class="ogl_icon ogl_msu"><span>MSU</span><span>${Util.formatNum(Util.msu(totM,totC,totD))}</span></div>`;
            planetList.appendChild(recap);
        }

        setFleetEvents(events) {
            this.fleetEvents = events;
            this._updateFleetIcons();
        }

        refresh() {
            this._updateAllResources();
            this._updateFleetIcons();
            this._updateRecap();
        }
    }

    // ─── EMPIRE MANAGER ───────────────────────────────────────────────────────
    class EmpireManager {
        constructor(db) { this.db = db; this.fetching = false; }

        init() {
            const age = Util.serverNow() - (this.db.data?.lastEmpireUpdate || 0);
            if (age > 180) setTimeout(() => this.fetchAll(), 3000);
        }

        async fetchAll() {
            if (this.fetching) return;
            this.fetching = true;
            Util.toast('Aggiornamento empire…', null, 6000);
            try {
                await this._fetch(0);
                await this._fetch(1);
                this.db.data.lastEmpireUpdate = Util.serverNow();
                this.db.save();
                window.ogl13?.planetList?.refresh();
                Util.toast('Empire aggiornato!', 'success');
            } catch(e) {
                Util.toast('Errore empire: ' + e.message, 'error');
            }
            this.fetching = false;
        }

        _fetch(type) {
            return new Promise((res, rej) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${location.origin}/game/index.php?page=ajax&component=empire&ajax=1&planetType=${type}`,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    onload: (r) => {
                        try { this._parseHtml(r.responseText, type); res(); }
                        catch(e) { rej(e); }
                    },
                    onerror: () => rej(new Error('network')),
                });
            });
        }

        _parseHtml(html, type) {
            // L'empire page espone variabili JS per ogni pianeta in script inline
            // Cerca pattern: var currentSpaceObjectId = N; var metalOnPlanet = N; ecc.
            const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
            let match;
            while ((match = scriptRe.exec(html)) !== null) {
                const txt = match[1];
                if (!txt.includes('metalOnPlanet') && !txt.includes('currentSpaceObjectId') && !txt.includes('currentPlanetId')) continue;
                this._extractFromScript(txt, type);
            }
        }

        _extractFromScript(txt, type) {
            const num = (name) => {
                const m = txt.match(new RegExp(`var\\s+${name}\\s*=\\s*([\\d.]+)`));
                return m ? parseFloat(m[1]) : 0;
            };
            const str = (name) => {
                const m = txt.match(new RegExp(`var\\s+${name}\\s*=\\s*["']([^"']+)["']`));
                return m ? m[1] : '';
            };
            const obj = (name) => {
                const m = txt.match(new RegExp(`var\\s+${name}\\s*=\\s*(\\{[^;]+\\})`));
                try { return m ? JSON.parse(m[1]) : null; } catch(e) { return null; }
            };

            const pid = num('currentSpaceObjectId') || num('currentPlanetId');
            if (!pid) return;

            const coords = obj('currentPlanet');
            const coordStr = coords ? `${coords.galaxy}:${coords.system}:${coords.position}` : '';

            const data = {
                type:    type === 1 ? 'moon' : 'planet',
                coords:  coordStr,
                metal:   num('metalOnPlanet'),
                crystal: num('crystalOnPlanet'),
                deut:    num('deuteriumOnPlanet'),
                food:    num('foodOnPlanet'),
            };
            this.db.updatePlanet(pid, data);
        }

        // Legge risorse dalla pagina corrente (disponibile sempre)
        readCurrentPage() {
            if (!Meta.planetId) return;
            try {
                const uw = unsafeWindow;
                const data = {
                    type:   Meta.planetType,
                    coords: Meta.planetCoords,
                    metal:  uw.metalOnPlanet   || 0,
                    crystal:uw.crystalOnPlanet || 0,
                    deut:   uw.deuteriumOnPlanet || 0,
                    food:   uw.foodOnPlanet    || 0,
                };
                // Se siamo su fleetdispatch, leggi la lista pianeti per aggiornare coords
                const pl = uw.planets || uw.planetList;
                if (pl) {
                    pl.forEach(p => {
                        const id = p.id || p.planetId;
                        if (!id) return;
                        const existing = this.db.data.myPlanets[id] || {};
                        this.db.data.myPlanets[id] = {
                            ...existing,
                            coords: `${p.galaxy}:${p.system}:${p.position}`,
                            type:   p.type === 3 ? 'moon' : 'planet',
                        };
                    });
                }
                this.db.updatePlanet(Meta.planetId, data);
                this.db.save();
            } catch(e) {}
        }

        // Fetch risorse live dal resourcesbar
        fetchResources() {
            try {
                const uri = unsafeWindow.ajaxResourceboxURI;
                if (!uri) return;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: uri,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    onload: (r) => {
                        try {
                            const j = JSON.parse(r.responseText);
                            const res = j.resources || j;
                            const data = {
                                type:    Meta.planetType,
                                coords:  Meta.planetCoords,
                                metal:        res.metal?.amount   || 0,
                                crystal:      res.crystal?.amount || 0,
                                deut:         res.deuterium?.amount || 0,
                                food:         res.food?.amount    || 0,
                                prodMetal:    res.metal?.production   || 0,
                                prodCrystal:  res.crystal?.production || 0,
                                prodDeut:     res.deuterium?.production || 0,
                                metalStorage:   res.metal?.storage   || 0,
                                crystalStorage: res.crystal?.storage || 0,
                                deutStorage:    res.deuterium?.storage || 0,
                            };
                            this.db.updatePlanet(Meta.planetId, data);
                            this.db.save();
                            window.ogl13?.planetList?.refresh();
                        } catch(e) {}
                    },
                });
            } catch(e) {}
        }
    }

    // ─── MESSAGE MANAGER (SPY TABLE) ──────────────────────────────────────────
    // Legge .rawMessageData dal DOM — compatibile v13 (confermato dai HAR)
    // Inserisce la spy table in #messagecontainercomponent .content prima di .messageContent
    class MessageManager {
        constructor(db) {
            this.db = db;
            this.messageDB = {};
            this.sortKey = 'age';
            this.sortDir = 'ASC';
            this.spytable = null;
        }

        init() {
            this._loadMessageDB();
            if (!this.db.getOpt('showSpyTable')) return;
            this._initSpyTable();
            if (document.querySelector('.msg')) {
                this._scanMessages();
                this._loadSpyTable();
            }
        }

        _loadMessageDB() {
            try {
                const raw = GM_getValue(Meta.dbKey + '_messages', null);
                this.messageDB = raw ? JSON.parse(raw) : {};
            } catch(e) { this.messageDB = {}; }
        }

        _saveMessageDB() {
            try { GM_setValue(Meta.dbKey + '_messages', JSON.stringify(this.messageDB)); } catch(e) {}
        }

        _initSpyTable() {
            this.spytable = Util.el('div', 'ogl_spytable');

            const header = Util.el('div', 'ogl_spyHeader');
            // colonne: #, età, attività, tipo, coords, nome, loot/MSU, fleet, def, azioni
            header.innerHTML = `
                <b class="ogl_textCenter">#</b>
                <b data-filter="age">Età</b>
                <b class="ogl_textCenter" title="Attività">⏱</b>
                <b class="ogl_textCenter"></b>
                <b data-filter="rawCoords">Coords</b>
                <b data-filter="playerName">Nome</b>
                <b data-filter="wave1" class="ogl_textRight">Loot</b>
                <b data-filter="fleetValue" class="ogl_textRight">Fleet</b>
                <b data-filter="defValue" class="ogl_textRight">Def</b>
                <b></b>
            `;
            Util.qsa('[data-filter]', header).forEach(th => {
                th.style.cursor = 'pointer';
                th.addEventListener('click', () => {
                    if (this.sortKey === th.dataset.filter) {
                        this.sortDir = this.sortDir === 'ASC' ? 'DESC' : 'ASC';
                    } else {
                        this.sortKey = th.dataset.filter;
                        this.sortDir = th.dataset.filter === 'age' ? 'ASC' : 'DESC';
                    }
                    Util.qsa('[data-filter]', header).forEach(h => h.classList.remove('ogl_active'));
                    th.classList.add('ogl_active');
                    this._loadSpyTable();
                });
            });

            // evidenzia colonna corrente
            const activeHeader = header.querySelector(`[data-filter="${this.sortKey}"]`);
            if (activeHeader) activeHeader.classList.add('ogl_active');

            this.spytable.appendChild(header);
        }

        _scanMessages() {
            // Legge i .rawMessageData presenti nel DOM
            // In v13 questi attributi sono confermati presenti (validato via HAR)
            Util.qsa('.rawMessageData').forEach(el => {
                const d = el.dataset;
                const msgType = parseInt(d.rawMessagetype || d.rawMessageType || 0);
                if (msgType !== 10 && msgType !== 0) return; // solo spy report
                const coords = d.rawCoordinates || d.rawCoords;
                if (!coords) return;

                const msgEl  = el.closest('.msg');
                const msgId  = msgEl?.dataset?.msgId || '';
                const hash   = d.rawHashcode || d.rawHashCode || '';

                const metal   = parseInt(d.rawMetal   || 0);
                const crystal = parseInt(d.rawCrystal || 0);
                const deut    = parseInt(d.rawDeuterium || 0);
                const food    = parseInt(d.rawFood    || 0);
                const loot    = parseInt(d.rawLoot    || 75);
                const resources = parseInt(d.rawResources || 0) || (metal + crystal + deut + food);
                const fleetValue  = d.rawHiddenships === '1' ? -1 : parseInt(d.rawFleetvalue  || d.rawFleetValue  || 0);
                const defValue    = d.rawHiddendef   === '1' ? -1 : parseInt(d.rawDefensevalue || d.rawDefenseValue || 0);
                const ts      = parseInt(d.rawTimestamp || 0);
                const now     = Util.serverNow();
                const age     = ts ? (now - ts) : parseInt(d.rawReportage || d.rawReportAge || 0);
                const activity= parseInt(d.rawActivity || 60);
                const isActive= parseInt(d.rawActive || 0);

                const playerName = d.rawPlayername || d.rawPlayerName || '';
                const targetType = parseInt(d.rawTargetplanettype || d.rawTargetPlanetType || 1);
                const playerId   = parseInt(d.rawTargetplayerid || d.rawTargetPlayerId || 0);
                const planetId   = parseInt(d.rawTargetplanetid || d.rawTargetPlanetId || 0);

                const c = Util.parseCoords(coords);
                const rawCoords = c ? Util.coordsToId(c.g, c.s, c.p) : coords;

                // wave loot: loot% della quantità rimanente ad ogni wave
                const lootPct = loot / 100;
                const waves = [];
                let rem = resources;
                for (let i = 1; i <= 6; i++) {
                    waves[i] = Math.floor(rem * lootPct);
                    rem -= waves[i];
                }
                const msu = Util.msu(metal, crystal, deut) * lootPct;

                const msg = {
                    id: msgId, hash, coords, rawCoords, playerName,
                    playerId, planetId, targetType,
                    metal, crystal, deut, food, resources, loot,
                    fleetValue, defValue, activity: isActive && activity < 15 ? activity : (activity === -1 ? 60 : activity),
                    age, ts, wave1: waves[1], msu, waves,
                    spyLink: c ? Util.fleetLink(c.g, c.s, c.p, targetType, 6) : '',
                    raidLink: c ? Util.fleetLink(c.g, c.s, c.p, targetType, 1) : '',
                };

                if (playerId !== 99999) {
                    this.messageDB[msgId || hash] = msg;
                }
            });

            // Salva anche nel DB principale per persistenza
            Object.values(this.messageDB).forEach(m => {
                if (m.hash) this.db.saveReport(m.hash, m);
            });
            this._saveMessageDB();
        }

        _loadSpyTable() {
            if (!this.spytable) return;

            // Rimuovi wrapper esistente
            this.spytable.querySelector('.ogl_lineWrapper')?.remove();

            const wrapper = Util.el('div', 'ogl_lineWrapper');
            const list = Object.values(this.messageDB);

            // Ordinamento
            const key = this.sortKey;
            const dir = this.sortDir === 'DESC' ? -1 : 1;
            list.sort((a, b) => {
                const va = a[key] ?? 0, vb = b[key] ?? 0;
                if (typeof va === 'string') return dir * va.localeCompare(vb);
                return dir * (va - vb);
            });

            let idx = 0;
            let totalLoot = 0;
            list.forEach(msg => {
                idx++;
                totalLoot += msg.wave1 || 0;

                let ageStr;
                const ageSec = msg.age;
                if (ageSec > 86400) ageStr = Math.floor(ageSec / 86400) + 'd';
                else if (ageSec > 3600) ageStr = Math.floor(ageSec / 3600) + 'h';
                else ageStr = Math.floor(ageSec / 60) + 'm';

                const actStr  = msg.activity < 15 ? '*' : msg.activity >= 60 ? '-' : String(msg.activity);
                const ageClass= msg.age < 3600 ? '' : msg.age < 86400 ? ' ogl_warning' : ' ogl_danger';

                const line = Util.el('div', 'ogl_spyLine');
                line.dataset.id = msg.id;

                const coordParts = msg.coords.split(':');
                const galaxyLink = Util.galaxyLink(coordParts[0], coordParts[1]);

                line.innerHTML = `
                    <span class="ogl_textCenter" style="color:#666">${idx}</span>
                    <span class="${ageClass}">${ageStr}</span>
                    <span class="ogl_textCenter${msg.activity < 15 ? ' ogl_danger' : msg.activity < 60 ? ' ogl_warning' : ''}">${actStr}</span>
                    <span class="ogl_textCenter">${msg.targetType === 3 ? '🌙' : '🌍'}</span>
                    <span><a href="${galaxyLink}" style="color:#88aaff;text-decoration:none">${msg.coords}</a></span>
                    <div class="ogl_spyTableName"><a href="/game/index.php?page=componentOnly&component=messagedetails&messageId=${msg.id}">${msg.playerName}</a></div>
                    <a class="ogl_loot ogl_textRight" href="${msg.raidLink}">${Util.formatNum(msg.wave1)}</a>
                    <span class="ogl_textRight" style="${msg.fleetValue > 0 ? 'background:linear-gradient(192deg,#622a2a,#3c1717 70%)' : ''}">${msg.fleetValue < 0 ? '?' : Util.formatNum(msg.fleetValue)}</span>
                    <span class="ogl_textRight" style="${msg.defValue > 0 ? 'background:linear-gradient(192deg,#622a2a,#3c1717 70%)' : ''}">${msg.defValue < 0 ? '?' : Util.formatNum(msg.defValue)}</span>
                    <span class="ogl_actions"></span>
                `;

                // bottoni azione
                const actions = line.querySelector('.ogl_actions');
                if (msg.spyLink) {
                    const spyBtn = Util.el('a', 'ogl_button', '👁');
                    spyBtn.href  = msg.spyLink;
                    spyBtn.title = 'Spia';
                    actions.appendChild(spyBtn);

                    const atkBtn = Util.el('a', 'ogl_button', '⚔');
                    atkBtn.href  = msg.raidLink;
                    atkBtn.title = 'Attacca';
                    actions.appendChild(atkBtn);
                }

                // sottorighe wave loot (toggle)
                const more = Util.el('div', 'ogl_more ogl_hidden');
                msg.waves.slice(1).forEach((w, i) => {
                    if (!w) return;
                    const sub = Util.el('div');
                    sub.innerHTML = `<span>W${i+1}:</span><span>${Util.formatNum(w)}</span>`;
                    more.appendChild(sub);
                });
                if (more.children.length) {
                    const moreBtn = Util.el('span', 'ogl_button');
                    moreBtn.textContent = '…';
                    moreBtn.title = 'Wave detail';
                    moreBtn.addEventListener('click', () => more.classList.toggle('ogl_hidden'));
                    actions.appendChild(moreBtn);
                    wrapper.appendChild(line);
                    wrapper.appendChild(more);
                } else {
                    wrapper.appendChild(line);
                }
            });

            // riga totale
            const sumLine = Util.el('div', 'ogl_spyLine ogl_spySum');
            sumLine.innerHTML = `
                <span></span><span></span><span></span><span></span><span></span>
                <span style="color:#aaa">Totale</span>
                <span class="ogl_textRight">${Util.formatNum(totalLoot)}</span>
                <span></span><span></span><span></span>
            `;
            wrapper.appendChild(sumLine);

            this.spytable.appendChild(wrapper);

            // Inserimento nel punto corretto: #messagecontainercomponent .content → prima di .messageContent
            const msgContent = Util.qs('#messagecontainercomponent .content');
            const msgList    = Util.qs('#messagecontainercomponent .content .messageContent');
            if (msgContent && msgList) {
                msgContent.insertBefore(this.spytable, msgList);
            } else if (msgContent) {
                msgContent.prepend(this.spytable);
            }
        }

        // Chiamato dall'AJAX hook dopo getMessagesList
        onMessagesReloaded() {
            this._scanMessages();
            this._loadSpyTable();
        }
    }

    // ─── MOVEMENT MANAGER ─────────────────────────────────────────────────────
    class MovementManager {
        constructor(db) { this.db = db; }

        init() { this._fetchEvents(); }

        _fetchEvents() {
            try {
                const uri = unsafeWindow.ajaxEventboxURI;
                if (!uri) return;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: uri,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    onload: (r) => {
                        try {
                            const j = JSON.parse(r.responseText);
                            if (j.newAjaxToken) try { unsafeWindow.token = j.newAjaxToken; } catch(e) {}
                            this._fetchEventList();
                        } catch(e) {}
                    },
                });
            } catch(e) {}
        }

        _fetchEventList() {
            try {
                const base = unsafeWindow.ajaxEventboxURI || '';
                const uri  = base.replace('fetchEventBox', 'catchEvents').replace('asJson=1', 'ajax=1');
                if (!uri || uri === base) return;
                GM_xmlhttpRequest({
                    method: 'GET', url: uri,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    onload: (r) => {
                        try {
                            const j = JSON.parse(r.responseText);
                            const html = j.content?.eventlist || '';
                            if (html) this._parseEventList(html);
                        } catch(e) {}
                    },
                });
            } catch(e) {}
        }

        _parseEventList(html) {
            const doc    = new DOMParser().parseFromString(html, 'text/html');
            const events = [];
            const myPlanets = this.db.data?.myPlanets || {};

            const findPlanetId = (coords, isMoon) => {
                if (!coords) return null;
                const cs = `${coords.g}:${coords.s}:${coords.p}`;
                const t  = isMoon ? 'moon' : 'planet';
                const found = Object.entries(myPlanets).find(([,p]) => p.coords === cs && p.type === t);
                return found ? parseInt(found[0]) : null;
            };

            Util.qsa('tr.eventFleet', doc).forEach(tr => {
                const mission     = parseInt(tr.dataset.missionType || 0);
                const arrivalTime = parseInt(tr.dataset.arrivalTime || 0);
                const returning   = tr.dataset.returnFlight === 'true';

                const originStr = Util.qs('.coordsOrigin a', tr)?.textContent?.trim() || '';
                const destStr   = Util.qs('.destCoords a',   tr)?.textContent?.trim() || '';
                const originMoon= !!Util.qs('.originFleet figure.moon, .originFleet .moon', tr);
                const destMoon  = !!Util.qs('.destFleet figure.moon, .destFleet .moon',   tr);

                const originC = Util.parseCoords(originStr);
                const destC   = Util.parseCoords(destStr);

                events.push({
                    mission, arrivalTime, returning,
                    originC, destC, originMoon, destMoon,
                    originId: findPlanetId(originC, originMoon),
                    destId:   findPlanetId(destC,   destMoon),
                });
            });

            window.ogl13?.planetList?.setFleetEvents(events);
            this._checkAttackNotifications(events);
        }

        _checkAttackNotifications(events) {
            if (!this.db.getOpt('browserNotif', false)) return;
            const now = Util.serverNow();
            events.forEach(ev => {
                if (ev.mission === 1 && !ev.returning && ev.destId) {
                    const secs = ev.arrivalTime - now;
                    if (secs > 30 && secs < 300) {
                        setTimeout(() => {
                            GM_notification({ title:'OGLight v13 — Attacco!', text:`Arrivo tra ${Util.formatTime(secs)}` });
                        }, Math.max(0, (secs - 30) * 1000));
                    }
                }
            });
        }

        onEventsLoaded(html) { this._parseEventList(html); }
    }

    // ─── GALAXY MANAGER ───────────────────────────────────────────────────────
    class GalaxyManager {
        constructor(db) { this.db = db; }

        init() {} // il parsing avviene via AJAX hook

        parseData(data) {
            if (!data?.system) return;
            const sys = data.system;
            const now = Util.serverNow();

            (sys.galaxyContent || []).forEach(slot => {
                if (!slot.planets?.length) return;
                const { galaxy, system, position } = slot;
                const ck = `${galaxy}:${system}:${position}`;

                slot.planets.forEach(p => {
                    const isMoon = p.planetType === 3;
                    if (!this.db.data.pdb[ck]) this.db.data.pdb[ck] = {};
                    const entry = this.db.data.pdb[ck];
                    if (isMoon) entry.mid = p.planetId;
                    else { entry.pid = p.planetId; entry.uid = p.playerId; entry.coo = ck; }
                    entry.api = now;
                    if (p.activity) {
                        const acti = p.activity.showMinutes ? p.activity.showActivity : -1;
                        if (!entry.acti) entry.acti = [null, null, 0];
                        if (isMoon) entry.acti[1] = acti; else entry.acti[0] = acti;
                        entry.acti[2] = now;
                    }
                });

                const pl = slot.player;
                if (pl?.playerId && pl.playerId !== 99999) {
                    const uid = pl.playerId;
                    if (!this.db.data.udb[uid]) this.db.data.udb[uid] = { uid, planets: [] };
                    const u = this.db.data.udb[uid];
                    u.name = pl.playerName; u.liveUpdate = now;
                    u.status = pl.isInactive ? 'i' : pl.isLongInactive ? 'I' : pl.isOnVacation ? 'v' : pl.isBanned ? 'b' : 'n';
                    if (!u.planets.includes(ck)) u.planets.push(ck);
                    if (pl.highscorePositionPlayer) { if (!u.score) u.score = {}; u.score.globalRanking = pl.highscorePositionPlayer; }
                }
            });

            this.db.save();
            if (Meta.isGalaxy) this._enhanceUI(data);
        }

        _enhanceUI(data) {
            if (!this.db.getOpt('showGalaxyEnhancements')) return;
            const rows = Util.qsa('#galaxyTableBody tr, .galaxyRow');
            (data.system?.galaxyContent || []).forEach((slot, i) => {
                const tr = rows[i];
                if (!tr) return;
                const { galaxy, system, position } = slot;
                this._addTag(tr, galaxy, system, position);
                if (slot.player?.playerId && slot.player.playerId !== 99999) {
                    this._addPin(tr, slot.player);
                    this._addRanking(tr, slot.player);
                }
            });
        }

        _addTag(tr, g, s, p) {
            const id = Util.coordsToId(g, s, p);
            const tag = this.db.data.tdb[id];
            Util.qs('.ogl_tagBtn', tr)?.remove();
            const coordCell = Util.qs('.cellPosition, [data-position], .coords', tr);
            if (!coordCell) return;
            const btn = Util.el('span', `ogl_tagBtn ogl_tag_${tag?.tag || 'none'}`);
            btn.title = 'Tag';
            btn.addEventListener('click', e => { e.stopPropagation(); this._showTagPicker(e, id, btn); });
            coordCell.appendChild(btn);
        }

        _addPin(tr, player) {
            const uid   = player.playerId;
            const pinType = this.db.data.udb[uid]?.pin;
            Util.qs('.ogl_pinBtn', tr)?.remove();
            const nameCell = Util.qs('.cellPlayerName, .playername', tr);
            if (!nameCell) return;
            const btn = Util.el('span', `ogl_pinBtn${pinType && pinType !== 'none' ? ' ogl_pinned' : ''}`);
            btn.textContent = '📌';
            btn.title = pinType ? `Pinned: ${pinType}` : 'Pin';
            btn.addEventListener('click', e => { e.stopPropagation(); this._showPinPicker(e, uid, btn); });
            nameCell.appendChild(btn);
        }

        _addRanking(tr, player) {
            if (!player.highscorePositionPlayer) return;
            Util.qs('.ogl_ranking', tr)?.remove();
            const nameCell = Util.qs('.cellPlayerName, .playername', tr);
            if (!nameCell) return;
            const span = Util.el('span', 'ogl_ranking', `#${player.highscorePositionPlayer}`);
            nameCell.appendChild(span);
        }

        _showTagPicker(e, id, tagEl) {
            Util.qs('.ogl_tagPicker')?.remove();
            Util.qs('.ogl_pinPicker')?.remove();
            const picker = Util.el('div', 'ogl_tagPicker');
            TAG_COLORS.forEach(color => {
                const sw = Util.el('span', `ogl_tag_${color}`);
                sw.title = color;
                sw.addEventListener('click', () => {
                    if (color === 'none') delete this.db.data.tdb[id];
                    else this.db.data.tdb[id] = { tag: color };
                    tagEl.className = `ogl_tagBtn ogl_tag_${color}`;
                    this.db.save();
                    picker.remove();
                });
                picker.appendChild(sw);
            });
            picker.style.left = e.clientX + 'px';
            picker.style.top  = e.clientY + 'px';
            document.body.appendChild(picker);
            setTimeout(() => document.addEventListener('click', () => picker.remove(), { once:true }), 50);
        }

        _showPinPicker(e, uid, pinEl) {
            Util.qs('.ogl_tagPicker')?.remove();
            Util.qs('.ogl_pinPicker')?.remove();
            const picker = Util.el('div', 'ogl_pinPicker');
            PIN_TYPES.forEach(type => {
                const btn = Util.el('span');
                btn.textContent = type;
                btn.addEventListener('click', () => {
                    if (!this.db.data.udb[uid]) this.db.data.udb[uid] = { uid };
                    if (type === 'none') delete this.db.data.udb[uid].pin;
                    else this.db.data.udb[uid].pin = type;
                    pinEl.className = `ogl_pinBtn${type !== 'none' ? ' ogl_pinned' : ''}`;
                    pinEl.title = type !== 'none' ? `Pinned: ${type}` : 'Pin';
                    this.db.save();
                    picker.remove();
                    window.ogl13?.ui?.refreshIfOpen('pinned');
                });
                picker.appendChild(btn);
            });
            picker.style.left = e.clientX + 'px';
            picker.style.top  = e.clientY + 'px';
            document.body.appendChild(picker);
            setTimeout(() => document.addEventListener('click', () => picker.remove(), { once:true }), 50);
        }
    }

    // ─── FLEET MANAGER ────────────────────────────────────────────────────────
    class FleetManager {
        constructor(db) { this.db = db; }

        init() {
            if (!Meta.isFleet) return;
            const poll = setInterval(() => {
                try {
                    if (unsafeWindow.fleetDispatcher) { clearInterval(poll); this._enhance(); }
                } catch(e) { clearInterval(poll); }
            }, 100);
            setTimeout(() => clearInterval(poll), 5000);
        }

        _enhance() {
            this._addCapacityBar();
        }

        _addCapacityBar() {
            const fleet1 = Util.qs('#fleet1');
            if (!fleet1 || Util.qs('.ogl_capacityBar', fleet1)) return;
            const bar  = Util.el('div', 'ogl_capacityBar');
            const fill = Util.el('div', 'ogl_capacityFill');
            fill.style.width = '0%';
            bar.appendChild(fill);
            const info = Util.el('div', 'ogl_capacityInfo');
            info.innerHTML = '<span>Capacità</span><span class="ogl_capVal">-</span>';
            fleet1.append(bar, info);

            setInterval(() => {
                try {
                    const fd  = unsafeWindow.fleetDispatcher;
                    if (!fd) return;
                    const cap  = fd.getCargoCapacity?.() || 0;
                    const load = (fd.metalToSend || 0) + (fd.crystalToSend || 0) + (fd.deuteriumToSend || 0) + (fd.foodToSend || 0);
                    if (!cap) return;
                    const pct = Math.min(100, (load / cap) * 100);
                    fill.style.width = pct + '%';
                    fill.className   = `ogl_capacityFill${pct >= 100 ? ' ogl_over' : ''}`;
                    Util.qs('.ogl_capVal', info).textContent = `${Util.formatNum(load)} / ${Util.formatNum(cap)} (${Math.round(pct)}%)`;
                } catch(e) {}
            }, 500);
        }
    }

    // ─── UI MANAGER ───────────────────────────────────────────────────────────
    class UIManager {
        constructor(db) { this.db = db; this.panel = null; this.currentTab = null; }

        init() {
            this._createPanel();
        }

        _createPanel() {
            const panel = Util.el('div', 'ogl_side');
            panel.innerHTML = `
                <div class="ogl_sideHeader">
                    <span>OGLight v13</span>
                    <span class="ogl_sideClose">✕</span>
                </div>
                <div class="ogl_sideTabs">
                    <div class="ogl_sideTab" data-tab="account">Account</div>
                    <div class="ogl_sideTab" data-tab="pinned">Pin</div>
                    <div class="ogl_sideTab" data-tab="tagged">Tag</div>
                    <div class="ogl_sideTab" data-tab="stats">Stats</div>
                    <div class="ogl_sideTab" data-tab="settings">⚙</div>
                </div>
                <div class="ogl_sideContent" id="ogl13SideContent"></div>
            `;
            document.body.appendChild(panel);
            this.panel = panel;

            Util.qs('.ogl_sideClose', panel).addEventListener('click', () => this.close());
            Util.qsa('.ogl_sideTab', panel).forEach(tab => {
                tab.addEventListener('click', () => this.openTab(tab.dataset.tab));
            });

            // Tasto ` o ² per toggle settings
            document.addEventListener('keydown', e => {
                if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
                if (e.key === '`' || e.key === '²') {
                    panel.classList.contains('ogl_open') ? this.close() : this.openTab('settings');
                }
            });
        }

        openTab(name) {
            if (!this.panel) return;
            this.panel.classList.add('ogl_open');
            this.currentTab = name;
            Util.qsa('.ogl_sideTab', this.panel).forEach(t => t.classList.toggle('ogl_active', t.dataset.tab === name));
            const content = Util.qs('#ogl13SideContent');
            content.innerHTML = '';
            switch(name) {
                case 'account':  this._renderAccount(content);  break;
                case 'pinned':   this._renderPinned(content);   break;
                case 'tagged':   this._renderTagged(content);   break;
                case 'stats':    this._renderStats(content);    break;
                case 'settings': this._renderSettings(content); break;
            }
        }

        close() { this.panel?.classList.remove('ogl_open'); this.currentTab = null; }

        refreshIfOpen(tab) { if (this.currentTab === tab) this.openTab(tab); }

        _renderAccount(content) {
            const planets = Object.entries(this.db.data?.myPlanets || {});
            if (!planets.length) {
                content.innerHTML = '<div style="padding:10px;color:#555;font-size:10px;">Nessun dato. Clicca ↺ per sincronizzare.</div>';
                return;
            }
            const now = Util.serverNow();
            let tM = 0, tC = 0, tD = 0;
            const rows = planets.map(([id, p]) => {
                const age = now - (p.lastRefresh || 0);
                const m = (p.metal   || 0) + (p.prodMetal   || 0) * (p.lastRefresh ? age : 0);
                const c = (p.crystal || 0) + (p.prodCrystal || 0) * (p.lastRefresh ? age : 0);
                const d = (p.deut    || 0) + (p.prodDeut    || 0) * (p.lastRefresh ? age : 0);
                tM += m; tC += c; tD += d;
                return `<tr><td style="color:#88aaff">${p.coords || id}</td><td class="ogl_metal">${Util.formatNum(m)}</td><td class="ogl_crystal">${Util.formatNum(c)}</td><td class="ogl_deut">${Util.formatNum(d)}</td><td class="ogl_msu">${Util.formatNum(Util.msu(m,c,d))}</td></tr>`;
            }).join('');
            content.innerHTML = `<table class="ogl_accountTable"><thead><tr><th>Pianeta</th><th>M</th><th>C</th><th>D</th><th>MSU</th></tr></thead><tbody>${rows}<tr class="ogl_total"><td>Totale</td><td class="ogl_metal">${Util.formatNum(tM)}</td><td class="ogl_crystal">${Util.formatNum(tC)}</td><td class="ogl_deut">${Util.formatNum(tD)}</td><td class="ogl_msu">${Util.formatNum(Util.msu(tM,tC,tD))}</td></tr></tbody></table>`;
        }

        _renderPinned(content) {
            const pinned = Object.values(this.db.data?.udb || {}).filter(u => u.pin && u.pin !== 'none');
            if (!pinned.length) { content.innerHTML = '<div style="padding:10px;color:#555;font-size:10px;">Nessun player pinnato. Usa 📌 nella galaxy.</div>'; return; }
            pinned.sort((a,b) => (a.name||'').localeCompare(b.name||'')).forEach(u => {
                const div = Util.el('div', 'ogl_pinnedItem');
                div.innerHTML = `<div><span class="ogl_pinType ogl_pin_${u.pin}">${u.pin}</span><span class="ogl_pName">${u.name||u.uid}</span></div><span class="ogl_pInfo">${(u.planets||[]).length} p${u.score?.globalRanking?` | #${u.score.globalRanking}`:''}</span>`;
                const c = Util.parseCoords(u.planets?.[0]);
                if (c) div.addEventListener('click', () => location.href = Util.galaxyLink(c.g, c.s));
                content.appendChild(div);
            });
        }

        _renderTagged(content) {
            const tagged = Object.entries(this.db.data?.tdb || {});
            if (!tagged.length) { content.innerHTML = '<div style="padding:10px;color:#555;font-size:10px;">Nessuna posizione taggata.</div>'; return; }
            tagged.sort((a,b) => a[0].localeCompare(b[0])).forEach(([id, data]) => {
                const g = parseInt(id.slice(0,3)), s = parseInt(id.slice(3,6)), p = parseInt(id.slice(6));
                const div = Util.el('div', 'ogl_pinnedItem');
                div.innerHTML = `<div><span class="ogl_tagBtn ogl_tag_${data.tag}" style="display:inline-block;margin-right:6px;vertical-align:middle"></span><a href="${Util.galaxyLink(g,s)}" style="color:#88aaff;text-decoration:none">${g}:${s}:${p}</a></div><span class="ogl_pInfo">${data.tag}</span>`;
                content.appendChild(div);
            });
        }

        _renderStats(content) {
            const stats = this.db.data?.stats || {};
            const today = this.db.todayKey();
            const todayStats = stats[today] || {};
            const header = Util.el('div');
            header.style.cssText = 'padding:6px 8px;color:#88aaff;font-size:11px;border-bottom:1px solid #1a2530;';
            header.textContent = 'Oggi — ' + today;
            content.appendChild(header);
            const types = { raid:'⚔ Raid', expe:'🔭 Spedizioni', debris:'♻ Debris' };
            Object.entries(types).forEach(([key, label]) => {
                const s = todayStats[key];
                if (!s) return;
                const row = Util.el('div', 'ogl_statsRow');
                row.innerHTML = `<span class="ogl_statsLabel">${label}</span><span class="ogl_statsVal">${Util.formatNum(Util.msu(s.metal||0,s.crystal||0,s.deut||0))} MSU (${s.count})</span>`;
                content.appendChild(row);
            });
            const wHeader = Util.el('div');
            wHeader.style.cssText = 'padding:6px 8px;color:#88aaff;font-size:11px;border-bottom:1px solid #1a2530;margin-top:8px;';
            wHeader.textContent = 'Ultimi 7 giorni';
            content.appendChild(wHeader);
            Object.entries(stats).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7).forEach(([day, ds]) => {
                const tot = Object.values(ds).reduce((sum,s) => sum + Util.msu(s.metal||0,s.crystal||0,s.deut||0), 0);
                const row = Util.el('div', 'ogl_statsRow');
                row.innerHTML = `<span class="ogl_statsLabel">${day}</span><span class="ogl_statsVal">${Util.formatNum(tot)} MSU</span>`;
                content.appendChild(row);
            });
        }

        _renderSettings(content) {
            const d = Util.el('div', 'ogl_settingsBlock');
            const opts = [
                { k:'showResources',          l:'Risorse nella planet list' },
                { k:'showFleetIcons',         l:'Icone flotte nella planet list' },
                { k:'showSpyTable',           l:'Spy table nei messaggi' },
                { k:'showGalaxyEnhancements', l:'Tag e pin nella galaxy view' },
                { k:'browserNotif',           l:'Notifiche browser per attacchi' },
            ];
            d.innerHTML = '<h3>Opzioni</h3>';
            opts.forEach(o => {
                const lbl = Util.el('label');
                const cb  = document.createElement('input');
                cb.type = 'checkbox'; cb.checked = this.db.getOpt(o.k);
                cb.addEventListener('change', () => { this.db.setOpt(o.k, cb.checked); this.db.save(); });
                lbl.appendChild(cb);
                lbl.appendChild(document.createTextNode(' ' + o.l));
                d.appendChild(lbl);
            });
            d.innerHTML += '<h3>N. Sonde</h3>';
            const pl = Util.el('label', '', 'Sonde: ');
            const pi = document.createElement('input');
            pi.type='number'; pi.value=this.db.getOpt('probeCount',6); pi.min=1; pi.max=9999;
            pi.addEventListener('change', () => { this.db.setOpt('probeCount', parseInt(pi.value)||6); this.db.save(); });
            pl.appendChild(pi); d.appendChild(pl);
            d.innerHTML += '<h3>Manutenzione</h3>';
            const expBtn = document.createElement('button');
            expBtn.className = 'ogl_btn'; expBtn.textContent = 'Esporta DB';
            expBtn.addEventListener('click', () => {
                const blob = new Blob([JSON.stringify(this.db.data,null,2)], {type:'application/json'});
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `ogl13_${Date.now()}.json`;
                a.click();
            });
            const rstBtn = document.createElement('button');
            rstBtn.className = 'ogl_btn ogl_btnDanger'; rstBtn.textContent = 'Reset DB';
            rstBtn.style.marginLeft = '6px';
            rstBtn.addEventListener('click', () => {
                if (confirm('Reset completo del DB?')) { GM_setValue(this.db._key, null); location.reload(); }
            });
            d.appendChild(expBtn); d.appendChild(rstBtn);
            content.appendChild(d);
        }
    }

    // ─── SHORTCUT MANAGER ─────────────────────────────────────────────────────
    class ShortcutManager {
        constructor(db) { this.db = db; }

        init() {
            document.addEventListener('keydown', e => this._handle(e));
        }

        _handle(e) {
            if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
            if (e.key === 'i' || e.key === 'o') {
                e.preventDefault();
                this._nextPlanet(e.key === 'o' ? 1 : -1);
            }
        }

        _nextPlanet(dir) {
            const links = Util.qsa('#planetList .smallplanet .planetlink');
            if (!links.length) return;
            const cur  = links.findIndex(l => l.href.includes(`cp=${Meta.planetId}`));
            const next = (cur + dir + links.length) % links.length;
            const url  = new URL(links[next].href);
            const sp   = new URLSearchParams(location.search);
            if (sp.get('component')) url.searchParams.set('component', sp.get('component'));
            if (sp.get('page'))      url.searchParams.set('page',      sp.get('page'));
            location.href = url.toString();
        }
    }

    // ─── AJAX HOOKS ───────────────────────────────────────────────────────────
    function setupAjaxHooks(ogl) {
        try {
            const $ = unsafeWindow.jQuery || unsafeWindow.$;
            if (!$) return;

            $(document).on('ajaxSuccess', (event, xhr, settings, data) => {
                const url = settings.url || '';
                try {
                    const json = typeof data === 'string' ? JSON.parse(data) : data;

                    if (url.includes('catchEvents') || url.includes('eventlist')) {
                        const html = json?.content?.eventlist || '';
                        if (html) ogl.movement?.onEventsLoaded(html);
                    }

                    if (url.includes('fetchSolarSystemData')) {
                        ogl.galaxy?.parseData(json);
                    }

                    if (url.includes('getMessagesList') || (url.includes('messages') && url.includes('action='))) {
                        setTimeout(() => ogl.messages?.onMessagesReloaded(), 400);
                    }

                    if (url.includes('fetchResources')) {
                        try {
                            const r = json.resources || json;
                            ogl.db.updatePlanet(Meta.planetId, {
                                metal:  r.metal?.amount   || 0,
                                crystal:r.crystal?.amount || 0,
                                deut:   r.deuterium?.amount || 0,
                                food:   r.food?.amount    || 0,
                                prodMetal:   r.metal?.production   || 0,
                                prodCrystal: r.crystal?.production || 0,
                                prodDeut:    r.deuterium?.production || 0,
                                metalStorage:   r.metal?.storage   || 0,
                                crystalStorage: r.crystal?.storage || 0,
                                deutStorage:    r.deuterium?.storage || 0,
                            });
                            ogl.db.save();
                            ogl.planetList?.refresh();
                        } catch(e) {}
                    }

                    if (json?.newAjaxToken) try { unsafeWindow.token = json.newAjaxToken; } catch(e) {}
                } catch(e) {}
            });
        } catch(e) {}
    }

    // ─── INIT ─────────────────────────────────────────────────────────────────
    function main() {
        const db = new DB();
        if (!db.init()) return;

        const ogl = {
            db,
            planetList: new PlanetListManager(db),
            empire:     new EmpireManager(db),
            messages:   new MessageManager(db),
            galaxy:     new GalaxyManager(db),
            movement:   new MovementManager(db),
            fleet:      new FleetManager(db),
            ui:         new UIManager(db),
            shortcuts:  new ShortcutManager(db),
        };
        window.ogl13 = ogl;

        // Legge dati pagina corrente
        ogl.empire.readCurrentPage();
        setTimeout(() => ogl.empire.fetchResources(), 1500);

        // UI sempre attiva
        ogl.ui.init();
        ogl.shortcuts.init();
        ogl.planetList.init();

        // Movement (eventi flotta) su tutte le pagine
        ogl.movement.init();

        // Empire auto-sync
        ogl.empire.init();

        // Page-specific
        if (Meta.isMessages) ogl.messages.init();
        if (Meta.isGalaxy)   ogl.galaxy.init();
        if (Meta.isFleet)    ogl.fleet.init();

        // AJAX hooks — attende jQuery
        const poll = setInterval(() => {
            try {
                if (unsafeWindow.jQuery || unsafeWindow.$) { clearInterval(poll); setupAjaxHooks(ogl); }
            } catch(e) { clearInterval(poll); }
        }, 100);
        setTimeout(() => clearInterval(poll), 5000);

        // Save periodico
        setInterval(() => db.save(), 30000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();
