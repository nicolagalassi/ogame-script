// ==UserScript==
// @name         OGLight v13
// @namespace    https://greasyfork.org/
// @version      1.0.0
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
    GM_addStyle(`
        /* side panel */
        .ogl13-side {
            position: fixed; top: 0; right: 0; width: 280px; height: 100vh;
            background: #0d1117; border-left: 1px solid #2a3a4a;
            z-index: 9999; display: flex; flex-direction: column;
            transform: translateX(100%); transition: transform .2s;
            font-size: 11px; color: #ccc; overflow: hidden;
        }
        .ogl13-side.open { transform: translateX(0); }
        .ogl13-side-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 6px 8px; background: #161e2e; border-bottom: 1px solid #2a3a4a;
            font-size: 12px; font-weight: bold; color: #88aaff; flex-shrink: 0;
        }
        .ogl13-side-close {
            cursor: pointer; color: #666; font-size: 16px; line-height: 1;
            padding: 2px 4px;
        }
        .ogl13-side-close:hover { color: #ccc; }
        .ogl13-side-content { overflow-y: auto; flex: 1; padding: 4px; }
        .ogl13-side-tabs {
            display: flex; gap: 2px; padding: 4px; flex-shrink: 0;
            background: #0a0f18; border-bottom: 1px solid #1a2a3a;
        }
        .ogl13-tab {
            flex: 1; padding: 4px 6px; text-align: center; cursor: pointer;
            border: 1px solid #2a3a4a; border-radius: 3px; font-size: 10px;
            color: #888; background: #111;
        }
        .ogl13-tab.active { color: #88aaff; border-color: #88aaff; background: #161e2e; }

        /* topbar */
        .ogl13-topbar {
            display: flex; gap: 4px; padding: 2px 4px;
            background: #0a0f18; border-bottom: 1px solid #1a2a3a;
        }
        .ogl13-topbar-btn {
            width: 24px; height: 24px; border: 1px solid #2a3a4a;
            border-radius: 3px; background: #111; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; color: #888; title: attr(title);
        }
        .ogl13-topbar-btn:hover { color: #88aaff; border-color: #88aaff; }
        .ogl13-topbar-btn.active { color: #ffcc44; border-color: #ffcc44; }

        /* pianeta sidebar */
        .ogl13-res {
            font-size: 9px; display: flex; gap: 3px; padding: 1px 2px;
            flex-wrap: wrap; line-height: 1.2;
        }
        .ogl13-res span { color: #aaa; white-space: nowrap; }
        .ogl13-res .ogl13-m { color: #e8a040; }
        .ogl13-res .ogl13-c { color: #44aaff; }
        .ogl13-res .ogl13-d { color: #44ffaa; }
        .ogl13-res .ogl13-warn { color: #ffaa00 !important; }
        .ogl13-res .ogl13-danger { color: #ff4444 !important; }
        .ogl13-refresh { font-size: 9px; color: #555; padding: 0 2px; }
        .ogl13-fleet-icons {
            display: flex; gap: 1px; padding: 1px 2px; flex-wrap: wrap;
        }
        .ogl13-fleet-icon {
            width: 14px; height: 14px; border-radius: 2px;
            display: flex; align-items: center; justify-content: center;
            font-size: 9px; cursor: default;
        }
        .ogl13-fleet-icon.m1 { background: #8b1a1a; color: #ffaaaa; }  /* attacco */
        .ogl13-fleet-icon.m3 { background: #1a3a8b; color: #aaccff; }  /* trasporto */
        .ogl13-fleet-icon.m4 { background: #1a5a1a; color: #aaffaa; }  /* schieramento */
        .ogl13-fleet-icon.m5 { background: #4a3a0a; color: #ffdd88; }  /* stazionamento */
        .ogl13-fleet-icon.m6 { background: #2a1a4a; color: #ccaaff; }  /* spionaggio */
        .ogl13-fleet-icon.m7 { background: #1a4a4a; color: #aaffee; }  /* colonizzazione */
        .ogl13-fleet-icon.m8 { background: #3a3a1a; color: #ffffaa; }  /* raccolta */
        .ogl13-fleet-icon.m15{ background: #1a1a4a; color: #aaaaff; }  /* spedizione */
        .ogl13-fleet-icon.ret{ opacity: .5; }
        .ogl13-recap {
            padding: 4px 6px; border-top: 1px solid #2a3a4a; font-size: 10px;
            color: #888; background: #0a0f18;
        }
        .ogl13-recap div { display: flex; justify-content: space-between; }
        .ogl13-recap .ogl13-m { color: #e8a040; }
        .ogl13-recap .ogl13-c { color: #44aaff; }
        .ogl13-recap .ogl13-d { color: #44ffaa; }

        /* spy table */
        .ogl13-spytable-wrap {
            margin-bottom: 8px; border: 1px solid #2a3a4a; border-radius: 4px;
            overflow: hidden;
        }
        .ogl13-spytable {
            width: 100%; border-collapse: collapse; font-size: 10px; color: #ccc;
        }
        .ogl13-spytable th {
            background: #161e2e; padding: 4px 6px; text-align: right;
            cursor: pointer; border-bottom: 1px solid #2a3a4a; white-space: nowrap;
            color: #88aaff; user-select: none;
        }
        .ogl13-spytable th:first-child,
        .ogl13-spytable th:nth-child(2) { text-align: left; }
        .ogl13-spytable th.sort-asc::after { content: ' ▲'; }
        .ogl13-spytable th.sort-desc::after { content: ' ▼'; }
        .ogl13-spytable td {
            padding: 3px 6px; text-align: right; border-bottom: 1px solid #1a2530;
            vertical-align: middle;
        }
        .ogl13-spytable td:first-child,
        .ogl13-spytable td:nth-child(2) { text-align: left; }
        .ogl13-spytable tr:hover td { background: #111e2e; }
        .ogl13-spytable tr.ogl13-highlight td { background: #0a2a0a; }
        .ogl13-spytable tr.ogl13-ignore td { opacity: .4; }
        .ogl13-spytable .ogl13-m { color: #e8a040; }
        .ogl13-spytable .ogl13-c { color: #44aaff; }
        .ogl13-spytable .ogl13-d { color: #44ffaa; }
        .ogl13-spytable .ogl13-msu { color: #ffcc44; }
        .ogl13-spytable .ogl13-fleet-v { color: #ff6666; }
        .ogl13-spytable .ogl13-def-v { color: #ff9944; }
        .ogl13-spytable .ogl13-loot { color: #88ff88; }
        .ogl13-coords-link { color: #88aaff; text-decoration: none; cursor: pointer; }
        .ogl13-coords-link:hover { text-decoration: underline; }
        .ogl13-spy-btn {
            font-size: 9px; padding: 1px 4px; border: 1px solid #2a4a6a;
            background: #0a1a2a; color: #88aaff; cursor: pointer; border-radius: 2px;
            margin-left: 4px;
        }
        .ogl13-spy-btn:hover { background: #1a3a5a; }
        .ogl13-age-old { color: #ff6666 !important; }
        .ogl13-age-mid { color: #ffaa44 !important; }
        .ogl13-age-fresh { color: #88ff88 !important; }

        /* galaxy */
        .ogl13-galaxy-tag {
            display: inline-block; width: 10px; height: 10px; border-radius: 2px;
            cursor: pointer; margin-left: 3px; vertical-align: middle;
        }
        .ogl13-galaxy-pin {
            font-size: 10px; cursor: pointer; margin-left: 3px; vertical-align: middle;
            color: #666;
        }
        .ogl13-galaxy-pin.pinned { color: #ffcc44; }
        .ogl13-tag-picker {
            position: absolute; z-index: 10000; background: #0d1117;
            border: 1px solid #2a3a4a; border-radius: 4px; padding: 4px;
            display: flex; gap: 3px; flex-wrap: wrap; width: 100px;
        }
        .ogl13-tag-picker span {
            width: 18px; height: 18px; border-radius: 3px; cursor: pointer;
            border: 1px solid rgba(255,255,255,.2);
        }
        .ogl13-tag-picker span:hover { border-color: #fff; }

        /* fleet dispatch */
        .ogl13-capacity-bar {
            margin: 6px 0; height: 8px; background: #1a2530;
            border-radius: 4px; overflow: hidden;
        }
        .ogl13-capacity-fill {
            height: 100%; background: #2a7a2a; border-radius: 4px;
            transition: width .3s;
        }
        .ogl13-capacity-fill.over { background: #8a2a2a; }
        .ogl13-capacity-info {
            font-size: 10px; color: #888; display: flex;
            justify-content: space-between; margin: 2px 0;
        }

        /* settings */
        .ogl13-settings { padding: 8px; }
        .ogl13-settings h3 { color: #88aaff; font-size: 11px; margin: 8px 0 4px; }
        .ogl13-settings label {
            display: flex; align-items: center; gap: 6px;
            margin: 4px 0; cursor: pointer; font-size: 10px; color: #aaa;
        }
        .ogl13-settings input[type=checkbox] { cursor: pointer; }
        .ogl13-settings input[type=text],
        .ogl13-settings input[type=number] {
            background: #111; border: 1px solid #2a3a4a; color: #ccc;
            padding: 2px 4px; font-size: 10px; border-radius: 2px; width: 80px;
        }
        .ogl13-btn {
            padding: 4px 10px; background: #1a3a5a; border: 1px solid #2a5a8a;
            color: #88aaff; cursor: pointer; border-radius: 3px; font-size: 10px;
        }
        .ogl13-btn:hover { background: #2a4a7a; }
        .ogl13-btn.danger { background: #3a1a1a; border-color: #6a2a2a; color: #ff8888; }

        /* account summary */
        .ogl13-account { padding: 4px; }
        .ogl13-account table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .ogl13-account th {
            background: #161e2e; padding: 3px 5px; color: #88aaff;
            border-bottom: 1px solid #2a3a4a; text-align: left;
        }
        .ogl13-account td {
            padding: 2px 5px; border-bottom: 1px solid #111e2e; color: #aaa;
        }
        .ogl13-account td:last-child { text-align: right; }
        .ogl13-account .ogl13-total { color: #fff; font-weight: bold; }

        /* stats */
        .ogl13-stats { padding: 4px; }
        .ogl13-stats-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 2px 4px; border-bottom: 1px solid #111e2e; font-size: 10px;
        }
        .ogl13-stats-row:hover { background: #111e2e; }
        .ogl13-stats-label { color: #888; }
        .ogl13-stats-val { color: #ffcc44; }

        /* notifiche toast */
        .ogl13-toast {
            position: fixed; bottom: 20px; right: 20px; z-index: 99999;
            background: #161e2e; border: 1px solid #2a5a8a;
            border-radius: 4px; padding: 8px 14px; font-size: 11px; color: #ccc;
            animation: ogl13-fadein .3s; max-width: 260px;
        }
        .ogl13-toast.error { border-color: #6a2a2a; color: #ff8888; }
        .ogl13-toast.success { border-color: #2a6a2a; color: #88ff88; }
        @keyframes ogl13-fadein { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        /* pinned players */
        .ogl13-pinned-item {
            display: flex; align-items: center; justify-content: space-between;
            padding: 4px 6px; border-bottom: 1px solid #111e2e; cursor: pointer;
        }
        .ogl13-pinned-item:hover { background: #111e2e; }
        .ogl13-pinned-item .name { color: #88aaff; font-size: 10px; }
        .ogl13-pinned-item .info { color: #666; font-size: 9px; }
        .ogl13-pin-type {
            font-size: 9px; padding: 1px 3px; border-radius: 2px; margin-right: 4px;
        }
        .ogl13-pin-friend { background:#1a4a1a; color:#aaffaa; }
        .ogl13-pin-rush   { background:#4a2a1a; color:#ffccaa; }
        .ogl13-pin-danger { background:#4a1a1a; color:#ffaaaa; }
        .ogl13-pin-trade  { background:#1a3a4a; color:#aaccff; }

        /* tag colors */
        .ogl13-tag-red    { background:#aa2222; }
        .ogl13-tag-orange { background:#aa6622; }
        .ogl13-tag-yellow { background:#aaaa22; }
        .ogl13-tag-green  { background:#22aa22; }
        .ogl13-tag-cyan   { background:#22aaaa; }
        .ogl13-tag-blue   { background:#2244aa; }
        .ogl13-tag-purple { background:#8822aa; }
        .ogl13-tag-pink   { background:#aa2288; }
        .ogl13-tag-white  { background:#aaaaaa; }
        .ogl13-tag-none   { background:#333; }
    `);

    // ─── COSTANTI ─────────────────────────────────────────────────────────────
    const TAG_COLORS = ['red','orange','yellow','green','cyan','blue','purple','pink','white','none'];
    const PIN_TYPES  = ['friend','rush','danger','skull','trade','money','star','ptre','none'];
    const MISSION_ICONS = { 1:'⚔',2:'⚔',3:'▲',4:'●',5:'◆',6:'👁',7:'🌍',8:'♻',9:'💥',10:'🚀',15:'🔭',18:'🔍' };
    const MISSION_NAMES = { 1:'Attacco',2:'ACS',3:'Trasporto',4:'Schieramento',5:'Stazionamento',6:'Spionaggio',7:'Colonizzazione',8:'Raccolta',9:'Distruzione',10:'Attacco missili',15:'Spedizione',18:'Discovery' };
    const SHIP_NAMES = {
        202:'Cargo leggero',203:'Cargo pesante',204:'Caccia leggero',205:'Caccia pesante',
        206:'Incrociatore',207:'Corazzata',208:'Colonizzatrice',209:'Riciclatrice',
        210:'Sonda spia',211:'Bombardiere',212:'Satellite solare',213:'Distruttore',
        214:'Stella della morte',215:'Incrociatore da battaglia',217:'Bombardiere furtivo',
        218:'Raider',219:'Esploratore',
    };
    const TECH_NAMES = {
        1:'Miniera metallo',2:'Miniera cristallo',3:'Sintetizzatore deuterio',
        4:'Centrale solare',5:'Fusore',6:'Robot',7:'Nano-robot',8:'Cantiere navale',
        9:'Deposito metallo',10:'Deposito cristallo',11:'Cisterna deuterio',
        12:'Laboratorio',14:'Terraformer',15:'Alleanza deposito',
        21:'Hangar',22:'Phalanx',23:'Portale di salto',24:'Luna',
        31:'Idroimpianto',33:'Fusione fusion',34:'Convertitore materia',
        36:'Reattore a gravità',41:'Armeria robotizzata',42:'Magazzino cristallo',
        43:'Magazzino deuterio',44:'Re-entry tech',
        109:'Motore ad impulsi',110:'Motore a reazione',111:'Motore iperspaziale',
        113:'Armature',114:'Scudi',115:'Armi',
        120:'Iperspace',121:'Informatica',122:'Astrofisica',
        123:'IRN',124:'Graviton',
        // lifeform buildings 11xxx omitted for brevity
    };
    const DB_VERSION = 1;

    // ─── UTILITIES ────────────────────────────────────────────────────────────
    const Util = {
        formatNum(n, digits = 0) {
            if (n == null || isNaN(n)) return '-';
            const abs = Math.abs(n);
            if (abs >= 1e9) return (n / 1e9).toFixed(1) + 'G';
            if (abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
            if (abs >= 1e3) return (n / 1e3).toFixed(digits > 0 ? digits : 0) + 'K';
            return n.toFixed(0);
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
            const m = String(str).match(/(\d+)[:\s](\d+)[:\s](\d+)/);
            return m ? { g: +m[1], s: +m[2], p: +m[3] } : null;
        },
        serverNow() {
            try {
                const st = unsafeWindow.serverTime;
                if (st instanceof Date) return Math.floor(st.getTime() / 1000);
            } catch (e) {}
            return Math.floor(Date.now() / 1000);
        },
        fleetLink(g, s, p, type = 1) {
            return `/game/index.php?page=ingame&component=fleetdispatch&galaxy=${g}&system=${s}&position=${p}&type=${type}&mission=6`;
        },
        galaxyLink(g, s) {
            return `/game/index.php?page=ingame&component=galaxy&galaxy=${g}&system=${s}`;
        },
        msu(m, c, d) {
            return m / 3 + c * 2 / 3 + d;
        },
        toast(msg, type = 'info', duration = 3000) {
            const el = document.createElement('div');
            el.className = `ogl13-toast${type !== 'info' ? ' ' + type : ''}`;
            el.textContent = msg;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), duration);
        },
        el(tag, cls, html = '') {
            const e = document.createElement(tag);
            if (cls) e.className = cls;
            if (html) e.innerHTML = html;
            return e;
        },
        qs(sel, ctx = document) { return ctx.querySelector(sel); },
        qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },
    };

    // ─── META ──────────────────────────────────────────────────────────────────
    const Meta = {
        _cache: {},
        _m(name) {
            if (!(name in this._cache)) {
                this._cache[name] = document.querySelector(`meta[name="${name}"]`)?.content || '';
            }
            return this._cache[name];
        },
        get playerId()    { return parseInt(this._m('ogame-player-id')) || 0; },
        get playerName()  { return this._m('ogame-player-name'); },
        get planetId()    { return parseInt(this._m('ogame-planet-id')) || 0; },
        get planetType()  { return this._m('ogame-planet-type') || 'planet'; },
        get planetCoords(){ return this._m('ogame-planet-coordinates'); },
        get language()    { return this._m('ogame-language') || 'en'; },
        get universe()    { return this._m('ogame-universe'); },
        get universeName(){ return this._m('ogame-universe-name'); },
        get uniSpeed()    { return parseInt(this._m('ogame-universe-speed')) || 1; },
        get speedPeace()  { return parseInt(this._m('ogame-universe-speed-fleet-peaceful')) || 1; },
        get speedWar()    { return parseInt(this._m('ogame-universe-speed-fleet-war')) || 1; },
        get speedHold()   { return parseInt(this._m('ogame-universe-speed-fleet-holding')) || 1; },
        get donutGal()    { return this._m('ogame-donut-galaxy') === '1'; },
        get donutSys()    { return this._m('ogame-donut-system') === '1'; },
        get token()       { try { return unsafeWindow.token || ''; } catch(e) { return ''; } },
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
        get isMovement() { return this.page === 'movement'; },
        get isOverview() { return this.page === 'overview' || this.page === 'ingame'; },
        reset() { this._cache = {}; },
    };

    // ─── DB ───────────────────────────────────────────────────────────────────
    class DB {
        constructor() {
            this._key = null;
            this.data = null;
        }

        _defaults() {
            return {
                version: DB_VERSION,
                myPlanets: {},      // { [planetId]: { coords, type, metal, crystal, deut, food, ... } }
                udb: {},            // { [playerId]: { name, status, pin, score, planets, liveUpdate } }
                pdb: {},            // { ['g:s:p']: { uid, pid, mid, acti, debris } }
                tdb: {},            // { ['gggsssp']: { tag } }
                messageDb: {},      // { [hashcode]: spy report data }
                stats: {},          // { ['YYYY-M-D']: { raid, expe, debris, ... } }
                options: {
                    showResources: true,
                    showFleetIcons: true,
                    showSpyTable: true,
                    showGalaxyTags: true,
                    probeCount: 6,
                    fleetLimiter: false,
                    browserNotif: false,
                    ptreTK: '',
                },
                lastEmpireUpdate: 0,
                lastApiUpdate: 0,
                fleetLimiter: { ships: {}, resources: {} },
                quickRaidList: [],
                lastFleet: null,
            };
        }

        init() {
            this._key = Meta.dbKey;
            if (!this._key || Meta.playerId === 0) return false;
            try {
                const raw = GM_getValue(this._key, null);
                if (raw) {
                    this.data = { ...this._defaults(), ...JSON.parse(raw) };
                } else {
                    this.data = this._defaults();
                }
            } catch (e) {
                this.data = this._defaults();
            }
            return true;
        }

        save() {
            if (!this._key || !this.data) return;
            try {
                GM_setValue(this._key, JSON.stringify(this.data));
            } catch (e) {}
        }

        get(path) {
            if (!this.data) return undefined;
            return path.split('.').reduce((o, k) => o?.[k], this.data);
        }

        set(path, val) {
            if (!this.data) return;
            const keys = path.split('.');
            let obj = this.data;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!(keys[i] in obj)) obj[keys[i]] = {};
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = val;
        }

        updatePlanet(planetId, data) {
            if (!this.data) return;
            this.data.myPlanets[planetId] = {
                ...(this.data.myPlanets[planetId] || {}),
                ...data,
                lastRefresh: Util.serverNow(),
            };
        }

        saveReport(hashcode, data) {
            if (!this.data) return;
            this.data.messageDb[hashcode] = { ...data, savedAt: Util.serverNow() };
            // limita a 500 report
            const keys = Object.keys(this.data.messageDb);
            if (keys.length > 500) {
                const sorted = keys.sort((a,b) => (this.data.messageDb[a].savedAt||0) - (this.data.messageDb[b].savedAt||0));
                sorted.slice(0, keys.length - 500).forEach(k => delete this.data.messageDb[k]);
            }
        }

        getOption(key, def = null) {
            return this.data?.options?.[key] ?? def;
        }

        setOption(key, val) {
            if (!this.data) return;
            this.data.options[key] = val;
        }

        todayKey() {
            const d = new Date();
            return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        }

        addStat(type, data) {
            if (!this.data) return;
            const k = this.todayKey();
            if (!this.data.stats[k]) this.data.stats[k] = {};
            const s = this.data.stats[k];
            if (!s[type]) s[type] = { metal:0, crystal:0, deut:0, food:0, count:0 };
            s[type].metal   += data.metal   || 0;
            s[type].crystal += data.crystal || 0;
            s[type].deut    += data.deut    || 0;
            s[type].food    += data.food    || 0;
            s[type].count   += 1;
            // pulisce stat più vecchie di 90 giorni
            const cutoff = Date.now() - 90 * 86400000;
            Object.keys(this.data.stats).forEach(k2 => {
                if (new Date(k2).getTime() < cutoff) delete this.data.stats[k2];
            });
        }
    }

    // ─── PLANET LIST MANAGER ──────────────────────────────────────────────────
    class PlanetListManager {
        constructor(db) {
            this.db = db;
            this.fleetEvents = [];
        }

        init() {
            this._injectTopbar();
            this._updateAll();
            this._injectRecap();
        }

        _injectTopbar() {
            const planetList = Util.qs('#planetList');
            if (!planetList) return;
            const bar = Util.el('div', 'ogl13-topbar');
            const btns = [
                { icon: '📦', title: 'Collect tutte le risorse', action: () => this._collectAll() },
                { icon: '👤', title: 'Account Summary', action: () => window.ogl13?.ui?.openTab('account') },
                { icon: '📌', title: 'Pinned Players', action: () => window.ogl13?.ui?.openTab('pinned') },
                { icon: '🏷', title: 'Tagged Planets', action: () => window.ogl13?.ui?.openTab('tagged') },
                { icon: '⚙', title: 'Impostazioni', action: () => window.ogl13?.ui?.openTab('settings') },
                { icon: '🔄', title: 'Sincronizza Empire', action: () => window.ogl13?.empire?.fetchAll() },
            ];
            btns.forEach(b => {
                const btn = Util.el('div', 'ogl13-topbar-btn');
                btn.title = b.title;
                btn.textContent = b.icon;
                btn.addEventListener('click', b.action);
                bar.appendChild(btn);
            });
            planetList.insertAdjacentElement('beforebegin', bar);
        }

        _updateAll() {
            if (!this.db.getOption('showResources', true) && !this.db.getOption('showFleetIcons', true)) return;
            Util.qsa('#planetList .smallplanet').forEach(el => this._updatePlanet(el));
        }

        _updatePlanet(el) {
            // leggi ID pianeta dal link
            const link = Util.qs('.planetlink, .moonlink', el);
            if (!link) return;
            const href = link.getAttribute('href') || '';
            const m = href.match(/cp=(\d+)/);
            if (!m) return;
            const planetId = parseInt(m[1]);
            const pdata = this.db.data?.myPlanets?.[planetId];

            // rimuovi vecchi elementi OGL
            Util.qsa('.ogl13-res, .ogl13-refresh, .ogl13-fleet-icons', el).forEach(e => e.remove());

            if (pdata && this.db.getOption('showResources', true)) {
                this._injectResources(el, pdata);
            }

            if (this.db.getOption('showFleetIcons', true)) {
                this._injectFleetIcons(el, planetId, pdata?.coords);
            }
        }

        _injectResources(el, pdata) {
            const div = Util.el('div', 'ogl13-res');
            const now = Util.serverNow();
            const age = now - (pdata.lastRefresh || 0);
            const prod = pdata.lastRefresh ? age : 0;

            const m = (pdata.metal   || 0) + (pdata.prodMetal   || 0) * prod;
            const c = (pdata.crystal || 0) + (pdata.prodCrystal || 0) * prod;
            const d = (pdata.deut    || 0) + (pdata.prodDeut    || 0) * prod;

            const cls = (val, stor) => {
                if (!stor || stor === 0) return '';
                const r = val / stor;
                if (r > .9) return ' ogl13-danger';
                if (r > .75) return ' ogl13-warn';
                return '';
            };

            div.innerHTML = `<span class="ogl13-m${cls(m, pdata.metalStorage)}">${Util.formatNum(m)}</span>` +
                            `<span class="ogl13-c${cls(c, pdata.crystalStorage)}">${Util.formatNum(c)}</span>` +
                            `<span class="ogl13-d${cls(d, pdata.deutStorage)}">${Util.formatNum(d)}</span>`;

            if (pdata.lastRefresh) {
                const minAgo = Math.floor(age / 60);
                const refresh = Util.el('div', 'ogl13-refresh');
                refresh.textContent = minAgo < 60 ? `${minAgo}m fa` : `${Math.floor(minAgo/60)}h fa`;
                el.appendChild(refresh);
            }
            el.appendChild(div);
        }

        _injectFleetIcons(el, planetId, coords) {
            if (!this.fleetEvents.length) return;
            const relevant = this.fleetEvents.filter(ev => {
                return ev.destId === planetId || ev.originId === planetId;
            });
            if (!relevant.length) return;
            const div = Util.el('div', 'ogl13-fleet-icons');
            relevant.forEach(ev => {
                const icon = Util.el('div', `ogl13-fleet-icon m${ev.mission}${ev.returning ? ' ret' : ''}`);
                icon.title = `${MISSION_NAMES[ev.mission] || ev.mission} — ${ev.returning ? 'ritorno' : 'arrivo'} ${new Date(ev.arrivalTime * 1000).toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'})}`;
                icon.textContent = MISSION_ICONS[ev.mission] || ev.mission;
                div.appendChild(icon);
            });
            el.appendChild(div);
        }

        _injectRecap() {
            const planetList = Util.qs('#planetList');
            if (!planetList) return;
            Util.qs('.ogl13-recap', planetList)?.remove();

            const planets = Object.values(this.db.data?.myPlanets || {});
            if (!planets.length) return;

            const now = Util.serverNow();
            let totM = 0, totC = 0, totD = 0;
            planets.forEach(p => {
                const age = now - (p.lastRefresh || 0);
                const prod = p.lastRefresh ? age : 0;
                totM += (p.metal   || 0) + (p.prodMetal   || 0) * prod;
                totC += (p.crystal || 0) + (p.prodCrystal || 0) * prod;
                totD += (p.deut    || 0) + (p.prodDeut    || 0) * prod;
            });

            const recap = Util.el('div', 'ogl13-recap');
            recap.innerHTML = `
                <div><span class="ogl13-m">M</span><span class="ogl13-m">${Util.formatNum(totM)}</span></div>
                <div><span class="ogl13-c">C</span><span class="ogl13-c">${Util.formatNum(totC)}</span></div>
                <div><span class="ogl13-d">D</span><span class="ogl13-d">${Util.formatNum(totD)}</span></div>
                <div><span>MSU</span><span class="ogl13-msu">${Util.formatNum(Util.msu(totM,totC,totD))}</span></div>
            `;
            planetList.appendChild(recap);
        }

        setFleetEvents(events) {
            this.fleetEvents = events;
            this._updateAll();
            this._injectRecap();
        }

        _collectAll() {
            Util.toast('Funzione collect: naviga su ogni pianeta per raccogliere risorse.', 'info');
        }
    }

    // ─── EMPIRE MANAGER ───────────────────────────────────────────────────────
    class EmpireManager {
        constructor(db) {
            this.db = db;
            this.fetching = false;
        }

        init() {
            // fetch automatico se dati vecchi > 3 minuti
            const age = Util.serverNow() - (this.db.data?.lastEmpireUpdate || 0);
            if (age > 180) {
                setTimeout(() => this.fetchAll(), 2000);
            }
        }

        async fetchAll() {
            if (this.fetching) return;
            this.fetching = true;
            Util.toast('Aggiornamento empire in corso…', 'info', 5000);
            try {
                await this._fetchEmpire(0); // pianeti
                await this._fetchEmpire(1); // lune
                this.db.data.lastEmpireUpdate = Util.serverNow();
                this.db.save();
                Util.toast('Empire aggiornato!', 'success');
                window.ogl13?.planetList?.init();
            } catch (e) {
                Util.toast('Errore aggiornamento empire: ' + e.message, 'error');
            }
            this.fetching = false;
        }

        _fetchEmpire(type) {
            return new Promise((resolve, reject) => {
                const url = `/game/index.php?page=ajax&component=empire&ajax=1&planetType=${type}&token=${Meta.token}`;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: location.origin + url,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    onload: (res) => {
                        try {
                            this._parseEmpireHtml(res.responseText, type);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    },
                    onerror: () => reject(new Error('Network error')),
                });
            });
        }

        _parseEmpireHtml(html, type) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // ogni pianeta/luna è in un .listOfPlanets .smallplanet o simile
            // oppure nei dati inline script — proviamo entrambi gli approcci

            // approccio 1: cerca script inline con dati pianeta
            const scripts = Util.qsa('script', doc);
            scripts.forEach(s => {
                const txt = s.textContent;
                if (!txt.includes('currentPlanet') && !txt.includes('metalOnPlanet')) return;
                this._extractPlanetFromScript(txt, type);
            });

            // approccio 2: cerca i .planet-js-pos elementi con data attributes
            Util.qsa('[data-planet-id], [data-moon-id]', doc).forEach(el => {
                this._extractPlanetFromElement(el, type);
            });

            // approccio 3: cerca tabella empire (se esiste)
            this._parseEmpireTable(doc, type);
        }

        _extractPlanetFromScript(txt, type) {
            try {
                const planetId = this._extractVar(txt, 'currentPlanetId') ||
                                 this._extractVar(txt, 'currentSpaceObjectId');
                if (!planetId) return;

                const data = {
                    type: type === 1 ? 'moon' : 'planet',
                    coords: this._extractVar(txt, 'currentPlanet', 'coords') || '',
                    metal:   this._extractNum(txt, 'metalOnPlanet'),
                    crystal: this._extractNum(txt, 'crystalOnPlanet'),
                    deut:    this._extractNum(txt, 'deuteriumOnPlanet'),
                    food:    this._extractNum(txt, 'foodOnPlanet'),
                    metalStorage:   this._extractNum(txt, 'metalStorageCapacity'),
                    crystalStorage: this._extractNum(txt, 'crystalStorageCapacity'),
                    deutStorage:    this._extractNum(txt, 'deuteriumStorageCapacity'),
                };

                if (planetId) this.db.updatePlanet(parseInt(planetId), data);
            } catch (e) {}
        }

        _extractPlanetFromElement(el, type) {
            const planetId = parseInt(el.dataset.planetId || el.dataset.moonId || 0);
            if (!planetId) return;
            const coords = el.dataset.coords || '';
            const resources = {};
            Util.qsa('.resource_metal, [data-metal]', el).forEach(r => {
                resources.metal = parseInt(r.dataset.amount || r.textContent.replace(/\D/g,'')) || 0;
            });
            if (Object.keys(resources).length || coords) {
                this.db.updatePlanet(planetId, { type: type === 1 ? 'moon' : 'planet', coords, ...resources });
            }
        }

        _parseEmpireTable(doc, type) {
            // L'empire view ha righe per ogni pianeta con celle per ogni edificio
            // Struttura tipica: table.listOfPlanets o div con classi specifiche
            const rows = Util.qsa('.planet-row, .empire-row, [data-coords]', doc);
            rows.forEach(row => {
                const planetId = parseInt(row.dataset.planetId || row.dataset.id || 0);
                if (!planetId) return;
                const data = { type: type === 1 ? 'moon' : 'planet' };
                const coords = row.dataset.coords || Util.qs('.planet-coords', row)?.textContent?.trim() || '';
                if (coords) data.coords = coords;

                // edifici
                Util.qsa('[data-technology-id], [data-tech-id]', row).forEach(cell => {
                    const techId = parseInt(cell.dataset.technologyId || cell.dataset.techId || 0);
                    const level  = parseInt(cell.dataset.level || cell.textContent || 0);
                    if (techId && !isNaN(level)) data[techId] = level;
                });

                this.db.updatePlanet(planetId, data);
            });
        }

        _extractVar(txt, varName) {
            const m = txt.match(new RegExp(`var\\s+${varName}\\s*=\\s*([\\d.]+)`));
            return m ? m[1] : null;
        }

        _extractNum(txt, varName) {
            const m = txt.match(new RegExp(`var\\s+${varName}\\s*=\\s*([\\d.]+)`));
            return m ? parseFloat(m[1]) : 0;
        }

        // Leggi risorse dalla pagina corrente (quando si naviga su un pianeta)
        readCurrentPlanet() {
            if (!Meta.planetId) return;
            try {
                const uw = unsafeWindow;
                const data = {
                    type:    Meta.planetType,
                    coords:  Meta.planetCoords,
                    metal:   uw.metalOnPlanet   || 0,
                    crystal: uw.crystalOnPlanet || 0,
                    deut:    uw.deuteriumOnPlanet || 0,
                    food:    uw.foodOnPlanet    || 0,
                };
                // prova a leggere dal resourcesBar
                const rb = uw.resourcesBar?.resources;
                if (rb) {
                    data.metal   = rb.metal?.amount   || data.metal;
                    data.crystal = rb.crystal?.amount || data.crystal;
                    data.deut    = rb.deuterium?.amount || data.deut;
                    data.prodMetal   = rb.metal?.production   || 0;
                    data.prodCrystal = rb.crystal?.production || 0;
                    data.prodDeut    = rb.deuterium?.production || 0;
                }
                this.db.updatePlanet(Meta.planetId, data);
                this.db.save();
            } catch (e) {}
        }

        // Fetch risorse del pianeta corrente via API
        fetchCurrentResources() {
            try {
                const uri = unsafeWindow.ajaxResourceboxURI;
                if (!uri) return;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: uri,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    onload: (res) => {
                        try {
                            const json = JSON.parse(res.responseText);
                            const r = json.resources || json;
                            const data = {
                                type:    Meta.planetType,
                                coords:  Meta.planetCoords,
                                metal:   r.metal?.amount   || r.metal   || 0,
                                crystal: r.crystal?.amount || r.crystal || 0,
                                deut:    r.deuterium?.amount || r.deut  || 0,
                                food:    r.food?.amount    || r.food    || 0,
                                prodMetal:   r.metal?.production   || 0,
                                prodCrystal: r.crystal?.production || 0,
                                prodDeut:    r.deuterium?.production || 0,
                                metalStorage:   r.metal?.storage   || 0,
                                crystalStorage: r.crystal?.storage || 0,
                                deutStorage:    r.deuterium?.storage || 0,
                            };
                            this.db.updatePlanet(Meta.planetId, data);
                            this.db.save();
                            window.ogl13?.planetList?._updateAll();
                            window.ogl13?.planetList?._injectRecap();
                        } catch (e) {}
                    },
                });
            } catch (e) {}
        }
    }

    // ─── MESSAGE MANAGER (SPY TABLE) ──────────────────────────────────────────
    class MessageManager {
        constructor(db) {
            this.db = db;
            this.reports = [];
            this.sortKey = 'msu';
            this.sortDir = -1;
        }

        init() {
            if (!this.db.getOption('showSpyTable', true)) return;
            this._scanPage();
            this._renderTable();
        }

        _scanPage() {
            this.reports = [];
            Util.qsa('.rawMessageData').forEach(el => {
                const r = this._parseRawData(el);
                if (r) this.reports.push(r);
            });
            // carica anche dal db
            const saved = this.db.data?.messageDb || {};
            Object.values(saved).forEach(r => {
                if (!this.reports.find(x => x.hashcode === r.hashcode)) {
                    this.reports.push(r);
                }
            });
            // salva nuovi
            this.reports.forEach(r => {
                if (r.hashcode && r.type === 'spy') this.db.saveReport(r.hashcode, r);
            });
            this.db.save();
        }

        _parseRawData(el) {
            const d = el.dataset;
            const msgType = parseInt(d.rawMessagetype || d.rawMessageType || 0);
            // type 10 = spy report
            if (msgType !== 10 && msgType !== 0) return null;
            // deve avere coordinate
            const coords = d.rawCoordinates || d.rawCoords;
            if (!coords) return null;

            const metal   = parseInt(d.rawMetal   || 0);
            const crystal = parseInt(d.rawCrystal || 0);
            const deut    = parseInt(d.rawDeuterium || 0);
            const food    = parseInt(d.rawFood    || 0);
            const loot    = parseInt(d.rawLoot    || 75);
            const fleetV  = parseInt(d.rawFleetvalue  || d.rawFleetValue  || 0);
            const defV    = parseInt(d.rawDefensevalue || d.rawDefenseValue || 0);
            const ts      = parseInt(d.rawTimestamp || 0);
            const age     = parseInt(d.rawReportage || d.rawReportAge || 0) || (Util.serverNow() - ts);
            const activity= parseInt(d.rawActivity || -1);
            const hashcode = d.rawHashcode || d.rawHashCode || '';
            const playerName = d.rawPlayername || d.rawPlayerName || '';
            const targetPlayerId = parseInt(d.rawTargetplayerid || d.rawTargetPlayerId || 0);
            const targetPlanetType = parseInt(d.rawTargetplanettype || d.rawTargetPlanetType || 1);

            let fleet = {}, defense = {}, buildings = {}, research = {};
            try { fleet    = JSON.parse(d.rawFleet    || '{}'); } catch(e) {}
            try { defense  = JSON.parse(d.rawDefense  || '{}'); } catch(e) {}
            try { buildings= JSON.parse(d.rawBuildings|| '{}'); } catch(e) {}
            try { research = JSON.parse(d.rawResearch || '{}'); } catch(e) {}

            const resources = metal + crystal + deut + food;
            const lootable  = Math.floor(resources * loot / 100);
            const msu = Util.msu(metal, crystal, deut);

            // bottino per wave (semplificato a loot% / 2 per wave successiva)
            const waves = [];
            let rem = lootable;
            for (let i = 0; i < 6; i++) {
                const w = Math.floor(rem / 2);
                waves.push(w);
                rem -= w;
            }

            // trova il msgId e il container del messaggio
            const msgEl = el.closest('.msg');
            const msgId = msgEl?.dataset?.msgId || '';

            // link spia
            const c = Util.parseCoords(coords);
            const spyLink = c ? Util.fleetLink(c.g, c.s, c.p, targetPlanetType) : '';

            return {
                type: 'spy',
                hashcode, msgId, coords, playerName,
                targetPlayerId, targetPlanetType,
                metal, crystal, deut, food,
                resources, loot, lootable, msu,
                fleetV, defV, activity,
                fleet, defense, buildings, research,
                ts, age, waves, spyLink,
            };
        }

        _renderTable() {
            if (!this.reports.length) return;
            const container = Util.qs('#messages, .messages-content, #messageDetailDiv, [id*="message"]');
            if (!container) return;
            Util.qs('.ogl13-spytable-wrap')?.remove();

            const wrap = Util.el('div', 'ogl13-spytable-wrap');
            const table = Util.el('table', 'ogl13-spytable');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th data-key="age">Età</th>
                        <th data-key="coords">Coordinate</th>
                        <th data-key="playerName">Giocatore</th>
                        <th data-key="loot">Bottino%</th>
                        <th data-key="metal">Metallo</th>
                        <th data-key="crystal">Cristallo</th>
                        <th data-key="deut">Deuterio</th>
                        <th data-key="msu">MSU</th>
                        <th data-key="fleetV">Fleet</th>
                        <th data-key="defV">Difese</th>
                        <th data-key="activity">Attività</th>
                        <th>Azione</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            // sort
            Util.qsa('th', table).forEach(th => {
                const key = th.dataset.key;
                if (!key) return;
                if (key === this.sortKey) {
                    th.classList.add(this.sortDir === -1 ? 'sort-desc' : 'sort-asc');
                }
                th.addEventListener('click', () => {
                    if (this.sortKey === key) this.sortDir *= -1;
                    else { this.sortKey = key; this.sortDir = -1; }
                    this._fillBody(table);
                    Util.qsa('th', table).forEach(t => t.classList.remove('sort-asc','sort-desc'));
                    th.classList.add(this.sortDir === -1 ? 'sort-desc' : 'sort-asc');
                });
            });

            wrap.appendChild(table);
            container.insertAdjacentElement('beforebegin', wrap);
            this._fillBody(table);
        }

        _fillBody(table) {
            const tbody = Util.qs('tbody', table);
            tbody.innerHTML = '';
            const sorted = [...this.reports].sort((a, b) => {
                let va = a[this.sortKey] ?? 0;
                let vb = b[this.sortKey] ?? 0;
                if (typeof va === 'string') return this.sortDir * va.localeCompare(vb);
                return this.sortDir * (vb - va);
            });

            sorted.forEach(r => {
                const tr = Util.el('tr');
                const ageClass = r.age < 3600 ? 'ogl13-age-fresh' : r.age < 86400 ? 'ogl13-age-mid' : 'ogl13-age-old';
                const ageStr   = Util.formatTime(r.age);
                const actStr   = r.activity === -1 ? '?' : r.activity === 0 ? 'attivo' : `${r.activity}m`;
                const c = Util.parseCoords(r.coords);
                const galaxyLink = c ? Util.galaxyLink(c.g, c.s) : '#';

                tr.innerHTML = `
                    <td class="${ageClass}">${ageStr}</td>
                    <td><a class="ogl13-coords-link" href="${galaxyLink}">${r.coords}</a></td>
                    <td>${r.playerName}</td>
                    <td class="ogl13-loot">${r.loot}%</td>
                    <td class="ogl13-m">${Util.formatNum(r.metal)}</td>
                    <td class="ogl13-c">${Util.formatNum(r.crystal)}</td>
                    <td class="ogl13-d">${Util.formatNum(r.deut)}</td>
                    <td class="ogl13-msu">${Util.formatNum(r.msu)}</td>
                    <td class="ogl13-fleet-v">${r.fleetV ? Util.formatNum(r.fleetV) : '-'}</td>
                    <td class="ogl13-def-v">${r.defV ? Util.formatNum(r.defV) : '-'}</td>
                    <td>${actStr}</td>
                    <td>
                        ${r.spyLink ? `<a class="ogl13-spy-btn" href="${r.spyLink}">Spia</a>` : ''}
                        ${r.spyLink ? `<a class="ogl13-spy-btn" href="${r.spyLink.replace('mission=6','mission=1')}">Raid</a>` : ''}
                    </td>
                `;

                // tooltip con dettagli risorse wave
                const msuTd = tr.querySelectorAll('td')[7];
                msuTd.title = `Wave loot:\n${r.waves.map((w,i) => `W${i+1}: ${Util.formatNum(w)}`).join('\n')}`;

                tbody.appendChild(tr);
            });
        }

        // Chiamato da AJAX hook dopo getMessagesList
        onMessagesLoaded() {
            this._scanPage();
            this._renderTable();
        }
    }

    // ─── MOVEMENT MANAGER ─────────────────────────────────────────────────────
    class MovementManager {
        constructor(db) {
            this.db = db;
            this.events = [];
        }

        init() {
            this._fetchEvents();
        }

        _fetchEvents() {
            try {
                const uri = unsafeWindow.ajaxEventboxURI;
                if (!uri) return;
                // prima fetch veloce per avere il token aggiornato
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: uri,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    onload: (res) => {
                        try {
                            const j = JSON.parse(res.responseText);
                            if (j.newAjaxToken) {
                                try { unsafeWindow.token = j.newAjaxToken; } catch(e) {}
                            }
                        } catch(e) {}
                    },
                });

                // fetch lista eventi completa
                const catchUri = unsafeWindow.ajaxEventboxURI?.replace('fetchEventBox', 'catchEvents').replace('asJson=1', 'ajax=1');
                if (!catchUri) return;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: catchUri,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    onload: (res) => {
                        try {
                            const j = JSON.parse(res.responseText);
                            const html = j.content?.eventlist || '';
                            if (html) this._parseEventList(html);
                        } catch(e) {}
                    },
                });
            } catch(e) {}
        }

        _parseEventList(html) {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            this.events = [];
            Util.qsa('tr.eventFleet', doc).forEach(tr => {
                const mission    = parseInt(tr.dataset.missionType || 0);
                const arrivalTime= parseInt(tr.dataset.arrivalTime || 0);
                const returning  = tr.dataset.returnFlight === 'true';

                const originText = Util.qs('.coordsOrigin a', tr)?.textContent?.trim() || '';
                const destText   = Util.qs('.destCoords a', tr)?.textContent?.trim() || '';
                const originMoon = !!Util.qs('.originFleet figure.moon, .originFleet .moon', tr);
                const destMoon   = !!Util.qs('.destFleet figure.moon, .destFleet .moon', tr);

                const originCoords = Util.parseCoords(originText);
                const destCoords   = Util.parseCoords(destText);

                // cerca corrispondenza nei miei pianeti per avere l'ID
                const myPlanets = this.db.data?.myPlanets || {};
                const findPlanetId = (coords, isMoon) => {
                    if (!coords) return null;
                    const coordStr = `${coords.g}:${coords.s}:${coords.p}`;
                    const match = Object.entries(myPlanets).find(([id, p]) => {
                        return p.coords === coordStr && (isMoon ? p.type === 'moon' : p.type === 'planet');
                    });
                    return match ? parseInt(match[0]) : null;
                };

                const ev = {
                    mission, arrivalTime, returning,
                    originCoords, destCoords,
                    originMoon, destMoon,
                    originId: findPlanetId(originCoords, originMoon),
                    destId:   findPlanetId(destCoords,   destMoon),
                };
                this.events.push(ev);
            });

            window.ogl13?.planetList?.setFleetEvents(this.events);
            this._checkNotifications();
        }

        _checkNotifications() {
            if (!this.db.getOption('browserNotif', false)) return;
            const now = Util.serverNow();
            this.events.forEach(ev => {
                if (ev.mission === 1 && !ev.returning && ev.destId) {
                    const secs = ev.arrivalTime - now;
                    if (secs > 0 && secs < 300) {
                        setTimeout(() => {
                            GM_notification({
                                title: 'OGLight v13 — Attacco in arrivo!',
                                text: `Attacco in ${Util.formatTime(secs)} su ${ev.destCoords?.g}:${ev.destCoords?.s}:${ev.destCoords?.p}`,
                            });
                        }, Math.max(0, (secs - 30) * 1000));
                    }
                }
            });
        }

        // Chiamato da AJAX hook dopo catchEvents
        onEventsLoaded(html) {
            this._parseEventList(html);
        }
    }

    // ─── GALAXY MANAGER ───────────────────────────────────────────────────────
    class GalaxyManager {
        constructor(db) {
            this.db = db;
        }

        init() {
            if (!Meta.isGalaxy) return;
            this._observeGalaxy();
        }

        _observeGalaxy() {
            // Hook su risposta fetchSolarSystemData via AJAX
            // (gestito in setupAjaxHooks)
        }

        parseGalaxyData(data) {
            if (!data?.system) return;
            const sys = data.system;
            const now = Util.serverNow();

            (sys.galaxyContent || []).forEach(slot => {
                if (!slot.planets?.length) return;
                const { galaxy, system, position } = slot;
                const coordKey = `${galaxy}:${system}:${position}`;
                const coordId  = Util.coordsToId(galaxy, system, position);

                slot.planets.forEach(planet => {
                    const pid = planet.planetId;
                    const isMoon = planet.planetType === 3;

                    // aggiorna pdb
                    if (!this.db.data.pdb[coordKey]) this.db.data.pdb[coordKey] = {};
                    const pentry = this.db.data.pdb[coordKey];
                    if (isMoon) {
                        pentry.mid = pid;
                    } else {
                        pentry.pid  = pid;
                        pentry.uid  = planet.playerId;
                        pentry.coo  = coordKey;
                    }
                    pentry.api = now;

                    // attività
                    if (planet.activity) {
                        const acti = planet.activity.showMinutes ? planet.activity.showActivity : -1;
                        if (!pentry.acti) pentry.acti = [null, null, 0];
                        if (isMoon) pentry.acti[1] = acti;
                        else        pentry.acti[0] = acti;
                        pentry.acti[2] = now;
                    }
                });

                // aggiorna udb
                if (slot.player?.playerId && slot.player.playerId !== 99999) {
                    const uid = slot.player.playerId;
                    if (!this.db.data.udb[uid]) this.db.data.udb[uid] = { uid, planets: [] };
                    const u = this.db.data.udb[uid];
                    u.name = slot.player.playerName;
                    u.liveUpdate = now;
                    if (slot.player.isInactive) u.status = 'i';
                    else if (slot.player.isLongInactive) u.status = 'I';
                    else if (slot.player.isOnVacation) u.status = 'v';
                    else if (slot.player.isBanned) u.status = 'b';
                    else u.status = 'n';
                    if (!u.planets.includes(coordKey)) u.planets.push(coordKey);
                    if (slot.player.highscorePositionPlayer) {
                        if (!u.score) u.score = {};
                        u.score.globalRanking = slot.player.highscorePositionPlayer;
                    }
                }
            });

            this.db.save();
            this._enhanceGalaxyUI(data);
        }

        _enhanceGalaxyUI(data) {
            if (!Meta.isGalaxy) return;
            const sys = data.system;
            const tableRows = Util.qsa('#galaxyTableBody tr, .galaxyRow, [data-position]');

            (sys.galaxyContent || []).forEach((slot, idx) => {
                const tr = tableRows[idx];
                if (!tr) return;

                // tag colorato
                if (this.db.getOption('showGalaxyTags', true)) {
                    this._addTag(tr, slot);
                }

                // pin giocatore
                if (slot.player?.playerId && slot.player.playerId !== 99999) {
                    this._addPin(tr, slot.player);
                }

                // link ranking
                if (slot.player?.highscorePositionPlayer) {
                    const nameCell = Util.qs('.cellPlayerName, .playername', tr);
                    if (nameCell && !Util.qs('.ogl13-ranking', nameCell)) {
                        const rank = Util.el('span');
                        rank.className = 'ogl13-ranking';
                        rank.style.cssText = 'font-size:9px;color:#666;margin-left:4px;';
                        rank.textContent = `#${slot.player.highscorePositionPlayer}`;
                        nameCell.appendChild(rank);
                    }
                }
            });
        }

        _addTag(tr, slot) {
            const { galaxy, system, position } = slot;
            const id = Util.coordsToId(galaxy, system, position);
            const tagData = this.db.data.tdb[id];
            const tagColor = tagData?.tag || 'none';

            const existingTag = Util.qs('.ogl13-galaxy-tag', tr);
            if (existingTag) existingTag.remove();

            const coordCell = Util.qs('.cellPosition, [data-position], .coords', tr);
            if (!coordCell) return;

            const tag = Util.el('span', `ogl13-galaxy-tag ogl13-tag-${tagColor}`);
            tag.title = 'Tag posizione';
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                this._showTagPicker(e, id, tag);
            });
            coordCell.appendChild(tag);
        }

        _addPin(tr, player) {
            const uid = player.playerId;
            const pinData = this.db.data.udb[uid];
            const isPinned = pinData?.pin && pinData.pin !== 'none';

            const existingPin = Util.qs('.ogl13-galaxy-pin', tr);
            if (existingPin) existingPin.remove();

            const nameCell = Util.qs('.cellPlayerName, .playername', tr);
            if (!nameCell) return;

            const pin = Util.el('span', `ogl13-galaxy-pin${isPinned ? ' pinned' : ''}`);
            pin.textContent = '📌';
            pin.title = isPinned ? `Pinned: ${pinData.pin}` : 'Aggiungi pin';
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this._showPinPicker(e, uid, pin);
            });
            nameCell.appendChild(pin);
        }

        _showTagPicker(e, coordId, tagEl) {
            Util.qs('.ogl13-tag-picker')?.remove();
            const picker = Util.el('div', 'ogl13-tag-picker');
            TAG_COLORS.forEach(color => {
                const swatch = Util.el('span', `ogl13-tag-${color}`);
                swatch.title = color;
                swatch.addEventListener('click', () => {
                    if (color === 'none') {
                        delete this.db.data.tdb[coordId];
                    } else {
                        this.db.data.tdb[coordId] = { tag: color };
                    }
                    tagEl.className = `ogl13-galaxy-tag ogl13-tag-${color}`;
                    this.db.save();
                    picker.remove();
                });
                picker.appendChild(swatch);
            });
            picker.style.left = e.pageX + 'px';
            picker.style.top  = e.pageY + 'px';
            document.body.appendChild(picker);
            setTimeout(() => document.addEventListener('click', () => picker.remove(), { once: true }), 50);
        }

        _showPinPicker(e, uid, pinEl) {
            Util.qs('.ogl13-tag-picker')?.remove();
            const picker = Util.el('div', 'ogl13-tag-picker');
            picker.style.width = '130px';
            PIN_TYPES.forEach(type => {
                const btn = Util.el('span');
                btn.style.cssText = 'width:auto;padding:2px 4px;font-size:10px;border:1px solid #333;background:#111;color:#ccc;cursor:pointer;border-radius:2px;';
                btn.textContent = type;
                btn.addEventListener('click', () => {
                    if (!this.db.data.udb[uid]) this.db.data.udb[uid] = { uid };
                    if (type === 'none') delete this.db.data.udb[uid].pin;
                    else this.db.data.udb[uid].pin = type;
                    pinEl.className = `ogl13-galaxy-pin${type !== 'none' ? ' pinned' : ''}`;
                    pinEl.title = type !== 'none' ? `Pinned: ${type}` : 'Aggiungi pin';
                    this.db.save();
                    picker.remove();
                    window.ogl13?.ui?.refreshPinnedList();
                });
                picker.appendChild(btn);
            });
            picker.style.left = e.pageX + 'px';
            picker.style.top  = e.pageY + 'px';
            document.body.appendChild(picker);
            setTimeout(() => document.addEventListener('click', () => picker.remove(), { once: true }), 50);
        }
    }

    // ─── FLEET MANAGER ────────────────────────────────────────────────────────
    class FleetManager {
        constructor(db) {
            this.db = db;
        }

        init() {
            if (!Meta.isFleet) return;
            // aspetta che fleetDispatcher sia inizializzato
            const check = setInterval(() => {
                try {
                    if (unsafeWindow.fleetDispatcher) {
                        clearInterval(check);
                        this._enhance();
                    }
                } catch(e) { clearInterval(check); }
            }, 100);
            setTimeout(() => clearInterval(check), 5000);
        }

        _enhance() {
            this._addCapacityBar();
            this._readCurrentShips();
            this._addFleetLimiter();
        }

        _addCapacityBar() {
            const fleet1 = Util.qs('#fleet1');
            if (!fleet1) return;
            if (Util.qs('.ogl13-capacity-bar', fleet1)) return;

            const bar = Util.el('div', 'ogl13-capacity-bar');
            const fill = Util.el('div', 'ogl13-capacity-fill');
            fill.style.width = '0%';
            bar.appendChild(fill);

            const info = Util.el('div', 'ogl13-capacity-info');
            info.innerHTML = '<span>Capacità</span><span class="ogl13-cap-val">-</span>';
            fleet1.insertAdjacentElement('beforeend', bar);
            fleet1.insertAdjacentElement('beforeend', info);

            // aggiorna ogni 500ms
            setInterval(() => this._updateCapacityBar(fill, info), 500);
        }

        _updateCapacityBar(fill, info) {
            try {
                const fd = unsafeWindow.fleetDispatcher;
                if (!fd) return;
                const cap   = fd.getCargoCapacity ? fd.getCargoCapacity() : 0;
                const metal = fd.metalToSend   || 0;
                const cryst = fd.crystalToSend || 0;
                const deut  = fd.deuteriumToSend || 0;
                const food  = fd.foodToSend    || 0;
                const load  = metal + cryst + deut + food;
                if (cap <= 0) return;
                const pct = Math.min(100, (load / cap) * 100);
                fill.style.width = pct + '%';
                fill.className   = `ogl13-capacity-fill${pct >= 100 ? ' over' : ''}`;
                const capVal = Util.qs('.ogl13-cap-val', info);
                if (capVal) capVal.textContent = `${Util.formatNum(load)} / ${Util.formatNum(cap)} (${Math.round(pct)}%)`;
            } catch(e) {}
        }

        _readCurrentShips() {
            try {
                const fd = unsafeWindow.fleetDispatcher;
                const pl = unsafeWindow.planetList || unsafeWindow.planets;
                if (fd && pl) {
                    // salva lista pianeti nel DB per il MovementManager
                    const myPlanets = this.db.data.myPlanets;
                    pl.forEach(p => {
                        const pid = p.id || p.planetId;
                        if (!pid) return;
                        if (!myPlanets[pid]) myPlanets[pid] = {};
                        myPlanets[pid].coords = `${p.galaxy}:${p.system}:${p.position}`;
                        myPlanets[pid].type   = p.type === 3 ? 'moon' : 'planet';
                    });
                    this.db.save();
                }
            } catch(e) {}
        }

        _addFleetLimiter() {
            if (!this.db.getOption('fleetLimiter', false)) return;
            const fleet1 = Util.qs('#fleet1');
            if (!fleet1) return;

            const limiter = this.db.data.fleetLimiter;
            const div = Util.el('div');
            div.style.cssText = 'padding:4px;font-size:10px;color:#888;border-top:1px solid #2a3a4a;margin-top:4px;';
            div.innerHTML = '<span>Fleet Limiter attivo</span>';
            fleet1.appendChild(div);
        }
    }

    // ─── UI MANAGER ───────────────────────────────────────────────────────────
    class UIManager {
        constructor(db) {
            this.db = db;
            this.panel = null;
            this.currentTab = null;
        }

        init() {
            this._createSidePanel();
            document.addEventListener('keydown', (e) => this._handleKey(e));
        }

        _createSidePanel() {
            const panel = Util.el('div', 'ogl13-side');
            panel.innerHTML = `
                <div class="ogl13-side-header">
                    <span id="ogl13-panel-title">OGLight v13</span>
                    <span class="ogl13-side-close" id="ogl13-panel-close">✕</span>
                </div>
                <div class="ogl13-side-tabs">
                    <div class="ogl13-tab" data-tab="account">Account</div>
                    <div class="ogl13-tab" data-tab="pinned">Pin</div>
                    <div class="ogl13-tab" data-tab="tagged">Tag</div>
                    <div class="ogl13-tab" data-tab="stats">Stats</div>
                    <div class="ogl13-tab" data-tab="settings">⚙</div>
                </div>
                <div class="ogl13-side-content" id="ogl13-side-content"></div>
            `;
            document.body.appendChild(panel);
            this.panel = panel;

            Util.qs('#ogl13-panel-close', panel).addEventListener('click', () => this.close());
            Util.qsa('.ogl13-tab', panel).forEach(tab => {
                tab.addEventListener('click', () => this.openTab(tab.dataset.tab));
            });
        }

        openTab(tabName) {
            if (!this.panel) return;
            this.panel.classList.add('open');
            this.currentTab = tabName;

            Util.qsa('.ogl13-tab', this.panel).forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tabName);
            });

            const content = Util.qs('#ogl13-side-content', this.panel);
            content.innerHTML = '';

            switch(tabName) {
                case 'account':  this._renderAccount(content);  break;
                case 'pinned':   this._renderPinned(content);   break;
                case 'tagged':   this._renderTagged(content);   break;
                case 'stats':    this._renderStats(content);    break;
                case 'settings': this._renderSettings(content); break;
            }
        }

        close() {
            this.panel?.classList.remove('open');
        }

        refreshPinnedList() {
            if (this.currentTab === 'pinned') this.openTab('pinned');
        }

        _renderAccount(content) {
            const myPlanets = Object.entries(this.db.data?.myPlanets || {});
            if (!myPlanets.length) {
                content.innerHTML = '<div style="padding:8px;color:#666;font-size:10px;">Nessun dato pianeti. Clicca 🔄 per sincronizzare.</div>';
                return;
            }

            const div = Util.el('div', 'ogl13-account');
            let totM = 0, totC = 0, totD = 0;
            const now = Util.serverNow();

            const rows = myPlanets.map(([id, p]) => {
                const age  = now - (p.lastRefresh || 0);
                const prod = p.lastRefresh ? age : 0;
                const m = (p.metal   || 0) + (p.prodMetal   || 0) * prod;
                const c = (p.crystal || 0) + (p.prodCrystal || 0) * prod;
                const d = (p.deut    || 0) + (p.prodDeut    || 0) * prod;
                totM += m; totC += c; totD += d;
                const msu = Util.msu(m, c, d);
                return { id, p, m, c, d, msu };
            }).sort((a, b) => b.msu - a.msu);

            div.innerHTML = `
                <table>
                    <thead><tr>
                        <th>Pianeta</th>
                        <th>M</th><th>C</th><th>D</th><th>MSU</th>
                    </tr></thead>
                    <tbody>
                        ${rows.map(r => `
                            <tr>
                                <td style="color:#88aaff">${r.p.coords || r.id}</td>
                                <td class="ogl13-m">${Util.formatNum(r.m)}</td>
                                <td class="ogl13-c">${Util.formatNum(r.c)}</td>
                                <td class="ogl13-d">${Util.formatNum(r.d)}</td>
                                <td class="ogl13-msu">${Util.formatNum(r.msu)}</td>
                            </tr>`).join('')}
                        <tr class="ogl13-total">
                            <td>TOTALE</td>
                            <td class="ogl13-m">${Util.formatNum(totM)}</td>
                            <td class="ogl13-c">${Util.formatNum(totC)}</td>
                            <td class="ogl13-d">${Util.formatNum(totD)}</td>
                            <td class="ogl13-msu">${Util.formatNum(Util.msu(totM,totC,totD))}</td>
                        </tr>
                    </tbody>
                </table>
            `;
            content.appendChild(div);
        }

        _renderPinned(content) {
            const pinned = Object.values(this.db.data?.udb || {}).filter(u => u.pin && u.pin !== 'none');
            if (!pinned.length) {
                content.innerHTML = '<div style="padding:8px;color:#666;font-size:10px;">Nessun player pinnato. Usa 📌 nella galaxy view.</div>';
                return;
            }

            pinned.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            pinned.forEach(u => {
                const item = Util.el('div', 'ogl13-pinned-item');
                item.innerHTML = `
                    <div>
                        <span class="ogl13-pin-type ogl13-pin-${u.pin}">${u.pin}</span>
                        <span class="name">${u.name || u.uid}</span>
                    </div>
                    <div class="info">${(u.planets || []).length} pianeti${u.score?.globalRanking ? ` | #${u.score.globalRanking}` : ''}</div>
                `;
                if (u.planets?.length) {
                    const c = Util.parseCoords(u.planets[0]);
                    if (c) item.addEventListener('click', () => { location.href = Util.galaxyLink(c.g, c.s); });
                }
                content.appendChild(item);
            });
        }

        _renderTagged(content) {
            const tagged = Object.entries(this.db.data?.tdb || {});
            if (!tagged.length) {
                content.innerHTML = '<div style="padding:8px;color:#666;font-size:10px;">Nessuna posizione taggata. Usa i tag nella galaxy view.</div>';
                return;
            }

            tagged.sort((a, b) => a[0].localeCompare(b[0]));
            tagged.forEach(([id, data]) => {
                const g = id.slice(0,3), s = id.slice(3,6), p = id.slice(6);
                const coords = `${parseInt(g)}:${parseInt(s)}:${parseInt(p)}`;
                const item = Util.el('div', 'ogl13-pinned-item');
                item.innerHTML = `
                    <div>
                        <span class="ogl13-galaxy-tag ogl13-tag-${data.tag}" style="display:inline-block;margin-right:4px;"></span>
                        <a class="ogl13-coords-link" href="${Util.galaxyLink(parseInt(g), parseInt(s))}">${coords}</a>
                    </div>
                    <div class="info">${data.tag}</div>
                `;
                content.appendChild(item);
            });
        }

        _renderStats(content) {
            const stats = this.db.data?.stats || {};
            const today = this.db.todayKey();
            const todayStats = stats[today] || {};
            const div = Util.el('div', 'ogl13-stats');

            div.innerHTML = '<div style="color:#88aaff;font-size:11px;padding:4px;border-bottom:1px solid #2a3a4a;margin-bottom:4px;">Oggi — ' + today + '</div>';

            const types = { raid:'⚔ Raid', expe:'🔭 Spedizioni', debris:'♻ Detriti' };
            Object.entries(types).forEach(([key, label]) => {
                const s = todayStats[key];
                if (!s) return;
                const row = Util.el('div', 'ogl13-stats-row');
                const msu = Util.msu(s.metal||0, s.crystal||0, s.deut||0);
                row.innerHTML = `
                    <span class="ogl13-stats-label">${label}</span>
                    <span class="ogl13-stats-val">${Util.formatNum(msu)} MSU (${s.count||0})</span>
                `;
                div.appendChild(row);
            });

            // ultimi 7 giorni
            const weekDiv = Util.el('div');
            weekDiv.style.cssText = 'color:#88aaff;font-size:11px;padding:4px;border-bottom:1px solid #2a3a4a;margin:8px 0 4px;';
            weekDiv.textContent = 'Ultimi 7 giorni';
            div.appendChild(weekDiv);

            const days = Object.entries(stats).sort((a,b) => b[0].localeCompare(a[0])).slice(0, 7);
            days.forEach(([day, ds]) => {
                const totMsu = Object.values(ds).reduce((sum, s) => {
                    return sum + Util.msu(s.metal||0, s.crystal||0, s.deut||0);
                }, 0);
                const row = Util.el('div', 'ogl13-stats-row');
                row.innerHTML = `<span class="ogl13-stats-label">${day}</span><span class="ogl13-stats-val">${Util.formatNum(totMsu)} MSU</span>`;
                div.appendChild(row);
            });

            content.appendChild(div);
        }

        _renderSettings(content) {
            const div = Util.el('div', 'ogl13-settings');
            const opts = this.db.data?.options || {};

            const options = [
                { key:'showResources',  label:'Mostra risorse nella planet list' },
                { key:'showFleetIcons', label:'Mostra icone flotta nella planet list' },
                { key:'showSpyTable',   label:'Mostra spy table nei messaggi' },
                { key:'showGalaxyTags', label:'Mostra tag/pin nella galaxy view' },
                { key:'fleetLimiter',   label:'Abilita Fleet Limiter' },
                { key:'browserNotif',   label:'Notifiche browser per attacchi' },
            ];

            div.innerHTML = '<h3>Opzioni Generali</h3>';
            options.forEach(o => {
                const label = Util.el('label');
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = opts[o.key] ?? true;
                cb.addEventListener('change', () => {
                    this.db.setOption(o.key, cb.checked);
                    this.db.save();
                });
                label.appendChild(cb);
                label.appendChild(document.createTextNode(' ' + o.label));
                div.appendChild(label);
            });

            div.innerHTML += '<h3>Sonde per spionaggio</h3>';
            const probeLabel = Util.el('label');
            probeLabel.textContent = 'N. sonde: ';
            const probeInput = document.createElement('input');
            probeInput.type = 'number';
            probeInput.value = opts.probeCount || 6;
            probeInput.min = 1; probeInput.max = 9999;
            probeInput.addEventListener('change', () => {
                this.db.setOption('probeCount', parseInt(probeInput.value) || 6);
                this.db.save();
            });
            probeLabel.appendChild(probeInput);
            div.appendChild(probeLabel);

            div.innerHTML += '<h3>PTRE</h3>';
            const ptreLabel = Util.el('label');
            ptreLabel.textContent = 'Team Key: ';
            const ptreInput = document.createElement('input');
            ptreInput.type = 'text';
            ptreInput.placeholder = 'PTRE team key';
            ptreInput.value = opts.ptreTK || '';
            ptreInput.addEventListener('change', () => {
                this.db.setOption('ptreTK', ptreInput.value.trim());
                this.db.save();
            });
            ptreLabel.appendChild(ptreInput);
            div.appendChild(ptreLabel);

            div.innerHTML += '<h3>Manutenzione DB</h3>';
            const resetBtn = Util.el('button', 'ogl13-btn danger');
            resetBtn.textContent = 'Reset DB completo';
            resetBtn.addEventListener('click', () => {
                if (confirm('Sei sicuro? Tutti i dati salvati verranno eliminati.')) {
                    GM_setValue(this.db._key, null);
                    location.reload();
                }
            });
            div.appendChild(resetBtn);

            const exportBtn = Util.el('button', 'ogl13-btn');
            exportBtn.textContent = 'Esporta DB';
            exportBtn.style.marginLeft = '6px';
            exportBtn.addEventListener('click', () => {
                const blob = new Blob([JSON.stringify(this.db.data, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `ogl13_${Meta.playerId}_${Date.now()}.json`;
                a.click();
            });
            div.appendChild(exportBtn);

            content.appendChild(div);
        }

        _handleKey(e) {
            // ignora se focus su input/textarea
            if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;

            switch(e.key) {
                case '²':
                case '`':
                    if (this.panel?.classList.contains('open')) this.close();
                    else this.openTab('settings');
                    break;
            }
        }
    }

    // ─── SHORTCUT MANAGER ─────────────────────────────────────────────────────
    class ShortcutManager {
        constructor(db) {
            this.db = db;
        }

        init() {
            document.addEventListener('keydown', (e) => this._handle(e));
        }

        _handle(e) {
            if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
            const isGalaxy = Meta.isGalaxy;
            const isFleet  = Meta.isFleet;

            // navigazione pianeti con i/o
            if (e.key === 'i' || e.key === 'o') {
                e.preventDefault();
                this._nextPlanet(e.key === 'o' ? 1 : -1);
            }
            // select all ships in fleet
            if (e.key === 'a' && isFleet) {
                e.preventDefault();
                Util.qsa('.technology.detail_button:not(.off)').forEach(btn => {
                    const max = Util.qs('.max', btn);
                    if (max) max.click();
                });
            }
        }

        _nextPlanet(dir) {
            const links = Util.qsa('#planetList .smallplanet .planetlink');
            if (!links.length) return;
            const current = links.findIndex(l => l.href.includes(`cp=${Meta.planetId}`));
            let next = (current + dir + links.length) % links.length;
            const url = new URL(links[next].href);
            url.searchParams.set('page', new URLSearchParams(location.search).get('page') || 'ingame');
            url.searchParams.set('component', new URLSearchParams(location.search).get('component') || 'overview');
            location.href = url.toString();
        }
    }

    // ─── STATS MANAGER ────────────────────────────────────────────────────────
    class StatsManager {
        constructor(db) {
            this.db = db;
        }

        parseMessage(el) {
            const d = el.dataset;
            const msgType = parseInt(d.rawMessagetype || d.rawMessageType || 0);

            // combat report (type=25): leggi loot
            if (msgType === 25) {
                try {
                    const result = JSON.parse(d.rawResult || '{}');
                    const loot = result.loot || {};
                    if (loot.metal || loot.crystal || loot.deuterium) {
                        this.db.addStat('raid', {
                            metal: loot.metal || 0,
                            crystal: loot.crystal || 0,
                            deut: loot.deuterium || 0,
                        });
                        this.db.save();
                    }
                } catch(e) {}
            }

            // expedition message (type=12/13/etc)
            if (msgType === 12 || msgType === 13) {
                try {
                    const resources = JSON.parse(d.rawResourcesgained || d.rawResources || '{}');
                    if (resources.metal || resources.crystal || resources.deuterium) {
                        this.db.addStat('expe', {
                            metal: resources.metal || 0,
                            crystal: resources.crystal || 0,
                            deut: resources.deuterium || 0,
                        });
                        this.db.save();
                    }
                } catch(e) {}
            }
        }
    }

    // ─── AJAX HOOKS ───────────────────────────────────────────────────────────
    function setupAjaxHooks(ogl) {
        try {
            const $ = unsafeWindow.jQuery || unsafeWindow.$;
            if (!$) return;

            $(document).on('ajaxSuccess', function(event, xhr, settings, data) {
                const url = settings.url || '';
                try {
                    const json = typeof data === 'string' ? JSON.parse(data) : data;

                    // event list / catchEvents
                    if (url.includes('catchEvents') || url.includes('eventlist')) {
                        const html = json?.content?.eventlist || '';
                        if (html) ogl.movement?.onEventsLoaded(html);
                    }

                    // galaxy
                    if (url.includes('fetchSolarSystemData')) {
                        ogl.galaxy?.parseGalaxyData(json);
                    }

                    // messaggi spy
                    if (url.includes('getMessagesList') || url.includes('messages')) {
                        setTimeout(() => ogl.messages?.onMessagesLoaded(), 300);
                    }

                    // risorse bar
                    if (url.includes('fetchResources')) {
                        try {
                            const r = json.resources || json;
                            ogl.db.updatePlanet(Meta.planetId, {
                                metal:   r.metal?.amount   || 0,
                                crystal: r.crystal?.amount || 0,
                                deut:    r.deuterium?.amount || 0,
                                food:    r.food?.amount    || 0,
                                prodMetal:   r.metal?.production   || 0,
                                prodCrystal: r.crystal?.production || 0,
                                prodDeut:    r.deuterium?.production || 0,
                            });
                            ogl.db.save();
                            ogl.planetList?._updateAll();
                            ogl.planetList?._injectRecap();
                        } catch(e) {}
                    }

                    // token aggiornato
                    if (json?.newAjaxToken) {
                        try { unsafeWindow.token = json.newAjaxToken; } catch(e) {}
                    }
                } catch(e) {}
            });
        } catch(e) {}
    }

    // ─── INIT PRINCIPALE ──────────────────────────────────────────────────────
    function main() {
        // init DB
        const db = new DB();
        if (!db.init()) return; // non siamo su una pagina di gioco

        // crea oggetto globale
        const ogl = {
            db,
            planetList: null,
            empire:     null,
            messages:   null,
            galaxy:     null,
            movement:   null,
            fleet:      null,
            ui:         null,
            shortcuts:  null,
            stats:      null,
        };
        window.ogl13 = ogl;

        // init managers
        ogl.planetList = new PlanetListManager(db);
        ogl.empire     = new EmpireManager(db);
        ogl.messages   = new MessageManager(db);
        ogl.galaxy     = new GalaxyManager(db);
        ogl.movement   = new MovementManager(db);
        ogl.fleet      = new FleetManager(db);
        ogl.ui         = new UIManager(db);
        ogl.shortcuts  = new ShortcutManager(db);
        ogl.stats      = new StatsManager(db);

        // leggi risorse pianeta corrente da pagina (disponibile su tutte le pagine)
        ogl.empire.readCurrentPlanet();

        // init UI (side panel) — disponibile su tutte le pagine
        ogl.ui.init();
        ogl.shortcuts.init();

        // init page-specific
        ogl.planetList.init();
        ogl.movement.init();

        if (Meta.isMessages) {
            ogl.messages.init();
            // analizza anche i messaggi per le stats
            Util.qsa('.rawMessageData').forEach(el => ogl.stats.parseMessage(el));
        }

        if (Meta.isGalaxy) {
            ogl.galaxy.init();
        }

        if (Meta.isFleet) {
            ogl.fleet.init();
        }

        // fetch risorse dopo 1s per avere dati aggiornati
        setTimeout(() => ogl.empire.fetchCurrentResources(), 1000);

        // init empire fetch (se dati vecchi)
        ogl.empire.init();

        // AJAX hooks (aspetta jQuery)
        const waitJq = setInterval(() => {
            try {
                if (unsafeWindow.jQuery || unsafeWindow.$) {
                    clearInterval(waitJq);
                    setupAjaxHooks(ogl);
                }
            } catch(e) { clearInterval(waitJq); }
        }, 100);
        setTimeout(() => clearInterval(waitJq), 5000);

        // save periodico
        setInterval(() => db.save(), 30000);
    }

    // ─── ENTRY POINT ──────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();
