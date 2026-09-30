# The Ferryman v0.4 browser demo

Playable local prototype, completed September 29, 2026 from the paused v0.4 draft. Guided passenger, route, memory, review, result and delivery screens retain the approved soul abilities while reducing resources to lantern light and memories.

- [Play](index.html)
- [Quick start](QUICK_START.md)
- [Rules and decision authority](RULES.md)
- [Validation and limits](VALIDATION.md)

## Launch

Open `index.html` in a modern browser. Keep this entire folder intact. The game uses local classic scripts and local PNG artwork. No dependency installation, account, build or hosted service is required. Browser automation was performed via local HTTP; see validation for direct-file coverage.

If your browser restricts local-file behavior, optionally serve this folder with an already installed Python runtime:

```text
python3 -m http.server 8044 --bind 127.0.0.1
```

Then open `http://localhost:8044/`. On Windows with Python's launcher, use `py -m http.server 8044 --bind 127.0.0.1`. Stop the server with Ctrl+C. This alternative is for local play only.

## Save and resume

Progress automatically saves to one of three slots in browser storage: `ferryman-v0.4-run` (Save 1, the original key), `ferryman-v0.4-run-2` and `ferryman-v0.4-run-3`. The opening screen shows all three slots with Continue, New journey and Erase. Guide & save provides JSON export, file import, pasted JSON import, a confirmed New Run and a return to the save slots; these act on the current slot. Imports validate before replacing anything and ask before replacing a current run. Invalid or v0.3 saves leave current progress intact. Import limit: 5 MB. Save validation checks structure and invariants, not whether an edited save came from honest play.

Different browser profiles, local file URLs, `localhost` and `127.0.0.1` may have separate storage. Export when changing addresses, machines or browsers, or before clearing data. Private mode and browser storage limits can prevent saving; the UI shows a warning and offers export. Tentative delivery selections reset on reload; confirmed engine phases and pending crossing choices resume. A discovery annotation has its own `ferryman-v0.4-discoveries` key and can be cleared separately.

## Source and checks

`engine.js` exposes `Ferryman` in the browser and CommonJS in Node. It owns all transitions, previews, save validation and seeded shuffling. `app.js` renders safe DOM text, manages storage and focuses controls. `index.html`, `styles.css` and `assets/` are standalone runtime files; the brand link stays inside this folder.

With an existing Node runtime, from this folder:

```text
node --check engine.js
node --check app.js
node tests/engine-check.cjs
node tests/browser-fixtures.cjs
```

The engine runner writes `verification/engine-results.json`. It includes targeted assertions and randomized legal action sequences. Fixtures are constructed states used to test browser boundaries, not observed player sessions. The browser tool runner is `tests/browser-check.js`; it creates an isolated browser context to preserve existing saves. Its repository path and local URL are documented constants to adjust on another machine. Run it through the approved Playwright tool, then record its returned JSON in `verification/browser-results.json`. It writes screenshots and uses `work/v04/` for fixtures and exports.

`tests/static-check.cjs` checks local runtime references, document links and the unchanged art copies against provenance; it is repository-aware. Runners overwrite their corresponding v0.4 evidence only. Do not rerun older versions' evidence as part of this task.

## Status and boundaries

The user-approved cuts and retained rules are detailed in RULES.md. The physical v0.4 kit remains deferred. v0.3 remains playable in its own folder, with a separate v0.3 workshop kit. The 20 unchanged art copies are traced in [PROVENANCE.json](assets/PROVENANCE.json); final team art approval is pending.

This folder is the deliverable. No v0.4 distribution ZIP has been generated or claimed. Human playtesting, real-device checks, printing, final art approval, publishing and submission completion are not established by this build.
