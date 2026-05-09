# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A collection of Tampermonkey/Greasemonkey userscripts for the browser game [OGame](https://ogame.gameforge.com). Scripts are distributed via Greasyfork; the `@downloadURL` / `@updateURL` headers in each file point to the live published versions.

There is no build system, no package manager, and no test suite. Development is editing `.js` files directly and testing manually in-browser.

## Scripts

### `ogametimeritem.js`
Overlays compact countdown timers on active item and officer icons in the OGame header bar.

- **Pattern**: single IIFE, runs entirely on `https://*.ogame.gameforge.com/` pages.
- Injects CSS once, then polls with `setInterval(updateTimers, 2000)`.
- The core complexity is `formatCompactTime()`, which resolves an OGame UI ambiguity: the letter `s` can mean either *secondi* (seconds) or *settimane* (weeks). The rule: if the next token ends in `g` (giorni/days), `s` means weeks and is converted to days.
- Timer labels are appended as `.custom-timer-base` divs inside the anchor that wraps each icon.

### `oglight_shared_report_sim.js`
Bridges OGLight spy-report data into the OGame-Tools simulator when viewing alliance combat reports.

- **Pattern**: single IIFE that branches on `window.location.href` into two execution contexts:
  1. **On simulator sites** (`trashsim.universeview.be` or `simulator.ogame-tools.com`): captures the `prefill=…` URL hash via `GM_setValue`, then redirects trashsim URLs to ogame-tools.
  2. **On OGame**: injects a "play" button into every `message-footer-actions` element. Clicking it opens the simulator pre-loaded with the stored prefill and the report's SR_KEY.
- Uses a `MutationObserver` on `document.body` to handle dynamically loaded message lists.
- API key extraction tries two DOM paths: `.rawMessageData[data-raw-hashcode]` (detail popup) and `.msgApiKeyBtn` (list view).
- CSS hides the injected button when OGLight's own simulator button (`.ogl_trashsim`) is already present, avoiding duplicates.
- **Dependency**: expects OGLight userscript to be installed alongside this one.

## Conventions

- Comments and all user-facing strings are in Italian (target audience: Italian OGame players).
- Increment `@version` in the `==UserScript==` header when making changes intended for Greasyfork publication.
- Both scripts use `'use strict'` inside an IIFE — keep that pattern.
- `GM_setValue` / `GM_getValue` require the corresponding `@grant` lines; don't remove them.
